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
  assert.deepEqual(NOTE_KEYS, ['6', '7', '8', '9', '10', '11', '12', 'p2']);
  for (const key of Object.keys(SEALED)) {
    const n = openNotes(key, 99);
    assert.equal(n.key, key);
    for (const id of n.away ?? []) assert.ok(id === '*' || FACULTY_BY_ID[id], `${key}: ${id}`);
  }
});

test('sealed notes stay shut past the current chapter', () => {
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
