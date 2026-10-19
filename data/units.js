// Everyone the plan counts on, with their build paths, what they learn by rank, what they like and
// how Byleth recruits them. Teas, tea topics, meals (and the full gift lists) are in data/social.js.
// supports: false = no support with anyone, so social activities only buy motivation. Facts come from fe3h.com character pages and the Fire Emblem Wiki; the
// plans and notes are this guide's advice. Nothing here goes past Chapter 6 of the story except the
// planning facts the master guide already lists (paralogue windows, the Dancer, route deadlines).
//
// stages: the class path in order. master: finish the class mastery before moving on.
// optional: a bridge that is fine to skip. milestones: skill ranks worth reaching for what they
// unlock, in priority order; they feed the Goals the page suggests.
// learn: [skill, rank, name, kind] with kind 'spell' | 'art' | 'ability'. rank 'budding' = the
// budding talent reward.

const learn = (...rows) => rows.map(([skill, rank, name, kind = 'spell']) => ({ skill, rank, name, kind }));

// Support tiers for students from other houses: Byleth's stat and skill rank at each support rank.
// From A support on, any student joins.
const studentTiers = (stat, skill, rows) => ({
  kind: 'student',
  stat,
  skill,
  tiers: Object.fromEntries(Object.entries(rows).map(([tier, [value, rank]]) => [tier, { stat: value, rank }])),
});

export const HOUSES = {
  byleth: { name: 'Professor', color: 'gold' },
  be: { name: 'Black Eagles', color: 'crimson' },
  bl: { name: 'Blue Lions', color: 'blue' },
  gd: { name: 'Golden Deer', color: 'yellow' },
  aw: { name: 'Ashen Wolves', color: 'violet' },
  church: { name: 'Igreja / staff', color: 'green' },
  dlc: { name: 'DLC', color: 'grey' },
};

export const ROLES = {
  titular: 'Titular',
  rotacao: 'Rotação',
  reserva: 'Reserva',
  utilitario: 'Utilitário',
  temporaria: 'Temporária',
  ignorar: 'Fora do plano',
};

