// Part I paralogues: window, who opens it, the reward that matters and whether it is done. One row
// each: the closed row says who gets each item, opening it gives the reasons, rewards and tips.

import { html } from '../html.js';
import { PARALOGUES } from '../../data/paralogues.js';
import { UNIT_BY_ID } from '../../data/units.js';
import { FACULTY_BY_ID } from '../../data/faculty.js';
import { paralogueStatus, isRecruited, itemHolder } from '../logic.js';
import { avatar, icon, switchField, g, itemRow } from './ui.js';

const PHASE = {
  closing: ['último capítulo', 'miss', 0],
  open: ['aberto', 'ok', 1],
  locked: ['falta recrutar', 'info', 2],
  later: ['ainda não abriu', 'info', 3],
  done: ['feito', 'ok', 4],
  missed: ['perdido', 'miss', 5],
};

const NOBODY = { sell: 'vender', skip: 'ignorar', material: 'comboio' };

function who(id, state) {
  const def = UNIT_BY_ID[id] ?? { ...FACULTY_BY_ID[id], house: 'church' };
  const ok = isRecruited(state, id);
  return html`<span class="who ${ok ? 'ok' : ''}">${avatar(def, 'xs', { dim: !ok })}${def.name ?? id}${ok ? icon('check', g(def, 'recrutada', 'recrutado')) : ''}</span>`;
}

/** An item and who gets it, as a pill: the holder's face, the item, the holder's name. */
function loot(rec, state) {
  const { holder, next } = itemHolder(rec, state);
  const def = UNIT_BY_ID[holder ?? next];
  return html`<span class="loot k-${rec.kind}">${def ? avatar(def, 'xs', { dim: !holder }) : ''}<span>${rec.item}</span><span class="loot-to">→ ${def?.name ?? NOBODY[rec.kind] ?? 'quem precisar'}</span></span>`;
}

function row(p, state) {
  const s = paralogueStatus(p, state);
  const [label, tone] = PHASE[s.phase];
  const key = UNIT_BY_ID[p.key];
  const warn = s.missingKey && s.phase !== 'missed'
    ? html`<span class="para-warn">${key?.name ?? p.key} ainda não está ${g(key, 'recrutada', 'recrutado')}: sem ${g(key, 'ela', 'ele')} você perde ${p.keyReward.replace(/\.$/, '')}.</span>`
    : '';
  return html`<details class="para-row phase-${s.phase}" id="para-${p.id}">
    <summary>
      <span class="para-chev" aria-hidden="true"></span>
      <span class="para-top">
        <h2 class="para-name">${p.name}</h2>
        <span class="para-when">Cap. ${s.from}–${s.to}</span>
        <span class="para-units">${p.units.map((id) => who(id, state))}</span>
      </span>
      <span class="badge ${tone}">${label}</span>
      ${p.items?.length ? html`<span class="para-loot">${p.items.map((rec) => loot(rec, state))}</span>` : ''}
      ${warn}
    </summary>
    <div class="para-body">
      <p class="para-star">${p.star}</p>
      <div class="para-cols">
        ${p.items?.length ? html`<section>
          <h3 class="sub">Quem fica com cada item</h3>
          <ul class="item-list compact">${p.items.map((rec) => itemRow(rec, state, { from: '' }))}</ul>
        </section>` : ''}
        <section>
          <h3 class="sub">Recompensas</h3>
          <ul class="para-list">${p.rewards.map((r) => html`<li>${r}</li>`)}</ul>
          <h3 class="sub">Dicas</h3>
          <ul class="para-list tips">${p.tips.map((t) => html`<li>${t}</li>`)}</ul>
        </section>
      </div>
      ${switchField(`pd-${p.id}`, s.done, 'Concluído', html`data-paralogue="${p.id}"`)}
    </div>
  </details>`;
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
      <p class="lead">Cada paralogue gasta um dia livre de Battle. Abre quando pelo menos uma das unidades está com você; algumas recompensas só vêm se a unidade-chave estiver recrutada. Cada linha mostra quem fica com cada item; abra para ver o porquê, as recompensas e as dicas. Os da Parte 2 ficam nas notas lacradas.</p>
    </header>
    <div class="para-rows">${list.map((p) => row(p, state))}</div>
  </section>`;
}
