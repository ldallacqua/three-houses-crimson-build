// One unit's sheet: the state you type in, the class plan laid against it, and what it learns.

import { html, md } from '../html.js';
import { UNIT_BY_ID, HOUSES, ROLES } from '../../data/units.js';
import { SKILLS, STATS } from '../../data/skills.js';
import { CLASSES, OTHER_CLASSES, TIER_LABEL } from '../../data/classes.js';
import {
  unitState, roleOf, isRecruited, planStatus, unitAdvice, suggestGoals, meetsRank, recruitStatus,
} from '../logic.js';
import { currentNotes } from '../seal.js';
import { medal, rank, reqItem, abilityChip, rankSelect, numberField, supportSelect, skillLabel } from './ui.js';
import { recruitBlock, trainingTable } from './recrutamento.js';

function stateForm(def, st) {
  const p = `units.${def.id}`;
  const classOptions = [...CLASSES.map((c) => c.name), ...OTHER_CLASSES];
  return html`<section class="card" aria-labelledby="f-title">
    <h2 class="card-title" id="f-title">Estado atual</h2>
    <p class="card-lead">Copie da tela de status do jogo. Ranks em branco contam como desconhecidos.</p>
    <div class="form-row">
      ${numberField(`f-${def.id}-level`, `${p}.level`, st.level, 'Nível', { min: 1, max: 99 })}
      <label class="field grow" for="f-${def.id}-cls"><span class="field-label">Classe atual</span>
        <select id="f-${def.id}-cls" data-bind="${p}.cls" data-type="text">
          <option value="" ${!st.cls ? 'selected' : ''}>?</option>
          ${classOptions.map((c) => html`<option ${c === st.cls ? 'selected' : ''}>${c}</option>`)}
        </select>
      </label>
      ${def.plans?.length > 1 ? html`<label class="field grow" for="f-${def.id}-plan"><span class="field-label">Plano</span>
        <select id="f-${def.id}-plan" data-bind="${p}.plan" data-type="text">
          ${def.plans.map((pl) => html`<option value="${pl.id}" ${pl.id === (st.plan ?? def.plans[0].id) ? 'selected' : ''}>${pl.label}</option>`)}
        </select></label>` : ''}
    </div>
    <h3 class="sub">Atributos</h3>
    <div class="form-grid stats">${STATS.map((s) => numberField(`f-${def.id}-${s.id}`, `${p}.stats.${s.id}`, st.stats?.[s.id], s.name, { max: 255 }))}</div>
    <h3 class="sub">Skills</h3>
    <div class="form-grid ranks">${SKILLS.map((s) => rankSelect(`f-${def.id}-r-${s.id}`, `${p}.ranks.${s.id}`, st.ranks?.[s.id], s.name))}</div>
  </section>`;
}

function masteryList(def, st) {
  const withMastery = CLASSES.filter((c) => c.mastery.length && (!c.gender || c.gender === def.gender));
  const planned = new Set((def.plans ?? []).flatMap((p) => p.stages.map((s) => s.cls)));
  const first = withMastery.filter((c) => planned.has(c.name) || st.mastered?.includes(c.name) || c.name === st.cls);
  const rest = withMastery.filter((c) => !first.includes(c));
  const box = (c) => html`<li><input type="checkbox" id="m-${def.id}-${c.id}" data-bind-list="units.${def.id}.mastered" value="${c.name}" ${st.mastered?.includes(c.name) ? 'checked' : ''}>
    <label for="m-${def.id}-${c.id}"><strong>${c.name}</strong> <span class="muted">${c.mastery.map((m) => m.name).join(', ')}</span></label></li>`;
  return html`<section class="card">
    <h2 class="card-title">Maestrias concluídas</h2>
    <p class="card-lead">Marque quando a tela de classe mostrar a estrela de maestria. Maestria ≠ certificação ≠ nível.</p>
    <ul class="mastery-list">${first.map(box)}</ul>
    ${rest.length ? html`<details class="more-box"><summary>Outras classes</summary><ul class="mastery-list">${rest.map(box)}</ul></details>` : ''}
  </section>`;
}

function stageView(s) {
  const c = s.check;
  const tier = TIER_LABEL[s.cls.tier];
  return html`<li class="stage ${s.status} ${s.optional ? 'optional' : ''}">
    <div class="stage-mark" aria-hidden="true"></div>
    <div class="stage-body">
      <p class="stage-top"><strong class="stage-name">${s.cls.name}</strong>
        <span class="muted">${tier}${s.cls.level ? ` · Lv ${s.cls.level}` : ''}${s.cls.item ? ` · ${s.cls.item}` : ''}</span>
        ${s.status === 'current' ? html`<span class="tag tag-rota">atual</span>` : ''}
        ${s.status === 'done' ? html`<span class="tag tag-ok">feito</span>` : ''}
        ${s.optional ? html`<span class="tag tag-info">opcional</span>` : ''}
        ${s.status === 'future' && c.ready ? html`<span class="tag tag-ok">pode certificar</span>` : ''}
      </p>
      ${s.why ? html`<p class="stage-why">${s.why}</p>` : ''}
      ${c.items.length ? html`<ul class="reqs">${c.items.map(reqItem)}</ul>` : ''}
      ${s.status === 'future' && !c.levelOk && s.cls.level ? html`<p class="stage-level">Falta nível: ${c.level ?? '?'} / ${s.cls.level}</p>` : ''}
      ${!c.genderOk ? html`<p class="warn">Classe restrita a outro gênero.</p>` : ''}
      ${s.cls.mastery.length ? html`<p class="chips">${s.master ? html`<span class="chips-label">${s.mastered ? 'dominada' : 'dominar'}</span>` : html`<span class="chips-label">maestria</span>`}${s.cls.mastery.map(abilityChip)}</p>` : ''}
    </div>
  </li>`;
}

