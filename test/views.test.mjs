// The Mosteiro and Classes pages fill in their advice from the state; check the parts that change.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mosteiro } from '../js/views/mosteiro.js';
import { classes } from '../js/views/classes.js';
import { snapshotState } from '../js/store.js';

const text = (markup) => markup.toString().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const sunday = (state) => {
  const out = text(mosteiro(state));
  return out.slice(out.indexOf('Domingo:'), out.indexOf('Faculty Training neste capítulo'));
};

test('Sunday order in chapter 6 skips Flying, which no one teaches that month', () => {
  const out = sunday(snapshotState());
  assert.match(out, /Recrutas em aberto: .*Lysithea/);
  assert.match(out, /Choir Practice/);
  assert.match(out, /Agora: Faith \(Lysithea[^)]*\), com [^.]*Rhea/);
  assert.match(out, /Flying \(Ingrid\) espera um instrutor/);
  assert.match(out, /classe do Byleth\. Agora: Brawl/);
});

test('Sunday order in chapter 7 trains Flying for Ingrid first', () => {
  const out = sunday({ ...snapshotState(), chapter: 7 });
  assert.match(out, /Agora: Flying \(Ingrid\), com [^.]*Seteth/);
  assert.doesNotMatch(out, /espera um instrutor/);
});

test('after the recruiting deadline the order drops the recruiting steps', () => {
  const out = sunday({ ...snapshotState(), chapter: 12 });
  assert.doesNotMatch(out, /Recrutas em aberto|Choir Practice com duas recrutas/);
  assert.match(out, /Treino da classe do Byleth/);
});

test('the class page explains mastery and shows the class XP per tier', () => {
  const out = text(classes(snapshotState()));
  assert.match(out, /Maestria de classe/);
  assert.match(out, /Intermediate · Lv 10\+ · Intermediate Seal · maestria 100 XP/);
});
