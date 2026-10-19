// Who gives Faculty Training to Byleth and in which skills (Serenes Forest, Faculty Training).
// When someone is away is kept in each chapter's sealed notes, not here, because the reasons are
// part of the story. A chapter's notes list the instructors who are away that month.

export const FACULTY = [
  { id: 'seteth', name: 'Seteth', skills: ['sword', 'lance', 'axe', 'authority', 'flying'] },
  { id: 'manuela', name: 'Manuela', skills: ['sword', 'faith', 'flying'] },
  { id: 'hanneman', name: 'Hanneman', skills: ['bow', 'reason', 'riding'] },
  { id: 'rhea', name: 'Rhea', skills: ['sword', 'brawl', 'reason', 'faith'] },
  { id: 'jeralt', name: 'Jeralt', skills: ['lance', 'authority', 'riding'] },
  { id: 'gilbert', name: 'Gilbert', skills: ['lance', 'axe', 'heavyArmor', 'riding'] },
  { id: 'alois', name: 'Alois', skills: ['axe', 'brawl', 'heavyArmor'] },
  { id: 'catherine', name: 'Catherine', skills: ['sword', 'brawl'] },
  { id: 'shamir', name: 'Shamir', skills: ['lance', 'bow'], note: 'pode sair da lista quando for recrutada; confirme no jogo' },
  { id: 'anna', name: 'Anna', skills: ['sword', 'axe', 'bow', 'faith'], note: 'DLC; pode sair da lista quando for recrutada; confirme no jogo' },
];

export const FACULTY_BY_ID = Object.fromEntries(FACULTY.map((f) => [f.id, f]));
