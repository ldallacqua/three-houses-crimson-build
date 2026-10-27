// Small pieces every view uses: portraits, rank badges, requirement rows, form controls.

import { html, md } from '../html.js';
import { SKILL_NAME, STAT_NAME, RANKS, SUPPORTS, MONTHS } from '../../data/skills.js';
import { HOUSES, ROLES, UNIT_BY_ID } from '../../data/units.js';
import { ABILITY_TEXT, CLASSES, OTHER_CLASSES, TIER_LABEL } from '../../data/classes.js';
import { GAMBITS, STAT_LABEL } from '../../data/battalions.js';
import { monthOfChapter, taskAuto, itemHolder, isRecruited, isAccessory } from '../logic.js';

/** The feminine or masculine form of a word for a character (most of the squad is female). */
export const g = (def, fem, masc) => (def?.gender === 'm' ? masc : fem);

export const icon = (id, label) =>
  html`<svg class="ico" ${label ? html`role="img" aria-label="${label}"` : html`aria-hidden="true"`}><use href="#i-${id}"></use></svg>`;

export const skillIcon = (skill) => icon(skill === 'heavyArmor' ? 'armor' : skill);

/**
 * The character's portrait in a ring of their house colour. Decorative: the name is always next
 * to it. `dim` greys out someone who is not in the army yet. Without the image, the initial shows.
 */
export function avatar(def, size = '', { dim = false } = {}) {
  const house = HOUSES[def.house] ?? HOUSES.church;
  return html`<span class="avatar ${size}${dim ? ' dim' : ''}" data-house="${house.color}" data-initial="${def.name[0]}" aria-hidden="true"><img src="img/portraits/${def.id}.webp" alt="" width="224" height="224" loading="lazy" decoding="async"></span>`;
}

export const rank = (value, state = '') =>
  value
    ? html`<span class="rk ${state}">${value}</span>`
    : html`<span class="rk unknown" data-tip="Rank não informado">?</span>`;

export function skillLabel(skill) {
  return html`<span class="skill">${skillIcon(skill)}${SKILL_NAME[skill] ?? skill}</span>`;
}

/** One requirement: skill, current rank → needed rank, and how far. */
export function reqItem(item) {
  if (item.any) {
    const opts = item.options.map((o) => `${SKILL_NAME[o.skill]} ${o.need}`).join(' ou ');
    return html`<li class="req ${item.ok ? 'ok' : 'miss'}"><span class="req-name">${opts}</span><span class="req-state">${item.ok ? icon('check', 'cumprido') : 'falta'}</span></li>`;
  }
  // Met: show what it asks and that it is done; the arrow is only for a rank still to reach.
  if (item.ok) {
    return html`<li class="req ok">
    ${skillLabel(item.skill)}
    <span class="req-ranks">${rank(item.need, 'need')}</span>
    <span class="req-state">${icon('check', 'cumprido')}<small>tem ${item.have}</small></span>
  </li>`;
  }
  return html`<li class="req ${item.unknown ? 'unknown' : 'miss'}">
    ${skillLabel(item.skill)}
    <span class="req-ranks">${rank(item.have)}<span class="arrow" aria-hidden="true">→</span>${rank(item.need, 'need')}</span>
    <span class="req-state">${item.unknown ? 'informe o rank' : `${item.xp} XP`}</span>
  </li>`;
}

export function roleChip(role) {
  return html`<span class="chip role-${role}"><span class="dot" aria-hidden="true"></span>${ROLES[role] ?? role}</span>`;
}

export function abilityChip(m) {
  const tip = ABILITY_TEXT[m.name] ?? (m.locked ? 'Só funciona enquanto estiver nesta classe.' : '');
  const body = html`${m.name}${m.locked ? html` <span class="lock" aria-label="presa à classe">⛓</span>` : ''}`;
  const cls = `chip ${m.art ? 'art' : 'ability'}${m.locked ? ' locked' : ''}`;
  return tip ? html`<button type="button" class="${cls}" data-tip="${tip}">${body}</button>` : html`<span class="${cls}">${body}</span>`;
}

