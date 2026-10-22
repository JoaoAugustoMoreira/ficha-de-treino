// Progressão de carga (sugerirCarga no motor): cada regra com um caso real.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarMotor } from "./carregar.mjs";
const M = carregarMotor();
const EX = { k: "C", lo: 6, hi: 10, sets: 3, rpe: [7.5, 8, 8.5], low: false };      // composto de tronco, alvo médio 8
const NOME = "Supino reto com barra";                                               // incremento 2,5 kg
const s = (kg, reps, rpe) => (rpe == null ? { kg, reps } : { kg, reps, rpe });
const T = (...sets) => ({ date: "2026-10-20", sets });
const sug = (...h) => M.sugerirCarga(EX, NOME, h, {});

test("1ª vez: começa leve, sem carga sugerida", () => {
  const r = sug(); assert.equal(r.regra, "primeira"); assert.equal(r.kg, "");
});

test("fase de técnica do iniciante: mantém a carga", () => {
  const r = M.sugerirCarga(EX, NOME, [T(s(40, 10, 7))], { tecnica: true });
  assert.equal(r.regra, "tecnica"); assert.equal(r.kg, 40);
});

test("topo da faixa em todas as séries, esforço no alvo: sobe +2,5% (tronco)", () => {
  const r = sug(T(s(40, 10, 7.5), s(40, 10, 8), s(40, 10, 8.5)));
  assert.equal(r.regra, "topo"); assert.equal(r.kg, 42.5); assert.equal(r.reps, 6);
});

test("topo batido com back-off no fim: o back-off não impede a subida", () => {
  const r = sug(T(s(40, 10, 8), s(40, 10, 8.5), s(35, 12, 9)));
  assert.equal(r.regra, "topo"); assert.equal(r.kg, 42.5);
});

test("dentro da faixa: mantém e busca +1 rep", () => {
  const r = sug(T(s(40, 8, 8), s(40, 7, 8.5), s(40, 7, 9)));
  assert.equal(r.regra, "manter"); assert.equal(r.kg, 40); assert.equal(r.reps, 8);
});

test("só a última série foi à falha abaixo do mínimo: não reduz, avisa", () => {
  const r = sug(T(s(40, 8, 8), s(40, 7, 9), s(40, 4, 10)), T(s(40, 8, 7.5), s(40, 8, 8), s(40, 7, 8.5)));
  assert.equal(r.regra, "manter"); assert.equal(r.kg, 40); assert.match(r.html, /falha/);
});

test("2 treinos seguidos com 2+ séries abaixo do mínimo: reduz pela força estimada", () => {
  const r = sug(T(s(40, 5, 9.5), s(40, 4, 10), s(40, 4, 10)), T(s(40, 5, 9.5), s(40, 5, 10), s(40, 4, 10)));
  assert.equal(r.regra, "regredir"); assert.ok(r.kg < 40 && r.kg >= 30, String(r.kg));
});

test("1 treino ruim abaixo do mínimo ainda não reduz (pode ter sido um dia ruim)", () => {
  const r = sug(T(s(40, 5, 9), s(40, 5, 9), s(40, 5, 9)), T(s(40, 8, 8), s(40, 8, 8.5), s(40, 7, 9)));
  assert.notEqual(r.regra, "regredir");
});

test("esforço muito acima do alvo (RPE médio 1,5+ acima): reduz", () => {
  const r = sug(T(s(40, 7, 9.5), s(40, 7, 9.5), s(40, 6, 10)));
  assert.equal(r.regra, "rpe-alto"); assert.ok(r.kg < 40);
});

test("esforço muito abaixo do alvo (sobraram reps): sobe pela força estimada, no máximo +10%", () => {
  const r = sug(T(s(40, 8, 6), s(40, 8, 6), s(40, 8, 6.5)));
  assert.equal(r.regra, "rpe-baixo"); assert.ok(r.kg > 40 && r.kg <= 44, String(r.kg));
});

test("1 ponto acima do alvo em 2 treinos seguidos também ajusta (tendência, não dia ruim)", () => {
  const t = T(s(40, 7, 9), s(40, 7, 9), s(40, 7, 9));
  assert.equal(sug(t).regra, "manter");          // 1 treino só: espera
  assert.equal(sug(t, t).regra, "rpe-alto");     // 2 seguidos: reduz
});

test("3 treinos sem subir carga nem reps: avisa estagnação", () => {
  const t = T(s(40, 7, 8.5), s(40, 7, 8.5), s(40, 6, 8.5));
  assert.equal(sug(t, t, t).regra, "estagnado");
});

test("série mais pesada que falhou no fim é tentativa; a que deu certo vira a carga nova", () => {
  assert.equal(sug(T(s(40, 8, 8), s(40, 8, 8.5), s(45, 3, 10))).kg, 40);
  assert.equal(sug(T(s(40, 9, 7), s(40, 10, 8), s(45, 8, 8.5))).regra, "manter");
  assert.equal(sug(T(s(40, 9, 7), s(40, 10, 8), s(45, 8, 8.5))).kg, 45);
});

test("peso do corpo no topo: evoluir sem carga (reps, mochila ou variação)", () => {
  const r = sug(T(s(0, 10, 8), s(0, 10, 8), s(0, 10, 8.5)));
  assert.equal(r.regra, "corpo"); assert.equal(r.kg, 0);
});

test("incremento por equipamento: halter 2 kg, máquina 2,5, perna 5, isolado livre 1", () => {
  assert.equal(M.incOf(EX, "Supino com halteres"), 2);
  assert.equal(M.incOf({ k: "C", low: true }, "Agachamento livre"), 5);
  assert.equal(M.incOf({ k: "A" }, "Cadeira extensora"), 2.5);
  assert.equal(M.incOf({ k: "A" }, "Elevação lateral com elástico"), 1);
});

test("semana leve planejada a cada 7 semanas (6 normais + 1 leve), nunca nas primeiras 6", () => {
  const pf = { inicio: "2026-01-05" };                       // segunda-feira
  const sem = n => { const d = new Date("2026-01-05T12:00:00"); d.setDate(d.getDate() + 7 * (n - 1)); return M.cicloSemana(pf, d.toISOString().slice(0, 10)); };
  for (let n = 1; n <= 6; n++) assert.equal(sem(n).deload, false, "semana " + n);
  assert.equal(sem(7).deload, true); assert.equal(sem(8).deload, false); assert.equal(sem(14).deload, true);
  assert.equal(sem(5).falta, 2);
  assert.ok(M.buildPlan({ exp: "mais1", objetivo: "hipertrofia", dias: [1, 3, 5], tempo: 60, local: "completa", dores: [], prioridades: [], esportes: [], inicio: "2025-01-01" }).why.some(w => w.ev === "deload"));
});
