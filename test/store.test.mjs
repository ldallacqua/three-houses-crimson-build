import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, load, save, parseImport, setPath, snapshotState, STORAGE_KEY } from '../js/store.js';
import { html, md } from '../js/html.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), map };
}

test('a fresh device starts from the snapshot', () => {
  const s = load(memoryStorage());
  assert.equal(s.chapter, 6);
  assert.equal(s.date, '9/7');
  assert.equal(s.units.byleth.level, 20);
  assert.equal(s.units.constance.ranks.reason, 'C+');
  assert.equal(s.units.lysithea.recruited, false);
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

test('broken storage falls back to the snapshot', () => {
  const storage = memoryStorage();
  storage.map.set(STORAGE_KEY, '{not json');
  assert.equal(load(storage).chapter, 6);
  assert.equal(load({ getItem() { throw new Error('blocked'); } }).chapter, 6);
});

test('normalize drops unknown and invalid values', () => {
  const s = normalize({
    chapter: 99,
    difficulty: 'Lunatic',
    units: { petra: { level: '12', cls: 'Space Pirate', ranks: { axe: 'B', laser: 'A', bow: 'Z' }, stats: { str: 18, luck: 4 }, mastered: ['Brigand', 'Nope'] }, hacker: {} },
    checks: { 'ch6-shamir': true, '<script>': true },
    paralogues: { nuptials: true, fake: true },
  });
  assert.equal(s.chapter, 6);
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
