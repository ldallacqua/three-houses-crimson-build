import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, load, save, parseImport, setPath, snapshotState, freshState, STORAGE_KEY } from '../js/store.js';
import { html, md } from '../js/html.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), map };
}

test('a fresh device starts in Chapter 1 with no build and only the Black Eagles', () => {
  const s = load(memoryStorage());
  assert.equal(s.build, '');
  assert.equal(s.chapter, 1);
  assert.equal(s.date, '');
  assert.equal(s.updated, '');
  for (const id of ['byleth', 'edelgard', 'petra', 'bernadetta', 'dorothea']) assert.equal(s.units[id].recruited, true, id);
  for (const id of ['lysithea', 'constance', 'shamir', 'anna']) assert.equal(s.units[id].recruited, false, id);
  assert.equal(s.units.byleth.level, undefined, 'nothing about the save is assumed');
  assert.deepEqual(s, freshState());
});

test('the example save is the author’s Chapter 6 game, on the build it follows', () => {
  const s = snapshotState();
  assert.equal(s.build, 'corte-carmesim');
  assert.equal(s.chapter, 6);
  assert.equal(s.date, '9/7');
  assert.equal(s.units.byleth.level, 20);
  assert.equal(s.units.constance.ranks.reason, 'C+');
  assert.equal(s.units.lysithea.recruited, false);
});

test('only a build the guide knows is kept; a save from before builds gets none', () => {
  assert.equal(normalize({ build: 'corte-carmesim' }).build, 'corte-carmesim');
  assert.equal(normalize({ build: 'nope' }).build, '');
  const old = structuredClone(snapshotState());
  delete old.build;
  assert.equal(normalize(old).build, '');
  assert.equal(normalize(old).units.byleth.level, 20, 'the rest of an older save is kept');
});

test('save and load round-trip', () => {
  const storage = memoryStorage();
  const s = snapshotState();
  s.units.petra.mastered.push('Brigand');
  s.checks['ch6-shamir'] = true;
  assert.ok(save(s, storage));
  const back = load(storage);
  assert.deepEqual(back.units.petra.mastered, ['Brigand']);
  assert.equal(back.checks['ch6-shamir'], true);
});

test('broken storage starts fresh', () => {
  const storage = memoryStorage();
  storage.map.set(STORAGE_KEY, '{not json');
  assert.equal(load(storage).chapter, 1);
  assert.equal(load({ getItem() { throw new Error('blocked'); } }).chapter, 1);
});

test('normalize drops unknown and invalid values', () => {
  const s = normalize({
    chapter: 99,
    difficulty: 'Lunatic',
    units: { petra: { level: '12', cls: 'Space Pirate', ranks: { axe: 'B', laser: 'A', bow: 'Z' }, stats: { str: 18, luck: 4 }, mastered: ['Brigand', 'Nope'] }, hacker: {} },
    checks: { 'ch6-shamir': true, '<script>': true },
    paralogues: { nuptials: true, fake: true },
  });
  assert.equal(s.chapter, 1);
  assert.equal(s.difficulty, '');
  assert.equal(s.units.petra.level, 12);
  assert.equal(s.units.petra.cls, undefined);
  assert.deepEqual(s.units.petra.ranks, { axe: 'B' });
  assert.deepEqual(s.units.petra.stats, { str: 18 });
  assert.deepEqual(s.units.petra.mastered, ['Brigand']);
  assert.ok(!('hacker' in s.units));
  assert.deepEqual(Object.keys(s.checks), ['ch6-shamir']);
  assert.deepEqual(Object.keys(s.paralogues), ['nuptials']);
  assert.equal(s.units.byleth.recruited, true, 'Byleth is always there');
});

test('import rejects files that are not a backup', () => {
  assert.throws(() => parseImport('nope'), /JSON válido/);
  assert.throws(() => parseImport('{"a":1}'), /backup/);
  assert.equal(parseImport(JSON.stringify(snapshotState())).chapter, 6);
});

test('setPath creates and clears', () => {
  const o = {};
  setPath(o, 'units.petra.level', 12);
  assert.equal(o.units.petra.level, 12);
  setPath(o, 'units.petra.level', '');
  assert.ok(!('level' in o.units.petra));
});

test('html escapes values and md only adds emphasis', () => {
  const name = '<img src=x onerror=alert(1)>';
  assert.equal(html`<b>${name}</b>`.toString(), '<b>&lt;img src=x onerror=alert(1)&gt;</b>');
  assert.equal(md('**a** <i>').toString(), '<strong>a</strong> &lt;i&gt;');
  assert.equal(html`${[html`<i>1</i>`, '<2>']}`.toString(), '<i>1</i>&lt;2&gt;');
});
