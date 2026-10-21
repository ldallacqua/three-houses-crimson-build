// The Mosteiro and Classes pages fill in their advice from the state; check the parts that change.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mosteiro } from '../js/views/mosteiro.js';
import { classes } from '../js/views/classes.js';
import { snapshotState, normalize } from '../js/store.js';

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

test('every character page has teas, topics and one summary per final comment', async () => {
  const { UNITS } = await import('../data/units.js');
  const { SOCIAL, MEALS } = await import('../data/social.js');
  const { TEA_GISTS } = await import('../data/tea-gists.js');
  const dishes = new Set(MEALS.map((m) => m.name));
  for (const u of UNITS.filter((x) => x.id !== 'byleth')) {
    const s = SOCIAL[u.id];
    assert.ok(s?.teas.length && s.topics.length > 20, `${u.id}: teas and topics`);
    assert.equal(TEA_GISTS[u.id]?.length, s.answers.length, `${u.id}: one summary per final comment`);
    assert.ok(s.answers.every((a) => a.length), `${u.id}: every comment has an answer`);
    assert.ok([...s.meals, ...s.mealsDisliked].every((m) => dishes.has(m)), `${u.id}: meals on the menu`);
  }
  const { unidade } = await import('../js/views/unidade.js');
  const page = text(unidade(snapshotState(), 'lysithea'));
  assert.match(page, /Tea Time com Lysithea .*Sweet-Apple Blend/);
  assert.match(page, /Você acredita em fantasmas\? Laugh Chat/);
});

test('the support select offers the ranks the game shows', async () => {
  const { supportSelect } = await import('../js/views/ui.js');
  const values = [...supportSelect('s', 'units.x.support', 'C').toString().matchAll(/data-value="([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(values, ['none', 'C', 'B', 'A', 'S']);
});

test('the overview and the review page render and point at what is left', async () => {
  const { painel } = await import('../js/views/painel.js');
  const { atualizar } = await import('../js/views/atualizar.js');
  const s = snapshotState();
  assert.match(text(painel(s)), /atualize o esquadrão \d+ de \d+ ainda não foram conferidas/);
  const page = text(atualizar(s));
  assert.match(page, /0 de \d+ conferidas/);
  assert.match(page, /Recrutas .*Lysithea/);
  for (const u of Object.keys(s.units)) s.reviewed[u] = s.chapter;
  assert.doesNotMatch(text(painel(s)), /atualize o esquadrão/);
  assert.match(text(atualizar(s)), /Tudo em dia/);
});

test('a reviewed chapter survives a save and reload', () => {
  const s = normalize({ ...snapshotState(), reviewed: { byleth: 6, nobody: 6, petra: 'x' } });
  assert.deepEqual(s.reviewed, { byleth: 6 });
});

test('a new visitor sees the build picker with the chapter question; a chosen build shows as current', async () => {
  const { builds } = await import('../js/views/builds.js');
  const { freshState } = await import('../js/store.js');
  const fresh = text(builds(freshState()));
  assert.match(fresh, /Escolha a sua build/);
  assert.match(fresh, /Seu jogo .*Capítulo atual/);
  assert.match(fresh, /Corte Carmesim .*A waifu build da Flor Carmesim .*por ldallacqua/);
  assert.match(builds(freshState()).toString(), /data-act="choose-build" data-build="corte-carmesim"/);
  const chosen = builds(snapshotState()).toString();
  assert.doesNotMatch(chosen, /Seu jogo/);
  assert.doesNotMatch(chosen, /data-act="choose-build"/);
  assert.match(text(chosen), /Build atual/);
});

test('items show who keeps them, on the chapter, the overview and the unit page', async () => {
  const { painel } = await import('../js/views/painel.js');
  const { capitulos } = await import('../js/views/capitulos.js');
  const { unidade } = await import('../js/views/unidade.js');
  const s = snapshotState();
  const overview = text(painel(s));
  assert.match(overview, /Itens deste capítulo .*March Ring .*Fica com Dorothea/);
  const notes = text(capitulos(s));
  assert.match(notes, /Cap\. 1 · Great Tree Moon Three Houses/);
  assert.match(notes, /Spirit Dust .*Fica com Constance/);
  assert.match(notes, /Intermediate Seal .*Cai do Hanneman/);
  assert.doesNotMatch(notes, /Killer Lance/, 'Chapter 7 is still sealed');
  assert.match(text(unidade(s, 'bernadetta')), /Itens para ela .*Secret Book/);
  assert.match(text(unidade(s, 'ingrid')), /Itens para ela .*Luín .*Guarde para Ingrid/);
});

test('the Sunday order only lists what is open in the first chapters', async () => {
  const { freshState } = await import('../js/store.js');
  const ch = (n) => sunday(normalize({ ...freshState(), build: 'corte-carmesim', chapter: n }));
  assert.doesNotMatch(ch(1), /Choir Practice com duas|Faculty Training da skill|Chá Perfect/);
  assert.match(ch(1), /Refeição em dupla/);
  assert.match(text(mosteiro(normalize({ ...freshState(), chapter: 1 }))), /Ainda não abriram neste capítulo: Choir Practice \(Cap\. 2\), Faculty Training \(Cap\. 3\), Tea Time \(Cap\. 4\)/);
  assert.match(ch(2), /Choir Practice com duas/);
  assert.doesNotMatch(ch(2), /Faculty Training da skill/);
  assert.match(ch(3), /Faculty Training da skill/);
  assert.doesNotMatch(ch(3), /Chá Perfect/);
  assert.match(ch(4), /Refeição ou chá.*Chá Perfect/);
});
