// Everyone's gear on one screen: the weapons the plan gives each unit, the one accessory she wears,
// the battalion she leads, her adjutant and the stat boosters to use on her. Same rules as everywhere
// else (logic.js: itemHolder, accessoryPlan, battalionPlan, adjutantPlan); this page only lays them
// side by side.

import { html } from '../html.js';
import { UNITS, UNIT_BY_ID } from '../../data/units.js';
import { NOTE_KEYS, openNotes, keyForChapter } from '../seal.js';
import { CLASS_BY_NAME } from '../../data/classes.js';
import { ADJUTANT_KIND, ADJUTANT_CHANCE, ADJUTANT_HEALS, ADJUTANT_SLOTS, ADJUTANT_PLAN } from '../../data/adjutants.js';
import { unitState, roleOf, isRecruited, itemHolder, isAccessory, accessoryPlan, battalionPlan, adjutantPlan, paralogueItems } from '../logic.js';
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

const SLOT_ORDINAL = ['1º', '2º', '3º'];
const slotText = (slot) => `${SLOT_ORDINAL[ADJUTANT_SLOTS.indexOf(slot)]} espaço · Professor Level ${slot}`;

/** How often the adjutant acts. Only the support with Byleth is tracked, so other pairs get the range. */
function adjutantOdds(pair, state) {
  const sup = pair.lead === 'byleth' ? unitState(state, pair.use.id).support ?? 'none' : null;
  if (pair.use.kind === 'heal') return sup ? `${ADJUTANT_HEALS[sup]} cura${ADJUTANT_HEALS[sup] > 1 ? 's' : ''} por batalha` : 'de 1 a 5 curas por batalha, pelo suporte';
  return sup ? `${ADJUTANT_CHANCE[sup]}% de chance` : '10% sem suporte, até 50% no S';
}

/** Why one of a lead's adjutants is not the one in use (logic.js, adjutantPlan). */
function adjutantStatus(o, pair) {
  switch (o.status) {
    case 'use': return `em uso · ${slotText(pair.slot)}`;
    case 'free': return pair.full ? 'os três espaços já estão com os de cima' : 'também serve';
    case 'taken': return `com ${UNIT_BY_ID[o.by].name}`;
    case 'deployed': return 'está no mapa (titular)';
    case 'move': return 'unidade voadora só leva adjutant voador';
    case 'class': return `na classe atual faz ${ADJUTANT_KIND[o.kind].label}, não ${ADJUTANT_KIND[pair.want].label}`;
    default: return 'ainda não está no exército';
  }
}

function adjutantCell(def, state, adjutants) {
  const pair = adjutants.find((p) => p.lead === def.id);
  if (pair?.use) {
    return html`<p><strong>${UNIT_BY_ID[pair.use.id].name}</strong> · ${ADJUTANT_KIND[pair.use.kind ?? pair.want].label}</p>
      <p class="ld-from">${slotText(pair.slot)} · ${adjutantOdds(pair, state)}</p>`;
  }
  if (pair) return html`<p class="ld-none">${pair.full ? 'sem espaço: o jogo tem três' : 'ninguém da lista dela está livre'}</p>`;
  const rides = adjutants.find((p) => p.use?.id === def.id);
  if (rides) return html`<p>Vai com <strong>${UNIT_BY_ID[rides.lead].name}</strong></p><p class="ld-from">${ADJUTANT_KIND[rides.use.kind ?? rides.want].label} · ${slotText(rides.slot)}</p>`;
  if (roleOf(state, def.id) === 'titular' && CLASS_BY_NAME[unitState(state, def.id).cls]?.flying) return html`<p class="ld-none">só adjutant voador: ninguém no banco voa</p>`;
  return html`<p class="ld-none">nenhum</p>`;
}

