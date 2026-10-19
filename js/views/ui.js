// Small pieces every view uses: medals, rank badges, requirement rows, form fields.

import { html } from '../html.js';
import { SKILL_NAME, STAT_NAME, RANKS, SUPPORTS, MONTHS } from '../../data/skills.js';
import { HOUSES, ROLES } from '../../data/units.js';
import { ABILITY_TEXT } from '../../data/classes.js';
import { monthOfChapter } from '../logic.js';

export const icon = (id, label) =>
  html`<svg class="ico" ${label ? html`role="img" aria-label="${label}"` : html`aria-hidden="true"`}><use href="#i-${id}"></use></svg>`;

export const skillIcon = (skill) => icon(skill === 'heavyArmor' ? 'armor' : skill);

export function medal(def, size = '') {
  const house = HOUSES[def.house] ?? HOUSES.dlc;
  return html`<span class="medal ${size}" data-house="${house.color}" aria-hidden="true">${def.name[0]}</span>`;
}

export const rank = (value, state = '') =>
  value
    ? html`<span class="rk ${state}">${value}</span>`
    : html`<span class="rk unknown" title="Rank não informado">?</span>`;

export function skillLabel(skill) {
  return html`<span class="skill">${skillIcon(skill)}${SKILL_NAME[skill] ?? skill}</span>`;
}

/** One requirement: skill, current rank → needed rank, and how far. */
export function reqItem(item) {
  if (item.any) {
    const opts = item.options.map((o) => `${SKILL_NAME[o.skill]} ${o.need}`).join(' ou ');
    return html`<li class="req ${item.ok ? 'ok' : 'miss'}"><span class="req-name">${opts}</span><span class="req-state">${item.ok ? '✓' : 'falta'}</span></li>`;
  }
  const state = item.ok ? 'ok' : item.unknown ? 'unknown' : 'miss';
  return html`<li class="req ${state}">
    ${skillLabel(item.skill)}
    <span class="req-ranks">${rank(item.have)}<span class="arrow" aria-hidden="true">→</span>${rank(item.need, 'need')}</span>
    <span class="req-state">${item.ok ? '✓' : item.unknown ? 'informe o rank' : `${item.xp} XP`}</span>
  </li>`;
}

export function roleChip(role) {
  return html`<span class="chip role-${role}">${ROLES[role] ?? role}</span>`;
}

export function abilityChip(m) {
  const tip = ABILITY_TEXT[m.name] ?? (m.locked ? 'Só funciona enquanto estiver nesta classe.' : '');
  return html`<span class="chip ${m.art ? 'art' : 'ability'}${m.locked ? ' locked' : ''}" ${tip ? html`title="${tip}"` : ''}>${m.name}${m.locked ? html` <span class="lock" aria-label="presa à classe">⛓</span>` : ''}</span>`;
}

export function rankSelect(id, path, value, label) {
  return html`<label class="field rank-field" for="${id}">
    <span class="field-label">${label}</span>
    <select id="${id}" data-bind="${path}" data-type="rank">
      <option value="" ${!value ? 'selected' : ''}>?</option>
      ${RANKS.map((r) => html`<option ${r === value ? 'selected' : ''}>${r}</option>`)}
    </select>
  </label>`;
}

export function supportSelect(id, path, value, label = 'Suporte com o Byleth') {
  const names = { none: 'nenhum / D', C: 'C', 'C+': 'C+', B: 'B', 'B+': 'B+', A: 'A' };
  return html`<label class="field" for="${id}">
    <span class="field-label">${label}</span>
    <select id="${id}" data-bind="${path}" data-type="text">
      ${SUPPORTS.map((s) => html`<option value="${s}" ${s === (value ?? 'none') ? 'selected' : ''}>${names[s]}</option>`)}
    </select>
  </label>`;
}

export function numberField(id, path, value, label, { min = 0, max = 99 } = {}) {
  return html`<label class="field num-field" for="${id}">
    <span class="field-label">${label}</span>
    <input id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" value="${value ?? ''}" data-bind="${path}" data-type="int">
  </label>`;
}

export function checkItem(id, checked, body, attrs) {
  return html`<li class="check ${checked ? 'done' : ''}">
    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} ${attrs}>
    <label for="${id}">${body}</label>
  </li>`;
}

export const statName = (id) => STAT_NAME[id] ?? id;

export function chapterLabel(chapter) {
  if (chapter >= 13) return `Parte 2 · Cap. ${chapter}`;
  const month = monthOfChapter(chapter);
  return `Cap. ${chapter} · ${MONTHS[month]}`;
}

export function noteKeyLabel(key) {
  return key === 'p2' ? 'Parte 2' : chapterLabel(Number(key));
}

export function emptyState(text) {
  return html`<p class="empty">${text}</p>`;
}

export function tagChip(tag) {
  const names = {
    recrutar: 'Recrutar', classe: 'Classe', social: 'Social', treino: 'Treino', paralogue: 'Paralogue', rota: 'Rota', info: 'Info', batalha: 'Batalha',
  };
  return html`<span class="tag tag-${tag}">${names[tag] ?? tag}</span>`;
}
