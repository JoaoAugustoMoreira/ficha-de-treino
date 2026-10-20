// Carrega o motor (src/engine.js) com os dados de data/*.json, sem navegador.
import { readFileSync } from "node:fs";
import vm from "node:vm";
const r = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
export function carregarMotor() {
  const DATA = {
    padroes: JSON.parse(r("data/padroes.json")), exercicios: JSON.parse(r("data/exercicios.json")),
    divisoes: JSON.parse(r("data/divisoes.json")), objetivos: JSON.parse(r("data/objetivos.json")),
    esportes: JSON.parse(r("data/esportes.json")), evidencias: JSON.parse(r("data/evidencias.json")),
  };
  const module = { exports: {} };
  vm.runInNewContext(r("src/engine.js"), { DATA, module, console, Date, Math, JSON, Object, Array, Set, Number, String });
  return { ...module.exports, DATA };
}
export const perfil = (o = {}) => ({ exp: "nunca", objetivo: "hipertrofia", dias: [1, 3, 5], tempo: 60, local: "completa", dores: [], prioridades: [], esportes: [], cardio: "sim", inicio: "2026-01-01", ...o });
