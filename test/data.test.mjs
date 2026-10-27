// The data has to hang together: every class a plan names exists, every rank is a rank, every
// note opens, and the offline copy lists every file the page loads.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { UNITS } from '../data/units.js';
import { CLASSES, CLASS_BY_NAME } from '../data/classes.js';
import { RANKS, SKILL_NAME, SUPPORTS } from '../data/skills.js';
import { PARALOGUES } from '../data/paralogues.js';
import { FACULTY, FACULTY_BY_ID } from '../data/faculty.js';
import { SNAPSHOT } from '../data/snapshot.js';
import { SEALED } from '../data/chapters.js';
import { NOTE_KEYS, openNotes } from '../js/seal.js';
import { BUILDS } from '../data/builds.js';
import { ITEM_KIND } from '../js/views/ui.js';
import { UNIT_BY_ID } from '../data/units.js';

const isRank = (r) => RANKS.includes(r);

test('every class has valid requirements', () => {
  for (const c of CLASSES) {
    for (const [skill, rank] of Object.entries({ ...c.reqs, ...c.reqsAny })) {
      assert.ok(SKILL_NAME[skill], `${c.name}: skill ${skill}`);
      assert.ok(isRank(rank), `${c.name}: rank ${rank}`);
    }
    if (c.needsClass) assert.ok(CLASS_BY_NAME[c.needsClass], `${c.name}: needs ${c.needsClass}`);
  }
});

test('every unit plan names real classes and real ranks', () => {
  for (const u of UNITS) {
    for (const p of u.plans ?? []) {
      assert.ok(p.id && p.label, `${u.id}: plan id/label`);
      for (const s of p.stages) assert.ok(CLASS_BY_NAME[s.cls], `${u.id}/${p.id}: class ${s.cls}`);
      for (const s of p.stages) {
        const g = CLASS_BY_NAME[s.cls].gender;
        assert.ok(!g || g === u.gender, `${u.id}: ${s.cls} is for the other gender`);
      }
    }
    for (const m of u.milestones ?? []) assert.ok(SKILL_NAME[m.skill] && isRank(m.rank), `${u.id}: milestone`);
    for (const l of u.learn ?? []) assert.ok(SKILL_NAME[l.skill] && (isRank(l.rank) || l.rank === 'budding'), `${u.id}: learn ${l.name}`);
    if (u.birthday) assert.match(u.birthday, /^\d{1,2}\/\d{1,2}$/, `${u.id}: birthday`);
  }
});

test('student recruitment tables cover every support rank below A and get easier', () => {
  for (const u of UNITS.filter((x) => x.recruit?.kind === 'student')) {
    const keys = ['none', 'C', 'C+', 'B', 'B+'];
    let prev = null;
    for (const k of keys) {
      const t = u.recruit.tiers[k];
      assert.ok(t && isRank(t.rank) && Number.isInteger(t.stat), `${u.id}: tier ${k}`);
      if (prev) {
        assert.ok(t.stat <= prev.stat, `${u.id}: stat goes down at ${k}`);
        assert.ok(RANKS.indexOf(t.rank) <= RANKS.indexOf(prev.rank), `${u.id}: rank goes down at ${k}`);
      }
      prev = t;
    }
  }
});

test('paralogues name known units and sane windows', () => {
  const known = new Set([...UNITS.map((u) => u.id), 'alois', 'hanneman', 'seteth']);
  for (const p of PARALOGUES) {
    for (const id of p.units) assert.ok(known.has(id), `${p.id}: unit ${id}`);
    assert.ok(p.window[0] <= p.window[1] && p.window[1] <= 11, `${p.id}: window`);
  }
});

test('snapshot uses only known units, classes and ranks', () => {
  for (const [id, st] of Object.entries(SNAPSHOT.units)) {
    assert.ok(UNITS.some((u) => u.id === id), id);
    assert.ok(CLASS_BY_NAME[st.cls], `${id}: ${st.cls}`);
    for (const r of Object.values(st.ranks)) assert.ok(isRank(r), `${id}: ${r}`);
  }
});

test('sealed notes open, in order, and name real instructors', () => {
  assert.deepEqual(NOTE_KEYS, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'p2']);
  for (const key of Object.keys(SEALED)) {
    const n = openNotes(key, 99);
    assert.equal(n.key, key);
    for (const id of n.away ?? []) assert.ok(id === '*' || FACULTY_BY_ID[id], `${key}: ${id}`);
  }
});

test('every item recommendation names a known kind and real units', () => {
  const notes = Object.keys(SEALED).map((key) => openNotes(key, 99));
  const recs = [
    ...notes.flatMap((n) => (n.items ?? []).map((it) => [`notas ${n.key}`, it])),
    ...PARALOGUES.flatMap((p) => (p.items ?? []).map((it) => [p.id, it])),
  ];
  assert.ok(recs.length > 40, 'items from chapters and paralogues');
  for (const [where, it] of recs) {
    assert.ok(it.item && it.why, `${where}: ${it.item}`);
    assert.ok(ITEM_KIND[it.kind], `${where}: ${it.item} kind ${it.kind}`);
    for (const id of it.who) assert.ok(UNIT_BY_ID[id], `${where}: ${it.item} → ${id}`);
    assert.equal(new Set(it.who).size, it.who.length, `${where}: ${it.item} repeats a name`);
  }
  for (const n of notes.filter((n) => n.key !== 'p2' && Number(n.key) <= 12)) assert.ok(n.items?.length, `Cap. ${n.key} has items`);
});

