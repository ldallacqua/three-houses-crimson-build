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