export const UNITS = [
  {
    id: 'byleth',
    name: 'Byleth',
    house: 'byleth',
    gender: 'm',
    crest: true,
    role: 'titular',
    tags: ['físico'],
    summary: 'Carry físico. Nível 20 com Str 33 segura o time enquanto as outras sobem — mas não deixe ele roubar todas as kills.',
    plans: [
      {
        id: 'punhos',
        label: 'Punhos: Grappler → War Master',
        stages: [
          { cls: 'Brigand', master: true, why: 'Death Blow serve em qualquer rota física.' },
          { cls: 'Brawler', optional: true, why: 'Ponte opcional quando Brawl chegar a C.' },
          { cls: 'Grappler', master: true, why: 'Fierce Iron Fist, que só funciona dentro do Grappler.' },
          { cls: 'War Master', master: true, why: 'Lv30. Quick Riposte e +20 de crit.' },
        ],
      },
      {
        id: 'espada',
        label: 'Espada: Hero → Swordmaster',
        stages: [
          { cls: 'Brigand', master: true, why: 'Death Blow primeiro.' },
          { cls: 'Hero', why: 'Axe C já está feito; falta Sword B. Vantage e Swordfaire inatos.' },
          { cls: 'Swordmaster', master: true, why: 'Sword A. Astra só funciona dentro da classe.' },
        ],
      },
    ],
    notes: [
      'Byleth não tem Goals: as skills dele só sobem com Faculty Training e usando a arma em combate.',
      'Rota Punhos leva Brawl de E+ até A: 1.280 XP. Use manoplas em mapas fáceis. A Vajra-Mushti (Black Market Scheme, ou no inventário do Balthus — confira) ataca duas vezes, o que dobra o ganho; Byleth tem Crest, então não toma os 10 de dano da relíquia.',
      'Rota Espada é a confortável: Sword já está em C e ele tem a Sword of the Creator. Byleth também ganha uma classe própria mais tarde (sem spoiler) que favorece espada.',
      'Recrutar vem antes de Brawl: no Part 1, gaste o Faculty Training dele nas skills que destravam recrutas (aba Recrutamento) e o que sobrar em Brawl. A ordem do domingo está na aba Mosteiro.',
      'Pontos fortes dele: Sword, Brawl e Authority (30 XP por sessão em vez de 20). Faith é o budding talent: depois de 6 sessões de Faith, ela também passa a render 30.',
    ],
  },
  {
    id: 'edelgard',
    name: 'Edelgard',
    house: 'be',
    gender: 'f',
    crest: true,
    role: 'titular',
    tags: ['físico', 'voo'],
    summary: 'Dano físico com machado. Bem encaminhada para Wyvern Rider no Lv20.',
    plans: [
      {
        id: 'wyvern',
        label: 'Brigand → Wyvern Rider → Wyvern Lord',
        stages: [
          { cls: 'Brigand', master: true, why: 'Death Blow antes de sair.' },
          { cls: 'Wyvern Rider', master: true, why: 'Axe B + Flying C no Lv20.' },
          { cls: 'Wyvern Lord', why: 'Lv30: Axe A, Flying A e Lance C.' },
        ],
      },
    ],
    milestones: [{ skill: 'axe', rank: 'A', why: 'Lightning Axe e Wyvern Lord' }],
    learn: learn(
      ['axe', 'C+', 'Monster Breaker', 'art'], ['axe', 'A', 'Lightning Axe', 'art'],
      ['sword', 'C+', 'Haze Slice', 'art'], ['sword', 'A', 'Hexblade', 'art'],
      ['reason', 'D', 'Fire'], ['reason', 'C', 'Bolganone'], ['reason', 'B', 'Luna Λ'], ['reason', 'A', 'Hades Ω'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Recover'], ['faith', 'B', 'Seraphim'],
      ['authority', 'C', 'Battalion Vantage', 'ability'],
      ['reason', 'budding', 'Black Magic Crit +10', 'ability'],
    ),
    likes: { gifts: ['Armored Bear Stuffy', 'Board Game', 'Monarch Studies Book', 'Carnation'] },
    birthday: '6/22',
    notes: [
      'Como os outros líderes de casa, ela recebe uma classe exclusiva mais tarde (sem spoiler). Axe sempre serve; Flying só compensa se você preferir Wyvern Lord a essa classe quando ela aparecer.',
      'Continue subindo Authority aos poucos: battalions melhores pedem rank mais alto.',
    ],
  },
  {
    id: 'petra',
    name: 'Petra',
    house: 'be',
    gender: 'f',
    crest: false,
    role: 'titular',
    tags: ['físico', 'voo'],
    summary: 'Velocidade e mobilidade. Flying já está em C; o gargalo é Axe B.',
    plans: [
      {
        id: 'wyvern',
        label: 'Brigand → Wyvern Rider → Wyvern Lord',
        stages: [
          { cls: 'Brigand', master: true, why: 'Death Blow antes de sair.' },
          { cls: 'Wyvern Rider', master: true, why: 'Axe B + Flying C no Lv20.' },
          { cls: 'Wyvern Lord', why: 'Lv30: Axe A, Flying A e Lance C.' },
        ],
      },
    ],
    milestones: [{ skill: 'axe', rank: 'A', why: 'Diamond Axe e Wyvern Lord' }],
    learn: learn(
      ['axe', 'C', 'Wild Abandon', 'art'], ['axe', 'A', 'Diamond Axe', 'art'],
      ['sword', 'C+', 'Bane of Monsters', 'art'], ['sword', 'A', 'Finesse Blade', 'art'],
      ['bow', 'C+', 'Waning Shot', 'art'],
      ['reason', 'D', 'Wind'], ['reason', 'C', 'Sagittae'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Restore'],
      ['authority', 'C', 'Battalion Wrath', 'ability'],
    ),
    likes: { gifts: ['Exotic Spices', 'Hunting Dagger', 'Smoked Meat', 'Sunflower'] },
    birthday: '9/7',
    notes: [
      'Res 3: mantenha longe de magos inimigos.',
      'Não gaste aulas em Flying agora — C já basta para Wyvern Rider. Goals: Axe.',
      'Alternativa: Assassin (Sword B + Bow C) por Lethality, só se quiser variar.',
    ],
  },
  {
    id: 'bernadetta',
    name: 'Bernadetta',
    house: 'be',
    gender: 'f',
    crest: true,
    role: 'titular',
    tags: ['físico', 'alcance'],
    summary: 'Arqueira. Deveria estar em Archer já; Vengeance (Lance C+) está perto.',
    plans: [
      {
        id: 'sniper',
        label: 'Archer → Sniper (confortável)',
        stages: [
          { cls: 'Fighter', optional: true, why: 'Só termine Strength +2 se faltar muito pouco.' },
          { cls: 'Archer', master: true, why: 'Hit +20 resolve a precisão de arco e de Vengeance.' },
          { cls: 'Sniper', master: true, why: "Bow A no Lv20. Hunter's Volley — fique em Sniper." },
        ],
      },
      {
        id: 'cavalo',
        label: 'Archer → Paladin → Bow Knight',
        stages: [
          { cls: 'Archer', master: true, why: 'Hit +20.' },
          { cls: 'Paladin', why: 'Lance B + Riding B: Canto e Lancefaire para Vengeance.' },
          { cls: 'Bow Knight', why: 'Lv30: Bow A, Riding A, Lance C. Bowrange +2.' },
        ],
      },
    ],
    milestones: [
      { skill: 'lance', rank: 'C+', why: 'Vengeance', now: true },
      { skill: 'bow', rank: 'C+', why: 'Deadeye' },
    ],
    learn: learn(
      ['lance', 'C+', 'Vengeance', 'art'],
      ['bow', 'C+', 'Deadeye', 'art'], ['bow', 'A', 'Encloser', 'art'],
      ['reason', 'D', 'Blizzard'], ['reason', 'D+', 'Thunder'], ['reason', 'C', 'Thoron'], ['reason', 'A', 'Fimbulvetr'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Physic'], ['faith', 'A', 'Rescue'],
      ['authority', 'C', 'Battalion Wrath', 'ability'],
      ['riding', 'budding', 'Pass', 'ability'],
    ),
    likes: {
      gifts: ['Armored Bear Stuffy', 'Book of Sheet Music', 'Dapper Handkerchief', 'Landscape Painting', 'Watering Can', 'Pitcher Plant'],
    },
    birthday: '12/12',
    notes: [
      'Vengeance soma ao Mt o HP que falta. Não precisa ficar com 1 HP: basta não estar cheia. Use com lança, em qualquer classe.',
      'Persecution Complex (pessoal): +5 de ataque depois que ela leva um golpe.',
      "Hunter's Volley só funciona enquanto ela estiver em Sniper.",
    ],
  },
  {
    id: 'shamir',
    name: 'Shamir',
    house: 'church',
    gender: 'f',
    crest: false,
    role: 'titular',
    tags: ['físico', 'alcance'],
    summary: 'Entra pronta como Sniper (Bow A). Fica com você na Crimson Flower se recrutada no Part 1.',
    recruit: { kind: 'faculty', from: 6, levels: { none: 15, C: 12, 'C+': 9, B: 6, 'B+': 3 } },
    start: { cls: 'Sniper', level: 11, ranks: { bow: 'A', lance: 'C+', authority: 'D' } },
    plans: [
      {
        id: 'sniper',
        label: 'Sniper',
        stages: [
          { cls: 'Sniper', master: true, why: "Hunter's Volley logo cedo." },
          { cls: 'Bow Knight', optional: true, why: 'Lv30 opcional: precisa Riding A e Lance C.' },
        ],
      },
    ],
    learn: learn(
      ['lance', 'C+', 'Hit and Run', 'art'], ['lance', 'A', 'Lance Jab', 'art'],
      ['bow', 'C+', 'Heavy Draw', 'art'], ['bow', 'A', 'Monster Blast', 'art'],
    ),
    goals: [{ skill: 'authority', rank: 'B', why: 'battalions' }, { skill: 'bow', rank: 'S', why: 'dano de arco' }],
    likes: { gifts: ['Book of Sheet Music', 'Coffee Beans', 'Exotic Spices', 'Hunting Dagger', 'Sunflower'] },
    birthday: '3/27',
    notes: [
      'Survival Instinct (pessoal): kill na player phase dá +4 de Str, Mag, Dex e Spd.',
      "Não tire ela de Sniper antes de Hunter's Volley.",
    ],
  },
  {
    id: 'ingrid',
    name: 'Ingrid',
    house: 'bl',
    gender: 'f',
    crest: true,
    role: 'titular',
    tags: ['físico', 'voo'],
    summary: 'Voadora física resistente a magia. Recrute antes de Rumored Nuptials para ganhar a Luín.',
    recruit: studentTiers('dex', 'flying', {
      none: [15, 'D'], C: [12, 'D'], 'C+': [9, 'D'], B: [6, 'E+'], 'B+': [3, 'E+'],
    }),
    plans: [
      {
        id: 'falcon',
        label: 'Pegasus Knight → Falcon Knight',
        stages: [
          { cls: 'Pegasus Knight', master: true, why: 'Lance C + Flying D no Lv10. Darting Blow.' },
          { cls: 'Falcon Knight', why: 'Lv30: Lance A, Flying B+ e Sword C.' },
        ],
      },
    ],
    milestones: [{ skill: 'lance', rank: 'C', why: 'Hit and Run' }],
    learn: learn(
      ['lance', 'C', 'Hit and Run', 'art'], ['lance', 'A', 'Frozen Lance', 'art'], ['sword', 'A', 'Hexblade', 'art'],
      ['reason', 'D', 'Blizzard'], ['reason', 'C', 'Thoron'], ['reason', 'A', 'Fimbulvetr'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Physic'], ['faith', 'B', 'Seraphim'],
      ['authority', 'D', 'Rally Magic', 'ability'], ['authority', 'C', 'Battalion Desperation', 'ability'],
    ),
    likes: {
      gifts: ['Legends of Chivalry', 'Riding Boots', 'Smoked Meat'],
      lost: ['Pegasus Horseshoes', 'Jousting Almanac', 'Curry Comb'],
    },
    birthday: '1/4',
    notes: [
      'Luín: lança relíquia. Com a Crest dela, libera Burning Quake.',
      'Entre o Lv20 e o 30 ela pode continuar Pegasus Knight; a avançada voadora (Wyvern Rider) pede Axe B.',
    ],
  },
  {
    id: 'dorothea',
    name: 'Dorothea',
    house: 'be',
    gender: 'f',
    crest: false,
    role: 'titular',
    tags: ['dança', 'cura'],
    summary: 'Plano atual: Dancer no Cap. 9, com Physic e Meteor (Reason A) para linked attacks.',
    plans: [
      {
        id: 'dancer',
        label: 'Mage → Dancer',
        stages: [
          { cls: 'Mage', master: true, why: 'Fiendish Blow se der tempo antes do Cap. 9 — não é obrigatório.' },
          { cls: 'Dancer', why: 'Só vencendo o White Heron Cup (Cap. 9).' },
        ],
      },
      {
        id: 'maga',
        label: 'Mage → Warlock → Gremory',
        stages: [
          { cls: 'Mage', master: true, why: 'Fiendish Blow.' },
          { cls: 'Warlock', why: 'Reason A no Lv20.' },
          { cls: 'Gremory', why: 'Lv30: Reason A + Faith A.' },
        ],
      },
    ],
    milestones: [{ skill: 'reason', rank: 'A', why: 'Meteor' }],
    learn: learn(
      ['reason', 'D', 'Thunder'], ['reason', 'C', 'Thoron'], ['reason', 'B', 'Sagittae'], ['reason', 'A', 'Meteor'], ['reason', 'A+', "Agnea's Arrow"],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Physic'],
      ['authority', 'D', 'Rally Charm', 'ability'], ['authority', 'C', 'Battalion Desperation', 'ability'],
      ['faith', 'budding', 'White Magic Avo +20', 'ability'],
    ),
    likes: { gifts: ['Book of Sheet Music', 'Gemstone Beads', 'Stylish Hair Clip'] },
    birthday: '9/29',
    notes: [
      'White Heron Cup: cada treino de dança com a representante dá +5 de Cha (uma vez por semana). Cerca de 13+ costuma bastar; salve antes do evento.',
      'Com Meteor equipado (sem gastar), ela faz linked attack à distância mesmo dançando.',
      'Sem Crest: relíquias como Fetters of Dromi dão 10 de dano depois de cada combate. Como Dancer que só dança, isso quase não acontece.',
    ],
  },
  {
    id: 'constance',
    name: 'Constance',
    house: 'aw',
    gender: 'f',
    crest: true,
    role: 'titular',
    tags: ['magia', 'voo'],
    summary: 'Mag 20 no nível 9: a maior artilharia mágica do grupo. Muito frágil.',
    recruit: { kind: 'abyss', from: 3 },
    plans: [
      {
        id: 'dark-flier',
        label: 'Mage → Dark Flier',
        stages: [
          { cls: 'Monk', optional: true, why: 'Troque para Mage no Lv10.' },
          { cls: 'Mage', master: true, why: 'Fiendish Blow.' },
          { cls: 'Dark Flier', why: 'Lv20: Reason B+ e Flying C. Black Tomefaire vale para a magia dela.' },
        ],
      },
      {
        id: 'gremory',
        label: 'Mage → Gremory (artilharia)',
        stages: [
          { cls: 'Monk', optional: true, why: 'Troque para Mage no Lv10.' },
          { cls: 'Mage', master: true, why: 'Fiendish Blow.' },
          { cls: 'Warlock', optional: true, why: 'Se tiver Reason A no Lv20.' },
          { cls: 'Gremory', why: 'Lv30: Reason A + Faith A. Dobra Bolting e Rescue.' },
        ],
      },
    ],
    milestones: [
      { skill: 'reason', rank: 'A', why: 'Bolting' },
      { skill: 'faith', rank: 'B', why: 'Rescue' },
    ],
    learn: learn(
      ['reason', 'D', 'Fire'], ['reason', 'C', 'Sagittae'], ['reason', 'B', 'Fimbulvetr'], ['reason', 'A', 'Bolting'], ['reason', 'A+', "Agnea's Arrow"],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Ward'], ['faith', 'B', 'Rescue'], ['faith', 'A', 'Abraxas'],
      ['authority', 'D', 'Rally Magic', 'ability'], ['authority', 'C', 'Rally Resistance', 'ability'],
      ['sword', 'C+', 'Soulblade', 'art'],
      ['brawl', 'budding', 'Mystic Blow', 'art'],
    ),
    likes: {
      gifts: ['Arithmetic Textbook', 'Book of Crest Designs', 'Tea Leaves', 'Lily of the Valley'],
    },
    birthday: '3/20',
    notes: [
      'HP 25, Def 4, Spd 8: ataque e recue. Nunca termine o turno ao alcance de físicos.',
      'Ela pode já ter um Abyssian Exam Pass no inventário. Senão: 750 de Renown no Pagan Altar (Abismo).',
    ],
  },
  {
    id: 'hapi',
    name: 'Hapi',
    house: 'aw',
    gender: 'f',
    crest: true,
    role: 'titular',
    tags: ['magia', 'cura'],
    summary: 'Controle com Dark Magic (Banshee) e cura. Valkyrie dá montaria e +1 de alcance.',
    recruit: { kind: 'abyss', from: 4 },
    plans: [
      {
        id: 'valkyrie',
        label: 'Mage → Valkyrie',
        stages: [
          { cls: 'Monk', optional: true, why: 'Troque para Mage no Lv10.' },
          { cls: 'Mage', master: true, why: 'Fiendish Blow.' },
          { cls: 'Valkyrie', master: true, why: 'Lv20: Reason B + Riding B. +1 de alcance em Dark Magic.' },
          { cls: 'Gremory', optional: true, why: 'Lv30 se quiser Warp em dobro (Faith A).' },
        ],
      },
      {
        id: 'dark-knight',
        label: 'Mage → Valkyrie → Dark Knight',
        stages: [
          { cls: 'Mage', master: true, why: 'Fiendish Blow.' },
          { cls: 'Valkyrie', master: true, why: 'Uncanny Blow.' },
          { cls: 'Dark Knight', why: 'Lv30: Reason B+, Riding A, Lance C.' },
        ],
      },
    ],
    milestones: [
      { skill: 'faith', rank: 'C', why: 'Physic', now: true },
      { skill: 'faith', rank: 'A', why: 'Warp' },
    ],
    learn: learn(
      ['reason', 'D', 'Miasma Δ'], ['reason', 'D+', 'Swarm Z'], ['reason', 'C', 'Banshee Θ'], ['reason', 'B', 'Death Γ'], ['reason', 'A', 'Hades Ω'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Physic'], ['faith', 'B', 'Seraphim'], ['faith', 'A', 'Warp'],
      ['authority', 'D', 'Rally Dexterity', 'ability'], ['authority', 'C', 'Battalion Wrath', 'ability'],
      ['axe', 'budding', 'Exhaustive Strike', 'art'],
    ),
    likes: {
      gifts: ['Coffee Beans', 'Exotic Spices', 'Hunting Dagger', 'Smoked Meat', 'Tasty Baked Treat', 'Pitcher Plant'],
    },
    birthday: '1/15',
    notes: [
      'Physic (Faith C) primeiro: cura à distância enquanto a Dorothea dança.',
      'Dark Magic erra mais: use Banshee/Swarm para controlar, não para finalizar.',
      'Ela usa Dark Magic: não planeje Dark Flier esperando o Black Tomefaire.',
    ],
  },
  {
    id: 'lysithea',
    name: 'Lysithea',
    house: 'gd',
    gender: 'f',
    crest: true,
    role: 'titular',
    tags: ['magia'],
    summary: 'O maior dano mágico disponível. Prioridade nº 1 de recrutamento social.',
    recruit: studentTiers('mag', 'faith', {
      none: [15, 'B'], C: [12, 'C+'], 'C+': [9, 'C'], B: [6, 'D+'], 'B+': [3, 'D'],
    }),
    plans: [
      {
        id: 'gremory',
        label: 'Mage → Gremory',
        stages: [
          { cls: 'Mage', master: true, why: 'Fiendish Blow.' },
          { cls: 'Dark Flier', optional: true, why: 'Lv20 opcional (Pass): voo e Canto até o Lv30.' },
          { cls: 'Gremory', why: 'Lv30: Reason A + Faith A. Dobra a Dark Magic dela.' },
        ],
      },
      {
        id: 'valkyrie',
        label: 'Mage → Valkyrie → Gremory',
        stages: [
          { cls: 'Mage', master: true, why: 'Fiendish Blow.' },
          { cls: 'Valkyrie', why: 'Lv20 (Pass): +1 de alcance em Dark Magic, Canto.' },
          { cls: 'Gremory', why: 'Lv30.' },
        ],
      },
    ],
    milestones: [
      { skill: 'reason', rank: 'B', why: 'Dark Spikes' },
      { skill: 'faith', rank: 'B', why: 'Warp' },
    ],
    learn: learn(
      ['reason', 'D', 'Miasma Δ'], ['reason', 'D+', 'Swarm Z'], ['reason', 'C', 'Luna Λ'], ['reason', 'B', 'Dark Spikes T'], ['reason', 'A', 'Hades Ω'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Seraphim'], ['faith', 'B', 'Warp'], ['faith', 'A', 'Abraxas'],
      ['authority', 'C', 'Battalion Desperation', 'ability'],
      ['sword', 'budding', 'Soulblade', 'art'],
    ),
    likes: {
      gifts: ['Arithmetic Textbook', 'Armored Bear Stuffy', 'Book of Crest Designs', 'Tasty Baked Treat'],
    },
    birthday: '2/28',
    notes: [
      'A magia ofensiva dela é Dark Magic. Warlock só dobra Black Magic, por isso o alvo é Gremory (dobra tudo).',
      'Thyrsus (+2 de alcance mágico) é para ela: tem Crest, então não toma o dano da relíquia.',
      'Def baixíssima: nunca deixe ao alcance de físicos.',
    ],
  },
  {
    id: 'marianne',
    name: 'Marianne',
    house: 'gd',
    gender: 'f',
    crest: true,
    role: 'rotacao',
    tags: ['cura'],
    summary: 'Cura dedicada. Physic cedo, Bishop no Lv20.',
    recruit: studentTiers('mag', 'riding', {
      none: [10, 'C'], C: [8, 'C'], 'C+': [6, 'D+'], B: [4, 'D'], 'B+': [2, 'E+'],
    }),
    plans: [
      {
        id: 'bishop',
        label: 'Priest → Bishop',
        stages: [
          { cls: 'Priest', master: true, why: 'Faith C. Miracle.' },
          { cls: 'Bishop', why: 'Faith A no Lv20: cura +10 e magia branca em dobro.' },
        ],
      },
      {
        id: 'holy-knight',
        label: 'Priest → Bishop → Holy Knight',
        stages: [
          { cls: 'Priest', master: true, why: 'Miracle.' },
          { cls: 'Bishop', master: true, why: 'Renewal.' },
          { cls: 'Holy Knight', why: 'Lv30: Faith B+, Riding A, Lance C. Combina com Frozen Lance.' },
        ],
      },
    ],
    milestones: [{ skill: 'faith', rank: 'C', why: 'Physic' }],
    learn: learn(
      ['reason', 'D', 'Blizzard'], ['reason', 'C', 'Thoron'], ['reason', 'B', 'Cutting Gale'], ['reason', 'A', 'Fimbulvetr'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Physic'], ['faith', 'B', 'Silence'], ['faith', 'A', 'Aura'],
      ['authority', 'C', 'Battalion Renewal', 'ability'],
      ['sword', 'C+', 'Soulblade', 'art'],
      ['lance', 'budding', 'Frozen Lance', 'art'],
    ),
    likes: {
      gifts: ['Armored Bear Stuffy', 'Dapper Handkerchief', 'Floral Adornment', 'Lily of the Valley'],
    },
    birthday: '11/23',
    notes: [
      'Dorothea e Hapi já têm Physic. Por isso ela começa como 11ª (rotação), não como titular fixa.',
      'Ela tem um paralogue próprio na Parte 2.',
    ],
  },
  {
    id: 'mercedes',
    name: 'Mercedes',
    house: 'bl',
    gender: 'f',
    crest: true,
    role: 'reserva',
    tags: ['cura'],
    summary: 'A melhor curandeira pura: Fortify (Faith A) cura todo mundo no alcance.',
    recruit: studentTiers('mag', 'bow', {
      none: [15, 'C'], C: [12, 'C'], 'C+': [9, 'D+'], B: [6, 'D'], 'B+': [3, 'E+'],
    }),
    plans: [
      { id: 'bishop', label: 'Priest → Bishop', stages: [{ cls: 'Priest', master: true }, { cls: 'Bishop', why: 'Faith A.' }] },
    ],
    learn: learn(
      ['reason', 'D', 'Fire'], ['reason', 'D+', 'Thunder'], ['reason', 'C', 'Bolganone'], ['reason', 'A', 'Ragnarok'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Physic'], ['faith', 'B', 'Restore'], ['faith', 'A', 'Fortify'],
      ['bow', 'budding', 'Waning Shot', 'art'],
    ),
    likes: {
      gifts: ['Armored Bear Stuffy', 'Gemstone Beads', 'Goddess Statuette', 'Tasty Baked Treat', 'Lavender'],
    },
    birthday: '5/27',
  },
  {
    id: 'annette',
    name: 'Annette',
    house: 'bl',
    gender: 'f',
    crest: true,
    role: 'reserva',
    tags: ['magia'],
    summary: 'Maga de suporte. A mesma Faith que destrava a Lysithea destrava ela.',
    recruit: studentTiers('mag', 'faith', {
      none: [10, 'B'], C: [8, 'C+'], 'C+': [6, 'C'], B: [4, 'D+'], 'B+': [2, 'D'],
    }),
    plans: [
      { id: 'warlock', label: 'Mage → Warlock → Gremory', stages: [{ cls: 'Mage', master: true }, { cls: 'Warlock' }, { cls: 'Gremory' }] },
    ],
    learn: learn(
      ['reason', 'D', 'Wind'], ['reason', 'C', 'Cutting Gale'], ['reason', 'B', 'Sagittae'], ['reason', 'A', 'Excalibur'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Recover'], ['faith', 'A', 'Abraxas'],
    ),
    likes: { gifts: ['Arithmetic Textbook', 'Book of Sheet Music', 'Stylish Hair Clip'] },
    birthday: '5/9',
    notes: ['Disputa a mesma função de Constance, Hapi e Lysithea.'],
  },
  {
    id: 'leonie',
    name: 'Leonie',
    house: 'gd',
    gender: 'f',
    crest: false,
    role: 'reserva',
    tags: ['físico', 'alcance'],
    summary: 'Física versátil (arco e lança). Byleth já tem a Str; falta Lance.',
    recruit: studentTiers('str', 'lance', {
      none: [15, 'C'], C: [12, 'C'], 'C+': [9, 'D+'], B: [6, 'D'], 'B+': [3, 'E+'],
    }),
    plans: [
      { id: 'bow-knight', label: 'Archer → Bow Knight', stages: [{ cls: 'Archer', master: true }, { cls: 'Paladin' }, { cls: 'Bow Knight' }] },
    ],
    learn: learn(
      ['lance', 'C+', 'Monster Piercer', 'art'], ['lance', 'A', 'Lance Jab', 'art'],
      ['bow', 'C+', 'Break Shot', 'art'], ['bow', 'A', 'Point-Blank Volley', 'art'],
    ),
    likes: { gifts: ['Fishing Float', 'Hunting Dagger', 'Training Weight'] },
    birthday: '2/21',
    notes: ['Rivalry (pessoal) só funciona ao lado de um homem: num time quase todo feminino, basicamente ao lado do Byleth.'],
  },
  {
    id: 'manuela',
    name: 'Manuela',
    house: 'church',
    gender: 'f',
    crest: false,
    role: 'reserva',
    tags: ['cura', 'magia'],
    summary: 'Recrutável no Cap. 8. Libera Oil and Water (Experience Gem).',
    recruit: { kind: 'faculty', from: 8, levels: { none: 15, C: 12, 'C+': 9, B: 6, 'B+': 3 } },
    plans: [{ id: 'bishop', label: 'Bishop / Gremory', stages: [{ cls: 'Bishop' }, { cls: 'Gremory', optional: true }] }],
    learn: learn(
      ['reason', 'D', 'Thunder'], ['reason', 'C', 'Bolganone'], ['reason', 'A', 'Bolting'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Ward'], ['faith', 'B', 'Silence'], ['faith', 'A', 'Warp'],
    ),
    likes: { gifts: ['Blue Cheese', 'Book of Sheet Music', 'Gemstone Beads', 'Goddess Statuette'] },
    birthday: '8/3',
  },
  {
    id: 'anna',
    name: 'Anna',
    house: 'dlc',
    gender: 'f',
    crest: false,
    supports: false,
    role: 'reserva',
    tags: ['físico'],
    summary: 'Reserva utilitária. Sem supports: não gaste refeições nem chá esperando suporte.',
    plans: [
      {
        id: 'trickster',
        label: 'Thief → Trickster',
        stages: [
          { cls: 'Myrmidon', optional: true },
          { cls: 'Thief', why: 'Sword C no Lv10. Abre baús (Locktouch).' },
          { cls: 'Trickster', why: 'Lv20 (Pass): Sword B + Faith B.' },
        ],
      },
    ],
    learn: learn(
      ['sword', 'C+', 'Soulblade', 'art'], ['sword', 'A', 'Hexblade', 'art'], ['bow', 'C+', 'Break Shot', 'art'], ['axe', 'C+', 'Spike', 'art'],
      ['reason', 'D', 'Fire'], ['reason', 'D+', 'Thunder'], ['reason', 'A', 'Meteor'],
      ['faith', 'D', 'Heal'], ['faith', 'D+', 'Nosferatu'], ['faith', 'C', 'Ward'], ['faith', 'B', 'Rescue'],
      ['riding', 'budding', 'Pass', 'ability'],
    ),
    likes: { gifts: ['Blue Cheese', 'Coffee Beans', 'Exotic Spices', 'Goddess Statuette', 'Landscape Painting', 'Forget-me-nots'] },
    birthday: '6/9',
    notes: ['O paralogue dela (The Secret Merchant) fica na Parte 2 nesta rota.'],
  },
  {
    id: 'flayn',
    name: 'Flayn',
    house: 'church',
    gender: 'f',
    crest: true,
    role: 'temporaria',
    tags: ['cura'],
    summary: 'Entra sozinha mais à frente e não fica na Crimson Flower. Não invista nela.',
    recruit: { kind: 'auto', from: 7 },
    notes: ['Serve para An Ocean View (Cap. 9–11): os itens do paralogue ficam com você.'],
  },
  {
    id: 'lorenz',
    name: 'Lorenz',
    house: 'gd',
    gender: 'm',
    crest: true,
    role: 'utilitario',
    tags: [],
    summary: 'Só pelo paralogue Land of the Golden Deer (Cap. 7–11): Thyrsus para a Lysithea.',
    recruit: studentTiers('cha', 'reason', {
      none: [20, 'C'], C: [16, 'C'], 'C+': [12, 'D+'], B: [8, 'D'], 'B+': [4, 'E+'],
    }),
    likes: { gifts: ['Book of Sheet Music', 'Floral Adornment', 'Tea Leaves', 'Rose'] },
    birthday: '6/13',
    notes: ['Ele é obrigatório no mapa do paralogue, mas não precisa de treino nem de vaga depois.'],
  },
  {
    id: 'balthus',
    name: 'Balthus',
    house: 'aw',
    gender: 'm',
    crest: true,
    role: 'utilitario',
    tags: [],
    summary: 'Grátis no Abismo. Libera Black Market Scheme com a Hapi (Vajra-Mushti).',
    recruit: { kind: 'abyss', from: 5 },
    notes: ['Pode já carregar uma Vajra-Mushti e um Abyssian Exam Pass — confira o inventário ao recrutar.'],
  },
  {
    id: 'yuri',
    name: 'Yuri',
    house: 'aw',
    gender: 'm',
    crest: true,
    role: 'utilitario',
    tags: [],
    summary: 'Grátis no Abismo. Com ele recrutado, A Cursed Relic também dá Mockingbird\'s Thieves.',
    recruit: { kind: 'abyss', from: 6 },
  },
];

export const UNIT_BY_ID = Object.fromEntries(UNITS.map((u) => [u.id, u]));
