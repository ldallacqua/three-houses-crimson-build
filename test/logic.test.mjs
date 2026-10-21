import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rankIndex, meetsRank, xpToRank, sessionsFor, classCheck, planStatus, unitAdvice, suggestGoals,
  recruitStatus, bylethTraining, paralogueStatus, nextSteps, birthdaysInMonth, parseDate, isRecruited, instructorsFor,
} from '../js/logic.js';
import { snapshotState, normalize } from '../js/store.js';
import { UNIT_BY_ID } from '../data/units.js';
import { PARALOGUE_BY_ID } from '../data/paralogues.js';

const snap = () => snapshotState();

test('ranks compare and count experience from the start of the rank', () => {
  assert.equal(rankIndex('E'), 0);
  assert.equal(rankIndex(null), -1);
  assert.ok(meetsRank('C+', 'C'));
  assert.ok(!meetsRank('C', 'C+'));
  assert.ok(!meetsRank(null, 'E'));
  assert.equal(xpToRank('E', 'E+'), 40);
  assert.equal(xpToRank('E+', 'D+'), 140);
  assert.equal(xpToRank('A', 'C'), 0);
  assert.deepEqual(sessionsFor(40), { min: 1, max: 2 });
  assert.deepEqual(sessionsFor(0), { min: 0, max: 0 });
});

test('class check: Pegasus Knight needs Lance C and Flying D, and is female only', () => {
  const ok = classCheck('Pegasus Knight', { level: 10, gender: 'f', ranks: { lance: 'C', flying: 'D' } });
  assert.ok(ok.ready);
  const man = classCheck('Pegasus Knight', { level: 10, gender: 'm', ranks: { lance: 'C', flying: 'D' } });
  assert.ok(!man.ready && !man.genderOk);
  const low = classCheck('Pegasus Knight', { level: 9, gender: 'f', ranks: { lance: 'C', flying: 'D' } });
  assert.ok(low.skillsOk && !low.levelOk && !low.ready);
});

test('class check: "any of" requirements and the Dancer never count as an exam', () => {
  assert.ok(classCheck('Fighter', { level: 5, ranks: { bow: 'D' } }).ready);
  assert.ok(!classCheck('Fighter', { level: 5, ranks: { sword: 'A' } }).ready);
  const dancer = classCheck('Dancer', { level: 30, gender: 'f', ranks: {} });
  assert.ok(!dancer.ready && dancer.byEvent);
});

test('class check: Trickster needs Thief first', () => {
  const base = { level: 20, gender: 'f', ranks: { sword: 'B', faith: 'B' } };
  assert.ok(!classCheck('Trickster', { ...base, cls: 'Myrmidon' }).ready);
  assert.ok(classCheck('Trickster', { ...base, cls: 'Thief' }).ready);
  assert.ok(classCheck('Trickster', { ...base, cls: 'Mercenary', mastered: ['Thief'] }).ready);
});

test('snapshot: Bernadetta should certify Archer now, with Lance for Vengeance first in Goals', () => {
  const s = snap();
  const def = UNIT_BY_ID.bernadetta;
  const st = s.units.bernadetta;
  const advice = unitAdvice(def, st);
  assert.equal(advice[0].kind, 'certify');
  assert.equal(advice[0].cls, 'Archer');
  const goals = suggestGoals(def, st);
  assert.deepEqual(goals.map((g) => [g.skill, g.need]), [['lance', 'C+'], ['bow', 'A']]);
});

test('snapshot: Constance and Hapi wait for level 10 before Mage', () => {
  const s = snap();
  for (const id of ['constance', 'hapi']) {
    const status = planStatus(UNIT_BY_ID[id], s.units[id]);
    assert.equal(status.next.cls.name, 'Mage');
    assert.ok(status.next.check.skillsOk);
    assert.ok(!status.next.check.levelOk);
  }
  assert.equal(suggestGoals(UNIT_BY_ID.hapi, s.units.hapi)[0].skill, 'faith', 'Physic comes first for Hapi');
});

