// The same save on every device: after the master password is typed once, each change goes up to
// the cloud (api/save.js on Vercel, a row in Turso) and opening the page brings down what another
// device saved. Without the password nothing leaves this browser.
//
// The cloud numbers its versions. This device remembers the version it last saw (`rev`) and whether
// it has changes the cloud does not (`dirty`), in localStorage under META_KEY, apart from the save
// itself so an exported backup never carries the password. When both sides changed, the reader
// chooses which save to keep; the one set aside stays recoverable (here under BACKUP_KEY, in the
// cloud in its history).

import { normalize, freshState } from './store.js';

export const META_KEY = 'fe3h-sync';
export const BACKUP_KEY = 'fe3h-sync-backup';
const PUSH_DELAY = 1200;
const RETRY_DELAY = 20_000;

/** The endpoint: the Vercel project from the published page, the same server anywhere else. */
export function endpoint(loc = globalThis.location) {
  return loc?.hostname?.endsWith('github.io') ? 'https://three-houses-crimson-build.vercel.app/api/save' : '/api/save';
}

const comparable = (s) => {
  const { updated, ...rest } = normalize(s ?? {});
  return JSON.stringify(rest);
};
/** Whether two saves hold the same game, whenever each was saved. */
export const sameSave = (a, b) => comparable(a) === comparable(b);
/** A save with nothing in it yet beyond, maybe, the build. */
export const isBlank = (s) => comparable({ ...s, build: '' }) === comparable(freshState());

class SyncError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let active = null;

/** What the Dados page shows: off, or the state of the active connection. */
export function syncInfo() {
  return active?.info() ?? { on: false, status: 'off' };
}

/**
 * @param {{
 *   storage: Storage, fetch: typeof fetch, url: string,
 *   getState: () => object, adopt: (state: object) => void,
 *   ask: (opts: object) => Promise<'ok' | 'cancel' | ''>, notify: (message: string) => void, onChange: () => void,
 *   timers?: { set: typeof setTimeout, clear: typeof clearTimeout },
 * }} deps
 */
// setTimeout has to be called on its own, not as a method of another object ("Illegal invocation").
const TIMERS = { set: (fn, ms) => setTimeout(fn, ms), clear: (id) => clearTimeout(id) };

