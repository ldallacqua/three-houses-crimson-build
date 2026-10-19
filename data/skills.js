// Skills, ranks and stats as the game names them. Rank experience is the total a skill needs to
// reach each rank (Fire Emblem Wiki, "Skill experience", Three Houses row).

export const SKILLS = [
  { id: 'sword', name: 'Sword' },
  { id: 'lance', name: 'Lance' },
  { id: 'axe', name: 'Axe' },
  { id: 'bow', name: 'Bow' },
  { id: 'brawl', name: 'Brawl' },
  { id: 'reason', name: 'Reason' },
  { id: 'faith', name: 'Faith' },
  { id: 'authority', name: 'Authority' },
  { id: 'heavyArmor', name: 'Heavy Armor' },
  { id: 'riding', name: 'Riding' },
  { id: 'flying', name: 'Flying' },
];

export const SKILL_NAME = Object.fromEntries(SKILLS.map((s) => [s.id, s.name]));

export const RANKS = ['E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+', 'S', 'S+'];
export const RANK_XP = [0, 40, 100, 180, 300, 460, 680, 960, 1320, 1760, 2520, 3600];

export const STATS = [
  { id: 'hp', name: 'HP' },
  { id: 'str', name: 'Str' },
  { id: 'mag', name: 'Mag' },
  { id: 'dex', name: 'Dex' },
  { id: 'spd', name: 'Spd' },
  { id: 'lck', name: 'Lck' },
  { id: 'def', name: 'Def' },
  { id: 'res', name: 'Res' },
  { id: 'cha', name: 'Cha' },
];

export const STAT_NAME = Object.fromEntries(STATS.map((s) => [s.id, s.name]));

// Support ranks the game shows for Byleth and a student, lowest first. 'none' means no rank yet.
export const SUPPORTS = ['none', 'C', 'B', 'A', 'S'];

// C+ and B+ also exist and lower what a recruit asks, but the game never shows them: C+ sits
// between C and B, B+ between B and A (Fire Emblem Wiki, Support: 101 C, 201 C+, 301 B, 451 B+).
export const HIDDEN_SUPPORT = { C: 'C+', B: 'B+' };

// Faculty Training: 20 skill experience a session, +10 when the skill is one of Byleth's strengths,
// and a "Great" result multiplies it by 1.5 (Serenes Forest, Faculty Training).
export const TRAINING_XP = { base: 20, best: 45 };

// Calendar. Chapter n of Part I is played in month CHAPTER_MONTH[n] (Great Tree Moon = April = ch 1).
export const MONTHS = {
  1: 'Guardian Moon', 2: 'Pegasus Moon', 3: 'Lone Moon', 4: 'Great Tree Moon', 5: 'Harpstring Moon',
  6: 'Garland Moon', 7: 'Blue Sea Moon', 8: 'Verdant Rain Moon', 9: 'Horsebow Moon', 10: 'Wyvern Moon',
  11: 'Red Wolf Moon', 12: 'Ethereal Moon',
};
export const CHAPTER_MONTH = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 1, 11: 2, 12: 3 };

// The last chapter in which students from other houses can still be recruited.
export const RECRUIT_DEADLINE = 11;
