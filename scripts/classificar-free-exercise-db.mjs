// Classifica a free-exercise-db (domínio público) nos padrões de movimento da ficha.
// Gera data/fontes/candidatos.json para revisão; os aprovados recebem nome em português
// em data/fontes/traducoes.json e entram em data/exercicios.json via scripts/importar.mjs.
import { readFileSync, writeFileSync } from "node:fs";
const db = JSON.parse(readFileSync(new URL("../data/fontes/free-exercise-db.json", import.meta.url)));
const has = (n, ...w) => w.some(x => n.includes(x));
export function classificar(e) {
  if (!["strength", "powerlifting"].includes(e.category) || !e.equipment) return null;
  if (["foam roll", "exercise ball", "medicine ball", "other"].includes(e.equipment)) return null;
  const n = e.name.toLowerCase(), m = e.primaryMuscles[0];
  if (has(n, "stretch", "smr", "jump", "throw", "toss", "slam", "clean", "snatch", "jerk", "swing")) return null;
  if (m === "quadriceps") return has(n, "squat", "leg press", "hack") && !has(n, "split", "lunge", "sissy") ? "squat" : "quad";
  if (m === "hamstrings") return has(n, "curl", "glute ham", "nordic") ? "ham" : has(n, "deadlift", "romanian", "stiff", "good morning") ? "hinge" : null;
  if (m === "glutes") return has(n, "thrust", "bridge", "kickback", "abduct", "hip extension", "pull through", "pull-through") ? "glute" : null;
  if (m === "chest") return has(n, "fly", "flye", "crossover", "pec deck", "butterfly") ? "chest" : has(n, "incline") ? "incline" : has(n, "press", "push-up", "pushup", "dip") ? "hpush" : null;
  if (m === "shoulders") return has(n, "lateral", "side raise") ? "lateral" : has(n, "rear", "reverse fly", "reverse flye", "face pull") ? "rear" : has(n, "press", "arnold") ? "vpush" : null;
  if (m === "lats") return has(n, "pulldown", "pull-down", "pull-up", "pullup", "chin") ? "vpull" : has(n, "row") ? "hpull" : null;
  if (m === "middle back") return has(n, "row") ? "hpull" : null;
  if (m === "biceps") return has(n, "curl") ? "biceps" : null;
  if (m === "triceps") return has(n, "extension", "pushdown", "push-down", "kickback", "dip", "close-grip", "skull") ? "triceps" : null;
  if (m === "calves") return has(n, "calf", "raise") ? "calves" : null;
  if (m === "abdominals") return has(n, "crunch", "plank", "rollout", "roll-out", "leg raise", "knee raise", "dead bug", "pallof", "sit-up", "situp", "woodchop", "russian") ? "core" : null;
  return null;
}
export function locais(eq) {
  return { barbell: ["completa", "basica"], "e-z curl bar": ["completa", "basica"], machine: ["completa"], cable: ["completa", "basica"],
    dumbbell: ["completa", "basica", "casa"], "body only": ["completa", "basica", "casa"], kettlebells: ["completa", "casa"], bands: ["casa", "basica"] }[eq] || [];
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const out = db.map(e => ({ id: e.id, nome: e.name, padrao: classificar(e), equipamento: e.equipment, nivel: e.level, locais: locais(e.equipment) })).filter(x => x.padrao);
  writeFileSync(new URL("../data/fontes/candidatos.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
  const c = {}; out.forEach(x => c[x.padrao] = (c[x.padrao] || 0) + 1);
  console.log(out.length, "candidatos", c);
}
