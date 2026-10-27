// Battalions this build can get on the Crimson Flower route, and which one each unit should lead.
// Stats are the level 1 bonuses (they grow a little up to level 5); every row was checked on its
// Fire Emblem Wiki page, and the gambits on fe3h.com/battalions. A battalion goes to one unit at a
// time. Flying classes can only lead flying battalions, and flying battalions only go to flying
// classes; any other class can lead any battalion that is not flying.
//
// get: where it comes from.
//   guild: n           the Battalion Guild sells it from Chapter n (one copy). The Black Eagles
//                      sell the Empire ones; the Chapter 12 ones open on the Edelgard route.
//   paralogue: id      the end of a Part 1 paralogue (data/paralogues.js); needs: the unit that has
//                      to be in the army for it to come.
//   p2: name, from     the end of a Part 2 paralogue, which opens in Chapter `from`; needs: the units
//                      of the plan it asks for (others, like Hubert and Linhardt, are always there).
//   auto: n, text      it joins by itself in Chapter n.
// Battalions from Chapter 12 on stay out of sight until the player gets there.

const b = (name, auth, gambit, stats, get, extra = {}) => ({ name, auth, gambit, stats, get, flying: false, ...extra });
const fly = { flying: true };

export const GAMBITS = {
  'Absorption': 'Dano na área, e a líder recupera metade do dano que causar.',
  'Assault Troop': 'Ataque em área (Mt 10).',
  'Assembly': 'Recua 1 casa e puxa o inimigo para onde ela estava.',
  'Blaze': 'Ataque em área que põe fogo no terreno (Mt 10).',
  'Blessing': 'As aliadas da área sobrevivem com 1 HP a um golpe que mataria, neste turno.',
  'Flash-Fire Arrows': 'Flechas que põem fogo no terreno (Mt 7), fortes contra voadores.',
  'Fusillade': 'Flechas a 2–3 casas (Mt 5), fortes contra voadores.',
  'Group Flames': 'Magia em área a 1–2 casas (Mt 2).',
  'Group Lance Attack': 'Ataque em área (Mt 6).',
  'Linked Horses': 'Ataque em área (Mt 12).',
  'Lure': 'Puxa o inimigo para o outro lado da líder.',
  'Onslaught': 'Ataque que empurra o inimigo 1 casa (Mt 8).',
  'Poison Tactic': 'Envenena os inimigos da área.',
  'Poisoned Arrows': 'Veneno a 2–3 casas, forte contra voadores.',
  'Resonant Flames': 'Magia em área a 1–2 casas (Mt 6).',
  'Resonant Lightning': 'Magia em área a 1–2 casas (Mt 8).',
  'Resonant White Magic': 'Cura as aliadas da área (3 usos por mapa).',
  'Retribution': 'Por 5 turnos, as aliadas da área contra-atacam a qualquer distância.',
  'Reversal': 'Troca de lugar com o inimigo e causa dano (Mt 8).',
  'Stride': '+5 de movimento para as aliadas da área neste turno.',
};

export const STAT_LABEL = { atk: 'Atk', mag: 'Mag', hit: 'Hit', crit: 'Crit', avo: 'Avo', prt: 'Prt', rsl: 'Rsl' };

