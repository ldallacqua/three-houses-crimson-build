// Keeping the state current: everyone the recommendations depend on, with only the fields they use,
// checked against the game once per chapter. Changing a unit's game data marks it as seen; "Nada
// mudou" does the same without a change.

import { html } from '../html.js';
import { HOUSES } from '../../data/units.js';
import { STAT_NAME } from '../../data/skills.js';
import { CLASS_BY_NAME } from '../../data/classes.js';
import { unitState, roleOf, reviewStatus, keySkills, keyStats } from '../logic.js';
import {
  avatar, chapterLabel, select, numberField, rankSelect, supportSelect, switchField, classSelect, roleChip, icon,
} from './ui.js';

const ROLE_ORDER = ['titular', 'rotacao', 'reserva', 'utilitario', 'temporaria'];

const seenWord = (def) => (def.gender === 'm' ? 'conferido' : 'conferida');

function head(def, state, seen) {
  return html`<header class="review-head">
    <a class="unit-portrait" href="#/unidade/${def.id}" tabindex="-1" aria-hidden="true">${avatar(def, 'md')}</a>
    <div class="unit-id">
      <h3><a href="#/unidade/${def.id}">${def.name}</a></h3>
      <p class="unit-meta">${roleChip(roleOf(state, def.id))}</p>
    </div>
    ${seen
      ? html`<span class="badge ok">${icon('check')}${seenWord(def)}</span>`
      : html`<button type="button" class="btn ghost sm" id="rv-${def.id}" data-act="reviewed" data-unit="${def.id}">Nada mudou</button>`}
  </header>`;
}

function armyCard(def, state, seen) {
  const st = unitState(state, def.id);
  const p = `units.${def.id}`;
  const cls = CLASS_BY_NAME[st.cls];
  const skills = keySkills(def, st, state);
  const stats = def.id === 'byleth' ? keyStats(state) : [];
  return html`<article class="review-card ${seen ? 'seen' : ''}" data-house="${HOUSES[def.house].color}" aria-label="${def.name}">
    ${head(def, state, seen)}
    <div class="form-row">
      ${numberField(`a-${def.id}-level`, `${p}.level`, st.level, 'Nível', { min: 1, max: 99, stepper: true })}
      ${classSelect(`a-${def.id}-cls`, def, st)}
    </div>
    ${cls?.mastery.length ? switchField(
      `a-${def.id}-mst`,
      st.mastered?.includes(cls.name),
      html`Dominou ${cls.name} <span class="muted">(${cls.mastery.map((m) => m.name).join(', ')})</span>`,
      html`data-bind-list="${p}.mastered" value="${cls.name}"`,
    ) : ''}
    ${def.id === 'edelgard' ? html`<div class="form-row">${supportSelect(`a-${def.id}-sup`, `${p}.support`, st.support)}</div>` : ''}
    ${stats.length ? html`<div class="form-grid stats">${stats.map((s) => numberField(`a-${def.id}-${s}`, `${p}.stats.${s}`, st.stats?.[s], STAT_NAME[s], { max: 255 }))}</div>` : ''}
    ${skills.length ? html`<div class="form-grid ranks">${skills.map((s) => rankSelect(`a-${def.id}-r-${s}`, `${p}.ranks.${s}`, st.ranks?.[s], s))}</div>` : ''}
    <p class="hint">${def.id === 'byleth' && stats.length
      ? 'Atributos e ranks que as recrutas e a classe dele pedem.'
      : 'Só os ranks que o plano e os Goals ainda pedem.'} <a href="#/unidade/${def.id}">Ficha completa</a></p>
  </article>`;
}

function recruitCard(def, state, seen) {
  const st = unitState(state, def.id);
  const p = `units.${def.id}`;
  return html`<article class="review-card recruit ${seen ? 'seen' : ''}" data-house="${HOUSES[def.house].color}" aria-label="${def.name}">
    ${head(def, state, seen)}
    <div class="form-row">
      ${def.recruit.kind === 'student' ? supportSelect(`a-${def.id}-sup`, `${p}.support`, st.support) : ''}
      ${switchField(`a-${def.id}-rec`, st.recruited, 'Já está no meu exército', html`data-bind="${p}.recruited" data-type="bool"`)}
    </div>
  </article>`;
}

export function atualizar(state) {
  const r = reviewStatus(state);
  const done = r.all.length - r.pending.length;
  const army = [...r.army].sort((a, b) => (a.id === 'byleth' ? -1 : b.id === 'byleth' ? 1 : 0)
    || ROLE_ORDER.indexOf(roleOf(state, a.id)) - ROLE_ORDER.indexOf(roleOf(state, b.id)));
  const chapters = Array.from({ length: 17 - 5 }, (_, i) => i + 6);
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Uma vez por capítulo</p>
      <h1 id="v-title">Atualizar</h1>
      <p class="lead">Copie do jogo o que mudou: nível, classe, maestria, ranks e suportes. Tudo o que o site recomenda sai daqui. Mexer em qualquer campo de uma personagem marca ela como conferida neste capítulo; se nada mudou, toque em <strong>Nada mudou</strong>.</p>
    </header>
    <section class="card review-top">
      <div class="form-row">
        ${select({
          id: 'a-chapter', label: 'Capítulo', value: String(state.chapter), cls: 'grow',
          options: chapters.map((c) => ({ value: String(c), label: chapterLabel(c), hint: c > state.chapter ? 'lacrado' : '' })),
          attrs: html`data-act="set-chapter"`,
        })}
        <label class="field" for="a-date"><span class="field-label">Data no jogo (mês/dia)</span>
          <input id="a-date" type="text" inputmode="numeric" placeholder="9/7" value="${state.date}" data-bind="date" data-type="text"></label>
      </div>
      <div class="review-progress">
        <progress max="${r.all.length}" value="${done}" aria-label="Conferidas neste capítulo"></progress>
        <p><strong>${done} de ${r.all.length}</strong> conferidas no ${chapterLabel(state.chapter)}.</p>
        ${r.pending.length
          ? html`<button type="button" class="btn" data-act="review-all">${icon('check')}Nada mudou nas outras ${r.pending.length}</button>`
          : html`<p class="good">Tudo em dia neste capítulo.</p>`}
      </div>
    </section>
    <section class="group" aria-labelledby="rv-army">
      <header class="group-head"><h2 id="rv-army">Exército <span class="group-count">${army.length}</span></h2><p>Byleth, titulares, rotação e reservas. Utilitários e temporárias ficam nas fichas.</p></header>
      <div class="review-grid">${army.map((u) => armyCard(u, state, r.seen(u.id)))}</div>
    </section>
    ${r.recruits.length ? html`<section class="group" aria-labelledby="rv-recruits">
      <header class="group-head"><h2 id="rv-recruits">Recrutas <span class="group-count">${r.recruits.length}</span></h2><p>Suporte com o Byleth e se já entrou no exército. Até o fim do Cap. 11.</p></header>
      <div class="review-grid">${r.recruits.map((u) => recruitCard(u, state, r.seen(u.id)))}</div>
    </section>` : ''}
  </section>`;
}
