// Auditor de plano: dá nota a um plano gerado pelo motor, comparando com as faixas de auditoria/referencias.json.
// Não usa as metas do motor (data/objetivos.json): mede contra uma régua própria, escrita a partir da literatura.
import { readFileSync } from "node:fs";
export const REF = JSON.parse(readFileSync(new URL("./referencias.json", import.meta.url), "utf8"));

/* peso de cada critério na nota final */
export const CRITERIOS = {
  volume:          { nome: "Volume semanal por músculo", peso: 25 },
  frequencia:      { nome: "Frequência por músculo", peso: 10 },
  repeticoes:      { nome: "Faixa de repetições", peso: 10 },
  falha:           { nome: "Proximidade da falha (RPE)", peso: 10 },
  descanso:        { nome: "Descanso entre séries", peso: 5 },
  equilibrio:      { nome: "Equilíbrio entre músculos", peso: 10 },
  sessao:          { nome: "Organização do treino", peso: 10 },
  coerencia:       { nome: "Coerência com o perfil", peso: 15 },
  rastreabilidade: { nome: "Motivo e evidência", peso: 5 },
};

const MAQUINA = /máquina|cabo|smith|leg press|polia|articulad|hack|graviton|cadeira|mesa flexora|peck|belt|pêndulo|crossover/i;
const iniciante = pf => pf.exp === "nunca" || pf.exp === "ate6";
const r1 = n => Math.round(n * 10) / 10;

/* séries semanais por músculo (contagem fracionada) e treinos por semana, calculados aqui a partir dos padrões */
export function contarVolume(M, plan) {
  const v = {}, f = {}, porDia = [];
  M.MUSCLES.forEach(m => { v[m] = 0; f[m] = 0; });
  for (const d of plan.days) {
    const dia = {}, direto = {};
    for (const e of d.ex) {
      const def = M.LIB[e.p];
      dia[def.m] = (dia[def.m] || 0) + e.sets; direto[def.m] = (direto[def.m] || 0) + e.sets;
      for (const [m, w] of Object.entries(def.sec || {})) dia[m] = (dia[m] || 0) + e.sets * w;
    }
    for (const [m, s] of Object.entries(dia)) { v[m] += s; if ((direto[m] || 0) >= 1 || s >= 2) f[m]++; }
    porDia.push(direto);
  }
  return { v, f, porDia };
}

