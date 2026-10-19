// The player's state: what the game would tell us if we could read the save. It lives in
// localStorage on this device and can be exported as JSON. Everything that comes in (storage or an
// imported file) goes through normalize(), which keeps only known keys and valid values.

import { SNAPSHOT } from '../data/snapshot.js';
import { UNITS } from '../data/units.js';
import { RANKS, SKILLS, STATS, SUPPORTS } from '../data/skills.js';
import { CLASS_BY_NAME, OTHER_CLASSES } from '../data/classes.js';
import { PARALOGUES } from '../data/paralogues.js';

export const STORAGE_KEY = 'fe3h-crimson-build';
export const SCHEMA = 1;

const ROLE_KEYS = ['titular', 'rotacao', 'reserva', 'utilitario', 'temporaria', 'ignorar'];
const SKILL_IDS = new Set(SKILLS.map((s) => s.id));
const STAT_IDS = new Set(STATS.map((s) => s.id));
const CLASS_NAMES = new Set([...Object.keys(CLASS_BY_NAME), ...OTHER_CLASSES]);
const PARALOGUE_IDS = new Set(PARALOGUES.map((p) => p.id));

const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const int = (v, min, max) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const text = (v, max = 400) => (typeof v === 'string' ? v.slice(0, max) : '');

function normalizeUnit(raw, def) {
  const u = isObj(raw) ? raw : {};
  const out = {};
  out.recruited = def.id === 'byleth' ? true : Boolean(u.recruited);
  const level = int(u.level, 1, 99);
  if (level != null) out.level = level;
  if (CLASS_NAMES.has(u.cls)) out.cls = u.cls;
  if (typeof u.plan === 'string' && def.plans?.some((p) => p.id === u.plan)) out.plan = u.plan;
  if (ROLE_KEYS.includes(u.role)) out.role = u.role;
  // C+ and B+ were options before the select matched the game; they read as the rank shown.
  const support = { 'C+': 'C', 'B+': 'B' }[u.support] ?? u.support;
  if (SUPPORTS.includes(support)) out.support = support;
  out.mastered = Array.isArray(u.mastered) ? [...new Set(u.mastered.filter((c) => CLASS_NAMES.has(c)))] : [];
  out.stats = {};
  if (isObj(u.stats)) for (const [k, v] of Object.entries(u.stats)) if (STAT_IDS.has(k) && int(v, 0, 255) != null) out.stats[k] = int(v, 0, 255);
  out.ranks = {};
  if (isObj(u.ranks)) for (const [k, v] of Object.entries(u.ranks)) if (SKILL_IDS.has(k) && RANKS.includes(v)) out.ranks[k] = v;
  const note = text(u.note, 2000);
  if (note) out.note = note;
  return out;
}

/** Fill gaps from the defaults and drop anything unknown. Never throws. */
export function normalize(raw) {
  const s = isObj(raw) ? raw : {};
  const state = {
    schema: SCHEMA,
    chapter: int(s.chapter, 1, 17) ?? SNAPSHOT.chapter,
    date: text(s.date, 8),
    difficulty: ['', 'Normal', 'Hard', 'Maddening'].includes(s.difficulty) ? s.difficulty : '',
    mode: ['', 'Casual', 'Classic'].includes(s.mode) ? s.mode : '',
    units: {},
    checks: {},
    paralogues: {},
    updated: text(s.updated, 40),
  };
  for (const def of UNITS) {
    const fallback = SNAPSHOT.units[def.id] ?? {};
    state.units[def.id] = normalizeUnit(isObj(s.units) && isObj(s.units[def.id]) ? s.units[def.id] : fallback, def);
  }
  if (isObj(s.checks)) for (const [k, v] of Object.entries(s.checks)) if (/^[\w-]{1,60}$/.test(k) && v) state.checks[k] = true;
  if (isObj(s.paralogues)) for (const [k, v] of Object.entries(s.paralogues)) if (PARALOGUE_IDS.has(k) && v) state.paralogues[k] = true;
  return state;
}

export function snapshotState() {
  return normalize(structuredClone(SNAPSHOT));
}

export function load(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : snapshotState();
  } catch {
    return snapshotState();
  }
}

export function save(state, storage = globalThis.localStorage) {
  try {
    state.updated = new Date().toISOString();
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Parse an exported file. Returns the normalized state or throws with a readable message. */
export function parseImport(textContent) {
  let data;
  try {
    data = JSON.parse(textContent);
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  if (!isObj(data) || !isObj(data.units)) throw new Error('Esse JSON não parece um backup deste guia.');
  return normalize(data);
}

/** Set a value by dotted path ("units.petra.level"), creating objects on the way. */
export function setPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys.slice(0, -1)) {
    if (!isObj(cur[k])) cur[k] = {};
    cur = cur[k];
  }
  const last = keys.at(-1);
  if (value === undefined || value === null || value === '') delete cur[last];
  else cur[last] = value;
}

export function getPath(obj, path) {
  return path.split('.').reduce((cur, k) => (cur == null ? undefined : cur[k]), obj);
}
