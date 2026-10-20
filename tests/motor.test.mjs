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

test("tempo por treino limita a quantidade de exercícios", () => {
  for (const [t, max] of Object.entries({ 30: 4, 45: 5, 60: 6, 75: 7, 90: 8 }))
    for (const d of M.buildPlan(perfil({ tempo: Number(t), exp: "mais1", dias: [1, 2, 3, 4] })).days) assert.ok(d.ex.length <= max);
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

test("perna não fica no dia nem na véspera de esporte forte de pernas quando há alternativa", () => {
  const pf = perfil({ exp: "mais1", dias: [1, 2, 3, 4], esportes: [{ mod: "Jiu-jitsu / luta", dias: [1, 3], int: "forte" }] });
  const pl = M.buildPlan(pf);
  for (const d of pl.days) if (M.regionOf(d).L > 0.6) assert.ok(![1, 3].includes(d.dow[0]), `${d.n} na ${d.dow[0]}`);
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
