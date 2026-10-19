// Overview: where the campaign stands and the short list of what to do now.

import { html, md } from '../html.js';
import { UNIT_BY_ID } from '../../data/units.js';
import { PARALOGUES } from '../../data/paralogues.js';
import { SKILL_NAME, RECRUIT_DEADLINE } from '../../data/skills.js';
import {
  nextSteps, bylethTraining, paralogueStatus, composition, recruitTargets, birthdaysInMonth, parseDate,
  monthOfChapter, isRecruited, roleOf,
} from '../logic.js';
import { currentNotes } from '../seal.js';
import { avatar, checkItem, chapterLabel, tagChip, skillIcon, rank, emptyState, icon } from './ui.js';

function deadlines(state) {
  const ch = state.chapter;
  const rows = [
    { to: 9, from: 9, text: 'White Heron Cup: escolher a representante e vencer (Dancer).', link: '#/unidade/dorothea' },
    { to: RECRUIT_DEADLINE, from: 1, text: 'Último capítulo para recrutar alunas de outras casas.', link: '#/recrutamento' },
    { to: 11, from: 1, text: 'Crimson Flower: suporte C+ com a Edelgard e aceitar o convite dela.', link: '#/unidade/edelgard' },
  ];
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
  const pending = recruitTargets(state).filter((u) => ['titular', 'rotacao'].includes(roleOf(state, u.id)));
  const tasks = notes?.tasks ?? [];
  const done = tasks.filter((t) => state.checks[t.id]).length;
  return html`<div class="tiles">
    <div class="tile">
      <p class="tile-label">Capítulo</p>
      <p class="tile-value">${state.chapter >= 13 ? 'Parte 2' : state.chapter}</p>
      <p class="tile-sub">${notes?.title ?? chapterLabel(state.chapter)}${state.date ? ` · ${state.date}` : ''}</p>
    </div>
    <div class="tile">
      <p class="tile-label">Titulares em campo</p>
      <p class="tile-value">${ready}<span class="of">/${comp.total}</span></p>
      <p class="tile-sub">${comp.total - ready ? `${comp.total - ready} ainda por recrutar` : 'todas recrutadas'}</p>
    </div>
    <div class="tile">
      <p class="tile-label">Recrutas prioritárias</p>
      <p class="tile-value">${pending.length}</p>
      ${pending.length
        ? html`<p class="tile-sub stack">${pending.map((u) => html`<a href="#/unidade/${u.id}" data-tip="${u.name}" aria-label="${u.name}">${avatar(u, 'sm')}</a>`)}</p>`
        : html`<p class="tile-sub">nenhuma pendente</p>`}
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

function checklistCard(state, notes) {
  if (!notes) return html`<section class="card"><h2 class="card-title">Checklist do capítulo</h2>${emptyState('As notas começam no Cap. 6.')}</section>`;
  return html`<section class="card">
    <h2 class="card-title">Checklist do capítulo</h2>
    <p class="card-lead">${md(notes.intro)}</p>
    <ul class="checks">
      ${notes.tasks.map((t) => checkItem(`pc-${t.id}`, state.checks[t.id], html`${tagChip(t.tag)} ${md(t.text)}`, html`data-check="${t.id}"`))}
    </ul>
    <p class="more"><a href="#/capitulos">Notas completas do capítulo ${icon('arrow')}</a></p>
  </section>`;
}

function trainingCard(state, notes) {
  const rows = bylethTraining(state, notes).slice(0, 4);
  return html`<section class="card">
    <h2 class="card-title">Faculty Training do Byleth</h2>
    <p class="card-lead">O plano é chegar a suporte B com cada recruta; estas são as skills que ainda faltam para o requisito de B, titulares primeiro.</p>
    ${rows.length
      ? html`<ul class="train">${rows.map((r) => html`<li>
          <div class="train-head">${skillIcon(r.skill)}<strong>${SKILL_NAME[r.skill]}</strong> ${rank(r.have)}</div>
          <p class="train-for">${r.uses.map((u) => html`<span class="for"><strong>${u.name}</strong> com B: ${u.xpAtB ? html`${rank(u.needAtB, 'need')} <small>${u.xpAtB} XP</small>` : '✓'} · ${u.support === 'none' ? 'sem suporte' : `com ${u.support}`}: ${u.xp ? html`${rank(u.need, 'need')} <small>${u.xp} XP</small>` : '✓'}</span>`)}</p>
          <p class="train-who">${r.instructors.length
            ? html`Este mês: ${r.instructors.map((f) => f.name).join(', ')}${r.xpAtB ? html` · ~${r.sessionsAtB.min}–${r.sessionsAtB.max} sessões até o alvo de B` : ''}`
            : html`<span class="warn">Ninguém ensina ${SKILL_NAME[r.skill]} neste capítulo.</span>`}</p>
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
        <span class="gifts">${def.likes?.gifts?.slice(0, 4).join(' · ')}</span>
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
      <p class="lead">O que fazer agora, com base no estado que você marcou. Este site não lê o save: atualize níveis, ranks e suportes nas fichas quando mudarem.</p>
    </header>
    ${tiles(state, notes)}
    <div class="cols">${stepsCard(state, notes)}${checklistCard(state, notes)}</div>
    <div class="cols">${trainingCard(state, notes)}${deadlinesCard(state)}</div>
    <div class="cols">${birthdaysCard(state)}${progressCard(state)}</div>
  </section>`;
}

