// Perfis-gabarito: pessoas típicas com o que um bom plano PRECISA ter, escrito antes de olhar o que o motor gera.
// Cada "espera" devolve a lista do que não foi atendido (vazia = aprovado). Mudou o motor e um gabarito quebrou?
// Ou o motor piorou, ou a expectativa estava errada: decida e explique no commit, nunca afrouxe sem motivo.
const base = o => ({ exp: "nunca", objetivo: "hipertrofia", dias: [1, 3, 5], tempo: 60, local: "completa", dores: [], prioridades: [], habilidades: [],
  esportes: [], cardio: "sim", divisao: "auto", volume: "padrao", inicio: "2025-01-01", ...o });

/* verificações reutilizáveis */
const exs = plan => plan.days.flatMap(d => d.ex);
const checar = (...regras) => (plan, a, M) => regras.flatMap(r => { const msg = r(plan, a, M); return msg ? [].concat(msg) : []; });
const semErros = () => (p, a) => a.achados.filter(x => x.sev === "erro").map(x => "erro do auditor: " + x.msg);
const notaMin = n => (p, a) => a.nota < n && `nota ${a.nota} abaixo de ${n}`;
const dias = n => p => p.days.length !== n && `${p.days.length} dias de musculação (esperado ${n})`;
const divisao = (...ks) => p => !ks.includes(p.sk) && `divisão ${p.sk} (esperado ${ks.join(" ou ")})`;
const rpeMax = n => p => exs(p).filter(e => Math.max(...e.rpe) > n).map(e => `${e.opts[0]}: RPE ${Math.max(...e.rpe)} > ${n}`);
const volEntre = (m, lo, hi) => (p, a) => (a.volume[m] < lo || a.volume[m] > hi) && `${m}: ${Math.round(a.volume[m] * 10) / 10} séries (esperado ${lo}–${hi})`;
const freqMin = (ms, n) => (p, a) => ms.filter(m => a.frequencia[m] < n).map(m => `${m} treinado ${a.frequencia[m]}× (esperado ≥${n}×)`);
const nenhum = (re, porque) => p => exs(p).filter(e => re.test(e.opts[0])).map(e => `${porque}: ${e.opts[0]}`);
const temPadrao = (pad, porque) => p => !exs(p).some(e => e.p === pad) && `sem ${porque}`;
const pernaLonge = diasFortes => (p, a, M) => p.days.filter(d => d.dow && M.regionOf(d).L > 0.5 && diasFortes.some(x => x === d.dow[0] || x === (d.dow[0] + 1) % 7))
  .map(d => `${d.n} em ${M.DOWN[d.dow[0]]}: pernas no dia ou na véspera do esporte`);
const GRANDES = ["peito", "costas", "pernas", "posterior", "ombros", "glúteos"];

