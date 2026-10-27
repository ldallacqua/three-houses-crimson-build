// The page: hash routes, one delegated listener for every form field and button, and the
// re-render after each change. State is saved on every change.

import { load, save, persist, setPath, getPath, parseImport, snapshotState, freshState } from './store.js';
import { createSync, endpoint } from './sync.js';
import { RANKS } from '../data/skills.js';
import { UNIT_BY_ID } from '../data/units.js';
import { BUILD_BY_ID } from '../data/builds.js';
import { chapterLabel } from './views/ui.js';
import { currentNotes } from './seal.js';
import { parseDate, monthOfChapter, reviewStatus } from './logic.js';
import { summaryMarkdown } from './summary.js';
import { initSelects } from './controls/select.js';
import { initTooltips, hide as hideTooltip } from './controls/tooltip.js';
import { initDialog, confirmDialog, chooseDialog } from './controls/dialog.js';
import { painel } from './views/painel.js';
import { atualizar } from './views/atualizar.js';
import { esquadrao } from './views/esquadrao.js';
import { unidade } from './views/unidade.js';
import { recrutamento } from './views/recrutamento.js';
import { capitulos } from './views/capitulos.js';
import { paralogues } from './views/paralogues.js';
import { classes } from './views/classes.js';
import { mosteiro } from './views/mosteiro.js';
import { dados } from './views/dados.js';
import { builds } from './views/builds.js';
import { itens } from './views/itens.js';

const ROUTES = {
  painel: { view: painel, title: 'Painel' },
  atualizar: { view: atualizar, title: 'Atualizar' },
  esquadrao: { view: esquadrao, title: 'Esquadrão' },
  itens: { view: itens, title: 'Itens' },
  unidade: { view: unidade, title: (id) => UNIT_BY_ID[id]?.name ?? 'Unidade', tab: 'esquadrao' },
  recrutamento: { view: recrutamento, title: 'Recrutamento' },
  capitulos: { view: capitulos, title: 'Capítulos' },
  paralogues: { view: paralogues, title: 'Paralogues' },
  classes: { view: classes, title: 'Classes' },
  mosteiro: { view: mosteiro, title: 'Mosteiro' },
  dados: { view: dados, title: 'Dados' },
  builds: { view: builds, title: 'Builds' },
};

const main = document.getElementById('main');
const chip = document.getElementById('chapter-chip');
const reviewBadge = document.getElementById('review-badge');
const buildName = document.getElementById('build-name');
const toastEl = document.getElementById('toast');
let state = load();
let lastRoute = '';

