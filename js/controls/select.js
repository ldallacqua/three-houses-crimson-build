// Selects drawn like the rest of the page. Each one is a button (role combobox) that opens a
// listbox in a popover, following the WAI-ARIA "select-only combobox" pattern: focus stays on the
// button and the highlighted option is announced through aria-activedescendant. The button holds
// the value and the data-bind attributes and fires `change` like a native <select>, so main.js
// handles both the same way. The markup comes from `select()` in views/ui.js.

import { place } from './place.js';

const MAX_HEIGHT = 340;
const TYPEAHEAD_MS = 700;
let typed = '';
let typedAt = 0;

const isOpen = (pop) => pop.matches(':popover-open');
const listOf = (trigger) => document.getElementById(trigger.getAttribute('aria-controls'));
const triggerOf = (pop) => document.querySelector(`.sel-trigger[aria-controls="${pop.id}"]`);
const optionsOf = (pop) => [...pop.querySelectorAll('[role="option"]:not([aria-disabled="true"])')];
const labelOf = (opt) => (opt.querySelector('.sel-opt-label') ?? opt).textContent.trim();

function setActive(trigger, pop, opt, { scroll = true } = {}) {
  for (const o of pop.querySelectorAll('.sel-opt.active')) o.classList.remove('active');
  if (!opt) {
    trigger.removeAttribute('aria-activedescendant');
    return;
  }
  opt.classList.add('active');
  trigger.setAttribute('aria-activedescendant', opt.id);
  if (scroll) opt.scrollIntoView({ block: 'nearest' });
}

function opened(trigger, pop) {
  trigger.setAttribute('aria-expanded', 'true');
  place(trigger, pop, { matchWidth: true, maxHeight: MAX_HEIGHT });
  const selected = pop.querySelector('[role="option"][aria-selected="true"]') ?? optionsOf(pop)[0];
  if (selected) {
    // Start with the chosen option in the middle of the list, like the game's menus.
    pop.scrollTop = selected.offsetTop - pop.clientHeight / 2 + selected.offsetHeight / 2;
    setActive(trigger, pop, selected, { scroll: false });
  }
}

function closed(trigger, pop) {
  trigger.setAttribute('aria-expanded', 'false');
  setActive(trigger, pop, null);
  delete pop.dataset.side;
}

function open(trigger) {
  const pop = listOf(trigger);
  if (!pop || isOpen(pop)) return;
  pop.showPopover();
  opened(trigger, pop);
}

function close(trigger) {
  const pop = listOf(trigger);
  if (!pop) return;
  if (isOpen(pop)) pop.hidePopover();
  closed(trigger, pop);
}

function choose(trigger, opt) {
  const pop = listOf(trigger);
  close(trigger);
  trigger.focus({ preventScroll: true });
  if (!opt || opt.dataset.value === trigger.value) return;
  trigger.value = opt.dataset.value;
  const shown = opt.querySelector('.sel-opt-main')?.cloneNode(true);
  if (shown) trigger.querySelector('.sel-value').replaceChildren(...shown.childNodes);
  for (const o of pop.querySelectorAll('[role="option"]')) o.setAttribute('aria-selected', String(o === opt));
  trigger.dispatchEvent(new Event('change', { bubbles: true }));
}

function typeahead(trigger, pop, key) {
  const opts = optionsOf(pop);
  const now = performance.now();
  typed = now - typedAt < TYPEAHEAD_MS ? typed + key.toLowerCase() : key.toLowerCase();
  typedAt = now;
  // Pressing the same letter again walks through the options that start with it.
  const repeat = [...typed].every((c) => c === typed[0]);
  const needle = repeat ? typed[0] : typed;
  const at = opts.indexOf(pop.querySelector('.sel-opt.active'));
  const start = repeat ? at + 1 : Math.max(at, 0);
  const hit = [...opts.slice(start), ...opts.slice(0, start)].find((o) => labelOf(o).toLowerCase().startsWith(needle));
  if (!hit) return;
  open(trigger);
  setActive(trigger, pop, hit);
}

