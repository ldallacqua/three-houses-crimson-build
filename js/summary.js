// A Markdown snapshot of the state, to paste into a chat or into the master guide.

import { UNITS } from '../data/units.js';
import { SKILLS, STATS } from '../data/skills.js';
import { PARALOGUES } from '../data/paralogues.js';
import { unitState, isRecruited, roleOf, planStatus, suggestGoals, recruitStatus, paralogueStatus, taskAuto, reviewStatus } from './logic.js';
import { currentNotes } from './seal.js';

const line = (cells) => `| ${cells.join(' | ')} |`;

export function summaryMarkdown(state) {
  const out = [];
  out.push(`# Estado do save — Fire Emblem: Three Houses (Crimson Flower)`);
  out.push('');
  out.push(`- Capítulo: ${state.chapter}${state.date ? ` · data ${state.date}` : ''}`);
  out.push(`- Dificuldade: ${state.difficulty || 'não informada'} · Modo: ${state.mode || 'não informado'}`);
  const review = reviewStatus(state);
  out.push(`- Conferidas neste capítulo: ${review.all.length - review.pending.length} de ${review.all.length}${review.pending.length ? ` (faltam ${review.pending.map((u) => u.name).join(', ')})` : ''}`);
  out.push(`- Suporte com a Edelgard: ${unitState(state, 'edelgard').support ?? 'não informado'}`);
  out.push(`- Exportado do guia vivo em ${new Date().toISOString().slice(0, 10)}`);
  out.push('');
  out.push('## Unidades no exército');
  out.push('');
  out.push(line(['Unidade', 'Papel', 'Lv', 'Classe', 'Atributos', 'Skills', 'Maestrias', 'Próximo passo', 'Goals']));
  out.push(line(Array(9).fill('---')));
  for (const def of UNITS) {
    if (!isRecruited(state, def.id)) continue;
    const st = unitState(state, def.id);
    const stats = STATS.filter((s) => st.stats?.[s.id] != null).map((s) => `${s.name} ${st.stats[s.id]}`).join(', ');
    const ranks = SKILLS.filter((s) => st.ranks?.[s.id]).map((s) => `${s.name} ${st.ranks[s.id]}`).join(', ');
    const status = planStatus(def, st);
    const goals = status ? suggestGoals(def, st, status).map((g) => `${g.skill} ${g.need}`).join(' + ') : '';
    out.push(line([
      def.name, roleOf(state, def.id), st.level ?? '?', st.cls ?? '?', stats || '—', ranks || '—',
      st.mastered?.join(', ') || '—', status?.next ? `${status.next.cls.name}${status.next.check.ready ? ' (pronta)' : ''}` : '—', goals || '—',
    ]));
  }
  out.push('');
  out.push('## Recrutamento');
  out.push('');
  for (const def of UNITS) {
    if (!def.recruit || isRecruited(state, def.id)) continue;
    const rs = recruitStatus(def, state);
    const st = unitState(state, def.id);
    let detail = '';
    if (rs.tier) detail = ` — precisa ${rs.stat} ${rs.tier.stat} + ${rs.skill} ${rs.tier.rank} (Byleth: ${rs.statHave ?? '?'} / ${rs.rankHave ?? '?'})`;
    out.push(`- ${def.name} (${roleOf(state, def.id)}): ${rs.state}${st.support ? `, suporte ${st.support}` : ''}${detail}`);
  }
  out.push('');
  out.push('## Paralogues');
  out.push('');
  for (const p of PARALOGUES) {
    const s = paralogueStatus(p, state);
    out.push(`- ${p.name} (Cap. ${s.from}–${s.to}): ${s.phase}`);
  }
  const notes = currentNotes(state.chapter);
  if (notes?.tasks?.length) {
    out.push('');
    out.push('## Checklist do capítulo');
    out.push('');
    for (const t of notes.tasks) {
      const auto = taskAuto(t, state);
      out.push(`- [${auto || state.checks[t.id] ? 'x' : ' '}] ${t.text.replace(/\*\*/g, '')}${auto ? ` _(automático: ${auto.why})_` : ''}`);
    }
  }
  const personal = UNITS.filter((d) => unitState(state, d.id).note);
  if (personal.length) {
    out.push('');
    out.push('## Anotações');
    out.push('');
    for (const d of personal) out.push(`- ${d.name}: ${unitState(state, d.id).note}`);
  }
  out.push('');
  return out.join('\n');
}
