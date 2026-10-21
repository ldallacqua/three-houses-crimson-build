// The build picker: one card per plan, with who made it and what it is, the way a build site lists
// them. Until the player picks one, every route shows this page; later it opens from the header.

import { html } from '../html.js';
import { BUILDS } from '../../data/builds.js';
import { UNIT_BY_ID } from '../../data/units.js';
import { SNAPSHOT_LABEL } from '../../data/snapshot.js';
import { avatar, select, chapterLabel, icon } from './ui.js';

const CHAPTERS = Array.from({ length: 17 }, (_, i) => i + 1);

function card(build, state) {
  const chosen = state.build === build.id;
  const lead = UNIT_BY_ID[build.lead];
  return html`<article class="build-card${chosen ? ' chosen' : ''}" aria-labelledby="b-${build.id}">
    <div class="build-banner" aria-hidden="true">
      ${avatar(lead, 'xl')}
      <div class="build-faces">${build.faces.filter((id) => id !== build.lead).map((id) => avatar(UNIT_BY_ID[id], 'md'))}</div>
    </div>
    <div class="build-body">
      <p class="kicker">${build.route} · ${build.house}</p>
      <h2 class="build-name" id="b-${build.id}">${build.name}</h2>
      <p class="build-tagline">${build.tagline}</p>
      <p class="build-by">por <strong>${build.author}</strong> · atualizada em ${build.updated}</p>
      <p class="build-pitch">${build.pitch}</p>
      <dl class="build-facts">${build.facts.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
      <ul class="build-points">${build.highlights.map((h) => html`<li>${icon('check')}<span>${h}</span></li>`)}</ul>
      <div class="btn-row">${chosen
        ? html`<span class="badge ok">${icon('check')}Build atual</span><a class="btn" href="#/painel">Ir para o painel ${icon('arrow')}</a>`
        : html`<button type="button" class="btn primary" data-act="choose-build" data-build="${build.id}">Usar esta build ${icon('arrow')}</button>`}</div>
    </div>
  </article>`;
}

/** Before the first pick: where the player is, so the right notes open. */
function startCard(state) {
  return html`<section class="card start-card" aria-labelledby="b-start">
    <h2 class="card-title" id="b-start">Seu jogo</h2>
    <p class="card-lead">O guia começa no Cap. 1. Se você já passou dele, escolha o capítulo em que está: as notas até ele abrem e as seguintes continuam lacradas.</p>
    <div class="form-row">
      ${select({
        id: 'b-chapter', label: 'Capítulo atual', value: String(state.chapter), cls: 'grow',
        options: CHAPTERS.map((c) => ({ value: String(c), label: chapterLabel(c) })),
        attrs: html`data-act="set-chapter"`,
      })}
    </div>
    <p class="hint">Quer ver o guia preenchido antes de começar o seu? <button type="button" class="link-btn" data-act="load-sample">Abrir com o save de exemplo do autor (${SNAPSHOT_LABEL})</button>.</p>
  </section>`;
}

export function builds(state) {
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Fire Emblem: Three Houses</p>
      <h1 id="v-title">${state.build ? 'Builds' : 'Escolha a sua build'}</h1>
      <p class="lead">Uma build é o plano de uma campanha inteira: quem entra no exército, as classes de cada uma, a ordem de recrutamento, quem fica com cada item e o que fazer em cada capítulo. O resto do site segue a build escolhida.</p>
    </header>
    ${state.build ? '' : startCard(state)}
    <div class="build-grid">${BUILDS.map((b) => card(b, state))}</div>
    <p class="hint">Por enquanto há uma build. Seu progresso fica salvo neste aparelho e não depende dela.</p>
  </section>`;
}