function planCard(def, st) {
  const status = planStatus(def, st);
  if (!status) return '';
  const advice = unitAdvice(def, st, status);
  const goals = suggestGoals(def, st, status);
  return html`<section class="card plan">
    <h2 class="card-title">Plano: ${status.plan.label}</h2>
    ${advice.length ? html`<ul class="advice">${advice.map((a) => html`<li class="adv-${a.kind}">${a.text}</li>`)}</ul>` : ''}
    ${goals.length ? html`<div class="goal-box">
      <p class="goals-label">Goals sugeridos</p>
      <ul class="goal-list">${goals.map((g) => html`<li>${skillLabel(g.skill)} ${rank(g.have)}<span class="arrow">→</span>${rank(g.need, 'need')} <span class="muted">${g.why} · ${g.xp} XP</span></li>`)}</ul>
    </div>` : ''}
    <ol class="stages">${status.stages.map(stageView)}</ol>
  </section>`;
}

function learnCard(def, st) {
  if (!def.learn?.length) return '';
  const ranks = st.ranks ?? {};
  const bySkill = new Map();
  for (const row of def.learn) bySkill.set(row.skill, [...(bySkill.get(row.skill) ?? []), row]);
  return html`<section class="card">
    <h2 class="card-title">Aprende por rank</h2>
    <div class="learn">
      ${[...bySkill.entries()].map(([skill, rows]) => html`<div class="learn-col">
        <p class="learn-skill">${skillLabel(skill)} ${rank(ranks[skill])}</p>
        <ul>${rows.map((r) => {
          const got = r.rank !== 'budding' && meetsRank(ranks[skill], r.rank);
          return html`<li class="${got ? 'got' : ''} kind-${r.kind}"><span class="rk-mini">${r.rank === 'budding' ? '✿' : r.rank}</span>${r.name}</li>`;
        })}</ul>
      </div>`)}
    </div>
    <p class="hint">✿ = recompensa do budding talent. Riscado = já aprendeu pelo rank informado.</p>
  </section>`;
}

function likesCard(def) {
  if (!def.likes && !def.birthday) return '';
  const l = def.likes ?? {};
  return html`<section class="card">
    <h2 class="card-title">Social</h2>
    <dl class="likes">
      ${def.birthday ? html`<dt>Aniversário</dt><dd>${def.birthday}</dd>` : ''}
      ${l.gifts?.length ? html`<dt>Presentes</dt><dd>${l.gifts.join(' · ')}</dd>` : ''}
      ${l.teas?.length ? html`<dt>Chás</dt><dd>${l.teas.join(' · ')}</dd>` : ''}
      ${l.lost?.length ? html`<dt>Lost Items</dt><dd>${l.lost.join(' · ')}</dd>` : ''}
    </dl>
  </section>`;
}

export function unidade(state, id) {
  const def = UNIT_BY_ID[id];
  if (!def) return html`<section class="view"><h1 id="v-title">Unidade não encontrada</h1><p><a href="#/esquadrao">Voltar ao esquadrão</a></p></section>`;
  const st = unitState(state, id);
  const recruited = isRecruited(state, id);
  const role = roleOf(state, id);
  const house = HOUSES[def.house];
  const rs = def.recruit ? recruitStatus(def, state) : null;
  return html`<section class="view" aria-labelledby="v-title">
    <p class="crumb"><a href="#/esquadrao">← Esquadrão</a></p>
    <header class="view-head unit-hero">
      ${medal(def, 'xl')}
      <div>
        <p class="kicker">${house.name}${def.crest ? ' · tem Crest' : ' · sem Crest'} · ${ROLES[role]}</p>
        <h1 id="v-title">${def.name}</h1>
        <p class="lead">${def.summary}</p>
      </div>
    </header>
    <div class="toolbar">
      <label class="field" for="u-role"><span class="field-label">Papel</span>
        <select id="u-role" data-bind="units.${id}.role" data-type="text">
          ${Object.entries(ROLES).map(([k, v]) => html`<option value="${k}" ${k === role ? 'selected' : ''}>${v}</option>`)}
        </select>
      </label>
      ${def.recruit && def.recruit.kind !== 'auto' ? html`<label class="toggle" for="u-rec">
        <input id="u-rec" type="checkbox" data-bind="units.${id}.recruited" data-type="bool" ${st.recruited ? 'checked' : ''}>
        <span>Já está no meu exército</span></label>` : ''}
      ${def.recruit?.kind === 'student' || id === 'edelgard' ? supportSelect(`u-sup`, `units.${id}.support`, st.support) : ''}
    </div>
    ${def.notes?.length ? html`<section class="card notes"><h2 class="card-title">Notas</h2><ul class="note-list">${def.notes.map((n) => html`<li>${md(n)}</li>`)}</ul></section>` : ''}
    ${rs && rs.state !== 'recruited' ? recruitBlock(def, state, rs) : ''}
    ${id === 'byleth' ? trainingTable(state, currentNotes(state.chapter)) : ''}
    ${recruited || id === 'byleth' ? html`${planCard(def, st)}<div class="cols">${stateForm(def, st)}${masteryList(def, st)}</div>` : planCard(def, st)}
    <div class="cols">${learnCard(def, st)}${likesCard(def)}</div>
    <section class="card">
      <h2 class="card-title">Anotações</h2>
      <label class="field block" for="u-note"><span class="field-label">Suas notas sobre ${def.name} (ficam neste aparelho)</span>
        <textarea id="u-note" rows="3" data-bind="units.${id}.note" data-type="text">${st.note ?? ''}</textarea></label>
    </section>
  </section>`;
}

