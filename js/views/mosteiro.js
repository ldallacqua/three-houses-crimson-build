// Monastery: the order to spend a free day in, who teaches what this month, what each activity
// is worth, and who likes which gift, tea and dish.

import { html } from '../html.js';
import { FACULTY } from '../../data/faculty.js';
import { SKILLS, SKILL_NAME, RECRUIT_DEADLINE } from '../../data/skills.js';
import { UNITS, UNIT_BY_ID } from '../../data/units.js';
import { roleOf, skillNeeds, unitState, recruitTargets, bylethTraining, prefsOf, sharedMeals, groupTaskPlan, skillGrowth } from '../logic.js';
import { MEALS } from '../../data/social.js';
import { currentNotes } from '../seal.js';
import { avatar, skillIcon, emptyState } from './ui.js';

const person = (def) => html`<span class="person">${avatar(def, 'xs')}${def.name}</span>`;

// The chapter each Sunday activity opens in, through a quest of that month: Choir Practice in 2,
// Faculty Training in 3 (Learning from the Best), Tea Time in 4 (Tea for Two). Fire Emblem Wiki
// chapter pages and Serenes Forest.
const OPENS = { choir: ['Choir Practice', 2], faculty: ['Faculty Training', 3], tea: ['Tea Time', 4] };

function facultyTable(state) {
  const notes = currentNotes(state.chapter);
  const away = new Set(notes?.away ?? []);
  const none = away.has('*');
  const taught = SKILLS.filter((s) => FACULTY.some((f) => f.skills.includes(s.id)));
  return html`<section class="card">
    <h2 class="card-title">Faculty Training neste capítulo</h2>
    <p class="card-lead">1 ponto de atividade por sessão; o mesmo instrutor só uma vez por fim de semana. 20 XP, ou 30 nos pontos fortes do Byleth (Sword, Brawl, Authority); ×1,5 quando sai "Great". Faith é o budding talent dele: depois de 6 sessões de Faith, ela também passa a render 30.</p>
    ${none ? emptyState('Sem Faculty Training com NPCs neste período.') : html`<div class="table-wrap"><table class="data faculty">
      <thead><tr><th scope="col">Instrutor</th>${taught.map((s) => html`<th scope="col" title="${s.name}">${skillIcon(s.id)}<span class="sr">${s.name}</span></th>`)}</tr></thead>
      <tbody>${FACULTY.map((f) => {
        const off = away.has(f.id);
        return html`<tr class="${off ? 'off' : ''}">
          <th scope="row"><span class="person">${avatar(UNIT_BY_ID[f.id] ?? { ...f, house: 'church' }, 'sm')}<span>${f.name}${off ? html` <span class="tag tag-info">fora</span>` : ''}${f.note ? html`<small class="muted note">${f.note}</small>` : ''}</span></span></th>
          ${taught.map((s) => html`<td>${f.skills.includes(s.id) ? html`<span class="pip" role="img" aria-label="ensina ${s.name}"></span>` : ''}</td>`)}
        </tr>`;
      })}</tbody>
    </table></div>`}
    ${notes ? '' : html`<p class="hint">Sem notas para este capítulo: a disponibilidade pode estar diferente.</p>`}
  </section>`;
}

/** Why a pair suits a task, in short phrases. */
function pairReasons(o) {
  const [a, b] = o.best.pair.map((id) => UNIT_BY_ID[id]);
  const skill = SKILL_NAME[o.skill];
  const out = [];
  if (o.best.need === 2) out.push(`${[a, b].some((u) => u.gender === 'm') ? 'os dois precisam' : 'as duas precisam'} de ${skill}`);
  else if (o.best.need === 1) {
    const u = UNIT_BY_ID[o.best.pair.find((id) => o.needs.includes(id))];
    out.push(`só ${u.gender === 'm' ? 'o' : 'a'} ${u.name} precisa de ${skill}`);
  }
  const strong = [a, b].filter((u) => skillGrowth(u.id, o.skill) > 0).map((u) => u.name);
  const weak = [a, b].filter((u) => skillGrowth(u.id, o.skill) < 0).map((u) => u.name);
  if (strong.length) out.push(`${strong.join(' e ')}: ponto forte em ${skill}`);
  if (weak.length) out.push(`${weak.join(' e ')}: ponto fraco em ${skill}`);
  out.push(o.best.support ? 'têm suporte entre si' : 'não têm suporte entre si');
  return out;
}