export function auditarPlano(M, pf, plan) {
  const ach = [], add = (crit, sev, msg) => ach.push({ crit, sev, msg });
  const nota = {};
  const obj = REF.volume.faixas[pf.objetivo] ? pf.objetivo : "misto";
  const ini = iniciante(pf), lift = plan.days.length, tempo = Number(pf.tempo) || 60;
  const { v, f, porDia } = contarVolume(M, plan);
  const grandes = REF.musculosGrandes, prio = new Set(pf.prioridades || []);
  const escolheuDivisao = pf.divisao && pf.divisao !== "auto";
  /* divisão escolhida que não combina com o número de dias: o app avisa a pessoa, então o achado vira alerta */
  const divisaoNaoCabe = escolheuDivisao && M.SPLITS[pf.divisao] && !M.SPLITS[pf.divisao].dias.includes(plan.days.length) && plan.notes.length > 0;

  /* 1. volume — o perfil pode não ter tempo para a faixa toda: aí o achado vira alerta "(limite de tempo)" */
  const [lo, hi] = REF.volume.faixas[obj][ini ? "iniciante" : "treinado"];
  /* capacidade física: minutos por série com o descanso dos exercícios principais; cada série de composto conta ~1,5 série de músculo grande */
  const compostos = plan.days.flatMap(d => d.ex).filter(e => e.k === "C"), descansoMedio = compostos.length ? compostos.reduce((a, e) => a + e.rest, 0) / compostos.length : 90;
  const minutosSemana = lift * (tempo - 5), minutosNecessarios = grandes.length * lo * (0.75 + descansoMedio / 60) / 1.5;
  const restrito = minutosSemana < minutosNecessarios;
  const notasMus = grandes.map(m => {
    const s = v[m], teto = hi * (prio.has(m) ? 1.3 : 1);
    if (s >= lo && s <= teto) return 1;
    const longe = s < lo ? (lo - s) / lo : (s - teto) / teto;
    /* abaixo da metade = erro (o músculo fica quase sem estímulo); acima da faixa é só alerta: retorno decrescente, não dano */
    const grave = s < lo * REF.volume.erroAbaixo;
    const quanto = s < lo ? `abaixo de ${lo}` : `acima de ${Math.round(teto)}`;
    const motivo = restrito && s < lo ? " (limite de tempo/dias do perfil)" : divisaoNaoCabe && s < lo ? ` (divisão ${pf.divisao} com ${plan.days.length} dias, escolhida pela pessoa; o app avisa)` : "";
    add("volume", grave && !motivo ? "erro" : "alerta", `${m}: ${r1(s)} séries/semana, ${quanto}${motivo}`);
    return Math.max(0, 1 - longe);
  });
  nota.volume = notasMus.reduce((a, b) => a + b, 0) / notasMus.length;

  /* 2. frequência */
  if (lift >= REF.frequencia.aPartirDeDias && ["hipertrofia", "misto", "forca"].includes(obj)) {
    const baixos = grandes.filter(m => f[m] < REF.frequencia.minimo);
    if (baixos.length) add("frequencia", "alerta", `1× por semana: ${baixos.join(", ")}${escolheuDivisao ? " (divisão escolhida pela pessoa)" : ""}`);
    nota.frequencia = 1 - baixos.length / grandes.length;
  } else nota.frequencia = 1;

  /* 3–5. repetições, RPE e descanso, exercício por exercício */
  let nRep = 0, nRpe = 0, nDesc = 0;
  const R = REF.repeticoes, F = REF.falha, D = REF.descanso;
  for (const d of plan.days) for (const e of d.ex) {
    if (e.k === "P") continue;
    const nome = e.opts[0], prancha = /prancha|\(seg\)/i.test(nome);
    if (!prancha && (e.lo < R.faixaGeral[0] || e.hi > R.faixaGeral[1])) { nRep++; add("repeticoes", "erro", `${nome}: ${e.lo}–${e.hi} reps, fora de ${R.faixaGeral.join("–")}`); }
    if (obj === "forca" && e.k === "C" && !ini && e.hi > R.forcaCompostoTopoMax && !e.skill) { nRep++; add("repeticoes", e.lo >= 8 ? "erro" : "alerta", `força: ${nome} com ${e.lo}–${e.hi} reps (carga alta = até ${R.forcaCompostoTopoMax})`); }
    if (ini && e.k === "C" && e.lo < R.inicianteCompostoMin) { nRep++; add("repeticoes", "alerta", `iniciante: ${nome} com ${e.lo}–${e.hi} reps (ACSM sugere 8–12 RM no começo)`); }
    const rmax = Math.max(...e.rpe);
    if (ini && rmax > F.inicianteRpeMax) { nRpe++; add("falha", "erro", `iniciante com RPE ${rmax} em ${nome}`); }
    if (!ini && obj === "hipertrofia" && e.k === "A" && rmax < F.hipertrofiaAcessorioRpeMin && !e.prevNome) { nRpe++; add("falha", "alerta", `hipertrofia: ${nome} termina em RPE ${rmax} (longe da falha)`); }
    if (e.k === "C" && e.rest < D.compostoMin[obj]) { nDesc++; add("descanso", "alerta", `${nome}: ${e.rest}s de descanso (mínimo ${D.compostoMin[obj]}s para ${obj})`); }
    if (e.k === "A" && e.rest < D.acessorioMin) { nDesc++; add("descanso", "alerta", `${nome}: ${e.rest}s de descanso`); }
  }
  const nEx = plan.days.reduce((a, d) => a + d.ex.length, 0) || 1;
  nota.repeticoes = Math.max(0, 1 - 3 * nRep / nEx);
  nota.falha = Math.max(0, 1 - 3 * nRpe / nEx);
  nota.descanso = Math.max(0, 1 - 3 * nDesc / nEx);

  /* 6. equilíbrio (convenção prática: só pega desequilíbrio grosseiro) */
  const E = REF.equilibrio; let nEq = 0;
  const razao = (a, b, [mn, mx]) => { if (prio.has(a) || prio.has(b) || v[b] < 2) return;
    const k = v[a] / v[b]; if (k < mn || k > mx) { nEq++; add("equilibrio", "alerta", `${a}/${b} = ${r1(k)} (${r1(v[a])} × ${r1(v[b])} séries; esperado ${mn}–${mx})`); } };
  razao("costas", "peito", E.costasPorPeito); razao("posterior", "pernas", E.posteriorPorPernas);
  nota.equilibrio = 1 - nEq / 2;

  /* 7. organização do treino */
  let nSes = 0;
  porDia.forEach((dir, i) => { for (const [m, s] of Object.entries(dir)) if (s > REF.sessao.seriesDiretasMax) { nSes++; add("sessao", "alerta", `${plan.days[i].n}: ${s} séries diretas de ${m} num treino`); } });
  for (const d of plan.days) {
    if (tempo >= 45 && d.ex.length < REF.sessao.exerciciosMin) { nSes++; add("sessao", "alerta", `${d.n}: só ${d.ex.length} exercício(s) em ${tempo} min`); }
    const k = d.ex.filter(e => !e.skill).map(e => e.k); const iA = k.indexOf("A"), lastC = k.lastIndexOf("C");
    if (iA >= 0 && lastC > iA) { nSes++; add("sessao", "alerta", `${d.n}: exercício composto depois de acessório`); }
  }
  nota.sessao = Math.max(0, 1 - nSes / (plan.days.length * 2));

  /* 8. coerência com o perfil */
  let nCo = 0; const co = (sev, msg) => { nCo += sev === "erro" ? 2 : 1; add("coerencia", sev, msg); };
  for (const d of plan.days) {
    if (d.min > tempo + 2) co("erro", `${d.n}: ${d.min} min, passa de ${tempo}`);
    const nomes = d.ex.map(e => e.opts[0]);
    if (new Set(nomes).size !== nomes.length) co("erro", `${d.n}: exercício repetido no mesmo dia`);
    for (const e of d.ex) {
      if (pf.local === "casa" && MAQUINA.test(e.opts[0])) co("erro", `em casa com máquina: ${e.opts[0]}`);
      for (const dor of pf.dores || []) { const seguros = M.LIB[e.p][dor]; if (!seguros || seguros.includes(e.opts[0])) continue;
        co("erro", e.opts.some(o => seguros.includes(o)) ? `dor no ${dor}: ${e.opts[0]} escolhido, havia opção segura` : `dor no ${dor}: nenhuma opção segura para ${M.LIB[e.p].n || e.p} em ${pf.local}`); }
    }
    const dow = d.dow && d.dow[0];
    if (dow != null && (pf.esportes || []).length) {
      const reg = M.regionOf(d), hoje = M.sportLoad(pf, dow), amanha = M.sportLoad(pf, (dow + 1) % 7);
      if (reg.L > 0.5 && (hoje.leg >= 0.6 || amanha.leg >= 0.6)) co("alerta", `${d.n} (${M.DOWN[dow]}): pernas ${hoje.leg >= 0.6 ? "no mesmo dia" : "na véspera"} de atividade forte de pernas`);
    }
  }
  nota.coerencia = Math.max(0, 1 - nCo / 6);

  /* 9. motivo e evidência */
  const evs = new Set(M.DATA.evidencias.map(e => e.id)); let nRa = 0;
  for (const d of plan.days) for (const e of d.ex) if (!e.why || !e.why.length || e.why.some(w => w.ev && !evs.has(w.ev))) { nRa++; add("rastreabilidade", "erro", `${e.opts[0]}: sem motivo ou com evidência inexistente`); }
  nota.rastreabilidade = Math.max(0, 1 - 3 * nRa / nEx);

  const somaPesos = Object.values(CRITERIOS).reduce((a, c) => a + c.peso, 0);
  const total = Math.round(100 * Object.entries(CRITERIOS).reduce((a, [k, c]) => a + c.peso * nota[k], 0) / somaPesos);
  return { nota: total, notas: nota, achados: ach, volume: v, frequencia: f, restrito };
}

