// Recruitment: what each target asks of Byleth at every support rank, and what to train for it.

import { html } from '../html.js';
import { UNITS, HOUSES, ROLES } from '../../data/units.js';
import { SKILL_NAME, STAT_NAME, RECRUIT_DEADLINE } from '../../data/skills.js';
import { recruitStatus, roleOf, unitState, bylethTraining, isRecruited } from '../logic.js';
import { currentNotes } from '../seal.js';
import { medal, rank, supportSelect, skillIcon, roleChip, emptyState } from './ui.js';

const TIER_NAME = { none: 'Sem suporte', C: 'C', 'C+': 'C+', B: 'B', 'B+': 'B+' };
const ROLE_ORDER = ['titular', 'rotacao', 'utilitario', 'reserva', 'temporaria', 'ignorar'];

const STATE_LABEL = {
  ready: ['pronta', 'ok'],
  missing: ['falta requisito', 'miss'],
  later: ['ainda não', 'info'],
  missed: ['prazo passou', 'miss'],
  auto: ['entra sozinha', 'info'],
  gone: ['saiu', 'info'],
  recruited: ['recrutada', 'ok'],
};

export function stateBadge(rs) {
  const [label, tone] = STATE_LABEL[rs.state] ?? [rs.state, 'info'];
  return html`<span class="badge ${tone}">${label}</span>`;
}

function studentTable(def, rs) {
  return html`<table class="tiers">
    <caption class="sr">Requisitos do Byleth para ${def.name} por suporte</caption>
    <thead><tr><th scope="col">Suporte</th><th scope="col">${STAT_NAME[rs.stat]}</th><th scope="col">${SKILL_NAME[rs.skill]}</th><th scope="col"><span class="sr">Situação</span></th></tr></thead>
    <tbody>
      ${rs.tiers.map((t) => html`<tr class="${t.key === rs.tier.key ? 'current' : ''} ${t.ok ? 'ok' : ''}">
        <th scope="row">${TIER_NAME[t.key]}${t.key === rs.tier.key ? html` <span class="you">você</span>` : ''}</th>
        <td class="${t.statOk ? 'good' : 'bad'}">${t.stat} <small>(tem ${rs.statHave ?? '?'})</small></td>
        <td class="${t.rankOk ? 'good' : 'bad'}">${rank(t.rank, 'need')} <small>${t.rankOk ? '' : `+${t.xp} XP`}</small></td>
        <td>${t.ok ? '✓' : ''}</td>
      </tr>`)}
      <tr class="${rs.support === 'A' ? 'current ok' : ''}"><th scope="row">A</th><td colspan="3">entra sem requisito</td></tr>
    </tbody>
  </table>`;
}

/** The recruitment box for one target: status, support, requirement table, what to do. */
export function recruitBlock(def, state, rs = recruitStatus(def, state), { bare = false } = {}) {
  const st = unitState(state, def.id);
  const r = def.recruit;
  let body;
  if (r.kind === 'student') {
    const todo = [];
    if (rs.state === 'ready') todo.push(html`<li class="good">Byleth já cumpre: fale com ${def.name} no Explore e escolha <strong>Recruit</strong>.</li>`);
    else {
      if (!rs.tier.statOk) todo.push(html`<li>${STAT_NAME[rs.stat]} ${rs.statHave ?? '?'} / ${rs.tier.stat}: suba o suporte (o requisito cai a cada rank).</li>`);
      if (!rs.tier.rankOk) todo.push(html`<li>${SKILL_NAME[rs.skill]} ${rs.rankHave ?? '?'} → ${rs.tier.rank}: ${rs.tier.xp} XP de Faculty Training.</li>`);
      if (rs.spontaneous) todo.push(html`<li class="good">Com suporte ${rs.support}, ela tem ~10% de chance por semana de pedir para entrar mesmo sem requisito.</li>`);
      else todo.push(html`<li>Suporte B: o requisito cai e ela passa a ter ~10% de chance por semana de pedir para entrar.</li>`);
    }
    body = html`${studentTable(def, rs)}<ul class="todo">${todo}</ul>`;
  } else if (r.kind === 'faculty') {
    body = rs.state === 'later'
      ? html`<p>Disponível a partir do Cap. ${rs.from}. Requisito: Byleth Lv ${r.levels.none} (menos com suporte).</p>`
      : html`<p>Requisito: Byleth Lv ${rs.level.need} — ele está no ${rs.level.have ?? '?'}. ${rs.level.ok ? html`<strong>Pode recrutar.</strong>` : ''}</p>`;
  } else if (r.kind === 'abyss') {
    body = rs.state === 'later' ? html`<p>No Abismo a partir do Cap. ${rs.from}.</p>` : html`<p>Fale no Abismo e escolha <strong>Recruit</strong>. Sem requisito.</p>`;
  } else {
    body = html`<p>${rs.state === 'later' ? `Entra sozinha no Cap. ${rs.from}.` : 'Entra sozinha.'}</p>`;
  }
  const inner = html`
    ${r.kind === 'student' ? html`<div class="toolbar">${supportSelect(`rs-${def.id}`, `units.${def.id}.support`, st.support)}
      <label class="toggle" for="rr-${def.id}"><input id="rr-${def.id}" type="checkbox" data-bind="units.${def.id}.recruited" data-type="bool" ${st.recruited ? 'checked' : ''}><span>Recrutada</span></label></div>` : ''}
    ${body}
    ${r.kind === 'student' ? html`<p class="hint">Prazo: até o Cap. ${RECRUIT_DEADLINE}. ${def.likes?.gifts?.length ? `Presentes: ${def.likes.gifts.join(', ')}.` : ''}${def.likes?.teas?.length ? ` Chás: ${def.likes.teas.join(', ')}.` : ''}${def.birthday ? ` Aniversário: ${def.birthday}.` : ''}</p>` : ''}`;
  if (bare) return inner;
  return html`<section class="card recruit" aria-label="Recrutamento de ${def.name}">
    <h2 class="card-title">Recrutamento ${stateBadge(rs)}</h2>
    ${inner}
  </section>`;
}

