// Everything the page works out from the state: what a unit is missing for a class, what Byleth is
// missing to recruit someone, which Goals to set, what is due this chapter. Pure functions over the
// data and the state, so the tests can run them in Node.

import { RANKS, RANK_XP, SKILLS, SUPPORTS, HIDDEN_SUPPORT, TRAINING_XP, RECRUIT_DEADLINE, CHAPTER_MONTH } from '../data/skills.js';
import { CLASS_BY_NAME, MASTERY_XP } from '../data/classes.js';
import { UNITS, UNIT_BY_ID } from '../data/units.js';
import { FACULTY } from '../data/faculty.js';
import { PARALOGUES, PARALOGUE_BY_ID } from '../data/paralogues.js';
import { SOCIAL } from '../data/social.js';

// ---------- ranks ----------

export const rankIndex = (rank) => (rank == null ? -1 : RANKS.indexOf(rank));

export const meetsRank = (have, need) => have != null && rankIndex(have) >= rankIndex(need);

/** Experience still needed, counted from the start of the current rank (the bar may be part full). */
export function xpToRank(have, need) {
  const from = have == null ? 0 : RANK_XP[rankIndex(have)];
  return Math.max(0, RANK_XP[rankIndex(need)] - from);
}

/** Faculty Training sessions for that much experience: best case (strength and "Great") to plain. */
export function sessionsFor(xp) {
  if (!xp) return { min: 0, max: 0 };
  return { min: Math.ceil(xp / TRAINING_XP.best), max: Math.ceil(xp / TRAINING_XP.base) };
}

export const supportIndex = (s) => SUPPORTS.indexOf(s ?? 'none');

// ---------- state helpers ----------

export function unitState(state, id) {
  return state.units?.[id] ?? {};
}

export function roleOf(state, id) {
  return unitState(state, id).role ?? UNIT_BY_ID[id]?.role ?? 'reserva';
}

/** Whether a unit fights for you right now. Units that join by themselves count from their chapter. */
export function isRecruited(state, id) {
  if (id === 'byleth') return true;
  const def = UNIT_BY_ID[id];
  const st = unitState(state, id);
  if (st.recruited) return true;
  if (def?.recruit?.kind === 'auto') return state.chapter >= def.recruit.from && state.chapter <= RECRUIT_DEADLINE;
  return false;
}

/** The plan picked on the sheet; without one, the plan that has the unit's current class, else the first. */
export function planOf(def, st) {
  if (!def?.plans?.length) return null;
  return def.plans.find((p) => p.id === st.plan)
    ?? def.plans.find((p) => p.stages.some((s) => s.cls === st.cls))
    ?? def.plans[0];
}

// ---------- classes ----------

/** What a unit has and lacks for a class. Unknown ranks count as missing and are flagged. */
export function classCheck(clsName, unit) {
  const cls = CLASS_BY_NAME[clsName];
  if (!cls) return null;
  const ranks = unit.ranks ?? {};
  const items = Object.entries(cls.reqs).map(([skill, need]) => {
    const have = ranks[skill] ?? null;
    return { skill, need, have, ok: meetsRank(have, need), xp: xpToRank(have, need), unknown: have == null };
  });
  if (cls.reqsAny) {
    const options = Object.entries(cls.reqsAny).map(([skill, need]) => ({ skill, need, have: ranks[skill] ?? null }));
    const ok = options.some((o) => meetsRank(o.have, o.need));
    items.push({ any: true, options, ok, unknown: !ok && options.every((o) => o.have == null), xp: 0 });
  }
  const level = unit.level ?? null;
  const levelOk = !cls.level || (level != null && level >= cls.level);
  const genderOk = !cls.gender || cls.gender === unit.gender;
  const pastClasses = new Set([...(unit.mastered ?? []), unit.cls].filter(Boolean));
  const classOk = !cls.needsClass || pastClasses.has(cls.needsClass);
  const skillsOk = items.every((i) => i.ok);
  // The Dancer comes from an event, not an exam.
  const byEvent = cls.tier === 'unique';
  return {
    cls,
    items,
    level,
    levelOk,
    genderOk,
    classOk,
    skillsOk,
    byEvent,
    ready: !byEvent && levelOk && genderOk && classOk && skillsOk,
    unknown: items.some((i) => i.unknown) || level == null,
  };
}

