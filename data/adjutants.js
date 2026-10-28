// Adjutants: a unit left off the map rides along with one who is deployed. Facts from the Fire Emblem
// Wiki (Adjutant page). The first slot opens at Professor Level C, the second at B and the third at
// A. A flying unit only takes a flying adjutant. The adjutant gets half the lead's EXP, full weapon
// and magic EXP (not Authority), full class mastery and support points with the lead, and leaves
// the map unharmed if the lead falls. Her class decides what she does:
//   heal    Monk, Priest, Bishop, Holy Knight: at the start of a turn, if the lead is at half HP or
//           less, casts her Heal on the lead; 1 time per battle with no support, up to 5 at S.
//   guard   armored classes, Brawler, Grappler, War Monk/Cleric: cuts the damage of the enemy's
//           follow-up hit, and that hit leaves the lead at 1 HP instead of killing her.
//   attack  every other class: after the lead attacks on her own turn, may attack once for half
//           damage if she reaches the enemy from where the lead stands; 10% with no support.

export const ADJUTANT_HEAL = new Set(['Monk', 'Priest', 'Bishop', 'Holy Knight']);
export const ADJUTANT_GUARD = new Set([
  'Brawler', 'Armored Knight', 'Grappler', 'Fortress Knight', 'Great Knight', 'Armored Lord', 'Emperor', 'War Monk', 'War Cleric',
]);

/** What a unit in this class does as an adjutant; null when the class is not known. */
export const adjutantKind = (cls) => (!cls ? null : ADJUTANT_HEAL.has(cls) ? 'heal' : ADJUTANT_GUARD.has(cls) ? 'guard' : 'attack');

export const ADJUTANT_KIND = {
  heal: { label: 'cura', text: 'no começo do turno, se a unidade estiver com metade do HP ou menos, o adjutant usa Heal nela.' },
  guard: { label: 'guarda', text: 'corta o dano do segundo golpe do inimigo, e esse golpe deixa a unidade com 1 HP em vez de matar.' },
  attack: { label: 'ataque extra', text: 'depois que a unidade ataca no próprio turno, o adjutant pode atacar uma vez com metade do dano, se alcançar o inimigo dali.' },
};

/** Attack and guard chance (%) and heals per battle, by the support between the two (C+ and B+ count as C and B). */
export const ADJUTANT_CHANCE = { none: 10, C: 20, B: 30, A: 40, S: 50 };
export const ADJUTANT_HEALS = { none: 1, C: 2, B: 3, A: 4, S: 5 };

/** The Professor Level that opens each slot. */
export const ADJUTANT_SLOTS = ['C', 'B', 'A'];

/**
 * Who goes with whom, in the order the slots should go. Each lead wants one kind of adjutant and
 * lists who to use, best first; the page takes the first one who is in the army, off the map, in a
 * class that does that and not with someone above. Flying leads (Edelgard, Petra, Ingrid) are left
 * out: they only take a flying adjutant, and nobody on this plan's bench flies. This is the guide's
 * recommendation.
 */
export const ADJUTANT_PLAN = [
  {
    lead: 'byleth',
    want: 'heal',
    why: 'Ele fica na frente e apanha mais; não voa, então qualquer curandeira serve.',
    from: [
      ['marianne', 'Sobe o suporte com o Byleth, que abre o Forgotten Hero (C antes do Cap. 15).'],
      ['mercedes', 'Bishop do plano; cura no começo do turno.'],
      ['manuela', 'Bishop do plano, se a Mercedes não estiver no exército.'],
    ],
  },
  {
    lead: 'lysithea',
    want: 'attack',
    why: 'Ela ataca de 2 casas: o adjutant precisa de magia ou arco para alcançar dali.',
    from: [
      ['annette', 'Magia alcança 1–2 casas; o ataque extra sobe Reason e a Annette treina sem risco.'],
      ['leonie', 'Com arco, alcança de 2 casas.'],
    ],
  },
  {
    lead: 'constance',
    want: 'attack',
    why: 'Ataca de 2 casas, como a Lysithea.',
    from: [
      ['leonie', 'Com arco, alcança de 2 casas; sobe Bow e a Leonie treina sem risco.'],
      ['annette', 'Magia alcança 1–2 casas.'],
    ],
  },
  {
    lead: 'bernadetta',
    want: 'attack',
    why: 'Arco a 2–3 casas: o adjutant só ajuda quando ela atira de 2.',
    from: [['leonie', 'Com arco.'], ['annette', 'Com magia.']],
  },
  {
    lead: 'shamir',
    want: 'attack',
    why: 'Arco, como a Bernadetta.',
    from: [['leonie', 'Com arco.'], ['annette', 'Com magia.']],
  },
  {
    lead: 'hapi',
    want: 'attack',
    why: 'Dark Magic a 1–2 casas.',
    from: [['annette', 'Com magia.'], ['leonie', 'Com arco.']],
  },
];
