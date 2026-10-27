// Everyone's gear on one screen: the weapons the plan gives each unit, the one accessory she wears,
// the battalion she leads and the stat boosters to use on her. Same rules as everywhere else
// (logic.js: itemHolder, accessoryPlan, battalionPlan); this page only lays them side by side.

import { html } from '../html.js';
import { UNITS, UNIT_BY_ID } from '../../data/units.js';
import { NOTE_KEYS, openNotes, keyForChapter } from '../seal.js';
import { unitState, roleOf, isRecruited, itemHolder, isAccessory, accessoryPlan, battalionPlan, paralogueItems } from '../logic.js';
import { avatar, roleChip, noteKeyLabel, battalionName, battalionStats, battalionStatus, g } from './ui.js';

const ROLE_ORDER = ['titular', 'rotacao', 'reserva', 'utilitario', 'temporaria'];
const WEAPON_KINDS = new Set(['relic', 'sacred', 'weapon', 'staff']);

/**
 * Every item the plan hands out by now: the open chapters' and the Part 1 paralogues' not missed.
 * `have` is true once its chapter is behind or its paralogue is marked done.
 */
function planItems(state) {
  const current = keyForChapter(state.chapter);
  const recs = NOTE_KEYS.flatMap((key) => (openNotes(key, state.chapter)?.items ?? []).map((rec) => ({
    ...rec, from: noteKeyLabel(key), have: key !== 'p2' && key !== current,
  })));
  for (const rec of paralogueItems(state, { open: false })) recs.push({ ...rec, have: Boolean(state.paralogues?.[rec.paralogue]) });
  return recs.map((rec) => ({ ...rec, ...itemHolder(rec, state) }));
}

function gear(rec) {
  return html`<li class="${rec.have ? '' : 'soon'}"><strong>${rec.item}</strong><span class="ld-from">${rec.have ? rec.from : `vem de ${rec.from}`}</span></li>`;
}

function battalionCell(p) {
  if (!p) return html`<p class="ld-none">fora do plano de battalions</p>`;
  const lands = p.use ? p.options.slice(0, p.options.indexOf(p.use)) : p.options;
  const fly = lands.find((o) => o.status === 'move' && o.b.flying);
  return html`${p.use
    ? html`<p>${battalionName(p.use.b)}</p><p class="ld-from">${battalionStats(p.use.b)}</p>`
    : html`<p class="ld-none">nenhum ainda</p>`}
    ${p.next ? html`<p class="ld-next">Authority ${p.next.b.auth} libera ${p.next.b.name}${p.auth ? '' : ' (informe o rank na ficha)'}</p>` : ''}
    ${fly ? html`<p class="ld-next">Quando voar: ${fly.b.name}</p>` : ''}`;
}

function loadout(def, state, items, wearing, battalions) {
  const st = unitState(state, def.id);
  const mine = items.filter((r) => r.holder === def.id);
  const weapons = mine.filter((r) => WEAPON_KINDS.has(r.kind) && !isAccessory(r));
  const boosts = mine.filter((r) => r.kind === 'stat');
  const acc = wearing.get(def.id);
  return html`<li class="loadout">
    <a class="ld-who person" href="#/unidade/${def.id}">${avatar(def, 'md')}<span class="ld-id"><strong>${def.name}</strong><span class="muted">${st.cls ?? 'classe ?'} · Lv ${st.level ?? '?'}</span>${roleChip(roleOf(state, def.id))}</span></a>
    <div class="ld-slot"><h3 class="ld-label">Armas</h3>${weapons.length ? html`<ul class="ld-gear">${weapons.map(gear)}</ul>` : html`<p class="ld-none">as de sempre</p>`}</div>
    <div class="ld-slot"><h3 class="ld-label">Acessório</h3>${acc ? html`<p><strong>${acc.item}</strong></p><p class="ld-from">${acc.from}</p>` : html`<p class="ld-none">nenhum ainda</p>`}</div>
    <div class="ld-slot"><h3 class="ld-label">Battalion</h3>${battalionCell(battalions.get(def.id))}</div>
    <div class="ld-slot"><h3 class="ld-label">Usar ${g(def, 'nela', 'nele')}</h3>${boosts.length ? html`<ul class="ld-gear">${boosts.map(gear)}</ul>` : html`<p class="ld-none">nada</p>`}</div>
  </li>`;
}

