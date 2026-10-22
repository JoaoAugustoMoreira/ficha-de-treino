// Robô de usabilidade do Kora: faz as tarefas principais como uma pessoa nova faria, na largura de celular,
// e devolve um relatório (toques por tarefa, botões pequenos demais, rolagem horizontal, becos sem saída).
// Como usar: abra o index.html num navegador com a tela de celular (375 px), cole este arquivo no console
// (ou injete pelo preview) e rode:  await roboKora()
// Ele APAGA os dados deste navegador antes de começar (é para rodar numa cópia de teste, nunca no celular de alguém).
async function roboKora() {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const vis = e => !!e && !e.hidden && (e.offsetParent !== null || getComputedStyle(e).position === "fixed");
  const $1 = s => document.querySelector(s), $all = s => [...document.querySelectorAll(s)];
  const botao = t => $all("button").filter(vis).find(b => b.innerText.trim().toLowerCase().includes(t.toLowerCase()));
  const R = { tarefas: [], problemas: [] };
  let toques = 0; const tap = el => { if (!el) throw new Error("botão não encontrado"); el.click(); toques++; };
  const checaTela = nome => {
    if (document.documentElement.scrollWidth > innerWidth + 1) R.problemas.push(`${nome}: a página rola para o lado`);
    const peq = $all("button,input,select,summary").filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.height < 32 || r.width < 32; })
      .map(e => (e.getAttribute("aria-label") || e.innerText || e.placeholder || e.id).trim().slice(0, 30));
    if (peq.length) R.problemas.push(`${nome}: alvos de toque pequenos (< 32 px): ${[...new Set(peq)].slice(0, 6).join(" · ")}`);
  };
  const tarefa = async (nome, fn) => { const t0 = toques; try { const nota = await fn(); R.tarefas.push({ tarefa: nome, ok: true, toques: toques - t0, nota: nota || "" }); }
    catch (e) { R.tarefas.push({ tarefa: nome, ok: false, toques: toques - t0, nota: String(e.message || e) }); } };

  localStorage.clear(); if (typeof draft !== "undefined") Object.assign(draft, { data: null, dirty: false, bak: null }); state.onbStep = 0; state.pf = null; state.sessions = []; state.prefs = { swap: {} }; state.current = "onb"; render(); await wait(300);

  await tarefa("1. Montar o plano (questionário)", async () => {
    for (let i = 0; i < 8 && !state.pf; i++) {
      checaTela("Questionário " + ($1("#wizN") || {}).innerText);
      if (vis($1("#q-go"))) { tap($1("#q-go")); await wait(300); if (!state.pf) throw new Error("não montou: " + $1("#status").innerText); }
      else { tap($1("#q-next")); await wait(150); }
    }
    if (!state.pf) throw new Error("questionário não terminou");
    return `chegou em "${($1("#day h2") || {}).innerText}"`;
  });

  await tarefa("2. Abrir o treino de hoje", async () => {
    tap(botao("primeiro treino") || $all("#tabs .tab").find(b => /treino/i.test(b.innerText))); await wait(300);
    checaTela("Treino");
    if (!$1(".card.ex")) throw new Error("nenhum exercício na tela");
    return vis($1("#tour")) ? "o guia \"Como ler esta tela\" aparece" : "SEM guia na primeira vez";
  });

  await tarefa("3. Registrar a 1ª série (carga, reps, ✓)", async () => {
    const d = state.plan.days.find(x => x.key === state.current), ex = d.ex[0];
    const kg = $1(`#${ex.id}-kg-0`); kg.value = "40"; kg.dispatchEvent(new Event("input", { bubbles: true })); toques++;
    tap($1(`[data-ex="${ex.id}"] .okb[data-i="0"]`)); await wait(150);
    if ($1(`#${ex.id}-d-0`).value !== "1") throw new Error("o ✓ não marcou a série: " + $1("#status").innerText);
    const crono = vis($1("#rest")); tap($1("#restX"));
    return crono ? "✓ marcou e abriu o cronômetro" : "✓ marcou, mas o cronômetro não apareceu";
  });

  await tarefa("4. Trocar um exercício", async () => {
    const card = $all(".card.ex")[1]; const antes = card.querySelector(".exname").innerText;
    tap(card.querySelector(".swapbtn")); await wait(150);
    const op = $all("#sheet .sopt").find(b => b.getAttribute("aria-pressed") !== "true"); if (!op) throw new Error("sem opções na lista");
    tap(op); await wait(300);
    const depois = $all(".card.ex")[1].querySelector(".exname").innerText;
    if (antes === depois) throw new Error("o exercício não mudou");
    return `${antes} → ${depois}`;
  });

  await tarefa("5. Salvar o treino", async () => {
    tap($1("#saveBtn")); await wait(500);
    if (!state.sessions.length) throw new Error("não salvou: " + $1("#status").innerText);
    return $1("#status").innerText;
  });

  await tarefa("6. Ver o progresso", async () => {
    tap($all("#tabs .tab").find(b => /progresso/i.test(b.innerText))); await wait(300);
    checaTela("Progresso");
    return ($1("#day h2") || {}).innerText;
  });

  await tarefa("7. Copiar o backup", async () => {
    tap($all("#tabs .tab").find(b => /perfil/i.test(b.innerText))); await wait(300);
    checaTela("Perfil");
    const det = $all("#day details").find(x => /backup/i.test(x.innerText)); if (!det) throw new Error("sem área de backup");
    det.open = true; toques++;
    if (!$1("#bkCopy")) throw new Error("sem botão Copiar backup");
    return "Perfil → Backup dos dados → Copiar backup";
  });

  R.totalToques = toques; R.aprovadas = R.tarefas.filter(t => t.ok).length + " de " + R.tarefas.length;
  localStorage.clear();
  return R;
}
if (typeof window !== "undefined") window.roboKora = roboKora;
