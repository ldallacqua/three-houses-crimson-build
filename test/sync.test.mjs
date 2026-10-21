// The cloud save: the endpoint (server/sync.js) against SQLite and against a stand-in for Turso's
// HTTP API, and two devices syncing through it (js/sync.js).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, sqliteDb, tursoDb } from '../server/sync.js';
import { createSync, sameSave, isBlank, META_KEY } from '../js/sync.js';
import { snapshotState, freshState, normalize } from '../js/store.js';

const ORIGIN = 'https://ldallacqua.github.io';

async function server(password = 'segredo') {
  const db = await sqliteDb();
  const opts = { db, password, origins: [ORIGIN] };
  const call = (method, body, { pass = password, origin } = {}) => handle(new Request('http://x/api/save', {
    method,
    headers: { authorization: `Bearer ${pass}`, ...(origin ? { origin } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  }), opts);
  return { db, opts, call };
}

test('the endpoint needs the password and writes only on top of the version it was given', async () => {
  const { call } = await server();
  assert.equal((await call('GET', undefined, { pass: 'errada' })).status, 401);
  assert.deepEqual(await (await call('GET')).json(), { rev: 0, state: null, updated: null });
  const first = await call('PUT', { base: 0, state: { chapter: 3 } });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).rev, 1);
  const stale = await call('PUT', { base: 0, state: { chapter: 9 } });
  assert.equal(stale.status, 409, 'another device already saved version 1');
  assert.deepEqual((await stale.json()).state, { chapter: 3 });
  assert.equal((await (await call('PUT', { base: 1, state: { chapter: 4 } })).json()).rev, 2);
  assert.deepEqual((await (await call('GET')).json()).state, { chapter: 4 });
  assert.equal((await call('PUT', { base: 2 })).status, 400);
  assert.equal((await call('PUT', '{nope')).status, 400);
  assert.equal((await call('PUT', { base: 2, state: { big: 'x'.repeat(600_000) } })).status, 413);
});

test('the endpoint answers the published page, keeps old versions and says when it is not set up', async () => {
  const { db, call } = await server();
  const pre = await call('OPTIONS', undefined, { origin: ORIGIN });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal((await call('OPTIONS', undefined, { origin: 'https://example.com' })).headers.get('access-control-allow-origin'), null);
  for (let base = 0; base < 60; base++) await call('PUT', { base, state: { chapter: (base % 17) + 1 } });
  const [{ rows }] = await db.run([{ sql: 'SELECT COUNT(*) AS n, MIN(rev) AS lo, MAX(rev) AS hi FROM save_history' }]);
  assert.deepEqual({ ...rows[0] }, { n: 50, lo: 10, hi: 59 }, 'the last 50 replaced versions');
  const unset = await handle(new Request('http://x/api/save'), { db: null, password: undefined, origins: [] });
  assert.equal(unset.status, 503);
});

test('the Turso client speaks the HTTP pipeline API', async () => {
  // A stand-in for Turso: runs each statement of the pipeline on SQLite and answers in its format.
  const lite = await sqliteDb();
  let seen = null;
  const fakeFetch = async (url, init) => {
    seen = { url, auth: init.headers.authorization };
    const { requests } = JSON.parse(init.body);
    assert.equal(requests.at(-1).type, 'close');
    const value = (a) => (a.type === 'null' ? null : a.type === 'integer' ? Number(a.value) : a.value);
    const results = [];
    for (const r of requests.slice(0, -1)) {
      const [out] = await lite.run([{ sql: r.stmt.sql, args: r.stmt.args.map(value) }]);
      const cols = Object.keys(out.rows[0] ?? {}).map((name) => ({ name }));
      const typed = (v) => (v == null ? { type: 'null' } : typeof v === 'number' ? { type: 'integer', value: String(v) } : { type: 'text', value: v });
      results.push({ type: 'ok', response: { type: 'execute', result: { cols, rows: out.rows.map((row) => cols.map((c) => typed(row[c.name]))), affected_row_count: out.changes } } });
    }
    results.push({ type: 'ok', response: { type: 'close' } });
    return new Response(JSON.stringify({ baton: null, results }));
  };
  const db = tursoDb({ url: 'libsql://crimson-ldallacqua.aws-us-east-1.turso.io', token: 't0k3n', fetch: fakeFetch });
  const call = (method, body) => handle(new Request('http://x/api/save', { method, headers: { authorization: 'Bearer p' }, body: body && JSON.stringify(body) }), { db, password: 'p', origins: [] });
  assert.equal((await call('PUT', { base: 0, state: { chapter: 6 } })).status, 200);
  assert.equal(seen.url, 'https://crimson-ldallacqua.aws-us-east-1.turso.io/v2/pipeline');
  assert.equal(seen.auth, 'Bearer t0k3n');
  assert.deepEqual(await (await call('GET')).json().then((r) => [r.rev, r.state]), [1, { chapter: 6 }]);
  assert.equal((await call('PUT', { base: 0, state: { chapter: 7 } })).status, 409);
  const failing = tursoDb({ url: 'libsql://x.turso.io', token: 't', fetch: async () => new Response(JSON.stringify({ results: [{ type: 'error', error: { message: 'no such table' } }] })) });
  const res = await handle(new Request('http://x', { headers: { authorization: 'Bearer p' } }), { db: failing, password: 'p', origins: [] });
  assert.equal(res.status, 502);
});

// ---------- two devices ----------

function memoryStorage() {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
}

