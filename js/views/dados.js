// Settings and backup: chapter, difficulty, the cloud save, export/import, the summary for a chat,
// sources.

import { html } from '../html.js';
import { SNAPSHOT_LABEL } from '../../data/snapshot.js';
import { BUILD_BY_ID } from '../../data/builds.js';
import { chapterLabel, select } from './ui.js';
import { syncInfo } from '../sync.js';

const SOURCES = [
  ['Recrutamento e efeito do suporte', 'https://www.fe3h.com/recruitment'],
  ['Classes e maestrias', 'https://www.fe3h.com/classes'],
  ['Classes da DLC', 'https://www.fe3h.com/classes/dlc'],
  ['Faculty Training e ausências', 'https://serenesforest.net/three-houses/monastery/faculty-training/'],
  ['XP por rank de skill', 'https://fireemblemwiki.org/wiki/Skill_experience'],
  ['Paralogues', 'https://www.fe3h.com/paralogues'],
  ['Pegasus Knight / Falcon Knight / Wyvern Lord', 'https://fireemblemwiki.org/wiki/Falcon_Knight'],
  ['Abyssian Exam Pass', 'https://fireemblemwiki.org/wiki/Abyssian_Exam_Pass'],
  ['Thyrsus, Fetters of Dromi, Luín, Vajra-Mushti', 'https://fireemblemwiki.org/wiki/Fetters_of_Dromi'],
  ['White Heron Cup', 'https://gameranx.com/features/id/178157/article/fire-emblem-three-houses-how-to-unlock-the-missable-dancer-class-white-heron-cup-guide/'],
  ['Personagens (presentes, chás, magias)', 'https://www.fe3h.com/characters'],
];

const STATUS = {
  idle: ['ok', 'Sincronizado'],
  busy: ['info', 'Sincronizando…'],
  offline: ['warn', 'Sem conexão: as mudanças ficam neste aparelho e sobem quando a internet voltar.'],
  error: ['miss', ''],
  conflict: ['warn', 'Este aparelho e a nuvem mudaram. Escolha qual save manter; o outro fica guardado como cópia.'],
};

const when = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function syncCard(sync = syncInfo()) {
  if (!sync.on) {
    return html`<section class="card sync-card">
      <h2 class="card-title">Sincronizar entre aparelhos</h2>
      <p class="card-lead">Guarda o save num banco na nuvem e abre igual no PC, no celular ou em outro navegador. Por enquanto é só para quem mantém o site: pede a senha mestre, uma vez em cada aparelho.</p>
      <form class="form-row sync-form" data-act="sync-connect">
        <label class="field grow" for="d-sync-pass"><span class="field-label">Senha mestre</span>
          <input id="d-sync-pass" name="password" type="password" autocomplete="current-password" required></label>
        <button type="submit" class="btn primary">Conectar</button>
      </form>
      <p class="hint">Sem a senha, tudo continua só neste navegador.</p>
    </section>`;
  }
  const [tone, label] = STATUS[sync.status] ?? STATUS.idle;
  return html`<section class="card sync-card">
    <h2 class="card-title">Sincronizar entre aparelhos</h2>
    <p class="sync-status ${tone}" role="status"><span class="sync-dot" aria-hidden="true"></span><span>${sync.status === 'error' ? sync.message : label}${sync.status === 'idle' && sync.at ? ` · ${when(sync.at)}` : ''}</span></p>
    ${sync.status === 'conflict' && sync.conflict ? html`<div class="btn-row">
      <button type="button" class="btn primary" data-act="sync-remote">Usar o da nuvem (Cap. ${sync.conflict.state?.chapter ?? '?'})</button>
      <button type="button" class="btn" data-act="sync-local">Manter o deste aparelho</button>
    </div>` : ''}
    <p class="card-lead">Cada mudança sobe sozinha; ao abrir o site, ele traz o que você salvou em outro aparelho.</p>
    <div class="btn-row">
      <button type="button" class="btn" data-act="sync-now">Sincronizar agora</button>
      <button type="button" class="btn ghost" data-act="sync-off">Desconectar este aparelho</button>
    </div>
    ${sync.backup ? html`<p class="hint">Este aparelho guardou o save que tinha antes de pegar o da nuvem. <button type="button" class="link-btn" data-act="sync-undo">Voltar para ele</button></p>` : ''}
  </section>`;
}

