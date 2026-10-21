// Overview: where the campaign stands and the short list of what to do now.

import { html, md } from '../html.js';
import { UNITS, UNIT_BY_ID } from '../../data/units.js';
import { PARALOGUES } from '../../data/paralogues.js';
import { SKILL_NAME, RECRUIT_DEADLINE } from '../../data/skills.js';
import {
  nextSteps, bylethTraining, paralogueStatus, composition, recruitTargets, birthdaysInMonth, parseDate,
  monthOfChapter, isRecruited, roleOf, reviewStatus, taskDone, unitState, supportIndex, prefsOf, paralogueItems, accessoryPlan,
} from '../logic.js';
import { currentNotes } from '../seal.js';
import { avatar, taskItem, tagChip, chapterLabel, skillIcon, rank, emptyState, icon, itemRow } from './ui.js';

function deadlines(state) {
  const ch = state.chapter;
  const dorothea = unitState(state, 'dorothea');
  const edelgard = unitState(state, 'edelgard');
  const rows = [];
  if (dorothea.cls !== 'Dancer' && !dorothea.mastered?.includes('Dancer')) {
    rows.push({ to: 9, from: 9, text: 'White Heron Cup: escolher a representante e vencer (Dancer).', link: '#/unidade/dorothea' });
  }
  if (recruitTargets(state).some((u) => ['student', 'faculty'].includes(u.recruit.kind))) {
    rows.push({ to: RECRUIT_DEADLINE, from: 1, text: 'Último capítulo para recrutar de outras casas.', link: '#/recrutamento' });
  }
  rows.push({
    to: 11,
    from: 1,
    text: supportIndex(edelgard.support) >= supportIndex('B')
      ? 'Crimson Flower: aceitar o convite da Edelgard (suporte já está em B).'
      : 'Crimson Flower: suporte B com a Edelgard (a rota pede C+, que o jogo não mostra) e aceitar o convite dela.',
    link: '#/unidade/edelgard',
  });
  for (const p of PARALOGUES) {
    const s = paralogueStatus(p, state);
    if (s.phase === 'done') continue;
    rows.push({ from: s.from, to: s.to, text: p.name, link: '#/paralogues', phase: s.phase });
  }
  return rows
    .filter((r) => r.to >= ch)
    .sort((a, b) => a.to - b.to || a.from - b.from)
    .map((r) => ({ ...r, now: ch >= r.from, closing: r.to === ch }));
}

function tiles(state, notes) {
  const comp = composition(state);
  const ready = comp.starters.filter((u) => isRecruited(state, u.id)).length;
  const open = state.chapter <= RECRUIT_DEADLINE;
  const pending = open ? recruitTargets(state).filter((u) => ['titular', 'rotacao'].includes(roleOf(state, u.id))) : [];
  const tasks = notes?.tasks ?? [];
  const done = tasks.filter((t) => taskDone(t, state)).length;
  return html`<div class="tiles">
    <div class="tile">
      <p class="tile-label">Capítulo</p>
      <p class="tile-value">${state.chapter >= 13 ? 'Parte 2' : state.chapter}</p>
      <p class="tile-sub">${notes?.title ?? chapterLabel(state.chapter)}${state.date ? ` · ${state.date}` : ''}</p>
    </div>
    <div class="tile">
      <p class="tile-label">Titulares em campo</p>
      <p class="tile-value">${ready}<span class="of">/${comp.total}</span></p>
      <p class="tile-sub">${comp.total - ready ? `${comp.total - ready} ${open ? 'ainda por recrutar' : 'fora do exército'}` : 'todas no exército'}</p>
    </div>
    <div class="tile">
      <p class="tile-label">Recrutas prioritárias</p>
      <p class="tile-value">${pending.length}</p>
      ${pending.length
        ? html`<p class="tile-sub stack">${pending.map((u) => html`<a href="#/unidade/${u.id}" data-tip="${u.name}" aria-label="${u.name}">${avatar(u, 'sm')}</a>`)}</p>`
        : html`<p class="tile-sub">${open ? 'nenhuma pendente' : `recrutamento fechou no Cap. ${RECRUIT_DEADLINE}`}</p>`}
    </div>
    <div class="tile">
      <p class="tile-label">Checklist do capítulo</p>
      <p class="tile-value">${done}<span class="of">/${tasks.length}</span></p>
      <p class="tile-sub">${tasks.length ? (done === tasks.length ? 'tudo feito' : 'itens do mês') : 'sem notas para este capítulo'}</p>
    </div>
  </div>`;
}

function stepsCard(state, notes) {
  const steps = nextSteps(state, notes);
  return html`<section class="card">
    <h2 class="card-title">Agora</h2>
    <p class="card-lead">Calculado do que você marcou no Esquadrão e no Recrutamento.</p>
    ${steps.length
      ? html`<ol class="steps">${steps.map((s) => html`<li class="step p${s.priority}">${tagChip(s.kind)}<a href="${s.link}">${s.text}</a></li>`)}</ol>`
      : emptyState('Nada urgente. Confira a checklist do capítulo.')}
  </section>`;
}