function onKeydown(e) {
  const trigger = e.target.closest?.('.sel-trigger');
  if (!trigger || trigger.disabled) return;
  const pop = listOf(trigger);
  if (!pop) return;
  const shown = isOpen(pop);
  const opts = optionsOf(pop);
  const active = pop.querySelector('.sel-opt.active');
  const go = (n) => setActive(trigger, pop, opts[Math.max(0, Math.min(opts.length - 1, n))]);
  const at = opts.indexOf(active);
  const searching = typed && performance.now() - typedAt < TYPEAHEAD_MS;

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      e.preventDefault();
      if (!shown) open(trigger);
      else if (e.altKey) choose(trigger, active);
      else go(at + (e.key === 'ArrowDown' ? 1 : -1));
      return;
    case 'Home':
    case 'End':
      if (!shown) return;
      e.preventDefault();
      go(e.key === 'Home' ? 0 : opts.length - 1);
      return;
    case 'PageDown':
    case 'PageUp':
      if (!shown) return;
      e.preventDefault();
      go(at + (e.key === 'PageDown' ? 8 : -8));
      return;
    case 'Enter':
      e.preventDefault();
      if (shown) choose(trigger, active);
      else open(trigger);
      return;
    case ' ':
      if (searching) break;
      e.preventDefault();
      if (shown) choose(trigger, active);
      else open(trigger);
      return;
    case 'Escape':
      if (!shown) return;
      e.preventDefault();
      close(trigger);
      return;
    case 'Tab':
      if (shown) close(trigger);
      return;
    default:
  }
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    typeahead(trigger, pop, e.key);
  }
}

// A light-dismissed list closes on pointerdown, before the click on its own button arrives;
// remember it so that click does not open it again.
let closedByPointer = null;

export function initSelects(root = document) {
  root.addEventListener('keydown', onKeydown);
  // Space activates a button on keyup; the keydown above already handled it.
  root.addEventListener('keyup', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('.sel-trigger')) e.preventDefault();
  });

  root.addEventListener('pointerdown', (e) => {
    const trigger = e.target.closest?.('.sel-trigger');
    closedByPointer = trigger && isOpen(listOf(trigger)) ? trigger : null;
  });

  root.addEventListener('click', (e) => {
    const opt = e.target.closest?.('.sel-opt');
    if (opt) {
      if (opt.getAttribute('aria-disabled') !== 'true') choose(triggerOf(opt.closest('.sel-pop')), opt);
      return;
    }
    const trigger = e.target.closest?.('.sel-trigger');
    if (!trigger || trigger.disabled) return;
    if (closedByPointer === trigger) {
      closedByPointer = null;
      close(trigger);
      return;
    }
    const pop = listOf(trigger);
    if (pop && isOpen(pop)) close(trigger);
    else open(trigger);
  });

  root.addEventListener('pointermove', (e) => {
    const opt = e.target.closest?.('.sel-opt');
    if (!opt || opt.classList.contains('active') || opt.getAttribute('aria-disabled') === 'true') return;
    const pop = opt.closest('.sel-pop');
    setActive(triggerOf(pop), pop, opt, { scroll: false });
  });

  // Closed some other way (Escape, a click elsewhere, another popover opening).
  root.addEventListener('toggle', (e) => {
    const pop = e.target;
    if (!pop.classList?.contains('sel-pop') || e.newState !== 'closed') return;
    const trigger = triggerOf(pop);
    if (trigger && trigger.getAttribute('aria-expanded') === 'true') closed(trigger, pop);
  }, true);

  const follow = (e) => {
    for (const pop of document.querySelectorAll('.sel-pop:popover-open')) {
      if (e?.target instanceof Node && pop.contains(e.target)) continue;
      const trigger = triggerOf(pop);
      if (trigger) place(trigger, pop, { matchWidth: true, maxHeight: MAX_HEIGHT, follow: e?.type === 'scroll' });
    }
  };
  window.addEventListener('scroll', follow, { capture: true, passive: true });
  window.addEventListener('resize', follow, { passive: true });
}