/* evidências da base sem DOI (o CLAUDE.md pede DOI para toda afirmação científica) */
export function auditarBase(M) {
  return M.DATA.evidencias.filter(e => !(e.fontes || []).some(f => /doi:|doi\.org/i.test(f))).map(e => e.id);
}

/* perfis aleatórios reprodutíveis (mesma semente = mesmos perfis) */
export function perfisAleatorios(M, n, semente = 7) {
  let s = semente; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const pick = a => a[Math.floor(rnd() * a.length)];
  const out = [];
  for (let i = 0; i < n; i++) {
    const dias = [1, 2, 3, 4, 5, 6, 0].filter(() => rnd() < 0.55); while (dias.length < 2) dias.push([1, 3, 5][dias.length]);
    out.push({
      exp: pick(["nunca", "ate6", "6a12", "mais1"]), objetivo: pick(["hipertrofia", "forca", "saude", "emagrecimento", "misto"]),
      dias: [...new Set(dias)], tempo: pick([30, 45, 60, 75, 90]), local: pick(["completa", "completa", "basica", "casa"]),
      dores: ["joelho", "ombro", "lombar"].filter(() => rnd() < 0.2), prioridades: M.MUSCLES.filter(() => rnd() < 0.08),
      habilidades: Object.keys(M.HAB).filter(() => rnd() < 0.08), volume: pick(["padrao", "padrao", "menor", "alto"]),
      divisao: rnd() < 0.7 ? "auto" : pick(Object.keys(M.SPLITS)), cardio: "sim", inicio: "2025-01-01",
      esportes: rnd() < 0.35 ? [{ mod: pick(Object.keys(M.SPORTS)), dias: [pick([0, 1, 2, 3, 4, 5, 6])], int: pick(["leve", "moderada", "forte"]) }] : [],
    });
  }
  return out;
}

export function resumoPerfil(pf) {
  const exp = { nunca: "nunca treinou", ate6: "<6 meses", "6a12": "6–12 meses", mais1: ">1 ano" }[pf.exp];
  const esp = (pf.esportes || []).map(s => `${s.mod} ${s.int}`).join(", ");
  return [pf.objetivo, exp, `${pf.dias.length} dias`, `${pf.tempo} min`, pf.local, pf.divisao && pf.divisao !== "auto" ? "divisão " + pf.divisao : "",
    (pf.dores || []).length ? "dor: " + pf.dores.join("/") : "", (pf.prioridades || []).length ? "prioridade: " + pf.prioridades.join("/") : "", esp].filter(Boolean).join(" · ");
}