function unitForCheck(def, st) {
  return { ...st, gender: def.gender, ranks: st.ranks ?? {}, mastered: st.mastered ?? [] };
}

/**
 * The plan laid against the unit: which stage it is on, which comes next and whether the
 * certification can be taken now.
 */
export function planStatus(def, st) {
  const plan = planOf(def, st);
  if (!plan) return null;
  const unit = unitForCheck(def, st);
  const mastered = new Set(unit.mastered);
  const currentIndex = plan.stages.findIndex((s) => s.cls === st.cls);
  // A class outside the plan still says how far the unit got: stages of a lower tier are behind it.
  const now = CLASS_BY_NAME[st.cls];
  const behind = (cls) => currentIndex === -1 && now && now.tier !== 'unique' && TIER_ORDER[cls.tier] < TIER_ORDER[now.tier];
  const stages = plan.stages.map((stage, index) => {
    const cls = CLASS_BY_NAME[stage.cls];
    const status = index < currentIndex || (currentIndex === -1 && (mastered.has(stage.cls) || behind(cls)))
      ? 'done'
      : index === currentIndex ? 'current' : 'future';
    return {
      ...stage,
      index,
      cls,
      status,
      mastered: mastered.has(stage.cls),
      check: classCheck(stage.cls, unit),
    };
  });
  const after = stages.filter((s) => s.index > currentIndex && s.status !== 'done');
  const next = after.find((s) => !s.optional) ?? after[0] ?? null;
  const current = currentIndex >= 0 ? stages[currentIndex] : null;
  return { plan, stages, current, next, following: next ? after.filter((s) => s.index > next.index && !s.optional) : [] };
}

/** Up to two Goals worth setting for a student, with the reason for each. */
export function suggestGoals(def, st, status = planStatus(def, st)) {
  if (def.id === 'byleth') return [];
  const ranks = st.ranks ?? {};
  const picks = [];
  const add = (skill, need, why) => {
    if (picks.some((p) => p.skill === skill)) return;
    if (meetsRank(ranks[skill], need)) return;
    picks.push({ skill, need, have: ranks[skill] ?? null, why, xp: xpToRank(ranks[skill], need) });
  };
  const milestones = def.milestones ?? [];
  milestones.filter((m) => m.now).forEach((m) => add(m.skill, m.rank, m.why));
  if (status?.next) status.next.check.items.filter((i) => !i.any).forEach((i) => add(i.skill, i.need, status.next.cls.name));
  status?.following?.forEach((s) => s.check.items.filter((i) => !i.any).forEach((i) => add(i.skill, i.need, s.cls.name)));
  milestones.filter((m) => !m.now).forEach((m) => add(m.skill, m.rank, m.why));
  (def.goals ?? []).forEach((g) => add(g.skill, g.rank, g.why));
  return picks.slice(0, 2);
}

/** Every skill the rest of the plan still asks of a unit (beyond the two Goals). */
export function skillNeeds(def, st, status = planStatus(def, st)) {
  const ranks = st.ranks ?? {};
  const needs = new Set();
  for (const s of status?.stages ?? []) {
    if (s.status !== 'future' || s.optional) continue;
    for (const i of s.check.items) if (!i.any && !meetsRank(ranks[i.skill], i.need)) needs.add(i.skill);
  }
  for (const m of def.milestones ?? []) if (!meetsRank(ranks[m.skill], m.rank)) needs.add(m.skill);
  return needs;
}

const TIER_ORDER = { beginner: 0, intermediate: 1, advanced: 2, dlc: 2, master: 3, unique: 9 };

/** Whether a class is a step up (or part of the plan) for a unit, so listing it is useful. */
export function isStepUp(def, st, cls) {
  const current = CLASS_BY_NAME[st.cls];
  const planned = (def.plans ?? []).some((p) => p.stages.some((s) => s.cls === cls.name));
  if (planned) return true;
  return !current || TIER_ORDER[cls.tier] > TIER_ORDER[current.tier];
}

