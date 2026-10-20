// Auditoria dos planos: gera milhares de perfis, dá nota a cada plano e escreve auditoria/relatorio.md.
// Uso: npm run auditar            (2.000 perfis)
//      npm run auditar -- 5000    (outro número de perfis)
import { writeFileSync } from "node:fs";
import { carregarMotor } from "../tests/carregar.mjs";
import { auditarPlano, auditarBase, perfisAleatorios, resumoPerfil, CRITERIOS, REF } from "../auditoria/auditor.mjs";
import { PERSONAS } from "../auditoria/personas.mjs";

const M = carregarMotor();
const N = Number(process.argv[2]) || 2000;
const version = M.DATA && JSON.parse((await import("node:fs")).readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

const linhas = perfisAleatorios(M, N).map(pf => ({ pf, ...auditarPlano(M, pf, M.buildPlan(pf)) }));
const notas = linhas.map(l => l.nota).sort((a, b) => a - b);
const q = p => notas[Math.min(notas.length - 1, Math.floor(p * notas.length))];
const media = Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);
const comErro = linhas.filter(l => l.achados.some(a => a.sev === "erro")).length;
const pct = n => `${Math.round(1000 * n / linhas.length) / 10}%`;

/* achados agrupados: troca números e nomes por "#" para juntar casos iguais */
const grupos = new Map();
for (const l of linhas) for (const a of new Map(l.achados.map(a => [a.crit + a.sev + chave(a.msg), a])).values()) {
  const k = `${a.crit}|${a.sev}|${chave(a.msg)}`; const g = grupos.get(k) || { ...a, n: 0, ex: a.msg }; g.n++; grupos.set(k, g);
}
function chave(msg) { return msg.replace(/^[^:]*?(Corpo inteiro|Superior|Inferior|Empurrar|Puxar|Pernas|Peito|Costas|Ombros|Braços)[^:]*:/, "<treino>:").replace(/\d+([,.]\d+)?/g, "#").replace(/: .*? (com|termina|não está|\()/, ": <exercício> $1"); }

const porCrit = Object.keys(CRITERIOS).map(c => {
  const ns = linhas.map(l => l.notas[c]); const m = ns.reduce((a, b) => a + b, 0) / ns.length;
  const afetados = linhas.filter(l => l.achados.some(a => a.crit === c)).length;
  return { c, m: Math.round(100 * m), afetados };
});

const personas = PERSONAS.map(p => { const plan = M.buildPlan(p.pf); const a = auditarPlano(M, p.pf, plan); const falhas = p.espera(plan, a, M); return { p, plan, a, falhas }; });
const semDoi = auditarBase(M);

let md = `# Auditoria dos planos do Kora\n\nVersão ${version} · ${N} perfis aleatórios (semente fixa) + ${PERSONAS.length} perfis-gabarito. Gerado por \`npm run auditar\`.\n\n`;
md += `A régua está em \`auditoria/referencias.json\`, separada do motor. Cada critério diz se é **evidência** (com fonte) ou **convenção prática**.\n\n`;
md += `## Resumo\n\n| | |\n|---|---|\n| Nota média | **${media}/100** |\n| Mediana | ${q(0.5)} |\n| 10% piores abaixo de | ${q(0.1)} |\n| Pior nota | ${notas[0]} |\n| Planos com pelo menos 1 erro | ${comErro} (${pct(comErro)}) |\n| Perfis-gabarito aprovados | ${personas.filter(x => !x.falhas.length).length} de ${personas.length} |\n\n`;
md += `## Por critério\n\n| Critério | Peso | Nota média | Planos com achado | Base |\n|---|---|---|---|---|\n`;
for (const { c, m, afetados } of porCrit) { const ref = REF[c]; md += `| ${CRITERIOS[c].nome} | ${CRITERIOS[c].peso} | ${m} | ${pct(afetados)} | ${ref ? `${ref.tipo} (\`${ref.ev}\`)` : "regras do app"} |\n`; }
md += `\n## Achados mais comuns\n\n| Gravidade | Critério | Planos | Exemplo |\n|---|---|---|---|\n`;
const top = sev => [...grupos.values()].filter(g => g.sev === sev).sort((a, b) => b.n - a.n).slice(0, 20);
for (const g of [...top("erro"), ...top("alerta")]) md += `| ${g.sev} | ${CRITERIOS[g.crit].nome} | ${g.n} (${pct(g.n)}) | ${g.ex.replace(/\|/g, "/")} |\n`;
md += `\n## Perfis-gabarito\n\n`;
for (const { p, plan, a, falhas } of personas) {
  md += `### ${falhas.length ? "❌" : "✅"} ${p.nome} — nota ${a.nota}\n${p.quem}\n\n- Plano: ${plan.split}, ${plan.days.length} dias · ${plan.days.map(d => `${d.n} (${d.ex.length} ex, ${d.min} min)`).join(", ")}\n`;
  md += `- Séries/semana: ${REF.musculosGrandes.map(m => `${m} ${Math.round(a.volume[m] * 10) / 10}`).join(", ")}\n`;
  if (falhas.length) md += falhas.map(f => `- **Esperado e não atendido:** ${f}\n`).join("");
  const erros = a.achados.filter(x => x.sev === "erro"); if (erros.length) md += erros.map(x => `- Erro: ${x.msg}\n`).join("");
  const al = a.achados.filter(x => x.sev === "alerta"); if (al.length) md += `- Alertas: ${al.map(x => x.msg).join("; ")}\n`;
  md += "\n";
}
md += `## 10 piores planos\n\n| Nota | Perfil | Principais achados |\n|---|---|---|\n`;
for (const l of linhas.slice().sort((a, b) => a.nota - b.nota).slice(0, 10)) md += `| ${l.nota} | ${resumoPerfil(l.pf)} | ${l.achados.slice(0, 4).map(a => a.msg).join("; ").replace(/\|/g, "/")} |\n`;
md += `\n## Base de evidências\n\n${semDoi.length ? `${semDoi.length} de ${M.DATA.evidencias.length} evidências sem DOI em nenhuma fonte: ${semDoi.map(x => "`" + x + "`").join(", ")}.` : "Todas as evidências têm DOI."}\n`;

writeFileSync(new URL("../auditoria/relatorio.md", import.meta.url), md);
console.log(`auditoria · ${N} perfis · nota média ${media} · mediana ${q(0.5)} · ${pct(comErro)} com erro · gabarito ${personas.filter(x => !x.falhas.length).length}/${personas.length} · sem DOI: ${semDoi.length}`);
console.log("relatório: auditoria/relatorio.md");