/** What this month can give and who keeps it: the mission's items and the open paralogues'. */
function itemsCard(state, notes) {
  const list = [...(notes?.items ?? []), ...paralogueItems(state)];
  if (!list.length) return '';
  return html`<section class="card" aria-labelledby="it-title">
    <h2 class="card-title" id="it-title">Itens deste capítulo</h2>
    <p class="card-lead">Quem fica com cada item que dá para ganhar agora: a primeira da ordem que já estiver no exército e, se for acessório, ainda não usar um melhor. Os nomes riscados ainda não entraram.</p>
    <ul class="item-list">${list.map((rec) => itemRow(rec, state))}</ul>
  </section>`;
}

const ROLE_ORDER = ['titular', 'rotacao', 'reserva', 'utilitario', 'temporaria'];

/** Who wears which accessory: one each, from what the open chapters and paralogues give. */
function accessoriesCard(state) {
  const { slots, wearing } = accessoryPlan(state);
  if (!slots.length) return '';
  const army = UNITS
    .filter((u) => isRecruited(state, u.id) && (wearing.has(u.id) || ['titular', 'rotacao'].includes(roleOf(state, u.id))))
    .sort((a, b) => ROLE_ORDER.indexOf(roleOf(state, a.id)) - ROLE_ORDER.indexOf(roleOf(state, b.id)));
  const spare = slots.filter((s) => !s.holder);
  return html`<section class="card" aria-labelledby="ac-title">
    <h2 class="card-title" id="ac-title">Acessórios: um por pessoa</h2>
    <p class="card-lead">Anel, escudo, gema ou cajado: cada personagem equipa um só, ao lado da arma. Escudo também pesa e tira velocidade. Com o que já dá para pegar até aqui, fica assim:</p>
    <ul class="acc-list">${army.map((u) => {
      const rec = wearing.get(u.id);
      return html`<li class="${rec ? '' : 'none'}">
        <a class="person" href="#/unidade/${u.id}">${avatar(u, 'sm')}<span>${u.name}</span></a>
        <span class="acc-item">${rec ? html`<strong>${rec.item}</strong><span class="acc-from">${rec.from}</span>` : 'nenhum ainda'}</span>
      </li>`;
    })}</ul>
    ${spare.length ? html`<p class="hint acc-spare"><strong>Sobrando:</strong> ${spare.map((s, i) => html`${i ? ' · ' : ''}${s.rec.item}${s.next ? ` (guarde para ${UNIT_BY_ID[s.next].name})` : ''}`)}. Guarde no comboio e equipe em quem entrar no mapa sem acessório.</p>` : ''}
  </section>`;
}

function checklistCard(state, notes) {
  if (!notes) return html`<section class="card"><h2 class="card-title">Checklist do capítulo</h2>${emptyState('Sem notas para este capítulo.')}</section>`;
  return html`<section class="card">
    <h2 class="card-title">Checklist do capítulo</h2>
    <p class="card-lead">${md(notes.intro)}</p>
    <ul class="checks">
      ${notes.tasks.map((t) => taskItem('pc', t, state, state.chapter))}
    </ul>
    <p class="hint">Itens com ✓ automático se marcam sozinhos pelo que você informou (quem já entrou, classe, maestria, suporte, paralogue, data).</p>
    <p class="more"><a href="#/capitulos">Notas completas do capítulo ${icon('arrow')}</a></p>
  </section>`;
}

/** Once per chapter: the army and the recruits checked against the game. */
function reviewCard(state) {
  const r = reviewStatus(state);
  if (!r.pending.length) return '';
  const fresh = r.pending.length === r.all.length;
  return html`<section class="card callout" aria-labelledby="rv-title">
    <div class="callout-body">
      <h2 class="card-title" id="rv-title">${fresh ? `${chapterLabel(state.chapter)}: atualize o esquadrão` : 'Faltam algumas fichas'}</h2>
      <p class="card-lead">${r.pending.length} de ${r.all.length} ainda não foram conferidas neste capítulo. Nível, classe, ranks e suportes mudam a cada mês, e as recomendações saem deles.</p>
      <p class="tile-sub stack">${r.pending.slice(0, 12).map((u) => html`<a href="#/atualizar" data-tip="${u.name}" aria-label="${u.name}">${avatar(u, 'sm')}</a>`)}</p>
    </div>
    <a class="btn primary" href="#/atualizar">Atualizar agora ${icon('arrow')}</a>
  </section>`;
}

