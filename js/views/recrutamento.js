// Recruitment: what each target asks of Byleth at every support rank, and what to train for it.

import { html } from '../html.js';
import { UNITS, HOUSES, ROLES } from '../../data/units.js';
import { SKILL_NAME, STAT_NAME, RECRUIT_DEADLINE } from '../../data/skills.js';
import { recruitStatus, roleOf, unitState, bylethTraining, isRecruited, prefsOf } from '../logic.js';
import { currentNotes } from '../seal.js';
import { avatar, rank, supportSelect, switchField, skillIcon, roleChip, emptyState, g } from './ui.js';

const TIER_NAME = { none: 'Sem suporte', C: 'C', 'C+': 'C+', B: 'B', 'B+': 'B+' };
const HIDDEN_TIP = 'O jogo não mostra este rank: ele fica no meio do caminho até o próximo.';
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

const MASC = { ready: 'pronto', auto: 'entra sozinho', recruited: 'recrutado' };

export function stateBadge(rs, def) {
  const [fem, tone] = STATE_LABEL[rs.state] ?? [rs.state, 'info'];
  const label = def?.gender === 'm' ? MASC[rs.state] ?? fem : fem;
  return html`<span class="badge ${tone}">${label}</span>`;
}

function studentTable(def, rs) {
  return html`<table class="tiers">
    <caption class="sr">Requisitos do Byleth para ${def.name} por suporte</caption>
    <thead><tr><th scope="col">Suporte</th><th scope="col">${STAT_NAME[rs.stat]}</th><th scope="col">${SKILL_NAME[rs.skill]}</th><th scope="col"><span class="sr">Situação</span></th></tr></thead>
    <tbody>
      ${rs.tiers.map((t) => html`<tr class="${t.key === rs.tier.key ? 'current' : ''} ${t.ok ? 'ok' : ''}">
        <th scope="row">${TIER_NAME[t.key]}${t.key.endsWith('+') ? html` <span class="hidden-rank" data-tip="${HIDDEN_TIP}" tabindex="0">oculto</span>` : ''}${t.key === rs.tier.key ? html` <span class="you">você</span>` : ''}</th>
        <td class="${t.statOk ? 'good' : 'bad'}">${t.stat} <small>(tem ${rs.statHave ?? '?'})</small></td>
        <td class="${t.rankOk ? 'good' : 'bad'}">${rank(t.rank, 'need')} <small>${t.rankOk ? '' : `+${t.xp} XP`}</small></td>
        <td>${t.ok ? '✓' : ''}</td>
      </tr>`)}
      <tr class="${['A', 'S'].includes(rs.support) ? 'current ok' : ''}"><th scope="row">A</th><td colspan="3">entra sem requisito</td></tr>
    </tbody>
  </table>`;
}

/**
 * The recruitment box for one target: status, support, requirement table, what to do.
 * `controls: false` leaves out the support select and the switch (the unit sheet has them on top).
 */
