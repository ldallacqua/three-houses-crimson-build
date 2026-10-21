// The builds the guide offers, the way a build site lists one card per author's plan. A build is a
// whole campaign plan: who joins the army, which classes, in what order to recruit and what to do
// each chapter. There is one today, and the plan lives in data/units.js (roster, roles, class
// paths), data/paralogues.js (who keeps each reward) and the sealed notes in data/chapters.js; a
// second build would bring its own copies of those.

export const BUILDS = [
  {
    id: 'corte-carmesim',
    name: 'Corte Carmesim',
    tagline: 'A waifu build da Flor Carmesim',
    author: 'ldallacqua',
    updated: '20/10/2026',
    route: 'Crimson Flower',
    house: 'Black Eagles',
    lead: 'edelgard',
    pitch: 'Byleth no comando e a Edelgard na linha de frente, cercados pelas melhores aliadas de Fódlan: magia pesada, voadoras, duas arqueiras e a Dancer. Cada recruta foi escolhida pelo que rende em batalha, não só pelo rosto.',
    faces: ['edelgard', 'lysithea', 'constance', 'ingrid', 'dorothea', 'petra', 'bernadetta', 'hapi', 'shamir', 'marianne'],
    facts: [
      ['Rota', 'Crimson Flower (Black Eagles)'],
      ['Byleth', 'masculino'],
      ['Dificuldade', 'Normal ou Hard'],
      ['DLC', 'Expansion Pass recomendado: Constance e Hapi são titulares'],
    ],
    highlights: [
      'Recrutamento planejado desde o Cap. 1: o treino do Byleth vai para o que destrava cada recruta.',
      'Classe por classe, com maestrias na ordem certa (Death Blow, Fiendish Blow, Hit +20).',
      'Quem fica com cada relíquia e item raro, capítulo a capítulo.',
      'Notas lacradas por capítulo: nada da história além de onde você está.',
    ],
  },
];

export const BUILD_BY_ID = Object.fromEntries(BUILDS.map((b) => [b.id, b]));
