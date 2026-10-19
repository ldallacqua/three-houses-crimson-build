// Opens the sealed chapter notes, but only up to the chapter the player has reached.

import { SEALED } from '../data/chapters.js';

const cache = new Map();

export const PART_TWO_FROM = 13;

/** The note keys in reading order: '6' … '12', then 'p2'. */
export const NOTE_KEYS = Object.keys(SEALED).sort((a, b) => (a === 'p2' ? 1 : b === 'p2' ? -1 : Number(a) - Number(b)));

export const keyForChapter = (chapter) => (chapter >= PART_TWO_FROM ? 'p2' : String(chapter));

export const chapterOfKey = (key) => (key === 'p2' ? PART_TWO_FROM : Number(key));

export function isOpen(key, chapter) {
  return chapterOfKey(key) <= chapter;
}

function decode(b64) {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** The notes for a key, or null when it is sealed for this chapter or does not exist. */
export function openNotes(key, chapter) {
  if (!SEALED[key] || !isOpen(key, chapter)) return null;
  if (!cache.has(key)) cache.set(key, decode(SEALED[key]));
  return cache.get(key);
}

/** The notes that apply right now: this chapter's, or Part 2's. */
export function currentNotes(chapter) {
  return openNotes(keyForChapter(chapter), chapter);
}
