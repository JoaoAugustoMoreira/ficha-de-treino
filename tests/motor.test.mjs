import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarMotor, perfil } from "./carregar.mjs";
const M = carregarMotor();
const LOC = ["completa", "basica", "casa"];

test("cada padrão tem pelo menos 3 opções em cada local", () => {
  for (const [p, def] of Object.entries(M.LIB)) for (const l of LOC)
    assert.ok(def.o[l].length >= 3, `${p} em ${l}: ${def.o[l].length}`);
});

test("exercícios: ids únicos, padrão conhecido e pelo menos um local", () => {
  const ids = new Set();
  for (const e of M.DATA.exercicios) {
    assert.ok(!ids.has(e.id), "id repetido " + e.id); ids.add(e.id);
    assert.ok(M.LIB[e.padrao], "padrão desconhecido " + e.padrao);
    assert.ok(Object.keys(e.locais).length || Object.keys(e.seguroPara || {}).length, "sem local " + e.id);
  }
});

test("todo modelo de treino usa só padrões existentes", () => {
  for (const [k, t] of Object.entries(M.DATA.divisoes.modelos)) for (const s of t.s) assert.ok(M.LIB[s.p], `${k}: ${s.p}`);
});

test("número de dias de musculação respeita o perfil (iniciante no automático: máximo 4)", () => {
  for (const n of [2, 3, 4, 5, 6]) {
    const dias = [1, 2, 3, 4, 5, 6].slice(0, n);
    assert.equal(M.buildPlan(perfil({ dias })).days.length, Math.min(n, 4));
    assert.equal(M.buildPlan(perfil({ dias, exp: "mais1" })).days.length, n);
  }
});

test("duração estimada de cada treino cabe no tempo escolhido", () => {
  for (const tempo of [30, 45, 60, 75, 90]) for (const exp of ["nunca", "mais1"])
    for (const d of M.buildPlan(perfil({ tempo, exp, dias: [1, 2, 3, 4] })).days) assert.ok(d.min <= tempo + 1, `${tempo} min: ${d.n} = ${d.min}`);
});

test("iniciante nunca recebe RPE acima de 8", () => {
  for (const objetivo of Object.keys(M.GOALS)) for (const d of M.buildPlan(perfil({ objetivo, inicio: "2020-01-01" })).days)
    for (const e of d.ex) assert.ok(Math.max(...e.rpe) <= 8, `${objetivo} ${e.id}`);
});

test("primeiras 2 semanas do iniciante: RPE até 7", () => {
  const hoje = new Date().toISOString().slice(0, 10);
  for (const d of M.buildPlan(perfil({ inicio: hoje })).days) for (const e of d.ex) assert.ok(Math.max(...e.rpe) <= 7);
});

test("exercícios a evitar não aparecem como primeira opção", () => {
  const pl = M.buildPlan(perfil({ evitar: "agachamento livre, barra fixa", exp: "mais1", dias: [1, 2, 3, 4] }));
  for (const d of pl.days) for (const e of d.ex) assert.ok(!/agachamento livre|barra fixa/i.test(e.opts[0]), e.opts[0]);
});

test("dor no joelho: agachamento começa por opção segura", () => {
  const pl = M.buildPlan(perfil({ dores: ["joelho"] }));
  const sq = pl.days.flatMap(d => d.ex).filter(e => e.p === "squat");
  assert.ok(sq.length);
  for (const e of sq) assert.ok(M.LIB.squat.joelho.includes(e.opts[0]), e.opts[0]);
});

test("treino em casa só oferece exercícios de casa", () => {
  const casa = new Set(M.DATA.exercicios.filter(e => "casa" in e.locais).map(e => e.nome));
  for (const d of M.buildPlan(perfil({ local: "casa" })).days) for (const e of d.ex) for (const o of e.opts)
    assert.ok(casa.has(o) || Object.values(M.LIB[e.p]).some(v => Array.isArray(v) && v.includes(o)), o);
});

test("perna não fica no dia nem na véspera de atividade forte de pernas, para qualquer esporte de pernas", () => {
  const dePernas = Object.entries(M.SPORTS).filter(([, v]) => v.leg >= 0.6).map(([k]) => k);
  assert.ok(dePernas.length >= 5);
  for (const mod of dePernas) {
    const pl = M.buildPlan(perfil({ exp: "mais1", dias: [1, 2, 3, 4], esportes: [{ mod, dias: [1, 3], int: "forte" }] }));
    for (const d of pl.days) if (M.regionOf(d).L > 0.6) assert.ok(![1, 3].includes(d.dow[0]), `${mod}: ${d.n} na ${d.dow[0]}`);
  }
});

test("quem só faz musculação recebe o plano sem ajustes de esporte", () => {
  const pl = M.buildPlan(perfil({ exp: "mais1", dias: [1, 2, 3, 4] }));
  assert.ok(pl.days.every(d => !d.sport.length && !d.warn));
});