/**
 * Advice for one unit, most urgent first. kind: 'certify' | 'master' | 'wait' | 'missing' | 'info'.
 */
export function unitAdvice(def, st, status = planStatus(def, st)) {
  const out = [];
  if (!status) return out;
  const { current, next } = status;
  const masteryPending = current?.master && !current.mastered && current.cls?.mastery?.length;

  if (masteryPending) {
    const names = current.cls.mastery.map((m) => m.name).join(' e ');
    const xp = MASTERY_XP[current.cls.tier];
    const how = xp ? ` (${xp} de XP de classe, +1 por combate)` : '';
    out.push({ kind: 'master', priority: 2, cls: current.cls.name, text: `Dominar ${current.cls.name} para ${names} antes de trocar${how}.` });
  } else if (current?.mastered && current.cls?.mastery?.some((m) => !m.art)) {
    const names = current.cls.mastery.filter((m) => !m.art).map((m) => m.name).join(', ');
    out.push({ kind: 'info', priority: 4, text: `${names} já liberada: confirme que está equipada em Abilities.` });
  }

  if (next) {
    const c = next.check;
    const item = next.cls.item ? ` (${next.cls.item})` : '';
    if (next.cls.tier === 'unique') {
      out.push({ kind: 'wait', priority: 3, cls: next.cls.name, text: `${next.cls.name}: ${next.cls.note ?? 'classe especial.'}` });
    } else if (c.ready && !masteryPending) {
      out.push({ kind: 'certify', priority: 1, cls: next.cls.name, text: `Certificar ${next.cls.name} agora${item}.` });
    } else if (c.ready) {
      out.push({ kind: 'wait', priority: 2, cls: next.cls.name, text: `${next.cls.name} já está liberada; troque assim que dominar ${current.cls.name}.` });
    } else if (c.skillsOk && !c.levelOk) {
      out.push({ kind: 'wait', priority: 3, cls: next.cls.name, text: `Skills prontas para ${next.cls.name}; falta chegar ao Lv ${next.cls.level}.` });
    } else {
      const missing = c.items.filter((i) => !i.ok && !i.any).map((i) => `${i.skill}:${i.need}`);
      out.push({ kind: 'missing', priority: 3, cls: next.cls.name, missing, text: `Para ${next.cls.name}: faltam skills.` });
    }
  }
  return out.sort((a, b) => a.priority - b.priority);
}

// ---------- recruitment ----------

// Requirement tiers, hidden ranks included. A shown rank uses its own tier; the hidden one above it
// (C+ over C, B+ over B) may already apply without the game saying so.
const TIER_KEYS = ['none', 'C', 'C+', 'B', 'B+'];

const tierFor = (support) => (TIER_KEYS.includes(support) ? support : 'none');

/**
 * Where a recruit stands. state: 'recruited' | 'ready' | 'missing' | 'later' | 'auto' | 'missed'.
 * For students it also lists what each support rank would ask of Byleth.
 */
