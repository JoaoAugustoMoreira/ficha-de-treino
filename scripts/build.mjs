// Gera o app em um arquivo só, com os dados embutidos:
//  - index.html             página completa (GitHub Pages / navegador)
//  - dist/ficha-de-treino.html  versão para publicar no Claude (sem <html>/<head>)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const r = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const DATA = {
  padroes: JSON.parse(r("data/padroes.json")),
  exercicios: JSON.parse(r("data/exercicios.json")),
  divisoes: JSON.parse(r("data/divisoes.json")),
  objetivos: JSON.parse(r("data/objetivos.json")),
  esportes: JSON.parse(r("data/esportes.json")),
  evidencias: JSON.parse(r("data/evidencias.json")),
  habilidades: JSON.parse(r("data/habilidades.json")),
};
const version = JSON.parse(r("package.json")).version;
const js = `const APP_VERSION=${JSON.stringify(version)};\nconst DATA=${JSON.stringify(DATA)};\n${r("src/engine.js")}\n${r("src/app.js")}\n${r("src/charts.js")}`;
const page = r("src/shell.html").replace("/*@CSS*/", () => r("src/styles.css")).replace("/*@JS*/", () => js);
mkdirSync(new URL("../dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("../dist/ficha-de-treino.html", import.meta.url), page);
const full = `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${page.replace('<div class="wrap">', '</head>\n<body>\n<div class="wrap">')}\n</body>\n</html>\n`;
writeFileSync(new URL("../index.html", import.meta.url), full);
console.log(`build ok · v${version} · ${DATA.exercicios.length} exercícios · ${DATA.evidencias.length} evidências`);