/**
 * A select drawn like the page; js/controls/select.js makes it work.
 * @param {object} o
 * @param {string} o.id
 * @param {*} o.label  text or html
 * @param {string} [o.value]
 * @param {{ value: string, label: string, hint?: string, lead?: *, group?: string }[]} o.options
 * @param {*} [o.attrs]  html for the button: data-bind, data-type, data-act
 * @param {string} [o.cls]  extra classes for the field: 'sm', 'grow', 'rank-field'
 * @param {boolean} [o.hideLabel]  label only for screen readers
 */
export function select({ id, label, value = '', options, attrs = '', cls = '', hideLabel = false, placeholder = 'Escolha' }) {
  const current = options.find((o) => o.value === value);
  const groups = [];
  for (const o of options) {
    const last = groups.at(-1);
    if (last && last.name === (o.group ?? '')) last.items.push(o);
    else groups.push({ name: o.group ?? '', items: [o] });
  }
  let n = 0;
  const option = (o) => html`<div class="sel-opt" role="option" id="${id}-o${n++}" data-value="${o.value}" aria-selected="${o.value === value ? 'true' : 'false'}">
      <span class="sel-opt-main">${o.lead ?? ''}<span class="sel-opt-label">${o.label}</span></span>
      ${o.hint ? html`<span class="sel-opt-hint">${o.hint}</span>` : ''}
      <svg class="sel-check" aria-hidden="true"><use href="#i-check"></use></svg>
    </div>`;
  return html`<div class="field sel ${cls}">
    <span class="field-label${hideLabel ? ' sr' : ''}" id="${id}-label">${label}</span>
    <button type="button" class="sel-trigger" id="${id}" value="${value}" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-list" aria-labelledby="${id}-label" ${attrs}>
      <span class="sel-value">${current ? html`${current.lead ?? ''}<span class="sel-opt-label">${current.label}</span>` : html`<span class="sel-placeholder">${placeholder}</span>`}</span>
      <svg class="sel-chev" aria-hidden="true"><use href="#i-chevrons"></use></svg>
    </button>
    <div class="sel-pop" id="${id}-list" role="listbox" aria-labelledby="${id}-label" popover>
      ${groups.map((g, gi) => (g.name
        ? html`<div class="sel-group" role="group" aria-labelledby="${id}-g${gi}"><p class="sel-group-label" id="${id}-g${gi}">${g.name}</p>${g.items.map(option)}</div>`
        : g.items.map(option)))}
    </div>
  </div>`;
}

const RANK_OPTIONS = [{ value: '', label: '?', hint: 'não sei' }, ...RANKS.map((r) => ({ value: r, label: r }))];

export function rankSelect(id, path, value, skill) {
  return select({
    id, label: skillLabel(skill), value: value ?? '', options: RANK_OPTIONS, cls: 'rank-field',
    attrs: html`data-bind="${path}" data-type="rank"`,
  });
}

const SUPPORT_LABEL = { none: 'Nenhum', C: 'C', B: 'B', A: 'A', S: 'S' };
const SUPPORT_HINT = { none: 'ainda sem rank', S: 'só no fim do jogo' };

/** The ranks as the game shows them; the hidden C+ and B+ are worked out in the recruitment box. */
export function supportSelect(id, path, value, label = 'Suporte com o Byleth') {
  return select({
    id, label, value: value ?? 'none', cls: 'support-field',
    options: SUPPORTS.map((s) => ({ value: s, label: SUPPORT_LABEL[s], hint: SUPPORT_HINT[s] })),
    attrs: html`data-bind="${path}" data-type="text"`,
  });
}