export function recruitStatus(def, state) {
  const r = def.recruit;
  if (!r) return null;
  const st = unitState(state, def.id);
  const chapter = state.chapter;
  const byleth = unitState(state, 'byleth');
  if (isRecruited(state, def.id) && r.kind !== 'auto') return { state: 'recruited' };
  if (r.kind === 'auto') {
    if (chapter < r.from) return { state: 'later', from: r.from };
    return { state: chapter > RECRUIT_DEADLINE ? 'gone' : 'auto' };
  }
  if (r.kind === 'abyss') {
    return chapter >= r.from ? { state: 'ready', how: 'abyss' } : { state: 'later', from: r.from };
  }
  if (chapter > RECRUIT_DEADLINE) return { state: 'missed' };

  const support = st.support ?? 'none';
  if (supportIndex(support) >= supportIndex('A')) return { state: 'ready', support, reason: 'Suporte A: entra sem requisito.' };

  if (r.kind === 'faculty') {
    if (chapter < r.from) return { state: 'later', from: r.from };
    const need = r.levels[tierFor(support)];
    const ok = (byleth.level ?? 0) >= need;
    const hidden = HIDDEN_SUPPORT[support];
    const maybe = !ok && hidden && (byleth.level ?? 0) >= r.levels[hidden] ? { key: hidden, level: r.levels[hidden] } : null;
    return { state: ok ? 'ready' : 'missing', support, maybe, level: { need, have: byleth.level ?? null, ok } };
  }

  // student
  const statHave = byleth.stats?.[r.stat] ?? null;
  const rankHave = byleth.ranks?.[r.skill] ?? null;
  const tiers = TIER_KEYS.map((key) => {
    const t = r.tiers[key];
    const statOk = statHave != null && statHave >= t.stat;
    const rankOk = meetsRank(rankHave, t.rank);
    return { key, ...t, statOk, rankOk, ok: statOk && rankOk, xp: xpToRank(rankHave, t.rank) };
  });
  const tier = tiers.find((t) => t.key === tierFor(support));
  const hidden = tiers.find((t) => t.key === HIDDEN_SUPPORT[support]);
  const maybe = !tier.ok && hidden?.ok ? hidden : null;
  const spontaneous = supportIndex(support) >= supportIndex('B');
  return {
    state: tier.ok ? 'ready' : 'missing',
    support,
    stat: r.stat,
    skill: r.skill,
    statHave,
    rankHave,
    tier,
    tiers,
    maybe,
    spontaneous,
  };
}

/** Recruits the plan still wants: not yet with you, not utility-only by choice of 'ignorar'. */
export function recruitTargets(state) {
  return UNITS.filter((u) => u.recruit && u.recruit.kind !== 'auto' && !isRecruited(state, u.id) && roleOf(state, u.id) !== 'ignorar');
}

/** Instructors who teach a skill and are around in the given chapter notes. */
export function instructorsFor(skill, notes) {
  const away = new Set(notes?.away ?? []);
  if (away.has('*')) return [];
  return FACULTY.filter((f) => f.skills.includes(skill) && !away.has(f.id));
}

/**
 * Byleth's Faculty Training worth doing, per skill: which recruits it unlocks at their current
 * support and at B, how far it is and who teaches it this month.
 */
export function bylethTraining(state, notes) {
  const byleth = unitState(state, 'byleth');
  const bySkill = new Map();
  for (const def of recruitTargets(state)) {
    if (def.recruit.kind !== 'student') continue;
    const rs = recruitStatus(def, state);
    if (!rs || rs.state === 'missed' || rs.state === 'ready') continue;
    const r = def.recruit;
    const have = byleth.ranks?.[r.skill] ?? null;
    const now = rs.tier;
    const atB = rs.tiers.find((t) => t.key === 'B');
    const entry = bySkill.get(r.skill) ?? { skill: r.skill, have, uses: [] };
    entry.uses.push({
      id: def.id,
      name: def.name,
      role: roleOf(state, def.id),
      support: rs.support,
      need: now.rank,
      xp: now.rankOk ? 0 : now.xp,
      statOk: now.statOk,
      needAtB: atB.rank,
      xpAtB: atB.rankOk ? 0 : atB.xp,
    });
    bySkill.set(r.skill, entry);
  }
  // The plan is support B first, so rank skills by who they serve (starters first) and by the
  // experience the support-B requirement still needs.
  return [...bySkill.values()]
    .map((e) => {
      const open = e.uses.filter((u) => u.xp > 0);
      const nearest = open.length ? open.reduce((a, b) => (a.xp <= b.xp ? a : b)) : null;
      const xp = nearest?.xp ?? 0;
      const atB = e.uses.filter((u) => u.xpAtB > 0).map((u) => u.xpAtB);
      const xpAtB = atB.length ? Math.min(...atB) : 0;
      const priority = Math.min(...e.uses.map((u) => ROLE_PRIORITY[u.role] ?? 9));
      return { ...e, nearest, xp, xpAtB, priority, sessions: sessionsFor(xp), sessionsAtB: sessionsFor(xpAtB), instructors: instructorsFor(e.skill, notes) };
    })
    .filter((e) => e.uses.some((u) => u.xp > 0 || u.xpAtB > 0))
    .sort((a, b) => a.priority - b.priority || (a.xpAtB || a.xp) - (b.xpAtB || b.xp));
}

