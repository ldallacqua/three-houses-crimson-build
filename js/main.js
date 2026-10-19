// The page: hash routes, one delegated listener for every form field and button, and the
// re-render after each change. State is saved on every change.

import { load, save, setPath, getPath, parseImport, snapshotState } from './store.js';
import { RANKS } from '../data/skills.js';
import { UNIT_BY_ID } from '../data/units.js';
import { chapterLabel } from './views/ui.js';
import { currentNotes } from './seal.js';
import { parseDate, monthOfChapter } from './logic.js';
import { summaryMarkdown } from './summary.js';
import { painel } from './views/painel.js';
import { esquadrao } from './views/esquadrao.js';
import { unidade } from './views/unidade.js';
import { recrutamento } from './views/recrutamento.js';
import { capitulos } from './views/capitulos.js';
import { paralogues } from './views/paralogues.js';
import { classes } from './views/classes.js';
import { mosteiro } from './views/mosteiro.js';
import { dados } from './views/dados.js';

const ROUTES = {
  painel: { view: painel, title: 'Painel' },
  esquadrao: { view: esquadrao, title: 'Esquadrão' },
  unidade: { view: unidade, title: (id) => UNIT_BY_ID[id]?.name ?? 'Unidade', tab: 'esquadrao' },
  recrutamento: { view: recrutamento, title: 'Recrutamento' },
  capitulos: { view: capitulos, title: 'Capítulos' },
  paralogues: { view: paralogues, title: 'Paralogues' },
  classes: { view: classes, title: 'Classes' },
  mosteiro: { view: mosteiro, title: 'Mosteiro' },
  dados: { view: dados, title: 'Dados' },
};

const main = document.getElementById('main');
const chip = document.getElementById('chapter-chip');
const toastEl = document.getElementById('toast');
let state = load();
let lastRoute = '';

function route() {
  const [name = 'painel', arg] = location.hash.replace(/^#\/?/, '').split('/');
  return ROUTES[name] ? { name, arg, ...ROUTES[name] } : { name: 'painel', ...ROUTES.painel };
}

function toast(message) {
  toastEl.textContent = message;
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

  main.innerHTML = r.view(state, r.arg).toString();
  main.classList.toggle('enter', changedRoute);
  document.title = `${typeof r.title === 'function' ? r.title(r.arg) : r.title} · Crimson Flower`;
  for (const a of document.querySelectorAll('.tabs a')) {
    const on = a.dataset.route === (r.tab ?? r.name);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
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
  render();
}

function coerce(el) {
  const type = el.dataset.type;
  if (type === 'bool') return el.checked;
  if (type === 'int') {
    const n = Number.parseInt(el.value, 10);
    return Number.isFinite(n) ? n : null;
  }
  if (type === 'rank') return RANKS.includes(el.value) ? el.value : null;
  return el.value;
}

function setChapter(chapter) {
  if (chapter === state.chapter) return;
  if (chapter > state.chapter && !confirm(`Abrir as notas até ${chapterLabel(chapter)}? Elas podem mostrar o que vem pela frente nesse mês.`)) {
    render();
    return;
  }
  state.chapter = chapter;
  // A date from another month would put the wrong birthdays on the overview.
  if (parseDate(state.date)?.month !== monthOfChapter(chapter)) state.date = '';
  commit(`Agora em ${chapterLabel(chapter)}.`);
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

const actions = {
  'advance-chapter': () => setChapter(state.chapter + 1),
  export: () => {
    const day = new Date().toISOString().slice(0, 10);
    download(`fe3h-crimson-${day}.json`, JSON.stringify(state, null, 2), 'application/json');
    toast('Backup exportado.');
  },
  'copy-summary': async () => {
    toast((await copy(summaryMarkdown(state))) ? 'Resumo copiado. Cole no chat.' : 'Não deu para copiar.');
  },
  'reset-snapshot': () => {
    if (!confirm('Voltar ao snapshot do guia mestre? Tudo o que você marcou neste aparelho será substituído.')) return;
    state = snapshotState();
    commit('Snapshot restaurado.');
  },
};

main.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (btn && actions[btn.dataset.act]) actions[btn.dataset.act]();
});

main.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.bind) {
    const value = coerce(el);
    if (el.dataset.bind === 'date' && value && !/^\d{1,2}\/\d{1,2}$/.test(value.trim())) {
      toast('Use mês/dia, por exemplo 9/7.');
      return;
    }
    setPath(state, el.dataset.bind, typeof value === 'string' ? value.trim() : value);
    commit();
  } else if (el.dataset.bindList) {
    const list = new Set(getPath(state, el.dataset.bindList) ?? []);
    if (el.checked) list.add(el.value);
    else list.delete(el.value);
    setPath(state, el.dataset.bindList, [...list]);
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

window.addEventListener('hashchange', () => render({ keepFocus: false }));

// Another tab changed the state: follow it.
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('fe3h-crimson-build')) {
    state = load();
    render();
  }
});

render({ keepFocus: false });

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
