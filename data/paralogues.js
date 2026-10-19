// Part I paralogues this save can reach, with their windows and loot (fe3h.com paralogue pages).
// A paralogue opens when at least one of its units is with you; `key` is the unit whose recruitment
// decides the reward that matters most here (keyReward). Part II paralogues are in the sealed notes.

export const PARALOGUES = [
  {
    id: 'golden-deer',
    name: 'Land of the Golden Deer',
    units: ['lorenz'],
    key: 'lorenz',
    keyReward: 'Thyrsus',
    window: [7, 11],
    star: 'Thyrsus — +2 de alcance mágico. Sem Crest, a portadora toma 10 de dano depois de cada combate.',
    rewards: [
      'Thyrsus e Gloucester Knights: no fim do mapa',
      'Advanced Seal: Thief da direita',
      'Devil Sword: Thief da esquerda',
    ],
    tips: [
      'Vitória: derrotar o comandante ou sobreviver 12 turnos.',
      'Os dois Thieves ficam parados até o turno 3 e depois fogem para o sul: mate-os antes.',
      'Lorenz é obrigatório no mapa; não precisa treinar ele para isso.',
    ],
  },
  {
    id: 'nuptials',
    name: 'Rumored Nuptials',
    units: ['ingrid', 'dorothea'],
    key: 'ingrid',
    keyReward: 'a Luín',
    window: [7, 11],
    star: 'Luín — lança relíquia (Mt 17). Com a Crest da Ingrid, libera Burning Quake. Só vem se a Ingrid estiver recrutada.',
    rewards: [
      'Luín e Galatea Pegasus Co.: no fim, se a Ingrid estiver recrutada',
      'Goddess Ring: no fim, com a Dorothea recrutada',
      'Killer Axe: baú da esquerda · Healing Staff: baú da direita',
      'Prayer Ring e Devil Axe: caem de Brigands',
    ],
    tips: [
      'Recrute a Ingrid ANTES. Sem ela, entra uma substituta e a Luín não vem.',
      'Tiles de cratera tiram 20% do HP de quem termina o turno neles.',
    ],
  },
  {
    id: 'black-market',
    name: 'Black Market Scheme',
    units: ['hapi', 'balthus'],
    key: 'hapi',
    keyReward: 'o Timotheos Magi Corps',
    window: [7, 11],
    star: 'Vajra-Mushti — manopla que ataca duas vezes ao iniciar. Ótima para o Byleth subir Brawl (ele tem Crest: sem dano de relíquia).',
    rewards: [
      'Vajra-Mushti: no fim',
      'Timotheos Magi Corps: com a Hapi recrutada',
      'Leicester Dicers Corps: com o Balthus recrutado',
    ],
    tips: [
      'Um dos paralogues mais difíceis: faça perto do fim da janela.',
      'Suas unidades começam espalhadas pelo mapa: não leve unidades frágeis sem escolta.',
    ],
  },
  {
    id: 'seiros',
    name: 'Sword and Shield of Seiros',
    units: ['shamir', 'alois'],
    key: 'shamir',
    keyReward: 'o Seiros Archers',
    window: [7, 11],
    star: 'Seraph Robe (HP máximo permanente) se os inimigos ficarem menos de 4 turnos dentro da cidade.',
    rewards: [
      'Large Bullion + Seraph Robe: inimigos < 4 turnos na cidade (senão, só Bullion)',
      'Seiros Archers: com a Shamir recrutada',
      'Concoction: roube do comandante pirata',
    ],
    tips: [
      'Vitória: derrotar o comandante, que só se move 3 turnos depois do Brigand no tile de cura cair.',
      'No Hard aparecem Wyvern Riders a cada 3 turnos indo para dentro da cidade.',
    ],
  },
  {
    id: 'cursed-relic',
    name: 'A Cursed Relic',
    units: ['constance', 'yuri'],
    key: 'constance',
    keyReward: 'o Nuvelle Fliers Corps',
    window: [8, 11],
    star: 'Fetters of Dromi — Canto e +1 de movimento. Sem Crest, 10 de dano depois de cada combate: prefira uma portadora com Crest.',
    rewards: [
      'Fetters of Dromi: no fim',
      'Nuvelle Fliers Corps (battalion voador): com a Constance recrutada',
      "Mockingbird's Thieves: com o Yuri recrutado",
    ],
    tips: [
      'Difícil: o guia recomenda esperar ter Warp, Rescue e algumas voadoras.',
      'Mate os Thieves antes de eles chegarem ao Duke Gerth — eles viram monstros.',
      'Ele persegue o Byleth.',
    ],
  },
  {
    id: 'oil-water',
    name: 'Oil and Water',
    units: ['manuela', 'hanneman'],
    key: 'manuela',
    keyReward: 'o Macuil Evil Repelling Co.',
    window: [8, 11],
    star: 'Experience Gem (mais XP de nível para quem equipar).',
    rewards: [
      'Experience Gem: cai do Archer inimigo',
      'Rapier: cai do Sniper inimigo',
      'Macuil Evil Repelling Co.: com a Manuela recrutada',
    ],
    tips: ['Recrute a Manuela no Cap. 8 para abrir.', 'O comandante não se move.'],
  },
  {
    id: 'red-canyon',
    name: 'Tales of the Red Canyon',
    units: ['byleth'],
    window: [8, 10],
    star: 'Knowledge Gem (dobra o XP de skill e de maestria de classe em combate) e +3 usos de Divine Pulse.',
    rewards: ['Knowledge Gem: no baú', '+3 Divine Pulse e Umbral Steel: no fim'],
    tips: [
      'Prazo é o Cap. 10, não o 11.',
      'Só monstros. O chefe não se move nem contra-ataca a 3 de distância: arcos longos e magia de alcance resolvem.',
    ],
  },
  {
    id: 'ocean-view',
    name: 'An Ocean View',
    units: ['flayn'],
    window: [9, 11],
    star: 'Spear of Assal (lança relíquia) e Caduceus Staff. Os itens ficam com você mesmo quando a Flayn sair.',
    rewards: ['Spear of Assal, Caduceus Staff e dois battalions: no fim', 'Advanced Seal, Black Pearl e Levin Sword: caem dos Bishops'],
    tips: ['Deserto: voadoras e magas andam normal, o resto anda devagar.', 'Sem reforços.'],
  },
];

export const PARALOGUE_BY_ID = Object.fromEntries(PARALOGUES.map((p) => [p.id, p]));