const ROLE_PRIORITY = { titular: 0, rotacao: 1, utilitario: 2, reserva: 3, temporaria: 4 };

// ---------- social ----------

/** What a character likes: gifts, lost items, teas, tea topics, final-comment answers and meals. */
export function prefsOf(def) {
  const s = SOCIAL[def.id];
  return {
    gifts: s?.gifts?.length ? s.gifts : def.likes?.gifts ?? [],
    lost: s?.lostItems?.length ? s.lostItems : def.likes?.lost ?? [],
    teas: s?.teas ?? [],
    topics: s?.topics ?? [],
    answers: (s?.answers ?? []).map((list) => list.filter((a) => a !== '—')),
    meals: s?.meals ?? [],
    mealsDisliked: s?.mealsDisliked ?? [],
  };
}

/** Dishes every one of the given characters likes, in menu order. */
export function sharedMeals(defs) {
  const lists = defs.map((d) => new Set(prefsOf(d).meals));
  return lists.length ? [...lists[0]].filter((m) => lists.every((l) => l.has(m))) : [];
}

// ---------- group tasks ----------

// One task a week, always two students; Byleth does not take part. Both gain experience in the
// task's skill, Good +4/+8/+12 and Perfect +8/+12/+16 for a weakness/neutral/strength, plus
// Smithing Stones and gold, and support with each other when they have supports. Perfect is likelier
// with a strength in the skill and a higher support between the two. Fire Emblem Wiki (Lessons) and
// fe3h.com (Lectures guide).
export const GROUP_TASKS = [
  { id: 'sky', name: 'Sky Watch', skill: 'flying' },
  { id: 'stable', name: 'Stable Duty', skill: 'riding' },
  { id: 'weeding', name: 'Weeding', skill: 'heavyArmor' },
];

/** +1 when the skill is a strength of the unit, -1 when it is a weakness, 0 otherwise. */
export function skillGrowth(id, skill) {
  const s = SOCIAL[id];
  if (s?.strengths?.includes(skill)) return 1;
  if (s?.weaknesses?.includes(skill)) return -1;
  return 0;
}

export const canSupport = (a, b) => Boolean(SOCIAL[a]?.pairs?.includes(b) || SOCIAL[b]?.pairs?.includes(a));

/**
 * The week's Group Task: for each task, the best pair, and the task to pick. A pair is worth more
 * when both need the skill for the plan, then when the skill is a strength of theirs, then when they
 * have supports with each other. With nobody needing any of the three skills, the task still buys
 * support between a pair that has supports, so that pair is the pick.
 */
export function groupTaskPlan(state) {
  const recruited = UNITS.filter((u) => u.id !== 'byleth' && isRecruited(state, u.id) && roleOf(state, u.id) !== 'ignorar');
  const starters = recruited.filter((u) => ['titular', 'rotacao'].includes(roleOf(state, u.id)));
  const pool = starters.length >= 2 ? starters : recruited;
  const options = GROUP_TASKS.map((task) => {
    const needs = pool.filter((u) => skillNeeds(u, unitState(state, u.id)).has(task.skill)).map((u) => u.id);
    let best = null;
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const pair = [pool[i].id, pool[j].id];
        const need = pair.filter((id) => needs.includes(id)).length;
        const fit = pair.reduce((sum, id) => sum + skillGrowth(id, task.skill), 0);
        const support = canSupport(...pair);
        // With nobody needing the skill, support is what the task is for, so it outweighs the fit.
        const score = need * 10 + fit * 2 + (support ? (need ? 3 : 5) : 0);
        if (!best || score > best.score) best = { pair, need, fit, support, score };
      }
    }
    return { ...task, needs, best };
  });
  const useful = options.filter((o) => o.best?.need);
  const pick = useful.length
    ? useful.reduce((a, b) => (b.best.score > a.best.score ? b : a))
    : options.filter((o) => o.best?.support).reduce((a, b) => (!a || b.best.score > a.best.score ? b : a), null);
  return { pick, options, anyNeed: useful.length > 0 };
}

