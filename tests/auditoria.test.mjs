import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarMotor } from "./carregar.mjs";
import { auditarPlano, perfisAleatorios } from "../auditoria/auditor.mjs";
import { PERSONAS } from "../auditoria/personas.mjs";
const M = carregarMotor();
const BASE = JSON.parse(readFileSync(new URL("../auditoria/linha-de-base.json", import.meta.url), "utf8"));

/* gabaritos que ainda falham por um problema conhecido do motor: aparecem como "todo" no resultado, sem quebrar o CI.
   Ao corrigir o motor, tire daqui — o teste passa a valer de verdade. */
const CONHECIDOS = {
};

for (const p of PERSONAS) {
  test(`gabarito: ${p.nome}`, { todo: CONHECIDOS[p.nome] }, () => {
    const plan = M.buildPlan(p.pf); const falhas = p.espera(plan, auditarPlano(M, p.pf, plan), M);
    assert.deepEqual(falhas, [], falhas.join("\n"));
  });
}

test("catraca: a qualidade média dos planos não piora", () => {
  const r = perfisAleatorios(M, BASE.perfis).map(pf => auditarPlano(M, pf, M.buildPlan(pf)));
  const media = r.reduce((a, x) => a + x.nota, 0) / r.length, comErro = r.filter(x => x.achados.some(a => a.sev === "erro")).length / r.length;
  assert.ok(Math.round(media) >= BASE.notaMediaMin, `nota média ${media.toFixed(1)} < ${BASE.notaMediaMin}`);
  assert.ok(comErro <= BASE.fracaoComErroMax + 1e-9, `${(100 * comErro).toFixed(1)}% dos planos com erro > ${100 * BASE.fracaoComErroMax}%`);
});

test("auditor: régua aponta para evidências que existem", () => {
  const ids = new Set(M.DATA.evidencias.map(e => e.id));
  const ref = JSON.parse(readFileSync(new URL("../auditoria/referencias.json", import.meta.url), "utf8"));
  for (const [k, v] of Object.entries(ref)) if (v && v.ev) assert.ok(ids.has(v.ev), `${k}: ${v.ev}`);
});