const duo = (o, size) => html`<span class="gt-duo">${o.best.pair.map((id, i) => html`${i ? html`<span class="gt-plus" aria-hidden="true">+</span>` : ''}<a class="person" href="#/unidade/${id}">${avatar(UNIT_BY_ID[id], size)}${UNIT_BY_ID[id].name}</a>`)}</span>`;

function groupTasks(state) {
  const { pick, options, anyNeed } = groupTaskPlan(state);
  const others = options.filter((o) => o !== pick);
  return html`<section class="card">
    <h2 class="card-title">Group Task da semana</h2>
    <p class="card-lead">Uma tarefa por semana, sempre em dupla; o Byleth não participa. A dupla ganha XP na skill da tarefa e, se tiver suporte entre si, pontos de suporte.</p>
    ${pick ? html`<div class="gt-pick">
      <p class="gt-head"><strong>${pick.name}</strong><span class="skill">${skillIcon(pick.skill)}${SKILL_NAME[pick.skill]}</span></p>
      ${duo(pick, 'md')}
      <p class="gt-why">${pairReasons(pick).join(' · ')}.</p>
    </div>` : emptyState('Recrute pelo menos duas unidades para formar uma dupla.')}
    ${pick && !anyNeed ? html`<p class="hint">Ninguém do plano precisa de Flying, Riding ou Heavy Armor agora: a tarefa vale pelo suporte, pelas Smithing Stones e pelo ouro.</p>` : ''}
    ${pick ? html`<p class="sub">Outras opções</p>
    <ul class="gt-alt">${others.map((o) => html`<li>
      <p class="gt-head"><strong>${o.name}</strong><span class="skill">${skillIcon(o.skill)}${SKILL_NAME[o.skill]}</span></p>
      ${o.best?.need || (!anyNeed && o.best?.support) ? html`${duo(o, 'xs')}<p class="gt-why">${pairReasons(o).join(' · ')}.</p>` : html`<p class="gt-why muted">Ninguém do plano precisa de ${SKILL_NAME[o.skill]} agora.</p>`}
    </li>`)}</ul>` : ''}
    <p class="hint">Resultado Good: +4/+8/+12 de XP (ponto fraco/neutro/forte), 3 Smithing Stones e 500 G. Perfect: +8/+12/+16, 5 Smithing Stones e 1.000 G. Ponto forte na skill e suporte alto na dupla deixam o Perfect mais provável. Repita a dupla até ela chegar no rank do plano; depois a sugestão muda.</p>
  </section>`;
}

const nameList = (list) => list.map((u) => u.name).join(', ');

/**
 * The order to spend a free day's activity points in. Until the recruiting deadline, support with
 * the recruits comes first (support B cuts the requirement and lets them ask to join), then the
 * training that closes a recruitment, then Byleth's own class. Fills in names from the state.
 */
