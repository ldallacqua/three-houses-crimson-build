// Part I paralogues this build can reach, with their windows and loot (fe3h.com paralogue pages).
// A paralogue opens when at least one of its units is with you; `key` is the unit whose recruitment
// decides the reward that matters most here (keyReward). Part II paralogues are in the sealed notes.
//
// items: who keeps each reward worth keeping, in the plan's order of preference. The first one in
// the army gets it (logic.js, itemHolder); an accessory skips whoever already wears a better one
// (data/accessories.js). Item effects: fe3h.com item and weapon pages.

export const PARALOGUES = [
  {
    id: 'golden-deer',
    name: 'Land of the Golden Deer',
    units: ['lorenz'],
    key: 'lorenz',
    keyReward: 'Thyrsus',
    window: [7, 11],
    star: 'Thyrsus — +2 de alcance mágico. Sem Crest, a portadora toma 10 de dano depois de cada combate.',
    items: [
      { item: 'Thyrsus', kind: 'relic', where: 'Fim do mapa', who: ['lysithea', 'constance', 'hapi'], why: '+2 de alcance para magia. A Lysithea tem a Crest de Gloucester, a da relíquia: não toma o dano e às vezes reduz o dano recebido. Constance e Hapi também têm Crest.' },
    ],
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
    items: [
      { item: 'Luín', kind: 'relic', where: 'Fim do mapa, só com a Ingrid recrutada', who: ['ingrid'], why: 'A Crest de Daphnel da Ingrid libera Burning Quake, o melhor golpe dela. Ninguém mais aproveita.' },
      { item: 'Goddess Ring', kind: 'ring', where: 'Fim do mapa, com a Dorothea recrutada', who: ['petra', 'shamir', 'edelgard', 'ingrid'], why: 'Luck +4 e cura um pouco de HP por turno: para quem fica na frente e esquiva. Quando a Petra ganhar um acessório melhor, passa para a próxima da ordem.' },
      { item: 'Prayer Ring', kind: 'ring', where: 'Cai de um Brigand', who: ['edelgard', 'petra', 'byleth'], why: 'Miracle (pode sobreviver com 1 HP) e +5 de HP por turno. Para a outra da linha de frente.' },
      { item: 'Killer Axe', kind: 'weapon', where: 'Baú da esquerda', who: ['edelgard', 'petra'], why: 'Machado com crítico alto (Axe C). Combina com Death Blow.' },
      { item: 'Healing Staff', kind: 'staff', where: 'Baú da direita', who: ['marianne', 'hapi', 'dorothea', 'mercedes'], why: 'Cura +10, para a curandeira dedicada (Marianne). Sem ela, a Hapi usa até ganhar o Caduceus Staff do An Ocean View.' },
    ],
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
    items: [
      { item: 'Vajra-Mushti', kind: 'relic', where: 'Fim do mapa', who: ['byleth'], why: 'Manopla que ataca duas vezes ao iniciar: dobra o ganho de Brawl do Byleth no plano Punhos. Ele tem Crest, então não toma o dano da relíquia.' },
    ],
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
    items: [
      { item: 'Seraph Robe', kind: 'stat', where: 'Fim do mapa, se os inimigos ficarem menos de 4 turnos na cidade', who: ['lysithea', 'constance'], why: '+5 de HP máximo permanente. Vai para a maga mais frágil.' },
    ],
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
    items: [
      { item: 'Fetters of Dromi', kind: 'relic', where: 'Fim do mapa', who: ['bernadetta', 'constance', 'hapi'], why: 'Movimento +1 e Canto (anda depois de agir). Rende mais em quem anda a pé: a Bernadetta atira e recua. Ela tem Crest, então não toma o dano da relíquia.' },
    ],
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
    items: [
      { item: 'Experience Gem', kind: 'gem', where: 'Cai do Archer inimigo', who: ['ingrid', 'marianne', 'lysithea', 'constance'], why: 'Dobra o XP de nível. Para a recruta que entrou por último e está atrás no nível; troque de dona quando ela alcançar as outras.' },
    ],
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
    items: [
      { item: 'Knowledge Gem', kind: 'gem', where: 'Baú do mapa', who: ['byleth'], why: 'Dobra o XP de skill e de maestria em combate. O Byleth não tem Goals: é o que mais ganha com ela.' },
      { item: 'Umbral Steel', kind: 'material', where: 'Fim do mapa', who: [], why: 'Material para consertar relíquias (Luín, Thyrsus, Vajra-Mushti) no ferreiro. Guarde.' },
    ],
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
    items: [
      { item: 'Spear of Assal', kind: 'sacred', where: 'Fim do mapa', who: ['ingrid', 'petra'], why: 'Lança sagrada (Lance A), eficaz contra cavalaria e cura por turno. Ninguém toma dano por usar.' },
      { item: 'Caduceus Staff', kind: 'staff', where: 'Fim do mapa', who: ['hapi', 'marianne', 'constance'], why: 'Alcance de magia +1 e cura por turno, mais forte com Crest. A Hapi tem Crest, e o alcance soma com o +1 de Dark Magic da Valkyrie.' },
      { item: 'Black Pearl', kind: 'stat', where: 'Cai de um Bishop', who: ['dorothea'], why: 'Charm +2 permanente. Se der para jogar antes do White Heron Cup, ajuda a vencer.' },
    ],
    rewards: ['Spear of Assal, Caduceus Staff e dois battalions: no fim', 'Advanced Seal, Black Pearl e Levin Sword: caem dos Bishops'],
    tips: ['Deserto: voadoras e magas andam normal, o resto anda devagar.', 'Sem reforços.'],
  },
];

export const PARALOGUE_BY_ID = Object.fromEntries(PARALOGUES.map((p) => [p.id, p]));