// ---------- paralogues ----------

export function paralogueStatus(p, state) {
  const ch = state.chapter;
  const [from, to] = p.window;
  const done = Boolean(state.paralogues?.[p.id]);
  const unlocked = p.units.some((id) => isRecruited(state, id));
  const missingKey = p.key && !isRecruited(state, p.key);
  let phase;
  if (done) phase = 'done';
  else if (ch > to) phase = 'missed';
  else if (ch < from) phase = 'later';
  else if (!unlocked) phase = 'locked';
  else phase = ch === to ? 'closing' : 'open';
  return { phase, done, unlocked, missingKey, from, to };
}

// ---------- items ----------

/**
 * Who keeps an item. `who` is the plan's order of preference; the first one in the army gets it.
 * When none is there yet, `next` is who to keep it for. Units set aside ('ignorar') are skipped.
 */
export function itemHolder(rec, state) {
  const wanted = (rec.who ?? []).filter((id) => UNIT_BY_ID[id] && roleOf(state, id) !== 'ignorar');
  const holder = wanted.find((id) => isRecruited(state, id)) ?? null;
  return { holder, next: holder ? null : wanted[0] ?? null, wanted };
}

/** The items of the Part 1 paralogues still to play (or, with open: false, all but the missed). */
export function paralogueItems(state, { open = true } = {}) {
  return PARALOGUES.flatMap((p) => {
    const s = paralogueStatus(p, state);
    if (open ? !['open', 'closing', 'locked'].includes(s.phase) : s.phase === 'missed') return [];
    return (p.items ?? []).map((rec) => ({ ...rec, from: p.name, paralogue: p.id }));
  });
}

// ---------- the chapter ----------

export function birthdaysInMonth(month) {
  return UNITS.filter((u) => u.birthday && Number(u.birthday.split('/')[0]) === month)
    .map((u) => ({ id: u.id, name: u.name, day: Number(u.birthday.split('/')[1]), date: u.birthday }))
    .sort((a, b) => a.day - b.day);
}

export function parseDate(text) {
  const m = /^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/.exec(text ?? '');
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? { month, day } : null;
}

export function monthOfChapter(chapter) {
  return CHAPTER_MONTH[chapter] ?? null;
}

/**
 * The short "do this now" list for the overview, built from everything above. Each item:
 * { priority, kind, text, link }.
 */
export function nextSteps(state, notes) {
  const steps = [];
  for (const def of UNITS) {
    const rs = recruitStatus(def, state);
    const role = roleOf(state, def.id);
    if (rs?.state === 'ready' && role !== 'ignorar') {
      const text = rs.how === 'abyss'
        ? `Recrutar ${def.name} no Abismo (sem requisito; pede o Cap. ${def.recruit.dlc} de Cindered Shadows).`
        : `Recrutar ${def.name} no Explore: Byleth já cumpre o requisito.`;
      steps.push({ priority: role === 'titular' ? 1 : 3, kind: 'recrutar', text, link: `#/unidade/${def.id}` });
    }
  }
  const mastering = [];
  for (const def of UNITS) {
    if (!isRecruited(state, def.id)) continue;
    const role = roleOf(state, def.id);
    if (role === 'utilitario' || role === 'temporaria' || role === 'ignorar') continue;
    const st = unitState(state, def.id);
    for (const a of unitAdvice(def, st)) {
      if (a.kind === 'certify') steps.push({ priority: role === 'titular' ? 1 : 3, kind: 'classe', text: `${def.name}: ${a.text}`, link: `#/unidade/${def.id}` });
      if (a.kind === 'master' && role === 'titular') mastering.push(`${def.name} (${a.cls})`);
    }
  }
  if (mastering.length) {
    steps.push({ priority: 4, kind: 'classe', text: `Terminar a maestria antes de trocar de classe: ${mastering.join(', ')}. Marque na ficha quando concluir.`, link: '#/esquadrao' });
  }
  for (const p of PARALOGUES) {
    const ps = paralogueStatus(p, state);
    if (ps.phase === 'closing') steps.push({ priority: 1, kind: 'paralogue', text: `Último capítulo para ${p.name}.`, link: '#/paralogues' });
    if (ps.phase === 'open' && ps.missingKey) {
      const key = UNIT_BY_ID[p.key];
      steps.push({ priority: 2, kind: 'paralogue', text: `${p.name} já está aberto, mas ${key?.name ?? p.key} precisa estar ${key?.gender === 'm' ? 'recrutado' : 'recrutada'} para ${p.keyReward}.`, link: '#/paralogues' });
    }
  }
  const edel = unitState(state, 'edelgard');
  if (state.chapter <= 11 && supportIndex(edel.support) < supportIndex('B')) {
    const why = 'a rota pede C+, que o jogo não mostra; B garante';
    steps.push({
      priority: state.chapter >= 10 ? 1 : 5,
      kind: 'rota',
      text: edel.support && edel.support !== 'none'
        ? `Suporte com a Edelgard está em ${edel.support}: chegue a B antes do Cap. 11 (${why}).`
        : `Informe o suporte com a Edelgard: chegue a B antes do Cap. 11 (${why}).`,
      link: '#/unidade/edelgard',
    });
  }
  return steps.sort((a, b) => a.priority - b.priority);
}