test('snapshot: Edelgard and Petra master Brigand before Wyvern Rider and train Axe', () => {
  const s = snap();
  for (const id of ['edelgard', 'petra']) {
    const advice = unitAdvice(UNIT_BY_ID[id], s.units[id]);
    assert.equal(advice[0].kind, 'master');
    assert.match(advice[0].text, /Death Blow .*100 de XP de classe, \+1 por combate/);
    assert.equal(suggestGoals(UNIT_BY_ID[id], s.units[id])[0].skill, 'axe');
  }
});

test('marking a mastery moves the advice on', () => {
  const s = snap();
  const st = { ...s.units.petra, mastered: ['Brigand'], level: 20, ranks: { ...s.units.petra.ranks, axe: 'B' } };
  const advice = unitAdvice(UNIT_BY_ID.petra, st);
  assert.equal(advice.find((a) => a.kind === 'certify')?.cls, 'Wyvern Rider');
});

test('recruitment: Shamir is ready in chapter 6 with Byleth at 20, not before chapter 6', () => {
  const s = snap();
  assert.equal(recruitStatus(UNIT_BY_ID.shamir, s).state, 'ready');
  assert.equal(recruitStatus(UNIT_BY_ID.shamir, { ...s, chapter: 5 }).state, 'later');
});

test('recruitment: Ingrid needs Flying D without support and E+ at B', () => {
  const s = snap();
  const none = recruitStatus(UNIT_BY_ID.ingrid, s);
  assert.equal(none.state, 'missing');
  assert.equal(none.tier.rank, 'D');
  assert.equal(none.tier.xp, 100);
  s.units.ingrid.support = 'B';
  const atB = recruitStatus(UNIT_BY_ID.ingrid, s);
  assert.equal(atB.tier.rank, 'E+');
  assert.ok(atB.spontaneous);
  s.units.byleth.ranks.flying = 'E+';
  assert.equal(recruitStatus(UNIT_BY_ID.ingrid, s).state, 'ready');
});

test('recruitment: at C, Lysithea asks Mag 12 and Faith C+, and the hidden C+ may already be enough', () => {
  const s = snap();
  s.units.lysithea.support = 'C';
  s.units.byleth.ranks.faith = 'C';
  const rs = recruitStatus(UNIT_BY_ID.lysithea, s);
  assert.deepEqual([rs.tier.stat, rs.tier.rank], [12, 'C+']);
  assert.equal(rs.state, 'missing');
  assert.equal(rs.maybe?.key, 'C+');
  s.units.lysithea.support = 'S';
  assert.equal(recruitStatus(UNIT_BY_ID.lysithea, s).state, 'ready');
});

test('a saved C+ or B+ from the old select reads as C or B', () => {
  const st = normalize({ units: { lysithea: { support: 'C+' }, ingrid: { support: 'B+' } } });
  assert.equal(st.units.lysithea.support, 'C');
  assert.equal(st.units.ingrid.support, 'B');
});

test('recruitment closes after chapter 11', () => {
  const s = { ...snap(), chapter: 12 };
  assert.equal(recruitStatus(UNIT_BY_ID.lysithea, s).state, 'missed');
});

test('Byleth training: no Flying instructor in chapter 6, Seteth and Manuela back in 7', () => {
  const ch6 = { away: ['seteth', 'manuela'] };
  assert.deepEqual(instructorsFor('flying', ch6), []);
  assert.deepEqual(instructorsFor('flying', { away: [] }).map((f) => f.id), ['seteth', 'manuela']);
  assert.deepEqual(instructorsFor('faith', { away: ['*'] }), []);
  const rows = bylethTraining(snap(), ch6);
  const flying = rows.find((r) => r.skill === 'flying');
  assert.equal(flying.xpAtB, 40);
  assert.equal(rows[0].skill, 'flying', 'starters first: Ingrid');
});

test('paralogues: Rumored Nuptials opens with Dorothea, warns about Ingrid, closes after 11', () => {
  const p = PARALOGUE_BY_ID.nuptials;
  const s = snap();
  assert.equal(paralogueStatus(p, s).phase, 'later');
  const s7 = { ...s, chapter: 7 };
  const st = paralogueStatus(p, s7);
  assert.equal(st.phase, 'open');
  assert.ok(st.missingKey);
  assert.equal(paralogueStatus(p, { ...s, chapter: 11 }).phase, 'closing');
  assert.equal(paralogueStatus(p, { ...s, chapter: 12 }).phase, 'missed');
  assert.equal(paralogueStatus(PARALOGUE_BY_ID['golden-deer'], s7).phase, 'locked');
});