test("esportes moderados/fortes descontam o cardio", () => {
  const sem = M.buildPlan(perfil({ objetivo: "saude" })).cardio.n;
  const com = M.buildPlan(perfil({ objetivo: "saude", esportes: [{ mod: "Corrida", dias: [2, 6], int: "moderada" }] })).cardio.n;
  assert.equal(com, Math.max(0, sem - 2));
});

test("prioridade dá mais volume ao músculo", () => {
  const a = M.buildPlan(perfil({ exp: "mais1", dias: [1, 2, 3, 4] })).vol.v.peito;
  const b = M.buildPlan(perfil({ exp: "mais1", dias: [1, 2, 3, 4], prioridades: ["peito"] })).vol.v.peito;
  assert.ok(b > a, `${b} > ${a}`);
});

test("divisões automáticas por número de dias", () => {
  const sk = (n, exp) => M.buildPlan(perfil({ exp, dias: [1, 2, 3, 4, 5, 6].slice(0, n) })).sk;
  assert.equal(sk(3, "nunca"), "full"); assert.equal(sk(4, "nunca"), "ul");
  assert.equal(sk(5, "mais1"), "ulf"); assert.equal(sk(6, "mais1"), "ppl");
});

test("força estimada (e1RM): mais reps ou mais reps sobrando = mais forte", () => {
  assert.ok(M.e1rm(100, 5, 8) > M.e1rm(100, 4, 8));
  assert.ok(M.e1rm(100, 5, 8) > M.e1rm(100, 5, 9));
});

test("toda evidência tem regra, tipo, força e fonte", () => {
  for (const e of M.DATA.evidencias) { assert.ok(e.regra && e.tipo && e.forca); assert.ok(e.fontes.length); }
});

test("sem nomes repetidos dentro do mesmo movimento", () => {
  const vistos = new Set();
  for (const e of M.DATA.exercicios) { const k = e.padrao + "|" + e.nome.toLowerCase(); assert.ok(!vistos.has(k), "repetido: " + k); vistos.add(k); }
});

test("máquinas comuns de academia brasileira estão na base", () => {
  const nomes = new Set(M.DATA.exercicios.map(e => e.nome));
  for (const n of ["Supino articulado", "Cadeira adutora", "Barra fixa no graviton", "Leg press vertical", "Panturrilha sentado na máquina", "Crucifixo na máquina", "Remada baixa na máquina"])
    assert.ok(nomes.has(n), n);
});

test("'evitar' também reconhece o nome popular (voador = peck deck)", () => {
  const pl = M.buildPlan(perfil({ exp: "mais1", dias: [1, 2, 3, 4, 5, 6], divisao: "ppl", evitar: "voador" }));
  for (const d of pl.days) for (const e of d.ex) assert.notEqual(e.opts[0], "Peck deck");
  assert.ok(!M.pickOpts(M.LIB.chest, { local: "completa", evitar: "voador" }).includes("Peck deck"));
});

test("grupo adutores: existe, tem opções em todo local e aparece como prioridade", () => {
  assert.ok(M.MUSCLES.includes("adutores"));
  for (const l of LOC) assert.ok(M.LIB.adductor.o[l].length >= 3, l);
  const sem = M.buildPlan(perfil({ exp: "mais1", dias: [1, 2, 3, 4] })).vol.v.adutores;
  const com = M.buildPlan(perfil({ exp: "mais1", dias: [1, 2, 3, 4], prioridades: ["adutores"] })).vol.v.adutores;
  assert.ok(com > sem, `${com} > ${sem}`);
});

test("'evitar' separa por vírgula, barra, 'e' e 'ou'", () => {
  const o = M.pickOpts(M.LIB.squat, { local: "completa", evitar: "Agachamento livre e leg press" });
  assert.ok(!o.includes("Agachamento livre") && !o.some(x => /leg press/i.test(x)));
});

test("cada exercício e o plano explicam o porquê", () => {
  const pl = M.buildPlan(perfil({ habilidades: ["barra"], prioridades: ["peito"] }));
  assert.ok(pl.why.length >= 3);
  for (const d of pl.days) for (const e of d.ex) assert.ok(e.why.length, e.opts[0]);
  for (const w of pl.why) if (w.ev) assert.ok(M.DATA.evidencias.some(x => x.id === w.ev), "evidência inexistente: " + w.ev);
});

test("iniciante recebe exercícios principais mais estáveis que o avançado", () => {
  const media = exp => { const c = M.buildPlan(perfil({ exp, dias: [1, 2, 3, 4] })).days.flatMap(d => d.ex).filter(e => e.k === "C").map(e => M.complexity(e.opts[0])); return c.reduce((a, b) => a + b, 0) / c.length; };
  assert.ok(media("nunca") < media("mais1"), `${media("nunca")} < ${media("mais1")}`);
});

