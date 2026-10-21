// The example save: the author's game as of the master guide v2.1 (eight screenshots, Chapter 6,
// 9/7), playing the Corte Carmesim build. A new visitor starts from Chapter 1 instead; this one is
// there to show the page filled in ("Carregar o save de exemplo"). Ranks marked as approximate in the
// guide are entered as the rank shown; nothing the screenshots did not show (masteries, supports) is
// assumed.

export const SNAPSHOT_LABEL = 'Cap. 6 · 9/7';

export const SNAPSHOT = {
  build: 'corte-carmesim',
  chapter: 6,
  date: '9/7',
  difficulty: '',
  mode: '',
  units: {
    byleth: {
      recruited: true, level: 20, cls: 'Brigand', plan: 'punhos', mastered: [],
      stats: { hp: 43, str: 33, mag: 12, dex: 20, spd: 19, cha: 21 },
      ranks: { sword: 'C', axe: 'C', brawl: 'E+', authority: 'C', flying: 'E', faith: 'E+', riding: 'E', reason: 'E' },
    },
    edelgard: {
      recruited: true, level: 16, cls: 'Brigand', mastered: [],
      stats: { hp: 39, str: 22, mag: 12, dex: 10, spd: 14, cha: 20 },
      ranks: { axe: 'C+', flying: 'C', authority: 'C', lance: 'E', heavyArmor: 'D' },
    },
    petra: {
      recruited: true, level: 11, cls: 'Brigand', mastered: [],
      stats: { hp: 31, str: 17, mag: 7, dex: 13, spd: 18, res: 3 },
      ranks: { sword: 'C', axe: 'C+', flying: 'C' },
    },
    bernadetta: {
      recruited: true, level: 11, cls: 'Fighter', plan: 'sniper', mastered: [],
      stats: { hp: 28, str: 13, mag: 6, dex: 16, spd: 13 },
      ranks: { bow: 'C+', lance: 'C', riding: 'E', authority: 'E' },
    },
    dorothea: {
      recruited: true, level: 13, cls: 'Mage', plan: 'dancer', mastered: [],
      stats: { hp: 34, str: 8, mag: 15, dex: 13, spd: 11, cha: 11 },
      ranks: { reason: 'C+', faith: 'C' },
    },
    constance: {
      recruited: true, level: 9, cls: 'Monk', plan: 'dark-flier', mastered: [],
      stats: { hp: 25, str: 9, mag: 20, dex: 8, spd: 8, def: 4 },
      ranks: { reason: 'C+', faith: 'D', flying: 'D+', authority: 'D' },
    },
    hapi: {
      recruited: true, level: 9, cls: 'Monk', plan: 'valkyrie', mastered: [],
      stats: { hp: 30, str: 9, mag: 15, dex: 11, spd: 9, res: 13 },
      ranks: { reason: 'C+', faith: 'D', riding: 'D+' },
    },
    anna: {
      recruited: true, level: 9, cls: 'Myrmidon', mastered: [],
      stats: { hp: 30, str: 8, mag: 11, dex: 11, spd: 14, lck: 14 },
      ranks: { sword: 'C+', bow: 'D', faith: 'D' },
    },
  },
  checks: {},
  paralogues: {},
};
