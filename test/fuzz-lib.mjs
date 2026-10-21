// Helpers for the fuzz test: a seeded random state and the checks that find impossible output.
// Kept apart from the test so a one-off script can list every problem across many seeds.

import { normalize } from '../js/store.js';
import { UNITS, ROLES } from '../data/units.js';
import { RANKS, SKILLS, STATS, SUPPORTS } from '../data/skills.js';
import { CLASSES, OTHER_CLASSES } from '../data/classes.js';
import { PARALOGUES } from '../data/paralogues.js';
import { painel } from '../js/views/painel.js';
import { atualizar } from '../js/views/atualizar.js';
import { esquadrao } from '../js/views/esquadrao.js';
import { unidade } from '../js/views/unidade.js';
import { recrutamento } from '../js/views/recrutamento.js';
import { capitulos } from '../js/views/capitulos.js';
import { paralogues } from '../js/views/paralogues.js';
import { classes } from '../js/views/classes.js';
import { mosteiro } from '../js/views/mosteiro.js';
import { dados } from '../js/views/dados.js';
import { builds } from '../js/views/builds.js';

// mulberry32
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLASS_NAMES = [...CLASSES.map((c) => c.name), ...OTHER_CLASSES];
const MONTH_OF = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 1, 11: 2, 12: 3 };

export function randomState(seed) {
  const r = rng(seed);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const maybe = (p, f) => (r() < p ? f() : undefined);
  const chapter = 1 + Math.floor(r() * 17);
  const units = {};
  for (const u of UNITS) {
    const ranks = {};
    for (const s of SKILLS) if (r() < 0.7) ranks[s.id] = pick(RANKS.slice(0, 10));
    const stats = {};
    for (const s of STATS) if (r() < 0.6) stats[s.id] = Math.floor(r() * 40);
    units[u.id] = {
      recruited: r() < 0.5,
      level: maybe(0.85, () => 1 + Math.floor(r() * 40)),
      cls: maybe(0.85, () => pick(CLASS_NAMES)),
      plan: maybe(0.3, () => pick(u.plans ?? [{ id: 'x' }]).id),
      role: maybe(0.4, () => pick(Object.keys(ROLES))),
      support: maybe(0.7, () => pick(SUPPORTS)),
      mastered: CLASS_NAMES.filter(() => r() < 0.08),
      ranks,
      stats,
    };
  }
  const month = MONTH_OF[chapter];
  return normalize({
    build: r() < 0.9 ? 'corte-carmesim' : '',
    chapter,
    date: month && r() < 0.7 ? `${month}/${1 + Math.floor(r() * 30)}` : '',
    units,
    paralogues: Object.fromEntries(PARALOGUES.filter(() => r() < 0.3).map((p) => [p.id, true])),
    reviewed: Object.fromEntries(UNITS.filter(() => r() < 0.4).map((u) => [u.id, chapter - Math.floor(r() * 2)])),
  });
}

export const PAGES = [
  ['painel', (s) => painel(s)],
  ['atualizar', (s) => atualizar(s)],
  ['esquadrao', (s) => esquadrao(s)],
  ['recrutamento', (s) => recrutamento(s)],
  ['capitulos', (s) => capitulos(s)],
  ['paralogues', (s) => paralogues(s)],
  ['classes', (s) => classes(s)],
  ['mosteiro', (s) => mosteiro(s)],
  ['dados', (s) => dados(s)],
  ['builds', (s) => builds(s)],
  ...UNITS.map((u) => [`unidade/${u.id}`, (s) => unidade(s, u.id)]),
];

const RANK = String.raw`(E\+?|D\+?|C\+?|B\+?|A\+?|S\+?)`;
const ARROW = new RegExp(`${RANK}\\s*→\\s*${RANK}`, 'g');
// Ids the page shell provides (index.html), which views may point at.
const SHELL_IDS = new Set(['tip', 'dialog', 'main']);

/** Everything wrong with one rendered page, as readable lines. */
export function problems(markup) {
  const out = [];
  const text = markup
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#\w]+;/g, ' ')
    .replace(/\s+/g, ' ');
  for (const bad of ['undefined', 'NaN', '[object', 'null', 'Infinity']) {
    const at = text.indexOf(bad);
    if (at >= 0) out.push(`"${bad}" in text: …${text.slice(Math.max(0, at - 60), at + 40)}…`);
  }
  for (const m of text.matchAll(ARROW)) {
    if (RANKS.indexOf(m[1]) >= RANKS.indexOf(m[2])) out.push(`arrow does not go up: "${text.slice(Math.max(0, m.index - 50), m.index + m[0].length + 10)}"`);
  }
  for (const m of text.matchAll(/(-\d+|\b0) XP\b/g)) out.push(`odd amount "${m[0]}": …${text.slice(Math.max(0, m.index - 60), m.index + 10)}…`);
  for (const m of text.matchAll(/~0–0 sessões|0 de 0\b/g)) out.push(`empty count "${m[0]}"`);
  for (const m of markup.matchAll(/(?:href|value|data-bind|data-value)="[^"]*(?:undefined|null|NaN)[^"]*"/g)) out.push(`bad attribute ${m[0]}`);

  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) out.push(`duplicate id "${id}"`);
    seen.add(id);
  }
  const refs = [
    ...[...markup.matchAll(/\sfor="([^"]+)"/g)].map((m) => m[1]),
    ...[...markup.matchAll(/\saria-(?:controls|labelledby|describedby)="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)),
    ...[...markup.matchAll(/\sdata-for="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const ref of refs) if (!seen.has(ref) && !SHELL_IDS.has(ref)) out.push(`points at missing id "${ref}"`);
  return out;
}