test('Flayn counts as with you from chapter 7 to 11 only', () => {
  const s = snap();
  assert.ok(!isRecruited(s, 'flayn'));
  assert.ok(isRecruited({ ...s, chapter: 9 }, 'flayn'));
  assert.ok(!isRecruited({ ...s, chapter: 13 }, 'flayn'));
});

test('next steps on the snapshot lead with Shamir and Bernadetta', () => {
  const steps = nextSteps(snap());
  const first = steps.filter((x) => x.priority === 1).map((x) => x.text);
  assert.ok(first.some((t) => t.includes('Shamir')));
  assert.ok(first.some((t) => t.includes('Bernadetta') && t.includes('Archer')));
});

test('calendar helpers', () => {
  assert.deepEqual(parseDate('9/7'), { month: 9, day: 7 });
  assert.equal(parseDate('13/1'), null);
  assert.equal(parseDate('setembro'), null);
  const sept = birthdaysInMonth(9).map((b) => b.id);
  assert.deepEqual(sept, ['petra', 'dorothea']);
});

test('review: everyone is pending in a new chapter, and a confirmed unit drops off', async () => {
  const { reviewStatus } = await import('../js/logic.js');
  const s = snap();
  const first = reviewStatus(s);
  assert.equal(first.pending.length, first.all.length);
  assert.ok(first.army.some((u) => u.id === 'byleth') && first.recruits.some((u) => u.id === 'lysithea'));
  s.reviewed.byleth = s.chapter;
  assert.equal(reviewStatus(s).pending.length, first.all.length - 1);
  assert.equal(reviewStatus({ ...s, chapter: s.chapter + 1 }).pending.some((u) => u.id === 'byleth'), true);
  assert.equal(reviewStatus({ ...s, chapter: 12 }).recruits.length, 0);
});

test('review: Byleth is asked for the stats and ranks recruits and his plan need', async () => {
  const { keySkills, keyStats } = await import('../js/logic.js');
  const s = snap();
  const skills = keySkills(UNIT_BY_ID.byleth, s.units.byleth, s);
  for (const k of ['brawl', 'faith', 'flying', 'riding']) assert.ok(skills.includes(k), k);
  // Leonie asks Str, Ingrid Dex, Lysithea/Marianne/Mercedes/Annette Mag, Lorenz Cha.
  assert.deepEqual(keyStats(s), ['str', 'mag', 'dex', 'cha']);
});

test('chapter tasks settle themselves from the state', async () => {
  const { taskAuto } = await import('../js/logic.js');
  const s = snap();
  const abyss = { id: 't', auto: { recruited: ['balthus', 'yuri'] } };
  assert.equal(taskAuto(abyss, s, 6), null);
  s.units.balthus.recruited = true;
  s.units.yuri.recruited = true;
  assert.match(taskAuto(abyss, s, 6).why, /Balthus e Yuri/);
  s.units.lorenz.role = 'ignorar';
  assert.match(taskAuto({ auto: { recruited: ['lorenz'] } }, s, 7).why, /fora do plano/);
  const archer = { auto: { reached: { bernadetta: 'Archer' } } };
  assert.equal(taskAuto(archer, s, 6), null);
  s.units.bernadetta.cls = 'Sniper';
  assert.ok(taskAuto(archer, s, 6));
  const mage = { auto: { mastered: { constance: 'Mage' } } };
  s.units.constance.cls = 'Mage';
  assert.equal(taskAuto(mage, s, 7), null);
  s.units.constance.cls = 'Dark Flier';
  assert.ok(taskAuto(mage, s, 7), 'moving past Mage settles it');
  const bday = { auto: { after: '9/7' } };
  assert.equal(taskAuto(bday, { ...s, date: '9/7' }, 6), null);
  assert.ok(taskAuto(bday, { ...s, date: '9/14' }, 6));
  assert.ok(taskAuto(bday, { ...s, chapter: 7, date: '' }, 6));
  const edel = { auto: { support: { edelgard: 'B' } } };
  s.units.edelgard.support = 'C';
  assert.equal(taskAuto(edel, s, 10), null);
  s.units.edelgard.support = 'B';
  assert.ok(taskAuto(edel, s, 10));
  const canyon = { auto: { paralogues: ['red-canyon'] } };
  assert.equal(taskAuto(canyon, s, 8), null);
  s.paralogues['red-canyon'] = true;
  assert.ok(taskAuto(canyon, s, 8));
});