const ROLE_HINT = {
  titular: 'entra em todo mapa',
  rotacao: 'mapas com 11–12 vagas',
  reserva: 'recrutar, treinar depois',
  utilitario: 'item, paralogue ou battalion',
  temporaria: 'não fica até o fim',
  ignorar: 'sai das listas e do painel',
};

export function roleSelect(id, unit, role, { compact = false } = {}) {
  return select({
    id, value: role, cls: compact ? 'sm role-field' : 'role-field', hideLabel: compact,
    label: compact ? `Papel de ${unit.name}` : 'Papel',
    options: Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v, hint: ROLE_HINT[k], lead: html`<span class="dot role-${k}" aria-hidden="true"></span>` })),
    attrs: html`data-bind="units.${unit.id}.role" data-type="text"`,
  });
}

export function numberField(id, path, value, label, { min = 0, max = 99, stepper = false } = {}) {
  const input = html`<input id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" value="${value ?? ''}" data-bind="${path}" data-type="int">`;
  return html`<div class="field num-field${stepper ? ' stepper' : ''}">
    <label class="field-label" for="${id}">${label}</label>
    ${stepper ? html`<div class="stepper-box">
      <button type="button" class="step-btn" id="${id}-dec" data-act="step" data-for="${id}" data-step="-1" aria-label="Diminuir ${label}">${icon('minus')}</button>
      ${input}
      <button type="button" class="step-btn" id="${id}-inc" data-act="step" data-for="${id}" data-step="1" aria-label="Aumentar ${label}">${icon('plus')}</button>
    </div>` : input}
  </div>`;
}

export function switchField(id, checked, label, attrs) {
  return html`<label class="switch" for="${id}"><input id="${id}" type="checkbox" role="switch" ${checked ? 'checked' : ''} ${attrs}><span>${label}</span></label>`;
}

/** The unit's class, grouped by tier; classes it has mastered say so. */
export function classSelect(id, def, st, { label = 'Classe atual', cls = 'grow' } = {}) {
  const mastered = new Set(st.mastered ?? []);
  const options = [
    { value: '', label: '?', hint: 'não sei' },
    ...CLASSES.filter((c) => !c.gender || c.gender === def.gender || c.name === st.cls).map((c) => ({
      value: c.name, label: c.name, group: TIER_LABEL[c.tier], hint: mastered.has(c.name) ? 'dominada' : '',
    })),
    ...OTHER_CLASSES.map((c) => ({ value: c, label: c, group: 'Outras' })),
  ];
  return select({ id, label, value: st.cls ?? '', options, cls, attrs: html`data-bind="units.${def.id}.cls" data-type="text"` });
}

/**
 * One chapter task. A task whose rule the state already meets is checked and locked, with the reason;
 * the others are ticked by hand.
 */
export function taskItem(prefix, task, state, chapter) {
  const auto = taskAuto(task, state, chapter);
  const id = `${prefix}-${task.id}`;
  const done = Boolean(auto || state.checks[task.id]);
  return html`<li class="check ${done ? 'done' : ''}${auto ? ' auto' : ''}">
    <input type="checkbox" id="${id}" ${done ? 'checked' : ''} ${auto ? 'disabled' : ''} data-check="${task.id}">
    <label for="${id}">${tagChip(task.tag)} ${md(task.text)}${auto ? html`<span class="auto-note">${icon('check')}automático: ${auto.why}</span>` : ''}</label>
  </li>`;
}

export const ITEM_KIND = {
  relic: 'Relíquia',
  sacred: 'Arma sagrada',
  weapon: 'Arma',
  staff: 'Cajado',
  shield: 'Escudo',
  ring: 'Acessório',
  gem: 'Gema',
  stat: 'Status permanente',
  seal: 'Selo',
  battalion: 'Battalion',
  material: 'Material',
  sell: 'Para vender',
  skip: 'Pode ignorar',
};