export const PERSONAS = [
  { nome: "Iniciante, 3 dias, hipertrofia", quem: "Nunca treinou, academia completa, seg/qua/sex, 60 min.",
    pf: base({}), espera: checar(semErros(), notaMin(85), dias(3), divisao("full"), rpeMax(8), freqMin(["peito", "costas", "pernas"], 2), volEntre("peito", 5, 13), volEntre("costas", 5, 14)) },
  { nome: "Saúde depois dos 50, 2 dias", quem: "55 anos, quer saúde, academia básica, ter/qui, 45 min.",
    pf: base({ objetivo: "saude", dias: [2, 4], tempo: 45, local: "basica", idade: 55 }),
    espera: checar(semErros(), notaMin(80), dias(2), divisao("full"), rpeMax(8), freqMin(GRANDES.slice(0, 4), 2)) },
  { nome: "Intermediário, 4 dias, hipertrofia", quem: "6–12 meses de treino, academia completa, seg/ter/qui/sex, 75 min.",
    pf: base({ exp: "6a12", dias: [1, 2, 4, 5], tempo: 75 }),
    espera: checar(semErros(), notaMin(85), dias(4), divisao("ul"), freqMin(GRANDES, 2), ...GRANDES.map(m => volEntre(m, 8, 22))) },
  { nome: "Avançado, 6 dias, hipertrofia", quem: "Mais de 1 ano, seg a sáb, 75 min.",
    pf: base({ exp: "mais1", dias: [1, 2, 3, 4, 5, 6], tempo: 75 }),
    espera: checar(semErros(), notaMin(85), dias(6), divisao("ppl"), freqMin(GRANDES, 2), ...GRANDES.map(m => volEntre(m, 10, 24))) },
  { nome: "Força, 4 dias", quem: "Mais de 1 ano, quer ficar mais forte, 90 min.",
    pf: base({ exp: "mais1", objetivo: "forca", dias: [1, 2, 4, 5], tempo: 90 }),
    espera: checar(semErros(), notaMin(85), freqMin(["peito", "costas", "pernas"], 2),
      p => exs(p).filter(e => e.k === "C" && !e.skill && e.hi > 6).map(e => `${e.opts[0]}: ${e.lo}–${e.hi} reps num composto de força`),
      p => exs(p).filter(e => e.k === "C" && e.rest < 150).map(e => `${e.opts[0]}: descanso ${e.rest}s`)) },
  { nome: "Emagrecimento em casa", quem: "Iniciante, treina em casa, 3 dias, 45 min.",
    pf: base({ objetivo: "emagrecimento", local: "casa", tempo: 45 }),
    espera: checar(semErros(), notaMin(80), nenhum(/máquina|cabo|smith|leg press|polia|cadeira|mesa flexora|peck/i, "máquina em casa"), p => p.cardio.n < 2 && `cardio ${p.cardio.n}×/semana (esperado ≥2 para emagrecimento)`) },
  { nome: "Iniciante com dor no joelho e na lombar", quem: "Nunca treinou, 3 dias, 60 min, joelho e lombar doem.",
    pf: base({ dores: ["joelho", "lombar"] }),
    espera: checar(semErros(), notaMin(80), rpeMax(8), nenhum(/agachamento livre|terra convencional|good morning|com salto|pistol|búlgaro com barra/i, "exercício arriscado com dor")) },
  { nome: "Jiu-jitsu forte ter/qui", quem: "Intermediário, musculação seg/qua/sex 60 min, jiu-jitsu forte ter e qui.",
    pf: base({ exp: "6a12", esportes: [{ mod: "Jiu-jitsu / luta", dias: [2, 4], int: "forte" }] }),
    espera: checar(semErros(), notaMin(75), pernaLonge([2, 4])) },
  { nome: "Corredor, provas no sábado", quem: "Mais de 1 ano, corre forte ter e sáb, musculação seg/qua/sex, 60 min.",
    pf: base({ exp: "mais1", objetivo: "misto", esportes: [{ mod: "Corrida", dias: [2, 6], int: "forte" }] }),
    espera: checar(semErros(), notaMin(75), (p, a, M) => p.days.filter(d => d.dow && d.dow[0] === 5 && M.regionOf(d).L > 0.5).map(() => "pernas na sexta, véspera da corrida forte")) },
  { nome: "Pouco tempo: 30 min, 3 dias", quem: "Intermediário, hipertrofia, 30 min por treino.",
    pf: base({ exp: "6a12", tempo: 30 }),
    espera: checar(semErros(), p => p.days.filter(d => d.min > 32).map(d => `${d.n}: ${d.min} min em 30`), p => p.days.filter(d => d.ex.length < 3).map(d => `${d.n}: só ${d.ex.length} exercícios`)) },
  { nome: "Escolheu ABC com 3 dias", quem: "Intermediário que quer a divisão clássica ABC, 3 dias, 75 min.",
    pf: base({ exp: "6a12", divisao: "abc", tempo: 75 }),
    espera: checar(semErros(), divisao("abc"), (p, a) => !a.achados.some(x => x.crit === "frequencia") && "deveria alertar que cada músculo treina só 1×/semana") },
  { nome: "Prioridade glúteos, 4 dias", quem: "Intermediária, quer glúteos, 4 dias, 60 min.",
    pf: base({ exp: "6a12", dias: [1, 2, 4, 5], prioridades: ["glúteos"] }),
    espera: checar(semErros(), notaMin(80), (p, a) => { const outros = ["peito", "costas", "ombros"].map(m => a.volume[m]); return a.volume["glúteos"] <= Math.max(...outros) && `glúteos ${Math.round(a.volume["glúteos"])} séries, não supera ${Math.round(Math.max(...outros))}`; }) },
  { nome: "Um pouco de tudo, 5 dias", quem: "Mais de 1 ano, objetivo misto, 5 dias, 60 min.",
    pf: base({ exp: "mais1", objetivo: "misto", dias: [1, 2, 3, 4, 5] }),
    espera: checar(semErros(), notaMin(85), dias(5), freqMin(GRANDES, 2)) },
  { nome: "Casa, 2 dias, 30 min", quem: "Nunca treinou, saúde, em casa, sáb/dom, 30 min.",
    pf: base({ objetivo: "saude", local: "casa", dias: [6, 0], tempo: 30 }),
    espera: checar(semErros(), dias(2), rpeMax(8), p => p.days.filter(d => d.min > 32).map(d => `${d.n}: ${d.min} min`), temPadrao("squat", "agachamento"), temPadrao("hpush", "empurrar na horizontal")) },
  { nome: "Não quer agachamento livre nem supino", quem: "Intermediário, 3 dias, escreveu 'agachamento livre, supino reto com barra' em evitar.",
    pf: base({ exp: "6a12", evitar: "agachamento livre, supino reto com barra" }),
    espera: checar(semErros(), nenhum(/agachamento livre|supino reto com barra/i, "exercício que a pessoa pediu para evitar")) },
  { nome: "Futebol forte domingo, 4 dias", quem: "Intermediário, joga futebol forte no domingo, musculação seg/ter/qui/sex, 60 min.",
    pf: base({ exp: "6a12", dias: [1, 2, 4, 5], esportes: [{ mod: "Futebol", dias: [0], int: "forte" }] }),
    espera: checar(semErros(), notaMin(75), freqMin(["peito", "costas"], 2)) },
];