export function dados(state) {
  const chapters = Array.from({ length: 17 }, (_, i) => i + 1);
  const build = BUILD_BY_ID[state.build];
  const cloud = syncInfo().on;
  return html`<section class="view" aria-labelledby="v-title">
    <header class="view-head">
      <p class="kicker">${cloud ? 'Salvo neste aparelho e na nuvem' : 'Salvo neste aparelho'}</p>
      <h1 id="v-title">Dados</h1>
      <p class="lead">${cloud ? 'O save fica neste navegador e na nuvem, e abre igual nos aparelhos conectados. O backup em JSON continua valendo como cópia.' : 'O guia guarda tudo no navegador deste aparelho. Para abrir o mesmo save em outro aparelho, use a sincronização ou exporte um backup.'}</p>
    </header>
    <div class="cols">
      <section class="card">
        <h2 class="card-title">Campanha</h2>
        <p class="build-line">Build: <strong>${build?.name ?? 'nenhuma'}</strong>${build ? html` <span class="muted">por ${build.author}</span>` : ''} · <a href="#/builds">trocar</a></p>
        <div class="form-row">
          ${select({
            id: 'd-chapter', label: 'Capítulo', value: String(state.chapter), cls: 'grow',
            options: chapters.map((c) => ({ value: String(c), label: chapterLabel(c), hint: c > state.chapter ? 'lacrado' : '' })),
            attrs: html`data-act="set-chapter"`,
          })}
          <label class="field" for="d-date"><span class="field-label">Data (mês/dia)</span>
            <input id="d-date" type="text" inputmode="numeric" value="${state.date}" data-bind="date" data-type="text" placeholder="9/7"></label>
        </div>
        <div class="form-row">
          ${select({
            id: 'd-diff', label: 'Dificuldade', value: state.difficulty ?? '', cls: 'grow',
            options: [['', 'Não informada'], ['Normal', 'Normal'], ['Hard', 'Hard'], ['Maddening', 'Maddening']].map(([value, label]) => ({ value, label })),
            attrs: html`data-bind="difficulty" data-type="text"`,
          })}
          ${select({
            id: 'd-mode', label: 'Modo', value: state.mode ?? '', cls: 'grow',
            options: [['', 'Não informado'], ['Casual', 'Casual', 'unidades voltam após a batalha'], ['Classic', 'Classic', 'unidade caída se perde']].map(([value, label, hint]) => ({ value, label, hint })),
            attrs: html`data-bind="mode" data-type="text"`,
          })}
        </div>
        <p class="hint">O plano assume Normal ou Hard. Em Maddening as prioridades mudam (mais cura, menos risco); em Classic, Vengeance com HP baixo pede mais cuidado.</p>
      </section>
      <section class="card">
        <h2 class="card-title">Backup</h2>
        <div class="btn-row">
          <button type="button" class="btn primary" data-act="export">Exportar JSON</button>
          <label class="btn" for="d-import">Importar JSON</label>
          <input id="d-import" class="sr" type="file" accept="application/json,.json" data-act="import">
          <button type="button" class="btn" data-act="copy-summary">Copiar resumo para o chat</button>
        </div>
        <p class="hint">O resumo em Markdown traz nível, classe, ranks, recrutamento e checklist — cole numa conversa para revisar o plano ou atualizar o guia mestre.</p>
        <div class="btn-row danger-zone">
          <button type="button" class="btn ghost" data-act="load-sample">Abrir o save de exemplo (${SNAPSHOT_LABEL})</button>
          <button type="button" class="btn ghost" data-act="reset-fresh">Recomeçar do Cap. 1</button>
        </div>
        ${state.updated ? html`<p class="hint">Última alteração: ${new Date(state.updated).toLocaleString('pt-BR')}</p>` : ''}
      </section>
    </div>
    ${syncCard()}
    <section class="card">
      <h2 class="card-title">Fontes conferidas</h2>
      <p class="card-lead">Fatos do jogo vêm destas páginas; planos e prioridades são recomendação deste guia. O guia mestre completo está em <a href="https://github.com/ldallacqua/three-houses-crimson-build/blob/main/docs/guia-mestre.md">docs/guia-mestre.md</a>.</p>
      <ul class="sources">${SOURCES.map(([label, url]) => html`<li><a href="${url}" rel="noopener" target="_blank">${label}</a></li>`)}</ul>
    </section>
  </section>`;
}