test('every build names real units and says who made it', () => {
  assert.ok(BUILDS.length >= 1);
  assert.equal(new Set(BUILDS.map((b) => b.id)).size, BUILDS.length);
  for (const b of BUILDS) {
    assert.ok(b.name && b.author && b.tagline && b.pitch, b.id);
    assert.ok(UNIT_BY_ID[b.lead], `${b.id}: lead`);
    for (const id of b.faces) assert.ok(UNIT_BY_ID[id], `${b.id}: ${id}`);
  }
  assert.equal(SNAPSHOT.build, BUILDS[0].id, 'the example save follows a real build');
});

test('sealed notes stay shut past the current chapter', () => {
  assert.ok(openNotes('1', 1));
  assert.equal(openNotes('2', 1), null);
  assert.ok(openNotes('6', 6));
  assert.equal(openNotes('7', 6), null);
  assert.equal(openNotes('p2', 12), null);
  assert.ok(openNotes('p2', 13));
});

test('the offline copy lists every file the page loads', async () => {
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const listed = new Set([...sw.matchAll(/'([\w./-]+\.(?:js|css|html|svg|png|webmanifest))'/g)].map((m) => m[1]));
  const dirs = ['js', 'js/views', 'js/controls', 'data', 'css'];
  for (const dir of dirs) {
    for (const f of await readdir(new URL(`../${dir}/`, import.meta.url))) {
      if (/\.(js|css)$/.test(f)) assert.ok(listed.has(`${dir}/${f}`), `sw.js is missing ${dir}/${f}`);
    }
  }
});

test('everyone on the page has a portrait, and the offline copy has them all', async () => {
  const files = new Set((await readdir(new URL('../img/portraits/', import.meta.url))).map((f) => f.replace(/\.webp$/, '')));
  for (const id of [...UNITS.map((u) => u.id), ...FACULTY.map((f) => f.id)]) assert.ok(files.has(id), `no portrait for ${id}`);
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const listed = sw.match(/const PORTRAITS = \[([^\]]+)\]/)[1].match(/'([\w-]+)'/g).map((m) => m.slice(1, -1));
  assert.deepEqual([...listed].sort(), [...files].sort());
});

test('every sealed task rule names things that exist', async () => {
  const { SEALED } = await import('../data/chapters.js');
  const { UNIT_BY_ID } = await import('../data/units.js');
  const { CLASS_BY_NAME } = await import('../data/classes.js');
  const { PARALOGUE_BY_ID } = await import('../data/paralogues.js');
  let rules = 0;
  for (const b64 of Object.values(SEALED)) {
    const note = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    for (const t of note.tasks ?? []) {
      if (!t.auto) continue;
      rules++;
      const a = t.auto;
      for (const id of [...(a.recruited ?? []), ...Object.keys(a.reached ?? {}), ...Object.keys(a.mastered ?? {}), ...Object.keys(a.support ?? {})]) assert.ok(UNIT_BY_ID[id], `${t.id}: ${id}`);
      for (const cls of [...Object.values(a.reached ?? {}), ...Object.values(a.mastered ?? {})]) assert.ok(CLASS_BY_NAME[cls], `${t.id}: ${cls}`);
      for (const id of a.paralogues ?? []) assert.ok(PARALOGUE_BY_ID[id], `${t.id}: ${id}`);
    }
  }
  assert.ok(rules >= 25);
});

test('battalions: real ranks and gambits, sources that exist, and item lists that match the plan', async () => {
  const { BATTALIONS, BATTALION_BY_NAME, BATTALION_PLAN, GAMBITS } = await import('../data/battalions.js');
  const { PARALOGUE_BY_ID } = await import('../data/paralogues.js');
  assert.equal(Object.keys(BATTALION_BY_NAME).length, BATTALIONS.length, 'names are unique');
  for (const b of BATTALIONS) {
    assert.ok(isRank(b.auth), `${b.name}: rank ${b.auth}`);
    assert.ok(GAMBITS[b.gambit], `${b.name}: gambit ${b.gambit}`);
    const g = b.get;
    if (g.paralogue) assert.ok(PARALOGUE_BY_ID[g.paralogue], `${b.name}: paralogue ${g.paralogue}`);
    for (const id of [g.needs ?? []].flat()) assert.ok(UNIT_BY_ID[id], `${b.name}: unit ${id}`);
    assert.ok(g.guild || g.auto || g.paralogue || (g.p2 && g.from), `${b.name}: where it comes from`);
  }
  for (const [id, list] of Object.entries(BATTALION_PLAN)) {
    assert.ok(UNIT_BY_ID[id], `plan for unknown unit ${id}`);
    for (const [name, why] of list) assert.ok(BATTALION_BY_NAME[name] && why, `${id}: ${name}`);
  }
  // A battalion an item list hands out goes to someone who has it in her own list.
  const recs = [...PARALOGUES.flatMap((p) => p.items ?? []), ...NOTE_KEYS.flatMap((k) => openNotes(k, 99)?.items ?? [])]
    .filter((r) => r.kind === 'battalion');
  for (const r of recs) {
    for (const id of r.who) assert.ok(BATTALION_PLAN[id]?.some(([n]) => n === r.item), `${r.item}: ${id} does not plan to lead it`);
  }
});