test('the Edelgard reminder asks for B, the rank the game shows', () => {
  const s = snap();
  s.units.edelgard.support = 'C';
  const step = nextSteps({ ...s, chapter: 10 }, null).find((x) => x.kind === 'rota');
  assert.match(step.text, /chegue a B/);
  s.units.edelgard.support = 'B';
  assert.equal(nextSteps({ ...s, chapter: 10 }, null).some((x) => x.kind === 'rota'), false);
});

test('a class outside the chosen plan: the plan with it is used, and lower stages count as behind', () => {
  const s = snap();
  const byleth = { ...s.units.byleth, cls: 'Hero', plan: undefined };
  const status = planStatus(UNIT_BY_ID.byleth, byleth);
  assert.equal(status.plan.id, 'espada');
  assert.equal(status.current.cls.name, 'Hero');
  const picked = planStatus(UNIT_BY_ID.byleth, { ...byleth, plan: 'punhos' });
  assert.equal(picked.plan.id, 'punhos');
  assert.equal(picked.stages.find((x) => x.cls.name === 'Brigand').status, 'done');
  assert.notEqual(picked.next.cls.name, 'Brigand');
});

test('recruitment boxes past the deadline or with support A say so instead of failing', async () => {
  const { recruitBlock } = await import('../js/views/recrutamento.js');
  const late = { ...snap(), chapter: 12 };
  assert.match(recruitBlock(UNIT_BY_ID.lysithea, late).toString(), /prazo para recrutar no Part 1 terminou/);
  assert.match(recruitBlock(UNIT_BY_ID.manuela, late).toString(), /prazo para recrutar no Part 1 terminou/);
  const s = snap();
  s.units.lysithea.support = 'A';
  assert.match(recruitBlock(UNIT_BY_ID.lysithea, s).toString(), /entra sem requisito/);
  assert.match(recruitBlock(UNIT_BY_ID.lorenz, snap()).toString(), /se ele recusar|ele tem|ele passa/);
});

test('a task only that month can do settles once the chapter is over', async () => {
  const { taskAuto } = await import('../js/logic.js');
  const s = snap();
  const once = { auto: { past: true } };
  assert.equal(taskAuto(once, s, 6), null, 'still this chapter');
  assert.match(taskAuto(once, s, 5).why, /capítulo já passou/);
  assert.equal(taskAuto({ auto: { past: true, recruited: ['lysithea'] } }, s, 5), null, 'every rule has to hold');
  const look = { auto: { recruits: 'starters' } };
  assert.equal(taskAuto(look, s, 6), null, 'starters still to recruit this month');
  assert.match(taskAuto(look, s, 4).why, /capítulo já passou/, 'a past month’s look at the tab is over');
});

test('an item goes to the first of the plan’s order who is in the army', async () => {
  const { itemHolder } = await import('../js/logic.js');
  const s = snap();
  const dust = { who: ['constance', 'lysithea', 'dorothea'] };
  assert.deepEqual(itemHolder(dust, s), { holder: 'constance', next: null, wanted: ['constance', 'lysithea', 'dorothea'], busy: [] });
  s.units.constance.recruited = false;
  assert.equal(itemHolder(dust, s).holder, 'dorothea', 'Lysithea is not in the army yet');
  s.units.lysithea.recruited = true;
  assert.equal(itemHolder(dust, s).holder, 'lysithea');
  s.units.lysithea.role = 'ignorar';
  assert.deepEqual(itemHolder(dust, s).wanted, ['constance', 'dorothea'], 'units set aside drop out');
  const luin = { who: ['ingrid'] };
  assert.deepEqual(itemHolder(luin, s), { holder: null, next: 'ingrid', wanted: ['ingrid'], busy: [] }, 'kept for her until she joins');
  assert.deepEqual(itemHolder({ who: [] }, s), { holder: null, next: null, wanted: [], busy: [] });
});