function sundayOrder(state) {
  const notes = currentNotes(state.chapter);
  const byleth = UNIT_BY_ID.byleth;
  const classSkills = [...skillNeeds(byleth, unitState(state, 'byleth'))].map((s) => SKILL_NAME[s]);
  const classNow = classSkills.length ? html` Agora: <strong>${classSkills.join(' e ')}</strong>.` : '';
  const points = html`<p class="hint">Pontos por domingo: 1 no Professor Level E e +1 a cada nível, até 10 no A+. Faculty Training não sobe atributo (Str, Mag, Dex, Cha), só rank de skill.</p>`;
  const has = (what) => state.chapter >= OPENS[what][1];
  const closed = Object.keys(OPENS).filter((k) => !has(k));
  const closedNote = closed.length
    ? html`<p class="hint">Ainda não abriram neste capítulo: ${closed.map((k) => `${OPENS[k][0]} (Cap. ${OPENS[k][1]})`).join(', ')}. Cada um abre com uma quest do mês.</p>`
    : '';

  if (state.chapter > RECRUIT_DEADLINE) {
    return html`<section class="card">
      <h2 class="card-title">Domingo: em que ordem gastar os pontos</h2>
      <ol class="steps">
        <li class="step"><strong>Primeiro o que é grátis.</strong> Presentes, Lost Items e as conversas de suporte que aparecerem.</li>
        <li class="step"><strong>Treino da classe do Byleth.</strong>${classNow}</li>
        <li class="step"><strong>Refeição, Choir Practice ou chá</strong> com quem precisa de motivação para a próxima aula ou de suporte.</li>
      </ol>
      ${points}
    </section>`;
  }

  const open = recruitTargets(state).filter((u) => u.recruit.kind === 'student');
  const starters = open.filter((u) => ['titular', 'rotacao'].includes(roleOf(state, u.id)));
  const recruits = starters.length ? starters : open;
  // The most urgent skill someone can teach this chapter; a more urgent one with no instructor
  // around is named so it is not forgotten.
  const pairs = [];
  for (let i = 0; i < recruits.length; i++) {
    for (let j = i + 1; j < recruits.length; j++) {
      const both = sharedMeals([recruits[i], recruits[j]]);
      if (both.length) pairs.push({ who: [recruits[i], recruits[j]], both });
    }
  }
  const mealPairs = pairs.length
    ? html`<ul class="meal-pairs">${pairs.slice(0, 3).map((p) => html`<li><strong>${p.who.map((u) => u.name).join(' + ')}:</strong> ${p.both.slice(0, 4).join(', ')}${p.both.length > 4 ? '…' : ''}</li>`)}</ul>`
    : '';
  const plan = bylethTraining(state, notes);
  const train = plan.find((e) => e.instructors.length);
  const waiting = plan[0] && plan[0] !== train ? plan[0] : null;
  const trainNow = train
    ? html` Agora: <strong>${SKILL_NAME[train.skill]}</strong> (${nameList(train.uses)}), com ${train.instructors.map((f) => f.name).join(', ')}.${waiting ? ` ${SKILL_NAME[waiting.skill]} (${nameList(waiting.uses)}) espera um instrutor voltar.` : ''}`
    : html` A aba <a href="#/recrutamento">Recrutamento</a> mostra qual.`;
  return html`<section class="card sunday">
    <h2 class="card-title">Domingo: em que ordem gastar os pontos</h2>
    <p class="card-lead">Até o fim do Cap. ${RECRUIT_DEADLINE}: suporte com as recrutas primeiro, depois o treino que fecha o recrutamento, e o que sobrar na classe do Byleth. Recrutamento tem prazo e suporte B derruba o requisito; a classe não some.</p>
    ${recruits.length ? html`<p class="people sunday-who"><span class="muted">Recrutas em aberto:</span> ${recruits.map((u) => html`<a class="person" href="#/unidade/${u.id}">${avatar(u, 'xs')}${u.name}</a>`)}</p>` : ''}
    <ol class="steps">
      <li class="step"><strong>Primeiro o que é grátis.</strong> Presentes de que elas gostam e Lost Items (+20 de suporte cada)${has('tea') ? ', chá no aniversário (não gasta ponto)' : ''}. Assista logo as conversas de suporte: com uma conversa pendente, aquela dupla não ganha ponto.</li>
      ${has('faculty') ? html`<li class="step"><strong>Alguém perto de fechar?</strong> Se a recruta já tem o suporte e faltam 1–2 treinos, treine e recrute no mesmo dia.</li>` : ''}
      ${has('choir') ? html`<li class="step"><strong>Choir Practice com duas recrutas.</strong> +30 de suporte com cada, sempre. Um por dia; alunas de outras casas podem ir (só não ganham Faith).</li>` : ''}
      <li class="step"><strong>${has('tea') ? 'Refeição ou chá.' : 'Refeição em dupla.'}</strong> Full Menu com um prato de que as duas gostem dá +30 com cada (o Today's Special dá metade).${has('tea') ? ' Chá Perfect dá +30 com uma só: use na que está perto do próximo rank; os assuntos certos estão na ficha dela.' : ''}${mealPairs ? html` Pratos que as duas gostam:${mealPairs}` : ''}</li>
      ${has('faculty') ? html`<li class="step"><strong>Faculty Training da skill que falta.</strong>${trainNow}</li>
      <li class="step"><strong>Sobrou ponto: classe do Byleth.</strong>${classNow}</li>` : ''}
    </ol>
    ${closedNote}
    ${points}
  </section>`;
}