function loadout(def, state, items, wearing, battalions, adjutants) {
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
    <div class="ld-slot"><h3 class="ld-label">Adjutant</h3>${adjutantCell(def, state, adjutants)}</div>
    <div class="ld-slot"><h3 class="ld-label">Usar ${g(def, 'nela', 'nele')}</h3>${boosts.length ? html`<ul class="ld-gear">${boosts.map(gear)}</ul>` : html`<p class="ld-none">nada</p>`}</div>
  </li>`;
}

export function itens(state) {
  const items = planItems(state);
  const { slots, wearing } = accessoryPlan(state);
  const battalions = battalionPlan(state);
  const adjutants = adjutantPlan(state);
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
      <p class="lead">O que cada uma deve estar usando agora: as armas que o plano dá a ela, o único acessório que ela equipa, o battalion que lidera e quem vai com ela como adjutant. Itens em itálico ainda não vieram; os de capítulos lacrados aparecem quando você chegar lá.</p>
    </header>
    ${army.length ? html`<ul class="loadouts">${army.map((def) => loadout(def, state, items, wearing, battalions, adjutants))}</ul>` : html`<p class="empty">Ninguém no exército ainda.</p>`}
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
    <section class="card">
      <h2 class="card-title">Adjutants: quem vai junto</h2>
      <p class="card-lead">Quem fica fora do mapa pode ir junto de uma titular (Y na tela de deploy). O primeiro espaço abre no Professor Level C, o segundo no B e o terceiro no A. O adjutant ganha metade da EXP de quem acompanha, EXP de arma e de maestria inteira e pontos de suporte com ela, e sai ileso se ela cair. O que ele faz depende da classe:</p>
      <ul class="note-list">
        <li><strong>Cura</strong> (Monk, Priest, Bishop, Holy Knight): ${ADJUTANT_KIND.heal.text} De 1 vez por batalha sem suporte até 5 no S.</li>
        <li><strong>Guarda</strong> (armaduras, Brawler, Grappler, War Monk/Cleric): ${ADJUTANT_KIND.guard.text}</li>
        <li><strong>Ataque extra</strong> (as outras classes): ${ADJUTANT_KIND.attack.text} 10% sem suporte, até 50% no S.</li>
      </ul>
      <p class="card-lead">Os espaços vão nesta ordem: uma curandeira no Byleth, depois magia ou arco nas que atacam de 2 casas. Edelgard, Petra e Ingrid voam e só levam adjutant voador, e ninguém no banco do plano voa. Fora a cura, o ganho em combate é pequeno: o que vale é treinar as reservas sem risco.</p>
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

/**
 * The adjutant card on a unit's sheet: for a lead, her list with why each one is or is not with her;
 * for a reserve, who she goes with. Nothing for units outside ADJUTANT_PLAN.
 */
export function adjutantCard(def, state) {
  const plan = adjutantPlan(state);
  const pair = plan.find((p) => p.lead === def.id);
  if (pair) {
    return html`<section class="card" aria-labelledby="adj-title">
      <h2 class="card-title" id="adj-title">Adjutant</h2>
      <p class="card-lead">${pair.use ? html`Agora: <strong>${UNIT_BY_ID[pair.use.id].name}</strong> (${ADJUTANT_KIND[pair.use.kind ?? pair.want].label}, ${adjutantOdds(pair, state)}).` : pair.full ? 'Os três espaços já estão com as de cima.' : 'Nenhum adjutant da lista serve agora.'} ${pair.why}</p>
      <ul class="bt-list">${pair.options.map((o) => html`<li class="bt-${o.status}">
        <div class="bt-main"><a class="person" href="#/unidade/${o.id}">${avatar(UNIT_BY_ID[o.id], 'sm')}<strong>${UNIT_BY_ID[o.id].name}</strong></a><p class="bt-why">${o.why}</p></div>
        <p class="bt-state">${adjutantStatus(o, pair)}</p>
      </li>`)}</ul>
    </section>`;
  }
  const leads = ADJUTANT_PLAN.filter((p) => p.from.some(([id]) => id === def.id));
  if (!leads.length) return '';
  const rides = plan.find((p) => p.use?.id === def.id);
  return html`<section class="card" aria-labelledby="adj-title">
    <h2 class="card-title" id="adj-title">Adjutant</h2>
    <p class="card-lead">${rides
      ? html`Fora do mapa, vai junto ${rides.lead === 'byleth' ? 'do' : 'da'} <strong>${UNIT_BY_ID[rides.lead].name}</strong> (${slotText(rides.slot)}): ${ADJUTANT_KIND[rides.use.kind ?? rides.want].text}`
      : `No plano, ${g(def, 'ela', 'ele')} vai junto de ${leads.map((p) => UNIT_BY_ID[p.lead].name).join(', ')} quando ficar fora do mapa; agora não está com ninguém.`}
      Ganha metade da EXP, EXP de arma e de maestria inteira e suporte com quem acompanha, sem risco.</p>
  </section>`;
}
