// The custom select has to keep the ARIA wiring the script relies on, and escape what it shows.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html } from '../js/html.js';
import { select, rankSelect, roleSelect, avatar } from '../js/views/ui.js';
import { UNIT_BY_ID } from '../data/units.js';

const attr = (markup, name) => [...markup.matchAll(new RegExp(`${name}="([^"]*)"`, 'g'))].map((m) => m[1]);

test('a select marks one option as chosen and wires the button to its list', () => {
  const out = select({
    id: 'x', label: 'Classe', value: 'Monk', attrs: html`data-bind="units.a.cls"`,
    options: [{ value: '', label: '?' }, { value: 'Fighter', label: 'Fighter', group: 'Beginner' }, { value: 'Monk', label: 'Monk', group: 'Beginner' }],
  }).toString();
  assert.equal(attr(out, 'aria-selected').filter((v) => v === 'true').length, 1);
  assert.match(out, /aria-controls="x-list"/);
  assert.match(out, /id="x-list" role="listbox"/);
  assert.match(out, /role="combobox"[^>]*data-bind="units.a.cls"/);
  assert.match(out, /value="Monk"/);
  const ids = attr(out, 'id');
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  assert.match(out, /role="group" aria-labelledby="x-g1"/);
});

test('a select escapes labels and shows the placeholder without a match', () => {
  const out = select({ id: 'y', label: 'L', value: 'nope', options: [{ value: '<b>', label: '<b>' }] }).toString();
  assert.doesNotMatch(out, /<b>/);
  assert.match(out, /sel-placeholder/);
});

test('rank and role selects bind to the unit', () => {
  assert.match(rankSelect('r', 'units.a.ranks.bow', 'C+', 'bow').toString(), /data-bind="units.a.ranks.bow" data-type="rank"/);
  const role = roleSelect('p', UNIT_BY_ID.petra, 'titular', { compact: true }).toString();
  assert.match(role, /data-bind="units.petra.role"/);
  assert.match(role, /class="field-label sr"/);
});

test('a portrait is decorative and falls back to the initial', () => {
  const out = avatar(UNIT_BY_ID.edelgard, 'sm', { dim: true }).toString();
  assert.match(out, /aria-hidden="true"/);
  assert.match(out, /data-initial="E"/);
  assert.match(out, /src="img\/portraits\/edelgard.webp" alt=""/);
  assert.match(out, /avatar sm dim/);
});

test('a requirement already met shows the target and what you have, never an arrow', async () => {
  const { reqItem } = await import('../js/views/ui.js');
  const met = reqItem({ skill: 'lance', need: 'C', have: 'B', ok: true, xp: 0 }).toString();
  assert.doesNotMatch(met, /→/);
  assert.match(met, /tem B/);
  const open = reqItem({ skill: 'lance', need: 'C', have: 'D', ok: false, xp: 200 }).toString();
  assert.match(open, /→/);
  assert.match(open, /200 XP/);
});
