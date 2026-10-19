// Class reference: requirements, masteries and who in the squad could take each one today.

import { html } from '../html.js';
import { CLASSES, TIER_LABEL, ABILITY_TEXT } from '../../data/classes.js';
import { UNITS } from '../../data/units.js';
import { RANKS, RANK_XP, SKILL_NAME } from '../../data/skills.js';
import { classCheck, isRecruited, unitState, roleOf, isStepUp } from '../logic.js';
import { medal, abilityChip, skillIcon } from './ui.js';

const TIERS = ['beginner', 'intermediate', 'advanced', 'master', 'dlc', 'unique'];

function reqText(c) {
  const parts = Object.entries(c.reqs).map(([s, r]) => html`<span class="req-inline">${skillIcon(s)}${SKILL_NAME[s]} ${r}</span>`);
  if (c.reqsAny) parts.push(html`<span class="req-inline">${Object.entries(c.reqsAny).map(([s, r]) => `${SKILL_NAME[s]} ${r}`).join(' ou ')}</span>`);
  if (c.needsClass) parts.push(html`<span class="req-inline">certificação de ${c.needsClass}</span>`);
  return parts.length ? parts : html`<span class="muted">${c.note ?? '—'}</span>`;
}

function readyNow(c, state) {
  return UNITS.filter((u) => isRecruited(state, u.id) && !['utilitario', 'ignorar'].includes(roleOf(state, u.id)))
    .filter((u) => {
      const st = unitState(state, u.id);
      if (st.cls === c.name || st.mastered?.includes(c.name) || !isStepUp(u, st, c)) return false;
      const check = classCheck(c.name, { ...st, gender: u.gender });
      return check?.ready;
    });
}

export function classes(state) {
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Referência</p>
      <h1 id="v-title">Classes</h1>
      <p class="lead">As classes úteis para este esquadrão. "Pode agora" usa o nível e os ranks que você informou. Uma arte com ⛓ só funciona dentro da própria classe; habilidades de maestria (Death Blow, Fiendish Blow, Hit +20…) podem ser equipadas em qualquer classe.</p>
    </header>
    ${TIERS.map((tier) => {
      const list = CLASSES.filter((c) => c.tier === tier);
      return html`<section class="card" aria-labelledby="t-${tier}">
        <h2 class="card-title" id="t-${tier}">${TIER_LABEL[tier]} ${list[0]?.level ? html`<span class="muted">· Lv ${list[0].level}+ · ${list[0].item}</span>` : ''}</h2>
        <div class="table-wrap"><table class="data classes">
          <thead><tr><th scope="col">Classe</th><th scope="col">Requisitos</th><th scope="col">Maestria</th><th scope="col">Inatas</th><th scope="col">Pode agora</th></tr></thead>
          <tbody>${list.map((c) => {
            const ready = readyNow(c, state);
            return html`<tr>
              <th scope="row">${c.name}${c.gender ? html` <span class="gender" title="${c.gender === 'f' ? 'só feminino' : 'só masculino'}">${c.gender === 'f' ? '♀' : '♂'}</span>` : ''}${c.flying ? html` <span class="muted" title="voadora">✈</span>` : ''}</th>
              <td>${reqText(c)}</td>
              <td>${c.mastery.length ? c.mastery.map(abilityChip) : html`<span class="muted">—</span>`}</td>
              <td class="innate">${c.innate.join(', ') || '—'}</td>
              <td>${ready.length ? html`<span class="ready-list">${ready.map((u) => html`<a href="#/unidade/${u.id}" title="${u.name}">${medal(u, 'sm')}</a>`)}</span>` : ''}</td>
            </tr>`;
          })}</tbody>
        </table></div>
      </section>`;
    })}
    <div class="cols">
      <section class="card">
        <h2 class="card-title">O que as habilidades fazem</h2>
        <dl class="glossary">${Object.entries(ABILITY_TEXT).map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>
      </section>
      <section class="card">
        <h2 class="card-title">XP total por rank</h2>
        <div class="table-wrap"><table class="data compact">
          <thead><tr><th scope="col">Rank</th><th scope="col">XP total</th><th scope="col">Desde o anterior</th></tr></thead>
          <tbody>${RANKS.map((r, i) => html`<tr><th scope="row">${r}</th><td>${RANK_XP[i]}</td><td>${i ? RANK_XP[i] - RANK_XP[i - 1] : '—'}</td></tr>`)}</tbody>
        </table></div>
        <p class="hint">Exame de certificação: o jogo mostra a chance antes de gastar o selo. Só faça com 100% — o selo (ou o Abyssian Exam Pass) é gasto mesmo se reprovar.</p>
      </section>
    </div>
  </section>`;
}