export function createSync({ storage, fetch, url, getState, adopt, ask, notify, onChange, timers = TIMERS }) {
  let status = 'idle';
  let message = '';
  let conflict = null;
  let edits = 0;
  let timer = null;
  let chain = Promise.resolve();

  const meta = () => {
    try {
      return JSON.parse(storage.getItem(META_KEY)) ?? null;
    } catch {
      return null;
    }
  };
  const setMeta = (patch) => {
    const next = { ...meta(), ...patch };
    try {
      storage.setItem(META_KEY, JSON.stringify(next));
    } catch { /* storage blocked: the session still syncs */ }
    return next;
  };
  const set = (s, m = '') => {
    status = s;
    message = m;
    onChange();
  };
  // One request at a time, in order.
  const serial = (fn) => {
    chain = chain.then(fn).catch(fail);
    return chain;
  };

  async function call(method, body, password = meta()?.password) {
    let res;
    try {
      res = await fetch(url, {
        method,
        cache: 'no-store',
        headers: { authorization: `Bearer ${password}`, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new SyncError('offline', 0);
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok || res.status === 409) return { status: res.status, ...data };
    throw new SyncError(data.error ?? `Erro ${res.status} no servidor.`, res.status);
  }

  function fail(err) {
    if (err.status === 0) {
      set('offline');
      if (meta()?.dirty) later(RETRY_DELAY);
    } else if (err.status === 401) {
      storage.removeItem(META_KEY);
      set('idle');
      notify('A senha mestre mudou. Conecte de novo em Dados.');
    } else {
      set('error', err.message);
    }
  }

  function later(ms = PUSH_DELAY) {
    timers.clear(timer);
    timer = timers.set(() => serial(push), ms);
  }

  function take(remote) {
    const local = getState();
    if (!isBlank(local) && !sameSave(local, remote.state)) {
      try {
        storage.setItem(BACKUP_KEY, JSON.stringify(local));
      } catch { /* nothing to keep it in */ }
    }
    adopt(normalize(remote.state));
    setMeta({ rev: remote.rev, dirty: false, at: new Date().toISOString() });
    conflict = null;
    set('idle');
  }

  async function push() {
    const m = meta();
    if (!m?.password || !m.dirty) return;
    set('busy');
    const sent = edits;
    const res = await call('PUT', { base: m.rev ?? 0, state: getState() });
    if (res.status === 409) return reconcile(res);
    setMeta({ rev: res.rev, dirty: edits !== sent, at: new Date().toISOString() });
    set('idle');
    if (edits !== sent) later();
  }

  async function reconcile(remote, { first = false } = {}) {
    const m = meta();
    const local = getState();
    if (!remote.rev) {
      setMeta({ rev: 0, dirty: true });
      await push();
      if (first) notify('Conectado. Seu save foi para a nuvem.');
      return;
    }
    if (sameSave(local, remote.state)) {
      setMeta({ rev: remote.rev, dirty: false, at: new Date().toISOString() });
      conflict = null;
      set('idle');
      if (first) notify('Conectado. Este aparelho e a nuvem já tinham o mesmo save.');
      return;
    }
    if (!first && remote.rev === m.rev) {
      if (m.dirty) return push();
      return set('idle');
    }
    // The cloud moved on (or this device is new to it) and the two saves differ.
    if ((!first && !m.dirty) || isBlank(local)) {
      take(remote);
      notify(first ? 'Conectado. Este aparelho pegou o save da nuvem.' : 'Save atualizado com o que você salvou em outro aparelho.');
      return;
    }
    conflict = remote;
    set('conflict');
    const choice = await ask({
      title: first ? 'Já existe um save na nuvem' : 'O save mudou em outro aparelho',
      body: `Na nuvem: ${describe(remote.state, remote.updated)}. Neste aparelho: ${describe(local, local.updated)}. O que você não escolher fica guardado como cópia.`,
      confirm: 'Usar o da nuvem',
      cancel: 'Manter o deste aparelho',
    });
    if (choice === 'ok') return resolve('remote');
    if (choice === 'cancel') return resolve('local');
  }

  async function resolve(which) {
    if (!conflict) return;
    if (which === 'remote') {
      take(conflict);
      return notify('Agora este aparelho usa o save da nuvem.');
    }
    setMeta({ rev: conflict.rev, dirty: true });
    conflict = null;
    await push();
    notify('O save deste aparelho foi para a nuvem.');
  }

  const api = {
    info() {
      const m = meta();
      return { on: Boolean(m?.password), status: m?.password ? status : 'off', message, at: m?.at ?? null, backup: Boolean(storage.getItem(BACKUP_KEY)), conflict };
    },
    /** Check the password and line this device up with the cloud. Throws with a readable message. */
    async connect(password) {
      const remote = await call('GET', null, password).catch((err) => {
        throw new Error(err.status === 0 ? 'Sem conexão com o servidor.' : err.message);
      });
      storage.removeItem(BACKUP_KEY);
      setMeta({ password, rev: 0, dirty: false, at: null });
      return serial(() => reconcile(remote, { first: true }));
    },
    disconnect() {
      timers.clear(timer);
      storage.removeItem(META_KEY);
      conflict = null;
      set('idle');
    },
    /** Bring down what another device saved (on opening the page, coming back to it, going online). */
    pull() {
      if (!meta()?.password) return Promise.resolve();
      return serial(async () => {
        set('busy');
        return reconcile(await call('GET'));
      });
    },
    /** After every local change. */
    changed() {
      if (!meta()?.password) return;
      edits += 1;
      setMeta({ dirty: true });
      later();
    },
    resolve: (which) => serial(() => resolve(which)),
    /** Go back to the save this device had before it took one from the cloud. */
    undo() {
      const raw = storage.getItem(BACKUP_KEY);
      if (!raw) return null;
      storage.removeItem(BACKUP_KEY);
      return normalize(JSON.parse(raw));
    },
    /** Wait for whatever is under way (tests). */
    settle: () => chain,
  };
  active = api;
  return api;
}

function describe(state, updated) {
  const s = normalize(state ?? {});
  const when = updated ? `, salvo em ${new Date(updated).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : '';
  return `Cap. ${s.chapter}${s.date ? ` · ${s.date}` : ''}${when}`;
}
