// The squad: who starts, who rotates, who waits, with the one thing each needs next.

import { html } from '../html.js';
import { UNITS, HOUSES, ROLES } from '../../data/units.js';
import { SKILL_NAME } from '../../data/skills.js';
import { unitState, roleOf, isRecruited, planStatus, unitAdvice, suggestGoals, recruitStatus, composition } from '../logic.js';
import { medal, roleChip, rank } from './ui.js';

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
    ['Físico', c.physical], ['Magia', c.magic], ['Cura', c.healers], ['Voo', c.fliers], ['Arco', c.ranged], ['Dança', c.dancer],
  ];
  return html`<section class="card comp">
    <h2 class="card-title">Composição das titulares <span class="count">${c.total}/10</span></h2>
    <ul class="comp-cells">${cells.map(([label, n]) => html`<li><span class="n">${n}</span><span class="l">${label}</span></li>`)}</ul>
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
  return html`<article class="unit-card ${recruited ? '' : 'pending'}">
    <header class="unit-head">
      ${medal(def)}
      <div class="unit-id">
        <h3><a href="#/unidade/${def.id}">${def.name}</a></h3>
        <p class="unit-meta">${recruited ? html`${st.cls ?? 'classe ?'} · Lv ${st.level ?? '?'}` : html`${house.name} · não recrutada`}</p>
      </div>
      <label class="role-pick" for="role-${def.id}"><span class="sr">Papel de ${def.name}</span>
        <select id="role-${def.id}" data-bind="units.${def.id}.role" data-type="text">
          ${ORDER.map((r) => html`<option value="${r}" ${r === role ? 'selected' : ''}>${ROLES[r] ?? 'Fora do plano'}</option>`)}
        </select>
      </label>
    </header>
    <p class="unit-line">${line || def.summary}</p>
    ${goals.length ? html`<p class="goals"><span class="goals-label">Goals</span>${goals.map((g) => html`<span class="goal">${SKILL_NAME[g.skill]} ${rank(g.have)}→${rank(g.need, 'need')}</span>`)}</p>` : ''}
    <a class="unit-open" href="#/unidade/${def.id}">Abrir ficha <span aria-hidden="true">→</span></a>
  </article>`;
}

export function esquadrao(state) {
  const groups = ORDER.map((role) => ({ role, units: UNITS.filter((u) => roleOf(state, u.id) === role) })).filter((g) => g.units.length);
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Byleth + esquadrão</p>
      <h1 id="v-title">Esquadrão</h1>
      <p class="lead">Cada carta mostra a próxima coisa que a unidade precisa. Abra a ficha para atualizar nível, classe, ranks e maestrias.</p>
    </header>
    ${compositionBar(state)}
    ${groups.map((g) => html`<section class="group" aria-labelledby="g-${g.role}">
      <header class="group-head"><h2 id="g-${g.role}">${roleChip(g.role)} <span class="group-count">${g.units.length}</span></h2><p>${GROUP_NOTE[g.role]}</p></header>
      <div class="unit-grid">${g.units.map((u) => card(u, state))}</div>
    </section>`)}
  </section>`;
}
