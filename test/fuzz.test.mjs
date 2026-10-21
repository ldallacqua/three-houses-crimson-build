// Every page, rendered with a few hundred random but valid states, must not show anything
// impossible: a rank arrow that goes down or nowhere, "undefined" or "NaN" in the text, a negative
// or empty amount, duplicate ids, or a label pointing at a field that is not there. The random
// generator is seeded, so a failure always reproduces; the message names the seed and the page.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summaryMarkdown } from '../js/summary.js';
import { randomState, problems, PAGES } from './fuzz-lib.mjs';

test('every page renders sensibly for random states', () => {
  const failures = [];
  for (let seed = 1; seed <= 250 && failures.length < 12; seed++) {
    const state = randomState(seed);
    for (const [name, render] of PAGES) {
      let markup;
      try {
        markup = render(structuredClone(state)).toString();
      } catch (err) {
        failures.push(`seed ${seed} ${name}: threw ${err.stack.split('\n').slice(0, 3).join(' / ')}`);
        continue;
      }
      for (const p of problems(markup)) failures.push(`seed ${seed} ${name}: ${p}`);
    }
    try {
      const md = summaryMarkdown(state);
      for (const bad of ['undefined', 'NaN', '[object']) if (md.includes(bad)) failures.push(`seed ${seed} summary: "${bad}"`);
    } catch (err) {
      failures.push(`seed ${seed} summary: threw ${err.message}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('advice never points back: no goal already met, no class already passed', async () => {
  const L = await import('../js/logic.js');
  const { UNITS } = await import('../data/units.js');
  const { CLASS_BY_NAME } = await import('../data/classes.js');
  const TIER = { beginner: 0, intermediate: 1, advanced: 2, dlc: 2, master: 3 };
  const below = (a, b) => a && b && a.tier in TIER && b.tier in TIER && TIER[a.tier] < TIER[b.tier];
  const failures = [];
  for (let seed = 1; seed <= 300 && failures.length < 12; seed++) {
    const s = randomState(seed);
    for (const def of UNITS) {
      const st = L.unitState(s, def.id);
      const status = L.planStatus(def, st);
      const now = CLASS_BY_NAME[st.cls];
      for (const goal of L.suggestGoals(def, st, status)) {
        if (L.meetsRank(goal.have, goal.need) || !(goal.xp > 0)) failures.push(`seed ${seed} ${def.id}: goal ${goal.skill} ${goal.have} → ${goal.need}`);
      }
      for (const a of L.unitAdvice(def, st, status)) {
        const target = CLASS_BY_NAME[a.cls];
        if (a.kind === 'certify' && (a.cls === st.cls || st.mastered.includes(a.cls))) failures.push(`seed ${seed} ${def.id}: certify ${a.cls} again`);
        if (['certify', 'wait', 'missing'].includes(a.kind) && below(target, now)) failures.push(`seed ${seed} ${def.id}: in ${st.cls}, told about ${a.cls}`);
        if (a.kind === 'master' && st.mastered.includes(a.cls)) failures.push(`seed ${seed} ${def.id}: master ${a.cls} again`);
      }
      const rs = L.recruitStatus(def, s);
      if (rs?.tier && (rs.state === 'ready') !== rs.tier.ok) failures.push(`seed ${seed} ${def.id}: ${rs.state} but tier ok=${rs.tier.ok}`);
    }
    for (const e of L.bylethTraining(s)) {
      for (const u of e.uses) if (u.xp > 0 && L.meetsRank(e.have, u.need)) failures.push(`seed ${seed}: train ${e.skill} ${e.have} for ${u.need}`);
    }
    for (const step of L.nextSteps(s, null)) {
      const id = step.link?.match(/unidade\/([\w-]+)/)?.[1];
      if (step.kind === 'recrutar' && id && (L.isRecruited(s, id) || L.roleOf(s, id) === 'ignorar')) failures.push(`seed ${seed}: ${step.text}`);
    }
  }
  assert.deepEqual(failures, []);
});