test('each unit wears one accessory: a better one sends the other down its own order', async () => {
  const { accessoryPlan, itemHolder } = await import('../js/logic.js');
  const at = (chapter, patch = (x) => x) => patch(normalize({ ...snap(), chapter }));
  const plan = (s) => {
    const { slots, wearing } = accessoryPlan(s);
    return { slots, wearing, by: (item) => slots.filter((x) => x.rec.item === item) };
  };

  // Chapter 5: only its own Accuracy Ring, so Edelgard wears it.
  const five = plan(at(5));
  assert.equal(five.by('Accuracy Ring')[0].holder, 'edelgard');

  // Chapter 7: Rumored Nuptials gives Edelgard and Petra better rings, and the Accuracy Ring moves on.
  const seven = plan(at(7));
  assert.equal(seven.by('Prayer Ring')[0].holder, 'edelgard');
  assert.equal(seven.by('Goddess Ring')[0].holder, 'petra');
  const [acc] = seven.by('Accuracy Ring');
  assert.equal(acc.holder, 'byleth');
  assert.deepEqual(acc.busy, [{ id: 'edelgard', item: 'Prayer Ring' }, { id: 'petra', item: 'Goddess Ring' }]);
  assert.equal(itemHolder(acc.rec, at(7)).holder, 'byleth', 'every page agrees');
  const holders = seven.slots.map((x) => x.holder).filter(Boolean);
  assert.equal(new Set(holders).size, holders.length, 'nobody wears two');

  // Chapter 9 without Marianne: both Healing Staffs wait, each for a different healer.
  const nine = plan(at(9));
  assert.equal(nine.by('Caduceus Staff')[0].holder, 'hapi');
  assert.deepEqual(nine.by('Healing Staff').map((x) => [x.holder, x.next]), [[null, 'marianne'], [null, 'mercedes']]);
  const withMarianne = plan(at(9, (s) => { s.units.marianne.recruited = true; return s; }));
  assert.deepEqual(withMarianne.by('Healing Staff').map((x) => x.holder), ['marianne', null]);
});

test('the overview lists the items of the paralogues still open, not the done or missed ones', async () => {
  const { paralogueItems } = await import('../js/logic.js');
  const s = normalize({ ...snap(), chapter: 9 });
  const names = () => paralogueItems(s).map((r) => r.item);
  assert.ok(names().includes('Thyrsus'));
  assert.ok(names().includes('Spear of Assal'));
  s.paralogues['golden-deer'] = true;
  assert.ok(!names().includes('Thyrsus'));
  assert.ok(paralogueItems(s, { open: false }).some((r) => r.item === 'Thyrsus'), 'done ones still count for a unit page');
  const late = normalize({ ...snap(), chapter: 12 });
  assert.deepEqual(paralogueItems(late), []);
  assert.ok(!paralogueItems(late, { open: false }).some((r) => r.item === 'Spear of Assal'), 'missed ones never show');
});

test('the week’s group task is one pair, never Byleth, for a skill the plan still needs', async () => {
  const { groupTaskPlan, skillGrowth, canSupport } = await import('../js/logic.js');
  assert.equal(skillGrowth('petra', 'flying'), 1);
  assert.equal(skillGrowth('dorothea', 'flying'), -1);
  assert.equal(skillGrowth('edelgard', 'flying'), 0);
  assert.ok(canSupport('edelgard', 'petra'));
  assert.ok(!canSupport('petra', 'constance'));
  const s = snap();
  const plan = groupTaskPlan(s);
  assert.equal(plan.options.length, 3);
  for (const o of plan.options) assert.ok(o.best.pair.length === 2 && !o.best.pair.includes('byleth'));
  assert.equal(plan.pick.name, 'Sky Watch');
  assert.deepEqual(plan.pick.best.pair, ['edelgard', 'petra'], 'both need Flying, Petra is strong in it and they have supports');
  for (const id of ['edelgard', 'petra', 'constance']) s.units[id].ranks.flying = 'A+';
  const next = groupTaskPlan(s);
  assert.equal(next.pick.name, 'Stable Duty');
  assert.ok(next.pick.best.pair.includes('hapi'));
  assert.ok(next.pick.best.support, 'the partner has supports with Hapi');
});
