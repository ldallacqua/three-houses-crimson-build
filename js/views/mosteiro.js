// Monastery: who teaches what this month, the free-day activities, gifts and birthdays.

import { html } from '../html.js';
import { FACULTY } from '../../data/faculty.js';
import { SKILLS, SKILL_NAME } from '../../data/skills.js';
import { UNITS } from '../../data/units.js';
import { roleOf, isRecruited, skillNeeds, unitState } from '../logic.js';
import { currentNotes } from '../seal.js';
import { skillIcon, emptyState } from './ui.js';

function facultyTable(state) {
  const notes = currentNotes(state.chapter);
  const away = new Set(notes?.away ?? []);
  const none = away.has('*');
  const taught = SKILLS.filter((s) => FACULTY.some((f) => f.skills.includes(s.id)));
  return html`<section class="card">
    <h2 class="card-title">Faculty Training neste capítulo</h2>
    <p class="card-lead">1 ponto de atividade por sessão; o mesmo instrutor só uma vez por fim de semana. 20 XP (30 se for ponto forte do Byleth), ×1,5 quando sai "Great".</p>
    ${none ? emptyState('Sem Faculty Training com NPCs neste período.') : html`<div class="table-wrap"><table class="data faculty">
      <thead><tr><th scope="col">Instrutor</th>${taught.map((s) => html`<th scope="col" title="${s.name}">${skillIcon(s.id)}<span class="sr">${s.name}</span></th>`)}</tr></thead>
      <tbody>${FACULTY.map((f) => {
        const off = away.has(f.id);
        return html`<tr class="${off ? 'off' : ''}">
          <th scope="row">${f.name}${off ? html` <span class="tag tag-info">fora</span>` : ''}${f.note ? html`<small class="muted note">${f.note}</small>` : ''}</th>
          ${taught.map((s) => html`<td>${f.skills.includes(s.id) ? html`<span class="dot" aria-label="ensina ${s.name}">●</span>` : ''}</td>`)}
        </tr>`;
      })}</tbody>
    </table></div>`}
    ${notes ? '' : html`<p class="hint">Sem notas para este capítulo: a disponibilidade pode estar diferente.</p>`}
  </section>`;
}

function groupTasks(state) {
  const tasks = [
    { name: 'Sky Watch', skill: 'flying' },
    { name: 'Stable Duty', skill: 'riding' },
    { name: 'Weeding', skill: 'heavyArmor' },
  ];
  const wants = (skill) => UNITS.filter((u) => isRecruited(state, u.id) && ['titular', 'rotacao'].includes(roleOf(state, u.id)) && u.id !== 'byleth')
    .filter((u) => skillNeeds(u, unitState(state, u.id)).has(skill))
    .map((u) => u.name);
  return html`<section class="card">
    <h2 class="card-title">Group Tasks</h2>
    <p class="card-lead">Duplas ganham XP na skill da tarefa e suporte entre si. Use em quem o plano ainda pede essa skill e forme duplas que já se dão bem (suporte entre elas ajuda o resultado).</p>
    <ul class="gt">${tasks.map((t) => {
      const names = wants(t.skill);
      return html`<li><strong>${t.name}</strong> ${skillIcon(t.skill)} ${SKILL_NAME[t.skill]}
        <span class="muted">${names.length ? `— combina com: ${names.join(', ')}` : '— ninguém precisa agora'}</span></li>`;
    })}</ul>
  </section>`;
}

function activities() {
  const items = [
    ['Presentes e Lost Items', 'Grátis. A forma mais barata de subir suporte com as recrutas de outras casas. O item perdido certo dá mais que um presente.'],
    ['Refeição', '1 ponto. Byleth + duas alunas: suporte com as duas e motivação. Junte duas recrutas na mesma refeição (ex.: Lysithea + Marianne).'],
    ['Tea Time', '1 ponto. Uma aluna; acertar os temas rende bastante suporte. Ótimo para a recruta prioritária.'],
    ['Faculty Training', '1 ponto. Só para as skills do Byleth que destravam recrutas ou classe — veja a aba Recrutamento.'],
    ['Sauna (DLC)', '1 ponto. Vale quando várias aulas vêm logo depois; não troque refeição ou treino-chave por ela.'],
    ['Pagan Altar (Abismo)', 'Abyssian Exam Pass por 750 de Renown, sem limite. O passe é gasto mesmo se reprovar: só faça exame com 100%.'],
    ['Motivação', 'Aulas gastam motivação. Refeição, chá e presentes recuperam; não deixe as titulares sem motivação na semana de aula.'],
    ['Dias de Battle', 'Cada paralogue gasta um dia livre. Explore cedo para recrutar, paralogues depois — mas antes dos prazos.'],
  ];
  return html`<section class="card">
    <h2 class="card-title">Atividades do dia livre</h2>
    <dl class="activities">${items.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>
  </section>`;
}

function giftIndex(state) {
  const map = new Map();
  for (const u of UNITS) {
    if (roleOf(state, u.id) === 'ignorar') continue;
    for (const g of u.likes?.gifts ?? []) map.set(g, [...(map.get(g) ?? []), u.name]);
  }
  const rows = [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return html`<section class="card">
    <h2 class="card-title">Presentes: quem gosta</h2>
    <div class="table-wrap"><table class="data compact">
      <thead><tr><th scope="col">Presente</th><th scope="col">Quem gosta</th></tr></thead>
      <tbody>${rows.map(([g, names]) => html`<tr><th scope="row">${g}</th><td>${names.join(', ')}</td></tr>`)}</tbody>
    </table></div>
  </section>`;
}

function teaIndex(state) {
  const map = new Map();
  for (const u of UNITS) {
    if (roleOf(state, u.id) === 'ignorar') continue;
    for (const t of u.likes?.teas ?? []) map.set(t, [...(map.get(t) ?? []), u.name]);
  }
  const rows = [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return html`<section class="card">
    <h2 class="card-title">Chás: quem gosta</h2>
    <div class="table-wrap"><table class="data compact">
      <thead><tr><th scope="col">Chá</th><th scope="col">Quem gosta</th></tr></thead>
      <tbody>${rows.map(([t, names]) => html`<tr><th scope="row">${t}</th><td>${names.join(', ')}</td></tr>`)}</tbody>
    </table></div>
  </section>`;
}

function birthdays(state) {
  const list = UNITS.filter((u) => u.birthday && roleOf(state, u.id) !== 'ignorar')
    .map((u) => {
      const [m, d] = u.birthday.split('/').map(Number);
      return { u, m, d, order: ((m + 8) % 12) * 100 + d };
    })
    .sort((a, b) => a.order - b.order);
  return html`<section class="card">
    <h2 class="card-title">Aniversários (ano letivo)</h2>
    <ul class="bday-all">${list.map(({ u }) => html`<li><span class="date">${u.birthday}</span><a href="#/unidade/${u.id}">${u.name}</a></li>`)}</ul>
  </section>`;
}

export function mosteiro(state) {
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Garreg Mach</p>
      <h1 id="v-title">Mosteiro</h1>
      <p class="lead">Onde gastar os pontos de atividade e o que dar para quem.</p>
    </header>
    ${facultyTable(state)}
    <div class="cols">${groupTasks(state)}${activities()}</div>
    <div class="cols">${giftIndex(state)}${teaIndex(state)}</div>
    ${birthdays(state)}
  </section>`;
}
