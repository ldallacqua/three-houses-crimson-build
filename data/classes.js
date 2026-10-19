// The classes this squad can use, with what the certification exam asks for and what mastering the
// class teaches. Sources: fe3h.com/classes and fe3h.com/classes/dlc, with Pegasus Knight, Falcon
// Knight, Wyvern Lord, Bishop, Gremory, Sniper, Brigand, Valkyrie and Dark Flier checked again on the
// Fire Emblem Wiki. Classes no one here can or wants to take (Armored Knight, Dark Mage, the male
// DLC classes and the like) are left out on purpose.
//
// reqs: every skill listed is needed. reqsAny: any one of them is enough.
// locked: a combat art that only works while the unit is in that class.

const SEAL = {
  beginner: 'Beginner Seal',
  intermediate: 'Intermediate Seal',
  advanced: 'Advanced Seal',
  master: 'Master Seal',
  dlc: 'Abyssian Exam Pass',
};

const c = (name, tier, level, reqs, extra = {}) => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, '-'),
  name,
  tier,
  level,
  reqs,
  item: SEAL[tier] ?? null,
  gender: null,
  innate: [],
  mastery: [],
  ...extra,
});

export const CLASSES = [
  c('Fighter', 'beginner', 5, {}, { reqsAny: { axe: 'D', bow: 'D', brawl: 'D' }, mastery: [{ name: 'Strength +2' }] }),
  c('Monk', 'beginner', 5, {}, { reqsAny: { reason: 'D', faith: 'D' }, mastery: [{ name: 'Magic +2' }], magic: true }),
  c('Myrmidon', 'beginner', 5, { sword: 'D' }, { mastery: [{ name: 'Speed +2' }] }),
  c('Soldier', 'beginner', 5, { lance: 'D' }, { mastery: [{ name: 'Defense +2' }] }),

  c('Archer', 'intermediate', 10, { bow: 'C' }, { innate: ['Bowrange +1'], mastery: [{ name: 'Hit +20' }] }),
  c('Brawler', 'intermediate', 10, { brawl: 'C' }, { gender: 'm', innate: ['Unarmed Combat'] }),
  c('Brigand', 'intermediate', 10, { axe: 'C' }, { mastery: [{ name: 'Death Blow' }] }),
  c('Cavalier', 'intermediate', 10, { lance: 'C', riding: 'D' }, { innate: ['Canto'], mastery: [{ name: 'Desperation' }], mounted: true }),
  c('Mage', 'intermediate', 10, { reason: 'C' }, { mastery: [{ name: 'Fiendish Blow' }], magic: true }),
  c('Mercenary', 'intermediate', 10, { sword: 'C' }, { mastery: [{ name: 'Vantage' }] }),
  c('Pegasus Knight', 'intermediate', 10, { lance: 'C', flying: 'D' }, {
    gender: 'f', innate: ['Canto', 'Avo +10'], mastery: [{ name: 'Darting Blow' }, { name: 'Triangle Attack', art: true }], flying: true,
  }),
  c('Priest', 'intermediate', 10, { faith: 'C' }, { innate: ['White Magic Heal +5'], mastery: [{ name: 'Miracle' }], magic: true }),
  c('Thief', 'intermediate', 10, { sword: 'C' }, { innate: ['Steal', 'Locktouch'] }),

  c('Assassin', 'advanced', 20, { sword: 'B', bow: 'C' }, {
    innate: ['Swordfaire', 'Locktouch', 'Stealth'], mastery: [{ name: 'Lethality' }, { name: 'Assassinate', art: true, locked: true }],
  }),
  c('Bishop', 'advanced', 20, { faith: 'A' }, {
    innate: ['White Magic Uses x2', 'White Magic Heal +10', 'Terrain Resistance'], mastery: [{ name: 'Renewal' }], magic: true,
  }),
  c('Grappler', 'advanced', 20, { brawl: 'A' }, {
    gender: 'm', innate: ['Fistfaire', 'Unarmed Combat'], mastery: [{ name: 'Fierce Iron Fist', art: true, locked: true }, { name: 'Tomebreaker' }],
  }),
  c('Hero', 'advanced', 20, { sword: 'B', axe: 'C' }, { gender: 'm', innate: ['Swordfaire', 'Vantage'], mastery: [{ name: 'Defiant Str' }] }),
  c('Paladin', 'advanced', 20, { lance: 'B', riding: 'B' }, { innate: ['Canto', 'Lancefaire'], mastery: [{ name: 'Aegis' }], mounted: true }),
  c('Sniper', 'advanced', 20, { bow: 'A' }, {
    innate: ['Bowrange +1', 'Bowfaire'], mastery: [{ name: "Hunter's Volley", art: true, locked: true }],
  }),
  c('Swordmaster', 'advanced', 20, { sword: 'A' }, {
    innate: ['Swordfaire', 'Sword Crit +10'], mastery: [{ name: 'Astra', art: true, locked: true }],
  }),
  c('Warlock', 'advanced', 20, { reason: 'A' }, { innate: ['Black Tomefaire', 'Black Magic Uses x2'], magic: true }),
  c('Warrior', 'advanced', 20, { axe: 'A' }, { innate: ['Axefaire', 'Axe Crit +10'], mastery: [{ name: 'Wrath' }] }),
  c('Wyvern Rider', 'advanced', 20, { axe: 'B', flying: 'C' }, {
    innate: ['Axefaire', 'Canto'], mastery: [{ name: 'Seal Defense' }], flying: true,
  }),

  c('Bow Knight', 'master', 30, { lance: 'C', bow: 'A', riding: 'A' }, {
    innate: ['Bowfaire', 'Canto', 'Bowrange +2'], mastery: [{ name: 'Defiant Spd' }], mounted: true,
  }),
  c('Dark Knight', 'master', 30, { lance: 'C', reason: 'B+', riding: 'A' }, {
    innate: ['Black Tomefaire', 'Dark Tomefaire', 'Canto'], mastery: [{ name: 'Seal Resistance' }], magic: true, mounted: true,
  }),
  c('Falcon Knight', 'master', 30, { sword: 'C', lance: 'A', flying: 'B+' }, {
    gender: 'f', innate: ['Canto', 'Lancefaire', 'Avo +10'], mastery: [{ name: 'Defiant Avo' }], flying: true,
  }),
  c('Gremory', 'master', 30, { reason: 'A', faith: 'A' }, {
    gender: 'f', innate: ['Black Magic Uses x2', 'Dark Magic Uses x2', 'White Magic Uses x2'], mastery: [{ name: 'Defiant Mag' }], magic: true,
  }),
  c('Holy Knight', 'master', 30, { lance: 'C', faith: 'B+', riding: 'A' }, {
    innate: ['White Tomefaire', 'Terrain Resistance', 'Canto'], mastery: [{ name: 'Defiant Res' }], magic: true, mounted: true,
  }),
  c('Mortal Savant', 'master', 30, { sword: 'A', reason: 'B+' }, { innate: ['Swordfaire', 'Black Tomefaire'], mastery: [{ name: 'Warding Blow' }], magic: true }),
  c('War Master', 'master', 30, { axe: 'A', brawl: 'A' }, {
    gender: 'm', innate: ['Axefaire', 'Fistfaire', 'Crit +20'], mastery: [{ name: 'Quick Riposte' }, { name: "War Master's Strike", art: true, locked: true }],
  }),
  c('Wyvern Lord', 'master', 30, { lance: 'C', axe: 'A', flying: 'A' }, {
    innate: ['Axefaire', 'Avo +10', 'Canto'], mastery: [{ name: 'Defiant Crit' }], flying: true,
  }),

  c('Dark Flier', 'dlc', 20, { reason: 'B+', flying: 'C' }, {
    gender: 'f', innate: ['Canto', 'Black Tomefaire'], mastery: [{ name: 'Transmute' }], magic: true, flying: true,
  }),
  c('Valkyrie', 'dlc', 20, { reason: 'B', riding: 'B' }, {
    gender: 'f', innate: ['Canto', 'Black Magic Range +1', 'Dark Magic Range +1'], mastery: [{ name: 'Uncanny Blow' }], magic: true, mounted: true,
  }),
  c('War Cleric', 'dlc', 20, { brawl: 'B+', faith: 'C+' }, { gender: 'f', innate: ['Fistfaire', 'Unarmed Combat', 'Brawl Avo +20'], magic: true }),
  c('Trickster', 'dlc', 20, { sword: 'B', faith: 'B' }, {
    needsClass: 'Thief', innate: ['Locktouch', 'Stealth', 'Lucky Seven'], mastery: [{ name: 'Foul Play', art: true, unsure: true }], magic: true,
  }),

  c('Dancer', 'unique', 0, {}, {
    item: 'White Heron Cup', innate: ['Dance'], mastery: [{ name: 'Special Dance' }],
    note: 'Só a vencedora do White Heron Cup (Cap. 9). Uma Dancer por campanha.',
  }),
];

