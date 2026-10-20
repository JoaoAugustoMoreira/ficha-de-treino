// Gera src/corpo.js com os contornos do corpo (frente e costas, masculino) do pacote react-native-body-highlighter (MIT).
// Uso: npm i --no-save react-native-body-highlighter && node scripts/importar-corpo.mjs
import { createRequire } from "node:module"; import { writeFileSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const base = process.argv[2] || "react-native-body-highlighter/dist/assets/";
const front = require(base + "bodyFront.js").bodyFront, back = require(base + "bodyBack.js").bodyBack;
const MAP = { chest:"peito", obliques:"abdômen", abs:"abdômen", biceps:"braços", triceps:"braços", forearm:"braços", deltoids:"ombros",
  trapezius:"costas", "upper-back":"costas", "lower-back":"costas", adductors:"adutores", quadriceps:"pernas", hamstring:"posterior",
  gluteal:"glúteos", calves:"panturrilha", tibialis:"panturrilha" };
const { svgPathBbox } = await import(process.argv[3] || "svg-path-bbox");
// um item por contorno (lado esquerdo e direito separados), com o centro da caixa: o app engrossa cada músculo a partir do próprio centro
const r1 = v => Math.round(v * 10) / 10;
const pack = arr => arr.flatMap(x => [...(x.path.left||[]), ...(x.path.right||[]), ...(x.path.common||[])].map(d => { const [x0,y0,x1,y1] = svgPathBbox(d); return [MAP[x.slug] || "", x.slug, d, r1((x0+x1)/2), r1((y0+y1)/2)]; }));
const lic = readFileSync(new URL("../vendor/react-native-body-highlighter.LICENSE", import.meta.url), "utf8").trim().split("\n").map(l => " * " + l).join("\n");
const out = `/* Contornos anatômicos do corpo (frente e costas), adaptados de react-native-body-highlighter.
${lic}
 */
const CORPO=${JSON.stringify({ front: pack(front), back: pack(back) })};
`;
writeFileSync(new URL("../src/corpo.js", import.meta.url), out);
console.log("corpo.js:", out.length, "bytes");
