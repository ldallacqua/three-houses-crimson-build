// The squad: who starts, who rotates, who waits, with the one thing each needs next.

import { html } from '../html.js';
import { UNITS, HOUSES } from '../../data/units.js';
import { SKILL_NAME } from '../../data/skills.js';
import { unitState, roleOf, isRecruited, planStatus, unitAdvice, suggestGoals, recruitStatus, composition } from '../logic.js';
import { avatar, roleChip, roleSelect, rank, icon } from './ui.js';

const ORDER = ['titular', 'rotacao', 'reserva', 'utilitario', 'temporaria', 'ignorar'];
const GROUP_NOTE = {
  titular: 'O time que entra em todo mapa. O limite normal é 10; alguns mapas pedem menos.',
  rotacao: 'Entra quando o mapa tem 11–12 vagas ou quando a função dela faz falta.',
  reserva: 'Recrute se quiser a coleção; treine só depois do núcleo.',
  utilitario: 'Recrutados por item, paralogue ou battalion — não precisam de treino.',
  temporaria: 'Não ficam até o fim nesta rota.',
  ignorar: 'Fora do plano.',
};

const RECRUIT_TEXT = {
  ready: 'pode recrutar agora',
  missing: 'falta requisito',
  later: 'ainda não disponível',
  missed: 'prazo passou',
  auto: 'entra sozinha',
  gone: 'saiu',
};

function compositionBar(state) {
  const c = composition(state);
  const cells = [
    ['Físico', c.physical, 'sword'], ['Magia', c.magic, 'reason'], ['Cura', c.healers, 'faith'],
    ['Voo', c.fliers, 'flying'], ['Arco', c.ranged, 'bow'], ['Dança', c.dancer, 'spark'],
  ];
  return html`<section class="card comp">
    <h2 class="card-title">Composição das titulares <span class="count">${c.total}/10</span></h2>
    <ul class="lineup" aria-label="Titulares">${c.starters.map((u) => {
      const ok = isRecruited(state, u.id);
      return html`<li><a href="#/unidade/${u.id}" data-tip="${u.name}${ok ? '' : ' · não recrutada'}" aria-label="${u.name}${ok ? '' : ', não recrutada'}">${avatar(u, 'md', { dim: !ok })}</a></li>`;
    })}</ul>
    <ul class="comp-cells">${cells.map(([label, n, ico]) => html`<li>${icon(ico)}<span class="n">${n}</span><span class="l">${label}</span></li>`)}</ul>
    <p class="card-lead">Recomendação deste guia: Shamir entra já como titular (pronta e fica na Crimson Flower); Marianne começa como 11ª porque Dorothea e Hapi já curam com Physic. Troque o papel no seletor de cada carta.</p>
  </section>`;
}

function card(def, state) {
  const st = unitState(state, def.id);
  const role = roleOf(state, def.id);
  const recruited = isRecruited(state, def.id);
  const house = HOUSES[def.house];
  let line = '';
  let goals = [];
  if (recruited && def.plans) {
    const status = planStatus(def, st);
    const advice = unitAdvice(def, st, status)[0];
    line = advice?.text ?? (status?.next ? `Próxima classe: ${status.next.cls.name}.` : 'Classe final alcançada.');
    goals = suggestGoals(def, st, status);
  } else if (!recruited && def.recruit) {
    const rs = recruitStatus(def, state);
    line = `Recrutamento: ${RECRUIT_TEXT[rs.state] ?? rs.state}.`;
  }
  return html`<article class="unit-card ${recruited ? '' : 'pending'}" data-house="${house.color}">
    <header class="unit-head">
      <a class="unit-portrait" href="#/unidade/${def.id}" tabindex="-1" aria-hidden="true">${avatar(def, 'lg', { dim: !recruited })}</a>
      <div class="unit-id">
        <h3><a href="#/unidade/${def.id}">${def.name}</a></h3>
        <p class="unit-meta">${recruited
          ? html`<span>${st.cls ?? 'classe ?'}</span><span class="sep" aria-hidden="true"></span><span>Lv ${st.level ?? '?'}</span>`
          : html`<span>${house.name}</span><span class="sep" aria-hidden="true"></span><span class="pending-note">não recrutada</span>`}</p>
      </div>
      ${roleSelect(`role-${def.id}`, def, role, { compact: true })}
    </header>
    <p class="unit-line">${line || def.summary}</p>
    ${goals.length ? html`<p class="goals"><span class="goals-label">Goals</span>${goals.map((g) => html`<span class="goal">${SKILL_NAME[g.skill]} ${rank(g.have)}<span class="arrow" aria-hidden="true">→</span>${rank(g.need, 'need')}</span>`)}</p>` : ''}
    <a class="unit-open" href="#/unidade/${def.id}">Abrir ficha ${icon('arrow')}</a>
  </article>`;
}

export function esquadrao(state) {
  const groups = ORDER.map((role) => ({ role, units: UNITS.filter((u) => roleOf(state, u.id) === role) })).filter((g) => g.units.length);
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Byleth + esquadrão</p>
      <h1 id="v-title">Esquadrão</h1>
      <p class="lead">Cada carta mostra a próxima coisa que a unidade precisa. Para atualizar todo mundo de uma vez, use a aba <a href="#/atualizar">Atualizar</a>; a ficha de cada uma tem todos os campos.</p>
    </header>
    ${compositionBar(state)}
    ${groups.map((g) => html`<section class="group" aria-labelledby="g-${g.role}">
      <header class="group-head"><h2 id="g-${g.role}">${roleChip(g.role)} <span class="group-count">${g.units.length}</span></h2><p>${GROUP_NOTE[g.role]}</p></header>
      <div class="unit-grid">${g.units.map((u) => card(u, state))}</div>
    </section>`)}
  </section>`;
}
