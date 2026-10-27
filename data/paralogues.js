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
      { item: 'Gloucester Knights', kind: 'battalion', where: 'Fim do mapa', who: ['lysithea'], why: 'Authority B. Mag +2 e Hit +10: compensa a precisão baixa da Dark Magic dela.' },
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
      { item: 'Galatea Pegasus Co.', kind: 'battalion', where: 'Fim do mapa, só com a Ingrid recrutada', who: ['ingrid'], why: 'Battalion voador da família dela (Authority B): Atk +3, Avo +5, Rsl +2.' },
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
      { item: 'Timotheos Magi Corps', kind: 'battalion', where: 'Fim do mapa, com a Hapi recrutada', who: ['hapi'], why: 'Authority B. Mag +3, Hit +5 e Crit +5: o Hit ajuda a Dark Magic, que erra mais.' },
      { item: 'Leicester Dicers Corps', kind: 'battalion', where: 'Fim do mapa, com o Balthus recrutado', who: ['byleth'], why: 'Authority B. Atk +3 e Mag +3 ainda no Part 1.' },
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
      { item: 'Seiros Archers', kind: 'battalion', where: 'Fim do mapa, com a Shamir recrutada', who: ['shamir', 'bernadetta'], why: 'Authority D. Hit +10 e Avo +5, com Fusillade a 2–3 casas. A guild também vende um a partir do Cap. 8.' },
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
      { item: 'Nuvelle Fliers Corps', kind: 'battalion', where: 'Fim do mapa, com a Constance recrutada', who: ['constance'], why: 'Battalion voador (Authority B): Mag +3 e Rsl +3. É o que ela lidera na Dark Flier.' },
      { item: "Mockingbird's Thieves", kind: 'battalion', where: 'Fim do mapa, com o Yuri recrutado', who: ['anna'], why: 'Authority B. Um pouco de tudo; Absorption cura quem lidera.' },
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
    keyReward: 'o Indech Sword Fighters',
    window: [8, 11],
    star: 'Experience Gem (mais XP de nível para quem equipar).',
    items: [
      { item: 'Experience Gem', kind: 'gem', where: 'Cai do Archer inimigo', who: ['ingrid', 'marianne', 'lysithea', 'constance'], why: 'Dobra o XP de nível. Para a recruta que entrou por último e está atrás no nível; troque de dona quando ela alcançar as outras.' },
      { item: 'Indech Sword Fighters', kind: 'battalion', where: 'Fim do mapa, com a Manuela recrutada', who: ['byleth'], why: 'Authority A. Atk +4 e Hit +10; Retribution deixa as aliadas em volta revidarem a qualquer distância por 5 turnos.' },
    ],
    rewards: [
      'Experience Gem: cai do Archer inimigo',
      'Rapier: cai do Sniper inimigo',
      'Indech Sword Fighters: com a Manuela recrutada',
      'Macuil Evil Repelling Co.: só com o Hanneman recrutado (fora deste plano)',
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
      { item: 'Cichol Wyvern Co.', kind: 'battalion', where: 'Fim do mapa', who: ['edelgard', 'petra'], why: 'O melhor battalion voador do plano (Authority A): Atk +3, Hit +10, Crit +10.' },
      { item: 'Cethleann Monks', kind: 'battalion', where: 'Fim do mapa', who: ['marianne'], why: 'Authority A. Mag +2, Rsl +3 e cura em área.' },
    ],
    rewards: ['Spear of Assal, Caduceus Staff, Cichol Wyvern Co. e Cethleann Monks: no fim', 'Advanced Seal, Black Pearl e Levin Sword: caem dos Bishops'],
    tips: ['Deserto: voadoras e magas andam normal, o resto anda devagar.', 'Sem reforços.'],
  },
];

export const PARALOGUE_BY_ID = Object.fromEntries(PARALOGUES.map((p) => [p.id, p]));