// ---------- keeping the state current ----------

const REVIEW_ROLES = ['titular', 'rotacao', 'reserva'];

/**
 * Who to check against the game this chapter: Byleth and the army that gets trained (starters,
 * rotation, reserves) and, until the recruiting deadline, the recruits still wanted. A unit counts
 * as seen once any of its game data changes or it is confirmed in this chapter.
 */
export function reviewStatus(state) {
  const army = UNITS.filter((u) => isRecruited(state, u.id) && (u.id === 'byleth' || REVIEW_ROLES.includes(roleOf(state, u.id))));
  const recruits = state.chapter <= RECRUIT_DEADLINE ? recruitTargets(state) : [];
  const all = [...army, ...recruits];
  const seen = (id) => (state.reviewed?.[id] ?? 0) >= state.chapter;
  return { army, recruits, all, pending: all.filter((u) => !seen(u.id)), seen };
}

/** The skill ranks worth confirming: what the plan and Goals still ask and, for Byleth, what recruits ask. */
export function keySkills(def, st, state) {
  const status = planStatus(def, st);
  const set = new Set([...suggestGoals(def, st, status).map((g) => g.skill), ...skillNeeds(def, st, status)]);
  for (const item of status?.next?.check.items ?? []) if (!item.any) set.add(item.skill);
  if (def.id === 'byleth') for (const e of bylethTraining(state)) set.add(e.skill);
  const cls = CLASS_BY_NAME[st.cls];
  if (!set.size && cls) for (const skill of Object.keys(cls.reqs)) set.add(skill);
  return SKILLS.map((s) => s.id).filter((id) => set.has(id));
}

/** Byleth's stats that open recruits ask for. */
export function keyStats(state) {
  if (state.chapter > RECRUIT_DEADLINE) return [];
  const stats = new Set(recruitTargets(state).filter((u) => u.recruit.kind === 'student').map((u) => u.recruit.stat));
  return ['str', 'mag', 'dex', 'spd', 'cha'].filter((s) => stats.has(s));
}

// ---------- chapter tasks that settle themselves ----------

/** Whether a unit is in a class, has mastered it, or has moved past it in its plan (or to a higher tier). */
function passedClass(def, st, name) {
  const cur = CLASS_BY_NAME[st.cls];
  const target = CLASS_BY_NAME[name];
  if (!cur || !target || cur === target) return false;
  const stages = planOf(def, st)?.stages.map((s) => s.cls) ?? [];
  const from = stages.indexOf(target.name);
  const now = stages.indexOf(cur.name);
  if (from >= 0 && now >= 0) return now > from;
  return TIER_ORDER[cur.tier] > TIER_ORDER[target.tier];
}

const reachedClass = (def, st, name) => st.cls === name || st.mastered?.includes(name) || passedClass(def, st, name);
const masteredClass = (def, st, name) => st.mastered?.includes(name) || passedClass(def, st, name);