test("sono curto não corta o volume; a preferência de volume decide", () => {
  const tot = pf => Object.values(M.buildPlan(pf).vol.v).reduce((a, b) => a + b, 0);
  const base = perfil({ exp: "mais1", dias: [1, 2, 3, 4], tempo: 90 });
  assert.equal(tot({ ...base, sono: 5, estresse: 5 }), tot({ ...base, sono: 8, estresse: 2 }));
  assert.ok(tot({ ...base, volume: "alto" }) > tot(base) && tot(base) > tot({ ...base, volume: "menor" }));
  assert.ok(M.buildPlan({ ...base, sono: 5 }).why.some(w => w.ev === "recuperacao"));
});

test("cada esporte traz o que a ciência recomenda para ele", () => {
  const ex = pf => M.buildPlan(pf).days.flatMap(d => d.ex.map(e => e.opts[0]));
  const b = perfil({ exp: "6a12", dias: [1, 2, 4, 5], tempo: 75 });
  const fut = ex({ ...b, esportes: [{ mod: "Futebol", dias: [6], int: "forte" }] });
  assert.ok(fut.includes("Nordic (com assistência)") && fut.includes("Prancha de Copenhagen"), fut.join(", "));
  const pl = M.buildPlan({ ...b, esportes: [{ mod: "Futebol", dias: [6], int: "forte" }] });
  for (const d of pl.days) { assert.ok(d.min <= 76, d.n + " " + d.min); if (d.ex.some(e => e.opts[0] === "Nordic (com assistência)")) assert.ok(M.regionOf(d).L > 0.4, "Nordic em dia de perna"); }
  const nat = ex({ ...b, esportes: [{ mod: "Natação", dias: [6], int: "moderada" }] });
  assert.ok(nat.some(n => /Rotação externa/.test(n)), nat.join(", "));
  const run = M.buildPlan({ ...b, esportes: [{ mod: "Corrida", dias: [3, 6], int: "moderada" }] });
  assert.ok(run.days.flatMap(d => d.ex).some(e => e.p === "power"));
  assert.ok(run.days.flatMap(d => d.ex).filter(e => e.k === "C" && M.LIB[e.p].low).every(e => e.hi === 6));
});

test("habilidades mudam o plano: barra fixa, potência, mobilidade e corrida", () => {
  const ex = pl => pl.days.flatMap(d => d.ex);
  const barra = M.buildPlan(perfil({ habilidades: ["barra"] }));
  assert.ok(ex(barra).filter(e => e.skill === "barra").length >= 1);
  assert.ok(barra.days.some(d => d.ex[0].skill === "barra"), "barra no início do treino");
  const pot = M.buildPlan(perfil({ exp: "6a12", dias: [1, 2, 4, 5], habilidades: ["potencia"] }));
  assert.equal(ex(pot).filter(e => e.p === "power").length, 2);
  assert.ok(M.buildPlan(perfil({ habilidades: ["mobilidade"] })).days.every(d => d.mob && d.mob.length));
  const run = M.buildPlan(perfil({ habilidades: ["corrida"] }));
  assert.ok(run.cardio.corrida && run.cardio.n >= 3);
});

test("mesmo movimento em treinos diferentes da semana usa variações diferentes", () => {
  const pl = M.buildPlan(perfil({ exp: "mais1", dias: [1, 2, 4, 5] }));
  const sq = pl.days.flatMap(d => d.ex).filter(e => e.p === "squat").map(e => e.opts[0]);
  assert.ok(sq.length >= 2 && new Set(sq).size === sq.length, sq.join(" / "));
});

test("perfis diferentes geram planos diferentes", () => {
  const assinatura = pf => JSON.stringify(M.buildPlan(pf).days.map(d => d.ex.map(e => e.opts[0] + e.sets)));
  const perfis = [perfil(), perfil({ exp: "mais1" }), perfil({ local: "casa" }), perfil({ objetivo: "forca" }), perfil({ habilidades: ["costas"] }), perfil({ tempo: 30 })];
  assert.equal(new Set(perfis.map(assinatura)).size, perfis.length);
});

test("divisão automática varia com dias e experiência (não é sempre corpo inteiro)", () => {
  const D={3:[1,3,5],4:[1,2,4,5],6:[1,2,3,4,5,6]};
  assert.equal(M.buildPlan(perfil({dias:D[3]})).sk, "full");
  assert.equal(M.buildPlan(perfil({dias:D[4]})).sk, "ul");
  assert.equal(M.buildPlan(perfil({exp:"mais1",dias:D[6]})).sk, "ppl");
  assert.equal(M.buildPlan(perfil({exp:"mais1",dias:D[3],divisao:"abc"})).sk, "abc");
});