/** Who keeps an item no unit of its order can take. */
export const nobodyText = (rec) => (isAccessory(rec) ? 'guarde no comboio' : { sell: 'ninguém: venda', skip: 'ninguém', material: 'guarde no comboio' }[rec.kind] ?? 'quem precisar');

/**
 * One item and who keeps it: the first of the plan's order who is in the army (for an accessory,
 * who does not wear a better one yet), or who to keep it for. The order shows when there is more
 * than one name, with whoever is not in the army greyed and whoever it skipped named below.
 */
export function itemRow(rec, state, { where = rec.where, from = rec.from } = {}) {
  const { holder, next, wanted, busy } = itemHolder(rec, state);
  const def = UNIT_BY_ID[holder ?? next];
  const skipped = new Set(busy.map((b) => b.id));
  return html`<li class="item-rec">
    <div class="item-main">
      <p class="item-name"><span class="tag item-kind k-${rec.kind}">${ITEM_KIND[rec.kind] ?? rec.kind}</span><strong>${rec.item}</strong></p>
      ${from || where ? html`<p class="item-where">${from ? html`<span class="item-from">${from}</span>` : ''}${from && where ? ' · ' : ''}${where ? md(where) : ''}</p>` : ''}
      <p class="item-why">${md(rec.why)}</p>
    </div>
    <div class="item-to">
      ${def
        ? html`<a class="person" href="#/unidade/${def.id}">${avatar(def, 'sm', { dim: !holder })}<span class="item-to-text"><span class="item-to-label">${holder ? 'Fica com' : 'Guarde para'}</span>${def.name}</span></a>`
        : html`<span class="item-to-text"><span class="item-to-label">${isAccessory(rec) && wanted.length ? 'Sobra' : 'Quem usa'}</span>${nobodyText(rec)}</span>`}
      ${wanted.length > 1 ? html`<p class="item-order" aria-label="Ordem de preferência">${wanted.map((id, i) => html`${i ? html`<span class="sep" aria-hidden="true">›</span>` : ''}<span class="${id === holder ? 'on' : skipped.has(id) ? 'busy' : isRecruited(state, id) ? '' : 'off'}">${UNIT_BY_ID[id].name}</span>`)}</p>` : ''}
      ${busy.length ? html`<p class="item-busy">${busy.map((b, i) => html`${i ? ' · ' : ''}${UNIT_BY_ID[b.id].name} já usa ${b.item}`)}</p>` : ''}
    </div>
  </li>`;
}

/** A battalion's bonuses, as the game lists them: "Atk +3 · Hit +10". */
export const battalionStats = (b) => Object.entries(b.stats)
  .filter(([, v]) => v)
  .map(([k, v]) => `${STAT_LABEL[k]} ${v > 0 ? '+' : '−'}${Math.abs(v)}`)
  .join(' · ');

/** The battalion's name with its gambit explained on hover or tap, and its Authority rank. */
export function battalionName(b) {
  return html`<span class="bt-name"><strong>${b.name}</strong> ${rank(b.auth, 'need')}<button type="button" class="chip ability" data-tip="${GAMBITS[b.gambit] ?? ''}">${b.gambit}</button>${b.flying ? html`<span class="chip bt-fly">${icon('flying')}voador</span>` : ''}</span>`;
}

/** Why a unit is not leading one of her battalions (logic.js, battalionPlan). */
export function battalionStatus(o, auth) {
  switch (o.status) {
    case 'use': return 'em uso';
    case 'free': return 'também serve';
    case 'taken': return `com ${UNIT_BY_ID[o.by]?.name ?? o.by}`;
    case 'rank': return auth ? `pede Authority ${o.b.auth} (tem ${auth})` : `pede Authority ${o.b.auth} (informe o rank)`;
    case 'move': return o.b.flying ? 'só em classe voadora' : 'não serve em classe voadora';
    case 'missed': return `perdido · ${o.src.text}`;
    default: return o.src.text;
  }
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