const SUPPORT_GAIN = [
  ['Presente de que ela gosta', 'grátis', '+20 (neutro +10)'],
  ['Lost Item devolvido', 'grátis', '+20'],
  ['Choir Practice, duas pessoas', '1 ponto', '+30 com cada'],
  ['Refeição Full Menu, prato que as duas gostam', '1 ponto', '+30 com cada'],
  ["Refeição Today's Special", '1 ponto', 'metade; um por domingo'],
  ['Cozinhar junto (Cooking)', '1 ponto + ingredientes', 'com uma pessoa: dobra com quem cozinha bem'],
  ['Tea Time Perfect', '1 ponto', '+30, uma pessoa'],
  ['Tea Time no aniversário', 'grátis', 'igual ao chá'],
  ['Faculty Training', '1 ponto', '+7 com o instrutor'],
];

function activities() {
  const items = [
    ['As três refeições', html`<strong>Today's Special</strong>: o prato do dia, sem gastar ingredientes, só um por domingo e com suporte pela metade. <strong>Full Menu</strong>: qualquer prato, gasta ingredientes, suporte cheio: escolha um de que as duas gostem (tabela de pratos abaixo). <strong>Cozinhar junto</strong>: com uma pessoa; o prato dá um bônus de atributo para todo o exército no resto do mês. Mercedes, Manuela, Anna, Bernadetta, Yuri e Gilbert cozinham bem (suporte em dobro); Constance, Hapi, Flayn e Hanneman, mal (metade). Cada aluna come com você uma vez por domingo.`],
    ['Sauna (DLC)', 'Desbloqueia com o quest Sauna Time (a partir do Cap. 5). 1 ponto, com alguém que já está na sua turma (não serve para recrutas), cada pessoa uma vez por mês. Se vocês saírem "refrescados", os dois ganham mais XP de skill no resto do mês (Faculty Training do Byleth, aulas da parceira); o suporte sobe de qualquer jeito. Vale no começo do mês, com ponto sobrando e muito treino pela frente.'],
    ['Pagan Altar (Abismo)', 'Abyssian Exam Pass por 750 de Renown, sem limite. O passe é gasto mesmo se reprovar: só faça exame com 100%.'],
    ['Estátuas dos santos', 'Recebem Renown depois do quest Tending to the Saints (Cap. 5). A da Cethleann, com 2.000 acumulados, dá +1 de XP de classe por combate para todo mundo: maestria duas vezes mais rápida. Disputa Renown com o Abyssian Exam Pass.'],
    ['Motivação', 'Aulas gastam motivação. Refeição, chá e presentes recuperam; não deixe as titulares sem motivação na semana de aula.'],
    ['Dias de Battle', 'Gastam o domingo inteiro (sem Explore). Cada combate conta para a maestria de classe. Explore cedo para recrutar, paralogues depois — mas antes dos prazos.'],
  ];
  return html`<section class="card">
    <h2 class="card-title">Quanto rende cada atividade</h2>
    <p class="card-lead">Suporte com o Byleth. Rank C a partir de 101 pontos, B a partir de 301.</p>
    <div class="table-wrap"><table class="data compact">
      <thead><tr><th scope="col">Atividade</th><th scope="col">Custo</th><th scope="col">Suporte</th></tr></thead>
      <tbody>${SUPPORT_GAIN.map(([a, cost, gain]) => html`<tr><th scope="row">${a}</th><td>${cost}</td><td>${gain}</td></tr>`)}</tbody>
    </table></div>
    <dl class="activities more">${items.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>
  </section>`;
}

