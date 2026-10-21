// The save in the cloud: one row in a Turso database, read and written by api/save.js on Vercel.
// The Turso token stays on the server; the page sends the master password (SYNC_PASSWORD).
//
// Every write names the version it started from (`base`). If the cloud has moved on since, nothing
// is written and the page gets the newer save back (409), so two devices never overwrite each
// other by accident. The version a write replaces goes to save_history (the last 50 are kept).
//
//   GET  → { rev, state, updated }   rev 0 and state null when nothing was saved yet
//   PUT  { base, state } → { rev, updated } or 409 with the cloud's { rev, state, updated }

import { createHash, timingSafeEqual } from 'node:crypto';

const SAVE_ID = 'master';
const MAX_BYTES = 512 * 1024;
const HISTORY = 50;

const SCHEMA = [
  { sql: 'CREATE TABLE IF NOT EXISTS saves (id TEXT PRIMARY KEY, rev INTEGER NOT NULL, state TEXT NOT NULL, updated TEXT NOT NULL)' },
  { sql: 'CREATE TABLE IF NOT EXISTS save_history (rev INTEGER PRIMARY KEY, state TEXT NOT NULL, updated TEXT NOT NULL)' },
];
const CURRENT = { sql: 'SELECT rev, state, updated FROM saves WHERE id = ?', args: [SAVE_ID] };

// ---------- databases: run([{ sql, args }]) → [{ rows: [{ column: value }], changes }] ----------

const toArg = (v) => {
  if (v == null) return { type: 'null' };
  if (Number.isInteger(v)) return { type: 'integer', value: String(v) };
  return { type: 'text', value: String(v) };
};
const fromValue = (v) => (v.type === 'null' ? null : v.type === 'integer' ? Number(v.value) : v.value);

/** Turso over its HTTP API (one pipeline per call, statements run in order). */
export function tursoDb({ url, token, fetch = globalThis.fetch }) {
  const endpoint = `${url.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '')}/v2/pipeline`;
  return {
    async run(statements) {
      const requests = statements.map(({ sql, args = [] }) => ({ type: 'execute', stmt: { sql, args: args.map(toArg) } }));
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ requests: [...requests, { type: 'close' }] }),
      });
      if (!res.ok) throw new Error(`Turso respondeu ${res.status}`);
      const { results } = await res.json();
      return statements.map((_, i) => {
        const r = results[i];
        if (r?.type !== 'ok') throw new Error(r?.error?.message ?? 'Turso não executou a consulta');
        const { cols, rows, affected_row_count: changes } = r.response.result;
        return { rows: rows.map((row) => Object.fromEntries(cols.map((c, j) => [c.name, fromValue(row[j])]))), changes };
      });
    },
  };
}

/** A SQLite file through node:sqlite, for working on the page locally (tools/serve.mjs) and the tests. */
export async function sqliteDb(file = ':memory:') {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(file);
  return {
    async run(statements) {
      return statements.map(({ sql, args = [] }) => {
        const stmt = db.prepare(sql);
        if (/^\s*select/i.test(sql)) return { rows: stmt.all(...args).map((r) => ({ ...r })), changes: 0 };
        return { rows: [], changes: Number(stmt.run(...args).changes) };
      });
    },
  };
}

// ---------- the endpoint ----------

const digest = (s) => createHash('sha256').update(String(s)).digest();

function passwordOk(request, password) {
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  return given.length > 0 && timingSafeEqual(digest(given), digest(password));
}

function corsHeaders(request, origins) {
  const origin = request.headers.get('origin');
  if (!origin || !origins.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

const row = (result) => {
  const r = result.rows[0];
  return r ? { rev: r.rev, state: JSON.parse(r.state), updated: r.updated } : { rev: 0, state: null, updated: null };
};

/**
 * @param {Request} request
 * @param {{ db: { run: Function } | null, password: string | undefined, origins: string[], now?: () => Date }} opts
 */
export async function handle(request, { db, password, origins, now = () => new Date() }) {
  const cors = corsHeaders(request, origins);
  const reply = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

  if (request.method === 'OPTIONS') return reply(204);
  if (!db || !password) return reply(503, { error: 'A sincronização não está configurada no servidor.' });
  if (!passwordOk(request, password)) {
    // A wrong password costs a moment, so guessing is slow.
    await new Promise((r) => setTimeout(r, 400));
    return reply(401, { error: 'Senha errada.' });
  }

  try {
    if (request.method === 'GET') {
      const results = await db.run([...SCHEMA, CURRENT]);
      return reply(200, row(results.at(-1)));
    }
    if (request.method === 'PUT') {
      const raw = await request.text();
      if (raw.length > MAX_BYTES) return reply(413, { error: 'Save grande demais.' });
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return reply(400, { error: 'JSON inválido.' });
      }
      const { base, state } = body ?? {};
      if (!Number.isInteger(base) || base < 0 || !state || typeof state !== 'object' || Array.isArray(state)) {
        return reply(400, { error: 'Envie { base, state }.' });
      }
      const updated = now().toISOString();
      const json = JSON.stringify(state);
      const write = base === 0
        ? { sql: 'INSERT INTO saves (id, rev, state, updated) VALUES (?, 1, ?, ?) ON CONFLICT(id) DO NOTHING', args: [SAVE_ID, json, updated] }
        : { sql: 'UPDATE saves SET rev = rev + 1, state = ?, updated = ? WHERE id = ? AND rev = ?', args: [json, updated, SAVE_ID, base] };
      const results = await db.run([
        ...SCHEMA,
        // The version being replaced, if it is the one this write started from.
        { sql: 'INSERT OR IGNORE INTO save_history (rev, state, updated) SELECT rev, state, updated FROM saves WHERE id = ? AND rev = ?', args: [SAVE_ID, base] },
        write,
        { sql: 'DELETE FROM save_history WHERE rev <= (SELECT MAX(rev) FROM save_history) - ?', args: [HISTORY] },
        CURRENT,
      ]);
      const current = row(results.at(-1));
      const written = results.at(-3).changes === 1;
      return written ? reply(200, { rev: current.rev, updated: current.updated }) : reply(409, current);
    }
    return reply(405, { error: 'Use GET ou PUT.' });
  } catch (err) {
    return reply(502, { error: `Banco indisponível: ${err.message}` });
  }
}

/** The endpoint as configured by the environment (Vercel) or, without Turso settings, a local file. */
export async function fromEnv(env = process.env, { localFile } = {}) {
  const origins = (env.SYNC_ORIGINS ?? 'https://ldallacqua.github.io').split(',').map((s) => s.trim()).filter(Boolean);
  let db = null;
  if (env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN) db = tursoDb({ url: env.TURSO_DATABASE_URL, token: env.TURSO_AUTH_TOKEN });
  else if (localFile) db = await sqliteDb(localFile);
  return { db, password: env.SYNC_PASSWORD, origins };
}
