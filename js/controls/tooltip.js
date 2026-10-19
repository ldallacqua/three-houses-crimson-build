// Tooltips for anything with data-tip: on hover with a mouse, on keyboard focus, and on tap with
// a finger (title attributes never show on a phone). One shared element in the top layer.

import { place } from './place.js';

const DELAY = 220;
let tip;
let owner = null;
let timer = 0;
let pointer = 'mouse';

function show(target) {
  clearTimeout(timer);
  if (owner === target) return;
  hide();
  tip.textContent = target.dataset.tip;
  tip.showPopover();
  place(target, tip, { gap: 8, align: 'center' });
  target.setAttribute('aria-describedby', tip.id);
  owner = target;
}

export function hide() {
  clearTimeout(timer);
  if (!owner) return;
  owner.removeAttribute('aria-describedby');
  owner = null;
  if (tip.matches(':popover-open')) tip.hidePopover();
}

const targetOf = (e) => e.target.closest?.('[data-tip]');

export function initTooltips(root = document) {
  tip = document.getElementById('tip');
  if (!tip) return;

  root.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = targetOf(e);
    if (!t) return;
    clearTimeout(timer);
    timer = setTimeout(() => show(t), owner ? 0 : DELAY);
  });
  root.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = targetOf(e);
    if (t && !t.contains(e.relatedTarget)) {
      clearTimeout(timer);
      timer = setTimeout(hide, 80);
    }
  });
  root.addEventListener('pointerdown', (e) => {
    pointer = e.pointerType;
  });
  root.addEventListener('click', (e) => {
    const t = targetOf(e);
    if (!t) {
      hide();
      return;
    }
    if (pointer === 'mouse' || e.detail === 0) return;
    if (owner === t) hide();
    else show(t);
  });
  root.addEventListener('focusin', (e) => {
    const t = targetOf(e);
    if (t && t.matches(':focus-visible')) show(t);
  });
  root.addEventListener('focusout', (e) => {
    if (targetOf(e) === owner) hide();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && owner) hide();
  });
  window.addEventListener('scroll', hide, { capture: true, passive: true });
  window.addEventListener('hashchange', hide);
}