export function itens(state) {
  const items = planItems(state);
  const { slots, wearing } = accessoryPlan(state);
  const battalions = battalionPlan(state);
  const army = UNITS
    .filter((u) => isRecruited(state, u.id) && ROLE_ORDER.includes(roleOf(state, u.id)))
    .sort((a, b) => ROLE_ORDER.indexOf(roleOf(state, a.id)) - ROLE_ORDER.indexOf(roleOf(state, b.id)));
  const waiting = items.filter((r) => !r.holder && r.next && r.kind !== 'battalion' && !isAccessory(r));
  const spare = slots.filter((s) => !s.holder);
  const spareBattalions = [...new Map([...battalions.values()]
    .flatMap((p) => p.options.filter((o) => o.status === 'free'))
    .filter((o) => ![...battalions.values()].some((p) => p.use?.b === o.b))
    .map((o) => [o.b.name, o.b])).values()];
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Equipamento</p>
      <h1 id="v-title">Itens</h1>
      <p class="lead">O que cada uma deve estar usando agora: as armas que o plano dá a ela, o único acessório que ela equipa e o battalion que lidera. Itens em itálico ainda não vieram; os de capítulos lacrados aparecem quando você chegar lá.</p>
    </header>
    ${army.length ? html`<ul class="loadouts">${army.map((def) => loadout(def, state, items, wearing, battalions))}</ul>` : html`<p class="empty">Ninguém no exército ainda.</p>`}
    ${waiting.length || spare.length || spareBattalions.length ? html`<section class="card">
      <h2 class="card-title">No comboio</h2>
      <ul class="note-list">
        ${waiting.map((r) => html`<li><strong>${r.item}</strong>: guarde para ${UNIT_BY_ID[r.next].name}, que ainda não entrou (${r.from}).</li>`)}
        ${spare.map((s) => html`<li><strong>${s.rec.item}</strong> sobrando (${s.rec.from})${s.next ? `: guarde para ${UNIT_BY_ID[s.next].name}` : ': equipe em quem entrar no mapa sem acessório'}.</li>`)}
        ${spareBattalions.map((b) => html`<li><strong>${b.name}</strong>: ninguém lidera agora; serve para quem entrar sem battalion.</li>`)}
      </ul>
    </section>` : ''}
    <section class="card">
      <h2 class="card-title">Battalions: como o guia escolhe</h2>
      <p class="card-lead">Cada personagem lidera um battalion por vez e cada battalion vai para uma só. Ela pega o primeiro da lista dela que o exército já tem, que a Authority dela alcança (rank em branco conta como E) e que combina com a classe: classe voadora só usa battalion voador, e battalion voador só serve em classe voadora. Ao virar Wyvern Rider, Pegasus Knight ou Dark Flier, troque. A lista completa de cada uma está na ficha.</p>
    </section>
  </section>`;
}

/** The battalion card on a unit's sheet: her whole list, with why each one is or is not in use. */
export function battalionCard(def, state) {
  const p = battalionPlan(state).get(def.id);
  if (!p?.options.length) return '';
  return html`<section class="card" aria-labelledby="bt-title">
    <h2 class="card-title" id="bt-title">Battalion</h2>
    <p class="card-lead">${p.use ? html`Agora: <strong>${p.use.b.name}</strong>${p.use.b.name.endsWith('.') ? '' : '.'}` :'Nenhum dos battalions do plano serve agora.'} A lista vai do melhor para o mais simples; ${g(def, 'ela', 'ele')} usa o primeiro que puder. Authority sobe sozinha com o battalion equipado em combate.</p>
    <ul class="bt-list">${p.options.map((o) => html`<li class="bt-${o.status}">
      <div class="bt-main">${battalionName(o.b)}<p class="ld-from">${battalionStats(o.b)}</p><p class="bt-why">${o.why}</p></div>
      <p class="bt-state">${battalionStatus(o, p.auth)}</p>
    </li>`)}</ul>
  </section>`;
}