export function recruitBlock(def, state, rs = recruitStatus(def, state), { bare = false, controls = true } = {}) {
  const st = unitState(state, def.id);
  const r = def.recruit;
  const prefs = prefsOf(def);
  const ela = def.gender === 'm' ? 'ele' : 'ela';
  let body;
  if (rs.state === 'missed') {
    body = html`<p>O prazo para recrutar no Part 1 terminou no Cap. ${RECRUIT_DEADLINE}.</p>`;
  } else if (rs.reason) {
    // Support A (or S): no requirement left.
    body = html`<p class="good">${rs.reason} Fale com ${def.name} no Explore e escolha <strong>Recruit</strong>.</p>`;
  } else if (r.kind === 'student') {
    const todo = [];
    if (rs.state === 'ready') todo.push(html`<li class="good">Byleth já cumpre: fale com ${def.name} no Explore e escolha <strong>Recruit</strong>.</li>`);
    else {
      if (!rs.tier.statOk) todo.push(html`<li>${STAT_NAME[rs.stat]} ${rs.statHave ?? '?'} / ${rs.tier.stat}: suba o suporte (o requisito cai a cada rank).</li>`);
      if (!rs.tier.rankOk) todo.push(html`<li>${SKILL_NAME[rs.skill]} ${rs.rankHave ?? '?'} → ${rs.tier.rank}: ${rs.tier.xp} XP de Faculty Training.</li>`);
      if (rs.maybe) todo.push(html`<li class="good">Pode já dar: entre ${rs.support} e o próximo rank existe um ${rs.maybe.key} que o jogo não mostra, e com ele o Byleth já cumpre. Tente <strong>Recruit</strong>; se ${ela} recusar, continue subindo o suporte.</li>`);
      if (rs.spontaneous) todo.push(html`<li class="good">Com suporte ${rs.support}, ${ela} tem ~10% de chance por semana de pedir para entrar mesmo sem requisito.</li>`);
      else todo.push(html`<li>Suporte B: o requisito cai e ${ela} passa a ter ~10% de chance por semana de pedir para entrar.</li>`);
    }
    body = html`${studentTable(def, rs)}<ul class="todo">${todo}</ul>`;
  } else if (r.kind === 'faculty') {
    body = rs.state === 'later'
      ? html`<p>Disponível a partir do Cap. ${rs.from}. Requisito: Byleth Lv ${r.levels.none} (menos com suporte).</p>`
      : html`<p>Requisito: Byleth Lv ${rs.level.need} — ele está no ${rs.level.have ?? '?'}. ${rs.level.ok ? html`<strong>Pode recrutar.</strong>` : ''}${rs.maybe ? ` Com o ${rs.maybe.key} oculto (o jogo não mostra) bastaria Lv ${rs.maybe.level}: vale tentar.` : ''}</p>`;
  } else if (r.kind === 'abyss') {
    const dlc = html`Pede o Expansion Pass e o Cap. ${r.dlc} de <strong>Cindered Shadows</strong> concluído (menu principal).`;
    body = rs.state === 'later'
      ? html`<p>No Abismo a partir do Cap. ${rs.from}. ${dlc}</p>`
      : html`<p>Fale com ${def.name} no Abismo e escolha <strong>Recruit</strong>. Sem requisito no jogo principal. ${dlc}</p>`;
  } else {
    const alone = g(def, 'Entra sozinha', 'Entra sozinho');
    body = html`<p>${rs.state === 'later' ? `${alone} no Cap. ${rs.from}.` : `${alone}.`}</p>`;
  }
  const inner = html`
    ${r.kind === 'student' && controls ? html`<div class="toolbar">${supportSelect(`rs-${def.id}`, `units.${def.id}.support`, st.support)}
      ${switchField(`rr-${def.id}`, st.recruited, 'Já está no meu exército', html`data-bind="units.${def.id}.recruited" data-type="bool"`)}</div>` : ''}
    ${body}
    ${r.kind === 'student' ? html`<p class="hint">Prazo: até o Cap. ${RECRUIT_DEADLINE}. ${prefs.gifts.length ? `Presentes: ${prefs.gifts.join(', ')}.` : ''}${prefs.teas.length ? ` Chás: ${prefs.teas.join(', ')}.` : ''}${def.birthday ? ` Aniversário: ${def.birthday}.` : ''} <a href="#/unidade/${def.id}">Assuntos do chá e pratos na ficha</a>.</p>` : ''}`;
  if (bare) return inner;
  return html`<section class="card recruit" aria-label="Recrutamento de ${def.name}">
    <h2 class="card-title">Recrutamento ${stateBadge(rs, def)}</h2>
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
  return html`<article class="recruit-card" data-house="${HOUSES[def.house].color}">
    <header class="unit-head">
      <a class="unit-portrait" href="#/unidade/${def.id}" tabindex="-1" aria-hidden="true">${avatar(def, 'lg', { dim: true })}</a>
      <div class="unit-id"><h3><a href="#/unidade/${def.id}">${def.name}</a></h3>
        <p class="unit-meta"><span>${HOUSES[def.house].name}</span>${roleChip(role)}</p></div>
      ${stateBadge(rs, def)}
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
      <p class="lead">Cada rank de suporte baixa o que o Byleth precisa ter, inclusive o C+ e o B+, que o jogo não mostra (ficam entre C e B e entre B e A). Em <strong>B</strong> a aluna passa a ter ~10% de chance por semana de pedir para entrar sozinha, e em <strong>A</strong> entra sem requisito. Presentes e Lost Items não gastam ponto de atividade: comece por eles.</p>
    </header>
    ${trainingTable(state, notes)}
    <div class="recruit-grid">${targets.map((u) => targetCard(u, state))}</div>
    ${done.length ? html`<section class="card"><h2 class="card-title">Já no exército</h2>
      <ul class="roster">${done.map((u) => html`<li><a href="#/unidade/${u.id}">${avatar(u, 'md')}<span class="roster-name">${u.name}</span><small>${ROLES[roleOf(state, u.id)]}</small></a></li>`)}</ul></section>` : ''}
  </section>`;
}