function giftIndex(state) {
  const map = new Map();
  for (const u of UNITS) {
    if (roleOf(state, u.id) === 'ignorar') continue;
    for (const g of prefsOf(u).gifts) map.set(g, [...(map.get(g) ?? []), u]);
  }
  const rows = [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return html`<section class="card">
    <h2 class="card-title">Presentes: quem gosta</h2>
    <div class="table-wrap"><table class="data compact">
      <thead><tr><th scope="col">Presente</th><th scope="col">Quem gosta</th></tr></thead>
      <tbody>${rows.map(([g, who]) => html`<tr><th scope="row">${g}</th><td class="people">${who.map(person)}</td></tr>`)}</tbody>
    </table></div>
  </section>`;
}

function teaIndex(state) {
  const map = new Map();
  for (const u of UNITS) {
    if (roleOf(state, u.id) === 'ignorar') continue;
    for (const t of prefsOf(u).teas) map.set(t, [...(map.get(t) ?? []), u]);
  }
  const rows = [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return html`<section class="card">
    <h2 class="card-title">Chás: quem gosta</h2>
    <div class="table-wrap"><table class="data compact">
      <thead><tr><th scope="col">Chá</th><th scope="col">Quem gosta</th></tr></thead>
      <tbody>${rows.map(([t, who]) => html`<tr><th scope="row">${t}</th><td class="people">${who.map(person)}</td></tr>`)}</tbody>
    </table></div>
  </section>`;
}

function mealIndex(state) {
  const people = UNITS.filter((u) => u.id !== 'byleth' && u.supports !== false && roleOf(state, u.id) !== 'ignorar');
  const rows = MEALS.map((m) => ({ ...m, who: people.filter((u) => prefsOf(u).meals.includes(m.name)) }))
    .sort((a, b) => b.who.length - a.who.length || a.name.localeCompare(b.name));
  return html`<section class="card">
    <h2 class="card-title">Pratos: quem gosta</h2>
    <p class="card-lead">Para o Full Menu. Um prato de que as duas convidadas gostam dá +30 de suporte com cada; ingredientes vêm de pesca, jardim, mercado e batalhas.</p>
    <div class="table-wrap"><table class="data compact meals">
      <thead><tr><th scope="col">Prato</th><th scope="col">Ingredientes</th><th scope="col">Quem gosta</th></tr></thead>
      <tbody>${rows.map((m) => html`<tr><th scope="row">${m.name}<small class="muted note">${m.category}</small></th><td>${m.ingredients.join(', ')}</td><td class="people">${m.who.map(person)}</td></tr>`)}</tbody>
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
    <ul class="bday-all">${list.map(({ u }) => html`<li><span class="date">${u.birthday}</span><a class="person" href="#/unidade/${u.id}">${avatar(u, 'xs')}${u.name}</a></li>`)}</ul>
  </section>`;
}

export function mosteiro(state) {
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Garreg Mach</p>
      <h1 id="v-title">Mosteiro</h1>
      <p class="lead">Onde gastar os pontos de atividade e o que dar para quem.</p>
    </header>
    ${sundayOrder(state)}
    ${facultyTable(state)}
    <div class="cols">${activities()}${groupTasks(state)}</div>
    <div class="cols">${giftIndex(state)}${teaIndex(state)}</div>
    ${mealIndex(state)}
    ${birthdays(state)}
  </section>`;
}