/** Byleth's training that moves recruitment, per skill. */
export function trainingTable(state, notes) {
  const rows = bylethTraining(state, notes);
  return html`<section class="card">
    <h2 class="card-title">Faculty Training do Byleth para recrutar</h2>
    <p class="card-lead">Cada sessão dá 20 XP (30 se for ponto forte dele; ×1,5 quando sai "Great"). XP contado do começo do rank atual — se a barra já andou, falta menos.</p>
    ${rows.length ? html`<div class="table-wrap"><table class="data">
      <thead><tr><th scope="col">Skill</th><th scope="col">Byleth</th><th scope="col">Para quem (agora / com B)</th><th scope="col">Instrutores neste capítulo</th></tr></thead>
      <tbody>${rows.map((r) => html`<tr>
        <th scope="row">${skillIcon(r.skill)} ${SKILL_NAME[r.skill]}</th>
        <td>${rank(r.have)}</td>
        <td>${r.uses.map((u) => html`<div>${u.name}: ${u.xp ? html`${rank(u.need, 'need')} <small>${u.xp} XP</small>` : '✓'} / ${u.xpAtB ? html`${rank(u.needAtB, 'need')} <small>${u.xpAtB} XP</small>` : '✓'}</div>`)}</td>
        <td>${r.instructors.length ? r.instructors.map((f) => f.name).join(', ') : html`<span class="warn">ninguém neste capítulo</span>`}${r.xpAtB ? html`<div><small>~${r.sessionsAtB.min}–${r.sessionsAtB.max} sessões até o alvo de B</small></div>` : ''}</td>
      </tr>`)}</tbody>
    </table></div>` : emptyState('Nada a treinar para recrutamento.')}
  </section>`;
}

function targetCard(def, state) {
  const rs = recruitStatus(def, state);
  const role = roleOf(state, def.id);
  return html`<article class="recruit-card">
    <header class="unit-head">${medal(def)}
      <div class="unit-id"><h3><a href="#/unidade/${def.id}">${def.name}</a></h3>
        <p class="unit-meta">${HOUSES[def.house].name} · ${roleChip(role)}</p></div>
      ${stateBadge(rs)}
    </header>
    <p class="unit-line">${def.summary}</p>
    ${recruitBlock(def, state, rs, { bare: true })}
  </article>`;
}

export function recrutamento(state) {
  const notes = currentNotes(state.chapter);
  const targets = UNITS.filter((u) => u.recruit && !isRecruited(state, u.id) && roleOf(state, u.id) !== 'ignorar')
    .sort((a, b) => ROLE_ORDER.indexOf(roleOf(state, a.id)) - ROLE_ORDER.indexOf(roleOf(state, b.id)));
  const done = UNITS.filter((u) => u.recruit && isRecruited(state, u.id));
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Até o Cap. ${RECRUIT_DEADLINE}</p>
      <h1 id="v-title">Recrutamento</h1>
      <p class="lead">Cada rank de suporte baixa o que o Byleth precisa ter. Em <strong>B</strong> a aluna passa a ter ~10% de chance por semana de pedir para entrar sozinha, e em <strong>A</strong> entra sem requisito. Presentes e Lost Items não gastam ponto de atividade: comece por eles.</p>
    </header>
    ${trainingTable(state, notes)}
    <div class="recruit-grid">${targets.map((u) => targetCard(u, state))}</div>
    ${done.length ? html`<section class="card"><h2 class="card-title">Já no exército</h2>
      <ul class="inline-list">${done.map((u) => html`<li>${medal(u, 'sm')}<a href="#/unidade/${u.id}">${u.name}</a> <small class="muted">${ROLES[roleOf(state, u.id)]}</small></li>`)}</ul></section>` : ''}
  </section>`;
}
