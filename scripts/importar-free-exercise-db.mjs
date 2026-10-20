// Junta os exercícios aprovados da free-exercise-db (domínio público) em data/exercicios.json.
// Idempotente: pode rodar de novo depois de editar data/fontes/traducoes.json.
import { readFileSync, writeFileSync } from "node:fs";
import { classificar, locais } from "./classificar-free-exercise-db.mjs";
const u = p => new URL("../" + p, import.meta.url);
const db = JSON.parse(readFileSync(u("data/fontes/free-exercise-db.json")));
const tr = JSON.parse(readFileSync(u("data/fontes/traducoes.json")));
let ex = JSON.parse(readFileSync(u("data/exercicios.json")))
  .filter(e => e.fonte !== "free-exercise-db")
  .map(e => { delete e.idExterno; delete e.nivel; delete e.equipamento; return e; });
const slug = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const NIVEL = { beginner: "iniciante", intermediate: "intermediario", expert: "avancado" };
const EQUIP = { barbell: "barra", "e-z curl bar": "barra W", machine: "máquina", cable: "cabo", dumbbell: "halteres", "body only": "peso do corpo", kettlebells: "kettlebell", bands: "elástico" };
let novos = 0, ligados = 0, ordem = 100;
for (const e of db) {
  const t = tr[e.name]; if (!t) continue;
  const nome = typeof t === "string" ? t : t.nome, padrao = (typeof t === "object" && t.padrao) || classificar(e);
  if (!padrao) continue;
  const extra = { idExterno: e.id, nivel: NIVEL[e.level] || e.level, equipamento: EQUIP[e.equipment] || e.equipment };
  const igual = ex.find(x => x.nome === nome);
  if (igual) { Object.assign(igual, extra); ligados++; continue; }
  const loc = {}; locais(e.equipment).forEach(l => loc[l] = ordem);
  ex.push({ id: padrao + "/" + slug(nome), nome, padrao, locais: loc, seguroPara: {}, fonte: "free-exercise-db", ...extra });
  ordem++; novos++;
}
const ids = new Set(); ex = ex.filter(e => !ids.has(e.id) && ids.add(e.id));
writeFileSync(u("data/exercicios.json"), JSON.stringify(ex, null, 2) + "\n");
console.log(`${ex.length} exercícios (${novos} novos da free-exercise-db, ${ligados} já existentes ligados à fonte)`);