export const CLASS_BY_NAME = Object.fromEntries(CLASSES.map((k) => [k.name, k]));

export const TIER_LABEL = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  master: 'Master',
  dlc: 'DLC (Abismo)',
  unique: 'Única',
};

// Class experience needed to master a class (fe3h.com/classes, Fire Emblem Wiki "Class mastery").
// Units gain 1 at the end of every combat in their current class; the Dancer needs 150. DLC classes
// are left out because neither source lists them.
export const MASTERY_XP = { beginner: 60, intermediate: 100, advanced: 150, master: 200 };

// Starting or story classes that appear on units but are not certified by the player.
export const OTHER_CLASSES = ['Commoner', 'Noble', 'Enlightened One'];

// What the abilities this plan leans on actually do. Only effects confirmed in more than one place.
export const ABILITY_TEXT = {
  'Death Blow': '+6 de Str quando a unidade inicia o combate. Equipável em qualquer classe.',
  'Fiendish Blow': '+6 de Mag quando a unidade inicia o combate. Equipável em qualquer classe.',
  'Darting Blow': '+6 de Spd quando a unidade inicia o combate.',
  'Uncanny Blow': '+30 de Hit quando a unidade inicia o combate.',
  'Hit +20': '+20 de Hit sempre. Equipável em qualquer classe.',
  Vantage: 'Ataca primeiro quando é atacada com HP em 50% ou menos.',
  Canto: 'Depois de agir, pode andar o movimento que sobrou.',
  "Hunter's Volley": 'Arte de arco: dois golpes seguidos. Só funciona enquanto estiver na classe Sniper.',
  'Fierce Iron Fist': 'Arte de punhos: três golpes. Só funciona enquanto estiver na classe Grappler.',
  "War Master's Strike": 'Arte de machado. Só funciona na classe War Master.',
  Astra: 'Arte de espada com cinco golpes. Só funciona na classe Swordmaster.',
  'Strength +2': '+2 de Str enquanto equipada.',
  'Magic +2': '+2 de Mag enquanto equipada.',
  'Speed +2': '+2 de Spd enquanto equipada.',
  'Defense +2': '+2 de Def enquanto equipada.',
  Miracle: 'Chance de sobreviver com 1 HP a um golpe fatal.',
  Desperation: 'Com HP baixo, dá o segundo golpe antes do contra-ataque.',
};