function route() {
  const [name = 'painel', arg] = location.hash.replace(/^#\/?/, '').split('/');
  // Nothing else makes sense before a build is picked: every route shows the picker, except Dados,
  // where a new device can bring its save down from the cloud.
  if (!state.build && name !== 'dados') return { name: 'builds', ...ROUTES.builds };
  return ROUTES[name] ? { name, arg, ...ROUTES[name] } : { name: 'painel', ...ROUTES.painel };
}

function toast(message) {
  toastEl.querySelector('.toast-text').textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function render({ keepFocus = true } = {}) {
  const r = route();
  const key = `${r.name}/${r.arg ?? ''}`;
  const changedRoute = key !== lastRoute;
  const focusId = keepFocus && !changedRoute ? document.activeElement?.id : null;
  const scroll = changedRoute ? 0 : window.scrollY;
  // Sections the reader opened stay open when the same page draws again.
  const opened = changedRoute ? [] : [...main.querySelectorAll('details[open][id]')].map((d) => d.id);

  hideTooltip();
  main.innerHTML = r.view(state, r.arg).toString();
  for (const id of opened) document.getElementById(id)?.setAttribute('open', '');
  main.classList.toggle('enter', changedRoute);
  document.title = `${typeof r.title === 'function' ? r.title(r.arg) : r.title} · Crimson Flower`;
  document.body.classList.toggle('picking', !state.build);
  buildName.textContent = BUILD_BY_ID[state.build]?.name ?? 'escolha a sua build';
  for (const a of document.querySelectorAll('.tabs a')) {
    const on = a.dataset.route === (r.tab ?? r.name);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  const pending = reviewStatus(state).pending.length;
  reviewBadge.hidden = !pending;
  reviewBadge.textContent = String(pending);
  reviewBadge.title = pending ? `${pending} para conferir neste capítulo` : '';
  const notes = currentNotes(state.chapter);
  chip.textContent = `${chapterLabel(state.chapter)}${state.date ? ` · ${state.date}` : ''}`;
  chip.title = notes?.title ?? '';
  if (changedRoute) {
    window.scrollTo(0, 0);
    if (r.arg && r.name === 'capitulos') document.getElementById(`cap-${r.arg}`)?.scrollIntoView();
    if (lastRoute) main.focus({ preventScroll: true });
    // Keep the active tab in view on narrow screens without moving the page.
    const active = document.querySelector('.tabs a[aria-current]');
    if (active) active.parentElement.scrollLeft = active.offsetLeft - (active.parentElement.clientWidth - active.offsetWidth) / 2;
  } else {
    window.scrollTo(0, scroll);
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
  }
  lastRoute = key;
}

function commit(message) {
  if (!save(state)) toast('Não deu para salvar neste navegador (armazenamento bloqueado).');
  else if (message) toast(message);
  try {
    sync.changed();
  } catch { /* the cloud never stops the page */ }
  render();
}

// The save in the cloud, once the master password was typed on this device (Dados).
const sync = createSync({
  storage: localStorage,
  fetch: (...args) => fetch(...args),
  url: endpoint(),
  getState: () => state,
  adopt: (next) => {
    state = next;
    persist(state);
    render();
  },
  ask: chooseDialog,
  notify: (message) => toast(message),
  // The status shows on Dados; redraw it there, unless that would wipe a field being typed in.
  onChange: () => {
    if (route().name === 'dados' && !document.activeElement?.matches('input[type="text"], input[type="password"]')) render();
  },
});

const cloudNote = () => (sync.info().on ? ' A nuvem também passa a ter este save; o anterior fica no histórico dela.' : '');

function coerce(el) {
  const type = el.dataset.type;
  if (type === 'bool') return el.checked;
  if (type === 'int') {
    const n = Number.parseInt(el.value, 10);
    if (!Number.isFinite(n)) return null;
    // Typing is not held to min/max by the browser; keep what is saved inside the field's range.
    const min = el.min === '' ? -Infinity : Number(el.min);
    const max = el.max === '' ? Infinity : Number(el.max);
    return Math.min(max, Math.max(min, n));
  }
  if (type === 'rank') return RANKS.includes(el.value) ? el.value : null;
  return el.value;
}

async function setChapter(chapter) {
  if (chapter === state.chapter) return;
  if (chapter > state.chapter && !(await confirmDialog({
    title: `Ir para ${chapterLabel(chapter)}?`,
    body: 'As notas lacradas até esse capítulo vão abrir. Elas podem mostrar o que acontece nesse mês.',
    confirm: 'Abrir as notas',
    cancel: 'Ainda não',
  }))) {
    render();
    return;
  }
  state.chapter = chapter;
  // A date from another month would put the wrong birthdays on the overview.
  if (parseDate(state.date)?.month !== monthOfChapter(chapter)) state.date = '';
  commit(`Agora em ${chapterLabel(chapter)}. Confira o esquadrão na aba Atualizar.`);
}

function download(name, textContent, type) {
  const url = URL.createObjectURL(new Blob([textContent], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copy(textContent) {
  try {
    await navigator.clipboard.writeText(textContent);
    return true;
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: textContent });
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

// Game data of a unit: changing any of it means the unit was just checked against the game.
const UNIT_DATA = /^units\.([\w-]+)\.(level|cls|ranks|stats|support|recruited|mastered)\b/;

function markReviewed(path) {
  const id = UNIT_DATA.exec(path)?.[1];
  if (id) state.reviewed[id] = state.chapter;
}

const actions = {
  'advance-chapter': () => setChapter(state.chapter + 1),
  reviewed: (btn) => {
    state.reviewed[btn.dataset.unit] = state.chapter;
    commit();
  },
  'review-all': () => {
    for (const u of reviewStatus(state).pending) state.reviewed[u.id] = state.chapter;
    commit('Tudo conferido neste capítulo.');
  },
  export: () => {
    const day = new Date().toISOString().slice(0, 10);
    download(`fe3h-crimson-${day}.json`, JSON.stringify(state, null, 2), 'application/json');
    toast('Backup exportado.');
  },
  'copy-summary': async () => {
    toast((await copy(summaryMarkdown(state))) ? 'Resumo copiado. Cole no chat.' : 'Não deu para copiar.');
  },
  'choose-build': (btn) => {
    const build = BUILD_BY_ID[btn.dataset.build];
    if (!build) return;
    state.build = build.id;
    if (location.hash !== '#/painel') history.replaceState(null, '', '#/painel');
    commit(`Build ${build.name} escolhida.`);
  },
  // The author's Chapter 6 game, to see the page filled in.
  'load-sample': async () => {
    const ok = !state.updated || await confirmDialog({
      title: 'Abrir o save de exemplo?',
      body: `Tudo o que você marcou neste aparelho será substituído pelo save de exemplo (Cap. 6). Exporte um backup antes se quiser guardar.${cloudNote()}`,
      confirm: 'Substituir',
      danger: true,
    });
    if (!ok) return;
    state = snapshotState();
    if (location.hash !== '#/painel') history.replaceState(null, '', '#/painel');
    commit('Save de exemplo aberto. Para começar o seu, use Dados → Recomeçar do Cap. 1.');
  },
  'reset-fresh': async () => {
    const ok = await confirmDialog({
      title: 'Recomeçar do Cap. 1?',
      body: `Tudo o que você marcou neste aparelho será apagado e o guia volta ao começo, com a escolha de build. Exporte um backup antes se quiser guardar.${cloudNote()}`,
      confirm: 'Recomeçar',
      danger: true,
    });
    if (!ok) return;
    state = freshState();
    commit('Recomeçado do Cap. 1.');
  },
  'sync-now': async () => {
    await sync.pull();
    const { status } = sync.info();
    if (status === 'idle') toast('Sincronizado.');
  },
  'sync-off': async () => {
    const ok = await confirmDialog({
      title: 'Desconectar este aparelho?',
      body: 'O save continua aqui e na nuvem, mas as mudanças deste aparelho param de subir até você digitar a senha de novo.',
      confirm: 'Desconectar',
    });
    if (!ok) return;
    sync.disconnect();
    toast('Este aparelho saiu da sincronização.');
  },
  'sync-remote': () => sync.resolve('remote'),
  'sync-local': () => sync.resolve('local'),
  'sync-undo': async () => {
    const ok = await confirmDialog({
      title: 'Voltar ao save anterior deste aparelho?',
      body: 'É o save que estava aqui antes de vir o da nuvem. Ele volta para este aparelho e sobe para a nuvem.',
      confirm: 'Voltar',
    });
    if (!ok) return;
    const previous = sync.undo();
    if (!previous) return;
    state = previous;
    commit('Save anterior restaurado.');
  },
  // The − and + beside a number field.
  step: (btn) => {
    const input = document.getElementById(btn.dataset.for);
    if (!input) return;
    const min = Number(input.min || 0);
    const max = Number(input.max || 99);
    const now = Number.parseInt(input.value, 10);
    // From an empty field, either button starts at the lowest value.
    const next = Number.isFinite(now) ? Math.min(max, Math.max(min, now + Number(btn.dataset.step))) : min;
    if (next === now) return;
    input.value = String(next);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
};

main.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (btn && actions[btn.dataset.act]) actions[btn.dataset.act](btn);
});

main.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.bind) {
    const value = coerce(el);
    if (el.dataset.bind === 'date' && value) {
      const date = parseDate(value);
      if (!date) {
        toast('Use mês/dia, por exemplo 9/7.');
        render();
        return;
      }
      const month = monthOfChapter(state.chapter);
      if (month && date.month !== month) toast(`${value.trim()} não é do mês do ${chapterLabel(state.chapter)}: confira o capítulo.`);
    }
    setPath(state, el.dataset.bind, typeof value === 'string' ? value.trim() : value);
    markReviewed(el.dataset.bind);
    commit();
  } else if (el.dataset.bindList) {
    const list = new Set(getPath(state, el.dataset.bindList) ?? []);
    if (el.checked) list.add(el.value);
    else list.delete(el.value);
    setPath(state, el.dataset.bindList, [...list]);
    markReviewed(el.dataset.bindList);
    commit();
  } else if (el.dataset.check) {
    if (el.checked) state.checks[el.dataset.check] = true;
    else delete state.checks[el.dataset.check];
    commit();
  } else if (el.dataset.paralogue) {
    if (el.checked) state.paralogues[el.dataset.paralogue] = true;
    else delete state.paralogues[el.dataset.paralogue];
    commit();
  } else if (el.dataset.act === 'set-chapter') {
    setChapter(Number(el.value));
  } else if (el.dataset.act === 'import') {
    const file = el.files?.[0];
    if (!file) return;
    try {
      state = parseImport(await file.text());
      commit('Backup importado.');
    } catch (err) {
      toast(err.message);
    }
  }
});

main.addEventListener('submit', async (e) => {
  const form = e.target.closest('form[data-act="sync-connect"]');
  if (!form) return;
  e.preventDefault();
  const input = form.querySelector('input[type="password"]');
  const button = form.querySelector('button');
  if (!input.value) return;
  button.disabled = true;
  try {
    await sync.connect(input.value);
    // Lined up with the cloud: on to the overview (or the build picker, if the save has no build).
    // A choice still to make or an error stays here, where Dados shows it.
    if (sync.info().status === 'idle') {
      location.hash = '#/painel';
      return;
    }
  } catch (err) {
    toast(err.message);
  }
  render();
});

window.addEventListener('hashchange', () => render({ keepFocus: false }));

// Coming back to the page or to the network: bring down what another device saved.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') sync.pull();
});
window.addEventListener('online', () => sync.pull());

// Another tab changed the state: follow it.
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('fe3h-crimson-build')) {
    state = load();
    render();
  }
});

// A portrait that does not load leaves the initial drawn under it.
document.addEventListener('error', (e) => {
  if (e.target instanceof HTMLImageElement && e.target.closest('.avatar')) e.target.remove();
}, true);

initSelects();
initTooltips();
initDialog();
render({ keepFocus: false });
sync.pull();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