export const BATTALIONS = [
  // The guild, Part 1.
  b('Empire Infantry', 'E', 'Lure', { mag: -2, hit: 5, prt: 1 }, { guild: 3 }),
  b('Seiros Holy Monks', 'E', 'Stride', { atk: -1, hit: 5, rsl: 1 }, { guild: 3 }),
  b('Seiros Sacred Monks', 'E', 'Resonant White Magic', { atk: -1, hit: 5, rsl: 2 }, { guild: 3 }),
  b('Empire Archers', 'D', 'Fusillade', { atk: 1, mag: -2, hit: 10, prt: 1 }, { guild: 3 }),
  b('Empire Magic Corps', 'D', 'Group Flames', { atk: -2, mag: 2, rsl: 2 }, { guild: 3 }),
  b('Seiros Pegasus Co.', 'D', 'Assembly', { atk: 2, avo: 1, rsl: 3 }, { guild: 3 }, fly),
  b('Empire Knights', 'C', 'Blaze', { atk: 3, mag: -2, prt: 2 }, { guild: 3 }),
  b('Empire Pegasus Co.', 'D', 'Group Lance Attack', { atk: 2, hit: 10, prt: 1, rsl: 2 }, { guild: 8 }, fly),
  b('Empire Wyvern Co.', 'C', 'Reversal', { atk: 3, mag: -2, hit: 5, crit: 5, prt: 2 }, { guild: 8 }, fly),
  b('Empire Snipers', 'C', 'Flash-Fire Arrows', { atk: 3, mag: -2, hit: 5, prt: 1 }, { guild: 8 }),
  b('Empire Magic Users', 'C', 'Resonant Flames', { atk: -2, mag: 3, crit: 5, rsl: 2 }, { guild: 8 }),

  // Part 1 paralogues.
  b('Seiros Archers', 'D', 'Fusillade', { hit: 10, avo: 5 }, { paralogue: 'seiros', needs: 'shamir' }),
  b('Galatea Pegasus Co.', 'B', 'Lure', { atk: 3, avo: 5, prt: 1, rsl: 2 }, { paralogue: 'nuptials', needs: 'ingrid' }, fly),
  b('Gloucester Knights', 'B', 'Assault Troop', { atk: 2, mag: 2, hit: 10, prt: 1, rsl: 1 }, { paralogue: 'golden-deer', needs: 'lorenz' }),
  b('Timotheos Magi Corps', 'B', 'Resonant Flames', { mag: 3, hit: 5, crit: 5, rsl: 1 }, { paralogue: 'black-market', needs: 'hapi' }),
  b('Leicester Dicers Corps', 'B', 'Onslaught', { atk: 3, mag: 3, prt: 1, rsl: 1 }, { paralogue: 'black-market', needs: 'balthus' }),
  b('Nuvelle Fliers Corps', 'B', 'Resonant Lightning', { mag: 3, avo: 5, rsl: 3 }, { paralogue: 'cursed-relic', needs: 'constance' }, fly),
  b("Mockingbird's Thieves", 'B', 'Absorption', { atk: 1, mag: 1, hit: 5, crit: 5, avo: 5, prt: 1, rsl: 1 }, { paralogue: 'cursed-relic', needs: 'yuri' }),
  b('Indech Sword Fighters', 'A', 'Retribution', { atk: 4, mag: -2, hit: 10, crit: 2 }, { paralogue: 'oil-water', needs: 'manuela' }),
  b('Cichol Wyvern Co.', 'A', 'Assault Troop', { atk: 3, hit: 10, crit: 10, prt: 2, rsl: 1 }, { paralogue: 'ocean-view' }, fly),
  b('Cethleann Monks', 'A', 'Resonant White Magic', { mag: 2, hit: 10, prt: 1, rsl: 3 }, { paralogue: 'ocean-view' }),

  // Chapter 12 on: the Edelgard route's guild, Hubert's own, and the Part 2 paralogues.
  b('Imperial Guard', 'B', 'Blaze', { atk: 3, mag: -2, crit: 10 }, { guild: 12 }),
  b('Empire Holy Magic Users', 'B', 'Blessing', { atk: -2, mag: 2, rsl: 3 }, { guild: 12 }),
  b('Empire Elite Wyvern Co.', 'B', 'Assembly', { atk: 4, mag: -2, crit: 5, prt: 2 }, { guild: 12 }, fly),
  b('Black Eagle Heavy Axes', 'A', 'Onslaught', { atk: 3, crit: 10, avo: -10, prt: 4, rsl: 2 }, { guild: 12 }),
  b('Black Eagle Cavalry', 'A', 'Linked Horses', { atk: 3, hit: 10, avo: 5, prt: 1 }, { guild: 12 }),
  b('Black Eagle Pegasus Co.', 'A', 'Retribution', { atk: 3, crit: 10, avo: 5, prt: 1, rsl: 3 }, { guild: 12 }, fly),
  b('Vestra Sorcery Engineers', 'C', 'Resonant Lightning', { atk: -2, mag: 3, avo: 5, rsl: 2 }, { auto: 12, text: 'Vem com o Hubert no Cap. 12; troque para quem precisar' }),
  b('Secret Transport Force', 'B', 'Stride', { atk: 1, avo: 10, prt: 1, rsl: 1 }, { p2: 'The Secret Merchant', from: 13, needs: ['anna'] }, fly),
  b("Holst's Chosen", 'C', 'Assault Troop', { atk: 3, prt: 3 }, { p2: 'Insurmountable', from: 15, needs: ['edelgard'] }),
  b('Varley Archers', 'B', 'Fusillade', { hit: 20, avo: -10, prt: 1 }, { p2: 'Foreign Land and Sky', from: 15, needs: ['petra', 'bernadetta'] }),
  b('Brigid Hunters', 'B', 'Poison Tactic', { mag: -2, crit: 5, avo: 15 }, { p2: 'Foreign Land and Sky', from: 15, needs: ['petra', 'bernadetta'] }),
  b('Edmund Troops', 'B', 'Flash-Fire Arrows', { atk: 1, mag: 1, hit: 30 }, { p2: 'Forgotten Hero', from: 15, needs: ['marianne'] }),
  b('Hevring Prayer Troops', 'B', 'Blessing', { mag: 3, avo: -10, rsl: 3 }, { p2: 'Legend of the Lake', from: 15, needs: ['leonie'] }),
  b('Sauin Militia', 'C', 'Poisoned Arrows', { atk: 1, hit: 10, avo: 5 }, { p2: 'Legend of the Lake', from: 15, needs: ['leonie'] }),
];

