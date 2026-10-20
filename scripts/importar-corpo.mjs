// Gera src/corpo.js com os contornos do corpo (frente e costas, masculino) do pacote react-native-body-highlighter (MIT).
// Uso: npm i --no-save react-native-body-highlighter && node scripts/importar-corpo.mjs
import { createRequire } from "node:module"; import { writeFileSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const base = process.argv[2] || "react-native-body-highlighter/dist/assets/";
const front = require(base + "bodyFront.js").bodyFront, back = require(base + "bodyBack.js").bodyBack;
const MAP = { chest:"peito", obliques:"abdômen", abs:"abdômen", biceps:"braços", triceps:"braços", forearm:"braços", deltoids:"ombros",
  trapezius:"costas", "upper-back":"costas", "lower-back":"costas", adductors:"adutores", quadriceps:"pernas", hamstring:"posterior",
  gluteal:"glúteos", calves:"panturrilha", tibialis:"panturrilha" };
const pack = arr => arr.map(x => [MAP[x.slug] || "", x.slug, [...(x.path.left||[]), ...(x.path.right||[]), ...(x.path.common||[])].join(" ")]);
const lic = readFileSync(new URL("../vendor/react-native-body-highlighter.LICENSE", import.meta.url), "utf8").trim().split("\n").map(l => " * " + l).join("\n");
const out = `/* Contornos anatômicos do corpo (frente e costas), adaptados de react-native-body-highlighter.
${lic}
 */
const CORPO=${JSON.stringify({ front: pack(front), back: pack(back) })};
`;
writeFileSync(new URL("../src/corpo.js", import.meta.url), out);
console.log("corpo.js:", out.length, "bytes");