const nameList = (ids) => {
  const names = ids.map((id) => UNIT_BY_ID[id]?.name ?? id);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names.at(-1)}` : names[0];
};

/**
 * A chapter task's own rule, read against the state. Returns null while the task still makes sense,
 * or { why } once the state shows it is done or moot. Rules (all must hold):
 *   recruited: [ids]        with you (units marked 'ignorar' are skipped)
 *   recruits: 'starters'|'all'  no student or faculty recruit of those roles left, or the chapter is over
 *   reached: { id: class }  in that class or past it
 *   mastered: { id: class } mastered it or moved past it
 *   support: { id: rank }   support with Byleth at least that rank
 *   paralogues: [ids]       marked done
 *   after: 'M/D'            the game date is past it, or the chapter is
 *   past: true              the chapter is over (for things only that month can do)
 */
export function taskAuto(task, state, chapter = state.chapter) {
  const a = task.auto;
  if (!a) return null;
  const why = [];
  const st = (id) => unitState(state, id);
  if (a.recruited) {
    const wanted = a.recruited.filter((id) => roleOf(state, id) !== 'ignorar');
    if (!wanted.every((id) => isRecruited(state, id))) return null;
    why.push(wanted.length ? `${nameList(wanted)} no exército` : 'fora do plano');
  }
  if (a.recruits) {
    const roles = a.recruits === 'all' ? ['titular', 'rotacao', 'reserva', 'utilitario'] : ['titular', 'rotacao'];
    const open = recruitTargets(state).filter((u) => ['student', 'faculty'].includes(u.recruit.kind) && roles.includes(roleOf(state, u.id)));
    // A month's look at the Recruitment tab: once the month is over, later chapters carry who is left.
    if (open.length && state.chapter <= chapter) return null;
    why.push(!open.length ? (a.recruits === 'all' ? 'todas as recrutas no exército' : 'titulares e rotação recrutadas') : 'o capítulo já passou');
  }
  if (a.reached) {
    const entries = Object.entries(a.reached);
    if (!entries.every(([id, cls]) => reachedClass(UNIT_BY_ID[id], st(id), cls))) return null;
    why.push(`${nameList(entries.map(([id]) => id))} em ${[...new Set(entries.map(([, cls]) => cls))].join('/')} ou além`);
  }
  if (a.mastered) {
    const entries = Object.entries(a.mastered);
    if (!entries.every(([id, cls]) => masteredClass(UNIT_BY_ID[id], st(id), cls))) return null;
    why.push(`${nameList(entries.map(([id]) => id))}: ${[...new Set(entries.map(([, cls]) => cls))].join('/')} dominada`);
  }
  if (a.support) {
    const entries = Object.entries(a.support);
    if (!entries.every(([id, need]) => supportIndex(st(id).support) >= supportIndex(need))) return null;
    why.push(entries.map(([id, need]) => `suporte ${need} com ${UNIT_BY_ID[id]?.name ?? id}`).join(', '));
  }
  if (a.paralogues) {
    if (!a.paralogues.every((id) => state.paralogues[id])) return null;
    why.push(`${a.paralogues.map((id) => PARALOGUE_BY_ID[id]?.name ?? id).join(', ')} feito`);
  }
  if (a.after) {
    const [month, day] = a.after.split('/').map(Number);
    const today = parseDate(state.date);
    const passed = state.chapter > chapter || (today && today.month === month && today.day > day);
    if (!passed) return null;
    why.push('a data já passou');
  }
  if (a.past) {
    if (state.chapter <= chapter) return null;
    why.push('o capítulo já passou');
  }
  return why.length ? { why: why.join(' · ') } : null;
}

export const taskDone = (task, state, chapter) => Boolean(state.checks[task.id] || taskAuto(task, state, chapter));

/** How the chosen starters split by job. */
export function composition(state) {
  const starters = UNITS.filter((u) => roleOf(state, u.id) === 'titular');
  const count = (tag) => starters.filter((u) => u.tags?.includes(tag)).length;
  return {
    starters,
    total: starters.length,
    physical: count('físico'),
    magic: count('magia'),
    healers: count('cura'),
    fliers: count('voo'),
    ranged: count('alcance'),
    dancer: count('dança'),
  };
}