async function device(name, call, initial, answers = []) {
  const storage = memoryStorage();
  const pending = [];
  const said = [];
  const dev = {
    name,
    state: initial,
    storage,
    said,
    asked: [],
    sync: null,
    // Run the timers that are due now (a retry they schedule waits for the next flush).
    async flush() {
      for (const fn of pending.splice(0)) await fn();
      await dev.sync.settle();
    },
    edit(fn) {
      fn(dev.state);
      dev.state.updated = new Date().toISOString();
      dev.sync.changed();
    },
  };
  dev.sync = createSync({
    storage,
    url: 'http://x/api/save',
    fetch: async (url, init) => call(new Request(url, init)),
    getState: () => dev.state,
    adopt: (next) => { dev.state = next; },
    ask: async (opts) => {
      dev.asked.push(opts.title);
      return answers.shift() ?? '';
    },
    notify: (m) => said.push(m),
    onChange: () => {},
    timers: { set: (fn) => pending.push(fn), clear: () => {} },
  });
  return dev;
}

test('two devices keep one save: the second takes it, changes go both ways, a clash asks', async () => {
  const { opts } = await server('mestre');
  const call = (request) => handle(request, opts);
  const pc = await device('pc', call, snapshotState(), ['cancel']);
  await assert.rejects(pc.sync.connect('errada'), /Senha errada/);
  await pc.sync.connect('mestre');
  assert.match(pc.said.at(-1), /foi para a nuvem/);
  assert.equal(JSON.parse(pc.storage.getItem(META_KEY)).rev, 1);
  assert.ok(!JSON.stringify(pc.state).includes('mestre'), 'the password never goes into the save');

  const phone = await device('phone', call, { ...freshState(), build: 'corte-carmesim' }, ['ok']);
  await phone.sync.connect('mestre');
  assert.match(phone.said.at(-1), /pegou o save da nuvem/);
  assert.ok(sameSave(phone.state, pc.state));
  assert.deepEqual(phone.asked, [], 'a blank device does not need to ask');

  pc.edit((s) => { s.date = '9/10'; });
  await pc.flush();
  await phone.sync.pull();
  assert.equal(phone.state.date, '9/10', 'the phone brings down what the PC saved');
  assert.match(phone.said.at(-1), /outro aparelho/);

  // Both change before either syncs.
  pc.edit((s) => { s.date = '9/14'; });
  await pc.flush();
  phone.edit((s) => { s.date = '9/12'; });
  await phone.flush();
  assert.deepEqual(phone.asked, ['O save mudou em outro aparelho']);
  assert.equal(phone.state.date, '9/14', 'the phone chose the cloud');
  assert.equal(phone.sync.undo().date, '9/12', 'and kept its own as a copy');

  // The PC keeps its own over a newer cloud: it goes up on top of the cloud's version.
  phone.edit((s) => { s.date = '9/20'; });
  await phone.flush();
  pc.edit((s) => { s.date = '9/21'; });
  await pc.flush();
  assert.deepEqual(pc.asked, ['O save mudou em outro aparelho']);
  const cloud = await (await call(new Request('http://x/api/save', { headers: { authorization: 'Bearer mestre' } }))).json();
  assert.equal(cloud.state.date, '9/21');
});

test('without a connection the changes wait on the device; a dismissed clash waits for a choice', async () => {
  const { opts } = await server('mestre');
  let online = true;
  const call = (request) => {
    if (!online) throw new TypeError('fetch failed');
    return handle(request, opts);
  };
  const pc = await device('pc', call, snapshotState());
  await pc.sync.connect('mestre');
  online = false;
  pc.edit((s) => { s.date = '9/11'; });
  await pc.flush();
  assert.equal(pc.sync.info().status, 'offline');
  assert.equal(JSON.parse(pc.storage.getItem(META_KEY)).dirty, true);
  online = true;
  await pc.sync.pull();
  assert.equal(pc.sync.info().status, 'idle');
  assert.equal(JSON.parse(pc.storage.getItem(META_KEY)).dirty, false);

  const other = await device('other', call, normalize({ ...snapshotState(), chapter: 2 }), ['']);
  await other.sync.connect('mestre');
  assert.equal(other.sync.info().status, 'conflict', 'nothing chosen yet');
  assert.equal(other.state.chapter, 2);
  await other.sync.resolve('remote');
  assert.equal(other.state.chapter, 6);
  assert.ok(isBlank({ ...freshState(), build: 'corte-carmesim' }));
  assert.ok(!isBlank(snapshotState()));
});

test('a save from before builds existed takes the build of the device it lands on, and the cloud gets it', async () => {
  const { opts } = await server('mestre');
  const call = (request) => handle(request, opts);
  const old = snapshotState();
  old.build = '';
  const mac = await device('mac', call, old);
  await mac.sync.connect('mestre');
  const pc = await device('pc', call, { ...snapshotState(), date: '9/30' }, ['ok']);
  await pc.sync.connect('mestre');
  assert.equal(pc.state.build, 'corte-carmesim', 'the PC keeps its build');
  assert.equal(pc.state.date, '9/7', 'and takes the rest from the cloud');
  const cloud = await (await call(new Request('http://x/api/save', { headers: { authorization: 'Bearer mestre' } }))).json();
  assert.equal(cloud.state.build, 'corte-carmesim', 'the build went up');
  await mac.sync.pull();
  assert.equal(mac.state.build, 'corte-carmesim', 'and reaches the Mac');
});
