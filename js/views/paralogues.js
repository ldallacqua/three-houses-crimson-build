// Part I paralogues: window, who opens it, the reward that matters and whether it is done.

import { html } from '../html.js';
import { PARALOGUES } from '../../data/paralogues.js';
import { UNIT_BY_ID } from '../../data/units.js';
import { FACULTY_BY_ID } from '../../data/faculty.js';
import { paralogueStatus, isRecruited } from '../logic.js';
import { avatar, icon, switchField, g } from './ui.js';

const PHASE = {
  closing: ['último capítulo', 'miss', 0],
  open: ['aberto', 'ok', 1],
  locked: ['falta recrutar', 'info', 2],
  later: ['ainda não abriu', 'info', 3],
  done: ['feito', 'ok', 4],
  missed: ['perdido', 'miss', 5],
};

function who(id, state) {
  const def = UNIT_BY_ID[id] ?? { ...FACULTY_BY_ID[id], house: 'church' };
  const ok = isRecruited(state, id);
  return html`<span class="who ${ok ? 'ok' : ''}">${avatar(def, 'xs', { dim: !ok })}${def.name ?? id}${ok ? icon('check', g(def, 'recrutada', 'recrutado')) : ''}</span>`;
}

function card(p, state) {
  const s = paralogueStatus(p, state);
  const [label, tone] = PHASE[s.phase];
  return html`<article class="para-card phase-${s.phase}">
    <header class="para-head">
      <h2>${p.name}</h2>
      <span class="badge ${tone}">${label}</span>
    </header>
    <p class="para-meta"><span class="when">Cap. ${s.from}–${s.to}</span>${p.units.map((id) => who(id, state))}</p>
    <p class="para-star">${p.star}</p>
    ${s.missingKey && s.phase !== 'missed' ? html`<p class="warn">${UNIT_BY_ID[p.key]?.name ?? p.key} ainda não está ${g(UNIT_BY_ID[p.key], 'recrutada', 'recrutado')}: sem ${g(UNIT_BY_ID[p.key], 'ela', 'ele')} você perde ${p.keyReward}.</p>` : ''}
    <details class="more-box"><summary>Recompensas e dicas</summary>
      <ul class="para-list">${p.rewards.map((r) => html`<li>${r}</li>`)}</ul>
      <ul class="para-list tips">${p.tips.map((t) => html`<li>${t}</li>`)}</ul>
    </details>
    ${switchField(`pd-${p.id}`, s.done, 'Concluído', html`data-paralogue="${p.id}"`)}
  </article>`;
}

export function paralogues(state) {
  const list = [...PARALOGUES].sort((a, b) => {
    const pa = PHASE[paralogueStatus(a, state).phase][2];
    const pb = PHASE[paralogueStatus(b, state).phase][2];
    return pa - pb || a.window[1] - b.window[1];
  });
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Part 1 · até o Cap. 11</p>
      <h1 id="v-title">Paralogues</h1>
      <p class="lead">Cada paralogue gasta um dia livre de Battle. Abre quando pelo menos uma das unidades está com você; algumas recompensas só vêm se a unidade-chave estiver recrutada. Os da Parte 2 ficam nas notas lacradas.</p>
    </header>
    <div class="para-grid">${list.map((p) => card(p, state))}</div>
  </section>`;
}
