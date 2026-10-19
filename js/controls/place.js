// Puts a floating element (a select's list, a tooltip) next to the element it belongs to: below
// when it fits, above when there is more room there, and always inside the viewport.

const MARGIN = 8;

/**
 * @param {Element} anchor
 * @param {HTMLElement} el  position: fixed and already shown
 * @param {object} [opts]
 * @param {number} [opts.gap]  space between the anchor and the element
 * @param {boolean} [opts.matchWidth]  at least as wide as the anchor
 * @param {number} [opts.maxHeight]
 * @param {'start' | 'center'} [opts.align]
 * @param {boolean} [opts.follow]  only move it (the page scrolled); keep its side and size
 */
export function place(anchor, el, { gap = 6, matchWidth = false, maxHeight = Infinity, align = 'start', follow = false } = {}) {
  const r = anchor.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  let up = el.dataset.side === 'top';

  if (!follow) {
    if (matchWidth) el.style.minWidth = `${Math.round(r.width)}px`;
    el.style.maxWidth = `${vw - MARGIN * 2}px`;
    el.style.maxHeight = '';
    const below = vh - r.bottom - gap - MARGIN;
    const above = r.top - gap - MARGIN;
    const natural = Math.min(el.offsetHeight, maxHeight);
    up = natural > below && above > below;
    const room = Math.max(96, Math.min(up ? above : below, maxHeight));
    if (natural >= room || Number.isFinite(maxHeight)) el.style.maxHeight = `${Math.floor(room)}px`;
  }

  const h = el.offsetHeight;
  const w = el.offsetWidth;
  const top = up ? r.top - gap - h : r.bottom + gap;
  const wanted = align === 'center' ? r.left + r.width / 2 - w / 2 : r.left;
  const left = Math.max(MARGIN, Math.min(wanted, vw - w - MARGIN));
  el.style.top = `${Math.round(top)}px`;
  el.style.left = `${Math.round(left)}px`;
  el.dataset.side = up ? 'top' : 'bottom';
}