function trainingCard(state, notes) {
  const rows = bylethTraining(state, notes).slice(0, 4);
  const none = notes?.away?.includes('*');
  return html`<section class="card">
    <h2 class="card-title">Faculty Training do Byleth</h2>
    <p class="card-lead">O plano é chegar a suporte B com cada recruta; estas são as skills que ainda faltam para o requisito de B, titulares primeiro.</p>
    ${none ? html`<p class="warn">Ninguém dá Faculty Training neste capítulo${state.chapter < 3 ? ': ele abre no Cap. 3, com a quest Learning from the Best' : ''}. Os alvos abaixo valem para quando o treino voltar.</p>` : ''}
    ${rows.length
      ? html`<ul class="train">${rows.map((r) => html`<li>
          <div class="train-head">${skillIcon(r.skill)}<strong>${SKILL_NAME[r.skill]}</strong> ${rank(r.have)}</div>
          <p class="train-for">${r.uses.map((u) => html`<span class="for"><strong>${u.name}</strong> com B: ${u.xpAtB ? html`${rank(u.needAtB, 'need')} <small>${u.xpAtB} XP</small>` : '✓'} · ${u.support === 'none' ? 'sem suporte' : `com ${u.support}`}: ${u.xp ? html`${rank(u.need, 'need')} <small>${u.xp} XP</small>` : '✓'}</span>`)}</p>
          ${none ? '' : html`<p class="train-who">${r.instructors.length
            ? html`Este mês: ${r.instructors.map((f) => f.name).join(', ')}${r.xpAtB ? html` · ~${r.sessionsAtB.min}–${r.sessionsAtB.max} sessões até o alvo de B` : ''}`
            : html`<span class="warn">Ninguém ensina ${SKILL_NAME[r.skill]} neste capítulo.</span>`}</p>`}
        </li>`)}</ul>`
      : emptyState('Nenhum treino pendente para recrutamento.')}
    <p class="more"><a href="#/recrutamento">Recrutamento ${icon('arrow')}</a></p>
  </section>`;
}

function deadlinesCard(state) {
  const rows = deadlines(state);
  return html`<section class="card">
    <h2 class="card-title">Prazos</h2>
    <ul class="deadlines">
      ${rows.map((r) => html`<li class="${r.closing ? 'closing' : r.now ? 'open' : 'later'}">
        <span class="when">${r.from === r.to ? `Cap. ${r.to}` : r.now ? `até Cap. ${r.to}` : `Cap. ${r.from}–${r.to}`}</span>
        <a href="${r.link}">${r.text}</a>
        ${r.phase === 'locked' ? html`<span class="tag tag-info">falta recrutar</span>` : ''}
        ${r.closing ? html`<span class="tag tag-rota">último mês</span>` : ''}
      </li>`)}
    </ul>
  </section>`;
}

function birthdaysCard(state) {
  const month = monthOfChapter(state.chapter);
  if (!month) return '';
  const today = parseDate(state.date);
  const list = birthdaysInMonth(month).filter((b) => roleOf(state, b.id) !== 'ignorar');
  if (!list.length) return '';
  return html`<section class="card">
    <h2 class="card-title">Aniversários deste mês</h2>
    <p class="card-lead">Presente no dia do aniversário rende suporte extra.</p>
    <ul class="bdays">${list.map((b) => {
      const def = UNIT_BY_ID[b.id];
      const when = today && today.month === month ? (b.day === today.day ? 'hoje' : b.day < today.day ? 'passou' : '') : '';
      return html`<li class="${when === 'hoje' ? 'today' : when === 'passou' ? 'past' : ''}">
        <span class="date">${b.date}</span><a class="person" href="#/unidade/${b.id}">${avatar(def, 'xs')}${b.name}</a>
        ${when ? html`<span class="tag ${when === 'hoje' ? 'tag-rota' : 'tag-info'}">${when}</span>` : ''}
        <span class="gifts">${prefsOf(def).gifts.slice(0, 4).join(' · ')}</span>
      </li>`;
    })}</ul>
  </section>`;
}

function progressCard(state) {
  const next = state.chapter + 1;
  return html`<section class="card progress">
    <h2 class="card-title">Onde você está</h2>
    <div class="progress-row">
      <label class="field" for="pd-date"><span class="field-label">Data no jogo (mês/dia)</span>
        <input id="pd-date" type="text" inputmode="numeric" placeholder="9/7" value="${state.date}" data-bind="date" data-type="text" pattern="\\d{1,2}/\\d{1,2}">
      </label>
      ${state.chapter < 17 ? html`<button type="button" class="btn primary" data-act="advance-chapter">${next === 13 ? 'Cheguei à Parte 2' : `Cheguei ao Cap. ${next}`}</button>` : ''}
    </div>
    <p class="hint">Avançar abre as notas lacradas do próximo capítulo. Dá para voltar na aba Dados.</p>
  </section>`;
}

export function painel(state) {
  const notes = currentNotes(state.chapter);
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">${chapterLabel(state.chapter)}${state.date ? ` · ${state.date}` : ''}</p>
      <h1 id="v-title">Painel</h1>
      <p class="lead">O que fazer agora, com base no estado que você marcou. Este site não lê o save: uma vez por capítulo, confira níveis, classes, ranks e suportes na aba <a href="#/atualizar">Atualizar</a>.</p>
    </header>
    ${reviewCard(state)}
    ${tiles(state, notes)}
    <div class="cols">${stepsCard(state, notes)}${checklistCard(state, notes)}</div>
    ${itemsCard(state, notes)}
    ${accessoriesCard(state)}
    <div class="cols">${trainingCard(state, notes)}${deadlinesCard(state)}</div>
    <div class="cols">${birthdaysCard(state)}${progressCard(state)}</div>
  </section>`;
}

