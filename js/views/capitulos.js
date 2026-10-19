// Chapter notes, one notebook page per chapter. Pages past the current chapter stay sealed.

import { html, md } from '../html.js';
import { FACULTY_BY_ID } from '../../data/faculty.js';
import { NOTE_KEYS, openNotes, chapterOfKey, keyForChapter } from '../seal.js';
import { taskItem, noteKeyLabel } from './ui.js';

function away(note) {
  if (!note.away?.length) return html`<p class="away ok">Todos os instrutores de Faculty Training disponíveis.</p>`;
  if (note.away.includes('*')) return html`<p class="away">Sem Faculty Training com NPCs neste período.</p>`;
  return html`<p class="away">Fora do Faculty Training: ${note.away.map((id) => FACULTY_BY_ID[id]?.name ?? id).join(', ')}.</p>`;
}

function page(note, state, current) {
  return html`<article class="notebook ${current ? 'current' : ''}" id="cap-${note.key}">
    <header class="nb-head">
      <p class="nb-kicker">${noteKeyLabel(note.key)}</p>
      <h2>${note.title}</h2>
    </header>
    <p class="nb-intro">${md(note.intro)}</p>
    ${away(note)}
    ${note.tasks?.length ? html`<h3>Lista</h3><ul class="checks">
      ${note.tasks.map((t) => taskItem('cc', t, state, chapterOfKey(note.key)))}
    </ul>` : ''}
    ${note.battle ? html`<h3>${note.battle.title}</h3><ul class="nb-points">${note.battle.points.map((p) => html`<li>${md(p)}</li>`)}</ul>` : ''}
    ${note.paralogues?.length ? html`<h3>Paralogues desta parte</h3><div class="table-wrap"><table class="data light">
      <thead><tr><th scope="col">Paralogue</th><th scope="col">Precisa</th><th scope="col">Destaque</th></tr></thead>
      <tbody>${note.paralogues.map((p) => html`<tr><th scope="row">${p.name}</th><td>${p.units}</td><td>${p.reward}</td></tr>`)}</tbody>
    </table></div>` : ''}
    ${note.notes?.length ? html`<h3>Notas</h3><ul class="nb-points">${note.notes.map((n) => html`<li>${md(n)}</li>`)}</ul>` : ''}
    ${note.spoilers?.map((s) => html`<details class="spoiler"><summary>${s.label}</summary><p>${md(s.text)}</p></details>`)}
  </article>`;
}

function sealed(key, state, isNext) {
  const ch = chapterOfKey(key);
  return html`<article class="notebook sealed" id="cap-${key}">
    <header class="nb-head"><p class="nb-kicker">${noteKeyLabel(key)}</p><h2>Lacrado</h2></header>
    <p>Estas notas abrem quando você chegar lá, para não mostrar nada à frente.</p>
    ${isNext ? html`<button type="button" class="btn" data-act="advance-chapter">Cheguei ${ch >= 13 ? 'à Parte 2' : `ao Cap. ${ch}`}</button>` : ''}
  </article>`;
}

export function capitulos(state) {
  const currentKey = keyForChapter(state.chapter);
  const firstSealed = NOTE_KEYS.find((k) => !openNotes(k, state.chapter));
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">Do Cap. 6 em diante</p>
      <h1 id="v-title">Capítulos</h1>
      <p class="lead">As notas de cada mês ficam lacradas até você marcar que chegou lá. Os capítulos anteriores ao 6 não são cobertos.</p>
    </header>
    <nav class="chapter-jump" aria-label="Capítulos">${NOTE_KEYS.map((k) => html`<a href="#/capitulos/${k}" class="${k === currentKey ? 'on' : ''} ${openNotes(k, state.chapter) ? '' : 'locked'}">${k === 'p2' ? 'P2' : k}</a>`)}</nav>
    <div class="notebooks">
      ${NOTE_KEYS.map((k) => {
        const note = openNotes(k, state.chapter);
        if (!note) return sealed(k, state, k === firstSealed);
        return page(note, state, k === currentKey);
      })}
    </div>
  </section>`;
}