export const BATTALION_BY_NAME = Object.fromEntries(BATTALIONS.map((x) => [x.name, x]));

/**
 * Which battalion each unit should lead, best first: the page takes the first one she already has,
 * can lead (Authority rank, flying or not) and nobody ahead of her took. The order between units is
 * the squad's (titulares first, in data/units.js order). This is the guide's recommendation.
 */
export const BATTALION_PLAN = {
  byleth: [
    ['Indech Sword Fighters', 'Atk +4 e Hit +10; Retribution deixa o time revidar a qualquer distância.'],
    ['Black Eagle Cavalry', 'Atk +3, Hit +10 e o gambit mais forte (Mt 12).'],
    ['Leicester Dicers Corps', 'Atk +3 já no Part 1.'],
    ['Imperial Guard', 'Atk +3 e Crit +10.'],
    ['Empire Knights', 'Atk +3 com Authority C, à venda desde o Cap. 3.'],
    ['Empire Infantry', 'Para começar: Hit +5 e Lure, que tira um inimigo de cima de uma aliada.'],
  ],
  edelgard: [
    ['Cichol Wyvern Co.', 'O melhor voador: Atk +3, Hit +10, Crit +10.'],
    ['Empire Elite Wyvern Co.', 'Atk +4 e Crit +5, voador.'],
    ['Empire Wyvern Co.', 'Atk +3, Hit +5, Crit +5: o voador do Part 1.'],
    ['Black Eagle Heavy Axes', 'Se ela trocar a Wyvern Lord pela classe exclusiva (sem voo): Atk +3, Crit +10, Prt +4.'],
    ["Holst's Chosen", 'Atk +3 e Prt +3, também para a classe exclusiva.'],
    ['Empire Infantry', 'Enquanto for Brigand.'],
  ],
  petra: [
    ['Cichol Wyvern Co.', 'Se a Edelgard não estiver com ele: Atk +3, Hit +10, Crit +10.'],
    ['Empire Elite Wyvern Co.', 'Atk +4 e Crit +5.'],
    ['Secret Transport Force', 'Avo +10 e Stride (+5 de movimento para quem estiver em volta).'],
    ['Empire Wyvern Co.', 'Atk +3 e Crit +5 na Wyvern Rider.'],
    ['Empire Pegasus Co.', 'Atk +2 e Hit +10 com só Authority D.'],
    ['Empire Infantry', 'Enquanto for Brigand, se o Byleth e a Edelgard já tiverem outro.'],
  ],
  bernadetta: [
    ['Varley Archers', 'Battalion da família dela: Hit +20 e Fusillade a 2–3 casas.'],
    ['Edmund Troops', 'Hit +30, se a Shamir não estiver com ele.'],
    ['Empire Snipers', 'Atk +3 e Hit +5.'],
    ['Empire Archers', 'Hit +10 com Authority D.'],
    ['Seiros Archers', 'Hit +10 e Avo +5, se a Shamir não estiver com ele.'],
  ],
  shamir: [
    ['Edmund Troops', 'Hit +30: o arco quase não erra.'],
    ['Brigid Hunters', 'Avo +15 e Crit +5.'],
    ['Seiros Archers', 'O battalion do paralogue dela: Hit +10 e Avo +5.'],
    ['Empire Snipers', 'Atk +3 e Hit +5, se a Bernadetta já tiver um melhor.'],
  ],
  ingrid: [
    ['Black Eagle Pegasus Co.', 'Atk +3, Crit +10, Rsl +3 e Retribution.'],
    ['Galatea Pegasus Co.', 'O da família dela: Atk +3, Avo +5, Rsl +2.'],
    ['Secret Transport Force', 'Avo +10 e Stride, se a Petra não estiver com ele.'],
    ['Empire Pegasus Co.', 'Atk +2 e Hit +10.'],
    ['Seiros Pegasus Co.', 'Atk +2 e Rsl +3, à venda desde o Cap. 3.'],
  ],
  dorothea: [
    ['Seiros Holy Monks', 'Stride: +5 de movimento para quem estiver em volta. Com a Dancer, leva o time inteiro aonde precisa. Authority E basta.'],
    ['Empire Holy Magic Users', 'No plano de maga: Mag +2 e Blessing.'],
  ],
  constance: [
    ['Nuvelle Fliers Corps', 'Voador, Mag +3 e Rsl +3: o battalion dela na Dark Flier.'],
    ['Vestra Sorcery Engineers', 'Mag +3 e Avo +5 se ela ficar no chão (plano Gremory).'],
    ['Empire Magic Users', 'Mag +3 e Crit +5.'],
    ['Empire Magic Corps', 'Mag +2 com Authority D.'],
  ],
  hapi: [
    ['Timotheos Magi Corps', 'O battalion do paralogue dela: Mag +3, Hit +5, Crit +5. A Dark Magic erra mais, então o Hit conta.'],
    ['Empire Magic Users', 'Mag +3 e Crit +5.'],
    ['Empire Magic Corps', 'Mag +2 com Authority D.'],
    ['Seiros Sacred Monks', 'Cura em área, se ela ficar de curandeira.'],
  ],
  lysithea: [
    ['Gloucester Knights', 'Mag +2 e Hit +10: compensa a precisão baixa da Dark Magic.'],
    ['Hevring Prayer Troops', 'Mag +3 e Rsl +3. Avo −10 pesa pouco: ela não deve ser atacada mesmo.'],
    ['Empire Holy Magic Users', 'Mag +2, Rsl +3 e Blessing.'],
    ['Empire Magic Users', 'Mag +3 e Crit +5.'],
    ['Empire Magic Corps', 'Mag +2 com Authority D.'],
  ],
  marianne: [
    ['Cethleann Monks', 'Mag +2, Rsl +3 e cura em área com Authority A.'],
    ['Seiros Sacred Monks', 'Cura em área (Resonant White Magic) com Authority E.'],
  ],
  mercedes: [['Seiros Sacred Monks', 'Cura em área.']],
  annette: [['Empire Magic Corps', 'Mag +2.']],
  leonie: [['Sauin Militia', 'O battalion do paralogue dela: Hit +10.']],
  anna: [["Mockingbird's Thieves", 'Um pouco de tudo, e Absorption cura a líder.']],
};
