/* Kora — interface: telas, registro, rascunho, histórico e análise. Usa o motor (engine.js). */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let toastT=null;
function setStatus(t){ const s=$("#status"); if(!s) return; s.textContent=t; s.classList.add("on"); clearTimeout(toastT); toastT=setTimeout(()=>s.classList.remove("on"),2600); }
function espRow(s,i){ s=s||{}; const mods=Object.keys(SPORTS);
  return `<div class="esprow" data-i="${i}"><div class="esphead"><select class="espmod" aria-label="Atividade">${mods.map(m=>`<option ${m===s.mod?"selected":""}>${esc(m)}</option>`).join("")}</select>
    <button type="button" class="link espdel" aria-label="Remover atividade">Remover</button></div>
    <p class="ql">Dias</p>${chipset("espd"+i,[1,2,3,4,5,6,0].map(d=>[d,DOWN[d]]),s.dias||[],true)}
    <p class="ql">Intensidade</p>${chipset("espi"+i,[["leve","Leve"],["moderada","Moderada"],["forte","Forte"]],s.int||"moderada")}
    <label class="ql">Duração (min)<input class="espmin" inputmode="numeric" value="${esc(s.min||"")}" placeholder="60"></label></div>`; }
function readSports(){ return $$(".esprow").map(r=>{ const i=r.dataset.i; return {mod:r.querySelector(".espmod").value,dias:chipVal("espd"+i,true).map(Number),int:chipVal("espi"+i)||"moderada",min:num(r.querySelector(".espmin").value)||null}; }).filter(s=>s.dias.length); }

/* ---------- estado e armazenamento ---------- */
let state={pf:null,plan:null,sessions:[],checkins:[],prefs:{swap:{}},analysis:null,current:null,leve:false,editing:false};
const LS="ficha-iniciante";
const store={mode:"local",db:null,uid:null,
  async init(){ try{ if(window.claude&&claude.use){ const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]); const uid=user?await user.id():null; if(db&&uid){ this.db=db; this.uid=uid; this.mode="db"; } } }catch(e){} },
  col(){ return this.db.collection("data/users/"+this.uid); },
  /* ARMAZENAMENTO É CONTRATO: a chave LS, o caminho data/users/<id> e os ids dos documentos (perfil, prefs, s_<ts>, ck_…) nunca mudam
     entre versões, senão quem já usa perde o histórico (tests/armazenamento.test.mjs). */
  local(){ try{ return JSON.parse(localStorage.getItem(LS)||"null")||{}; }catch(e){ return {}; } },
  async load(){
    if(this.mode==="db"){ let snap=null;
      for(let k=0;k<2&&!snap;k++){ try{ snap=await this.col().get(); }catch(e){ await new Promise(r=>setTimeout(r,1500)); } }
      /* a conta não respondeu: NÃO cai para um app vazio (a pessoa achava que tinha perdido tudo e se recadastrava) */
      if(!snap){ this.failed=true; return {failed:true}; }
      const o={sessions:[],checkins:[],pf:null,prefs:null,draft:null,bak:null,analysis:null};
      snap.docs.forEach(d=>{ const v=d.data(); if(!v) return; if(d.id==="perfil") o.pf=v; else if(d.id==="prefs") o.prefs=v; else if(d.id==="rascunho") o.draft=v; else if(d.id==="rascunho_bak") o.bak=v; else if(d.id==="analise") o.analysis=v; else if(d.id.startsWith("an_")) (o.anHist=o.anHist||[]).push(v); else if(v.type==="session") o.sessions.push(v); else if(v.type==="checkin") o.checkins.push(v); });
      /* migração: o que estava só neste navegador (modo local) sobe para a conta, sem apagar nada */
      const L=this.local(); try{
        const ids=new Set(o.sessions.map(x=>x.ts)); for(const x of (L.sessions||[])){ if(x&&x.type==="session"&&!ids.has(x.ts)){ await this.col().doc("s_"+x.ts).set(x); o.sessions.push(x); this.migrated=(this.migrated||0)+1; } }
        const wk=new Set(o.checkins.map(x=>x.week)); for(const x of (L.checkins||[])){ if(x&&x.week&&!wk.has(x.week)){ await this.col().doc("ck_"+x.week).set(x); o.checkins.push(x); } }
        if(!o.pf&&L.pf){ await this.col().doc("perfil").set(L.pf); o.pf=L.pf; this.migrated=this.migrated||1; }
        if(!o.prefs&&L.prefs){ await this.col().doc("prefs").set(L.prefs); o.prefs=L.prefs; }
      }catch(e){}
      return o; }
    return this.local(); },
  saveLocal(){ try{ localStorage.setItem(LS,JSON.stringify({sessions:state.sessions,checkins:state.checkins,pf:state.pf,prefs:state.prefs,analysis:state.analysis})); }catch(e){} },
  /* na conta, também guarda uma cópia neste aparelho (serve de reserva e de backup) */
  async put(id,v){ if(this.mode==="db"){ await this.col().doc(id).set(v); this.saveLocal(); return; } this.saveLocal(); },
  async del(id){ if(this.mode==="db") return this.col().doc(id).delete(); this.saveLocal(); },
  async saveDraft(d,merge,id){ if(this.mode!=="db") return; const ref=this.col().doc(id||"rascunho"); if(merge){ try{ await ref.update(d); return; }catch(e){} } await ref.set(d); }
};

/* ---------- histórico, e1RM e sugestão de carga ---------- */
function historyFor(name){ return state.sessions.filter(s=>s.ex&&s.ex[name]).sort((a,b)=>b.ts-a.ts).map(s=>({date:s.date,leve:s.leve,sets:s.ex[name]})); }
function incOf(ex,name){ if(/halter/i.test(name)) return 2; if(ex.k==="C") return ex.low?5:2.5; return /cabo|máquina|cadeira|mesa|peck|leg press|flexora|extensora|abdução/i.test(name)?2.5:1; }
/* a troca guarda o NOME escolhido (versões antigas guardavam a posição na lista); nome que saiu das opções volta para a 1ª */
function chosen(ex){ const v=state.prefs.swap[ex.id]; if(typeof v==="string") return ex.opts.includes(v)?v:ex.opts[0]; return ex.opts[v||0]||ex.opts[0]; }
/* Trocar exercício: lista própria da página. O menu nativo (<select> transparente por cima do botão) não abria no app do Claude no celular. */
function openSwap(ex,btn,all){ const cur=chosen(ex); const sh=$("#sheet"); $("#sheetT").textContent="Trocar exercício"; const syn=o=>EXBYNAME[o]&&EXBYNAME[o].sinonimos?`<small class="syn">${esc(EXBYNAME[o].sinonimos.slice(0,2).join(", "))}</small>`:"";
  const list=ex.opts.map((o,i)=>[o,i]).filter(([o,i])=>all||i<5||o===cur);
  $("#sheetL").innerHTML=list.map(([o,i])=>`<button type="button" class="sopt" data-i="${i}" aria-pressed="${o===cur}"><span>${esc(o)}</span>${syn(o)}</button>`).join("")
    +(!all&&ex.opts.length>list.length?`<button type="button" class="link" id="sheetAll">Ver todas (${ex.opts.length})</button>`:"");
  sh.hidden=false; document.body.style.overflow="hidden";
  const close=()=>{ sh.hidden=true; document.body.style.overflow=""; document.removeEventListener("keydown",onKey); try{ btn.focus({preventScroll:true}); }catch(e){} };
  const onKey=e=>{ if(e.key==="Escape") close(); }; document.removeEventListener("keydown",sh._k||(()=>{})); sh._k=onKey; document.addEventListener("keydown",onKey);
  $("#sheetX").onclick=close; sh.querySelector(".sheet-bg").onclick=close;
  if($("#sheetAll")) $("#sheetAll").onclick=()=>openSwap(ex,btn,true);
  $$("#sheet .sopt").forEach(b=>b.onclick=()=>{ close(); applySwap(ex,Number(b.dataset.i)); });
  const f=$('#sheet .sopt[aria-pressed="true"]')||$("#sheet .sopt"); if(f) f.focus({preventScroll:true}); }
async function applySwap(ex,i){ if(ex.opts[i]===chosen(ex)) return; flushDraft();
  Object.keys((draft.data&&draft.data.values)||{}).forEach(k=>{ if(k.startsWith(ex.id+"-")) draft.data.values[k]=""; });
  state.prefs.swap[ex.id]=ex.opts[i]; renderDay(); setStatus("Trocado para "+ex.opts[i]);
  try{ await store.put("prefs",state.prefs); }catch(err){ setStatus("Trocado só nesta tela: não consegui salvar."); } }
/* exercícios por tempo (prancha): a faixa vira segundos; o resto do plano não muda */
const isTimed=n=>/\(seg\)|prancha/i.test(n||"");
function viewEx(ex,name){ return isTimed(name)?Object.assign({},ex,{lo:20,hi:40,secs:true}):ex; }
function suggest(ex){
  const name=chosen(ex), inc=incOf(ex,name); const h=historyFor(name).filter(x=>!x.leve);
  if(ex.k==="P"){ const L=h.length?Math.max(...h[0].sets.map(s=>s.kg||0)):""; return {kg:L===0?0:L,reps:ex.lo,cls:"",html:`<span class="tag t-keep">⚡ Potência</span> Rápido, longe da falha`}; }
  const U=ex.secs?" s":" reps";
  if(!h.length) return {kg:ex.secs?0:"",reps:ex.secs?ex.lo:ex.hi,cls:"",html:ex.secs?`<span class="tag t-new">★ 1ª vez</span> Segure ${ex.lo} s com boa postura; se for fácil, vá até ${ex.hi} s`:`<span class="tag t-new">★ 1ª vez</span> Comece leve. Se as ${ex.hi} reps saírem fáceis, suba na próxima série`};
  if(tecnica(state.pf)) { const L=Math.max(...h[0].sets.map(s=>s.kg||0)); return {kg:L,reps:ex.hi,cls:"",html:`<span class="tag t-keep">= Técnica</span> Mantenha ${fmt(L)} kg`}; }
  const last=h[0].sets, work=workSets(last), L=work[0].kg||0;
  const allTop=work.length>=Math.min(ex.sets,last.length)&&work.every(s=>s.reps>=ex.hi); const lr=work[work.length-1]?.rpe; const tgt=ex.rpe[ex.rpe.length-1];
  if(allTop&&L===0) return {kg:0,reps:ex.secs?ex.hi+5:ex.hi,cls:"up",html:ex.secs?`<span class="tag t-up">⬆ Evolua</span> Tente <strong>${ex.hi+5} s</strong>, ou acrescente carga nas costas`:/elástico/i.test(chosen(ex))?`<span class="tag t-up">⬆ Evolua</span> Topo da faixa: use um elástico mais forte ou encurte o elástico`:`<span class="tag t-up">⬆ Evolua</span> Peso do corpo no topo: faça mais reps, acrescente carga (mochila) ou troque por uma variação mais difícil no ⇄`};
  if(allTop&&!(lr>tgt+0.5)){ const pct=ex.k==="C"?(ex.low?0.05:0.025):0.05; let nk=roundTo(L*(1+pct),inc); if(nk<=L) nk=L+inc;
    return {kg:nk,reps:ex.lo,cls:"up",html:`<span class="tag t-up">⬆ Suba</span> <strong>${fmt(nk)} kg</strong> · ${ex.lo} reps`}; }
  const below=s=>workSets(s.sets).some(x=>x.reps<ex.lo);
  if(h.length>=2&&below(h[0])&&below(h[1])){ const nk=Math.max(0,roundTo(L*0.9,inc)); return {kg:nk,reps:ex.hi,cls:"stall",html:`<span class="tag t-down">⬇ Reduza</span> <strong>${fmt(nk)} kg</strong>`}; }
  const minR=Math.min(...work.map(s=>s.reps)); const tr=Math.min(ex.hi,minR+1);
  return {kg:L,reps:tr,cls:"",html:`<span class="tag t-keep">= Mantenha</span> ${L?`<strong>${fmt(L)} kg</strong> · `:""}meta ${tr}${U}`};
}
/* leitura durante o treino: usa a ÚLTIMA série com RPE digitado (não só a 1ª), porque a pessoa pode ter mudado a carga no meio
   (ex.: 160 kg × 10 a RPE 6, depois 200 kg × 8 a RPE 9: a próxima série parte dos 200 kg, não volta para 160) */
function readiness(id){
  const d=state.plan&&state.plan.days.find(x=>x.key===state.current); const ex=d&&d.ex.find(e=>e.id===id); const box=document.getElementById("rd-"+id); if(!ex||!box) return;
  const card=box.closest(".card"), n=Number(card&&card.dataset.sets)||ex.sets;
  const val=(f,i)=>{ const el=document.getElementById(`${id}-${f}-${i}`); return el?num(el.value||el.placeholder):NaN; };
  let i=-1; for(let j=n-1;j>=0;j--){ const r=num(($(`#${id}-p-${j}`)||{}).value); if(r>=5&&r<=10){ i=j; break; } }
  if(i<0){ box.hidden=true; return; }
  const rpe=num($(`#${id}-p-${i}`).value), kg=val("kg",i), reps=val("r",i);
  if(!(kg>=0)||!(reps>0)||i===n-1){ box.hidden=true; return; }
  const t=ex.rpe[Math.min(i+1,ex.rpe.length-1)], inc=incOf(ex,chosen(ex)); let act,why,cls="", nk=kg, nr=reps;
  const target=kg>0?e1rm(kg,reps,rpe)/(1+(reps+10-t)/30):0; const calc=kg>0?roundTo(target,inc):0; const pr=kg>0?Math.round((calc/kg-1)*1000)/10:0;
  const S=`Série ${i+1}: ${kg?fmt(kg)+" kg × ":""}${reps} a RPE ${fmt(rpe)}; o alvo da próxima é ${fmt(t)}.`;
  if(rpe>=t+1){ cls="bad"; why=S; if(rpe-t>=2&&calc<kg){ nk=calc; act=`Reduza ${fmt(Math.abs(pr))}% → ${fmt(calc)} kg na próxima série.`; } else { nr=Math.max(1,reps-1); act=`Mantenha ${fmt(kg)} kg e faça 1 rep a menos na próxima série.`; } }
  else if(rpe<=t-1){ cls="good"; why=S; if(t-rpe>=2&&calc>kg&&calc<=target*1.05){ nk=calc; act=`Aumente +${fmt(pr)}% → ${fmt(calc)} kg na próxima série.`; } else { nr=Math.min(ex.hi,reps+(t-rpe>=2?2:1)); act=`Mantenha ${fmt(kg)} kg e faça +${t-rpe>=2?2:"1–2"} reps na próxima série.`; } }
  else { act=`Mantenha ${kg?fmt(kg)+" kg e ":""}as reps na próxima série.`; why=S; }
  box.className="rd "+cls; box.innerHTML=`<b>${act}</b><br><small>${esc(S)}</small>`; box.title=why; box.hidden=false;
  /* as séries seguintes ainda vazias passam a sugerir (em cinza) a carga e as reps da próxima */
  for(let j=i+1;j<n;j++){ const k=document.getElementById(`${id}-kg-${j}`), r=document.getElementById(`${id}-r-${j}`); if(kg>0&&k&&!k.value) k.placeholder=fmt(nk); if(r&&!r.value) r.placeholder=String(nr); }
}

/* ---------- rascunho à prova de perda (mesclagem campo a campo, só grava quem digitou) ---------- */
const DK="ficha-iniciante-rascunho";
const draft={data:null,timer:null,writing:false,again:false,ready:false,dirty:false,remote:false,bakR:false,bak:null};
function draftLocal(){ try{ const d=JSON.parse(localStorage.getItem(DK)||"null"); return d&&d.date===todayISO()?d:null; }catch(e){ return null; } }
function collect(){ const v={}; $$("#day input[id]:not([type=checkbox])").forEach(i=>{ if(i.value.trim()) v[i.id]=i.value; }); return v; }
function buildDraft(){ const prev=draft.data&&draft.data.date===todayISO()?(draft.data.values||{}):{}; const shown=new Set($$("#day input[id]:not([type=checkbox])").map(i=>i.id));
  const values={}; Object.entries(prev).forEach(([k,v])=>{ if(!shown.has(k)) values[k]=v; else if(v!=="") values[k]=""; }); Object.assign(values,collect());
  return {type:"draft",date:todayISO(),day:state.current,values,names:Object.assign({},draft.data&&draft.data.date===todayISO()&&draft.data.names||{},dayNames()),ts:Date.now()}; }
/* exercício de cada campo do rascunho: o valor só volta para o mesmo exercício (se o plano mudou numa atualização, não vai parar em outro) */
function dayNames(){ const d=state.plan&&state.plan.days.find(x=>x.key===state.current); const o={}; if(d) d.ex.forEach(e=>{ o[e.id]=chosen(e); }); return o; }
function sameEx(k,names){ if(!names) return true; const id=k.replace(/-(kg|r|p|d)-\d+$/,""), cur=dayNames(); return !(id in names)||!(id in cur)||names[id]===cur[id]; }
function wl(d){ try{ localStorage.setItem(DK,JSON.stringify(d)); }catch(e){} }
function mergeD(a,b){ const ok=x=>x&&x.type==="draft"&&x.date===todayISO(); if(!ok(a)) return ok(b)?b:null; if(!ok(b)) return a; const [o,n]=(a.ts||0)>(b.ts||0)?[b,a]:[a,b]; return Object.assign({},n,{values:Object.assign({},o.values||{},n.values||{}),names:Object.assign({},o.names||{},n.names||{})}); }
async function pushDraft(){ if(!draft.ready||!draft.dirty||!draft.data) return; if(draft.writing){ draft.again=true; return; } draft.writing=true;
  try{ await store.saveDraft(draft.data,draft.remote); draft.remote=true; const f={}; Object.entries(draft.data.values||{}).forEach(([k,v])=>{ if(v!=="") f[k]=v; });
    if(Object.keys(f).length){ await store.saveDraft({type:"draftbak",date:todayISO(),ts:Date.now(),values:f,names:draft.data.names},draft.bakR,"rascunho_bak"); draft.bakR=true; draft.bak={date:todayISO(),values:Object.assign({},(draft.bak&&draft.bak.date===todayISO()&&draft.bak.values)||{},f),names:Object.assign({},draft.bak&&draft.bak.names||{},draft.data.names||{})}; } }catch(e){}
  draft.writing=false; if(draft.again){ draft.again=false; pushDraft(); } }
function scheduleDraft(){ if(!isTrainDay()) return; draft.dirty=true; draft.data=buildDraft(); wl(draft.data); clearTimeout(draft.timer); draft.timer=setTimeout(pushDraft,1200); }
function flushDraft(){ if(!draft.dirty||!isTrainDay()) return; clearTimeout(draft.timer); draft.data=buildDraft(); wl(draft.data); pushDraft(); }
function restoreDraft(){ const d=draft.data; if(!d||d.date!==todayISO()) return; Object.entries(d.values||{}).forEach(([k,v])=>{ const el=document.getElementById(k); if(el&&!el.value&&v!==""&&sameEx(k,d.names)) el.value=v; }); }
async function clearDayDraft(prefix){ const rest={}; Object.entries((draft.data&&draft.data.values)||{}).forEach(([k,v])=>{ if(!k.startsWith(prefix)&&v!=="") rest[k]=v; });
  draft.data=Object.keys(rest).length?Object.assign({},draft.data,{values:rest,ts:Date.now()}):null; clearTimeout(draft.timer);
  if(draft.data){ wl(draft.data); try{ await store.saveDraft(draft.data,false); }catch(e){} } else { try{ localStorage.removeItem(DK); }catch(e){} try{ if(store.mode==="db") await store.col().doc("rascunho").delete(); }catch(e){} draft.remote=false; draft.dirty=false; } }
function recoverBak(){ const b=draft.bak; if(!b||b.date!==todayISO()){ setStatus("Nada digitado hoje para recuperar."); return; } let n=0;
  Object.entries(b.values||{}).forEach(([k,v])=>{ const el=document.getElementById(k); if(el&&!el.value&&sameEx(k,b.names)){ el.value=v; n++; } }); if(n){ scheduleDraft(); syncDone(); } setStatus(n?`${n} campos recuperados.`:"Nada a recuperar nesta aba."); }
document.addEventListener("input",e=>{ if(e.target.closest&&e.target.closest("#day")&&e.target.type!=="checkbox"&&e.target.id){ scheduleDraft(); const m=/^(.+)-(kg|r|p)-\d+$/.exec(e.target.id); if(m) readiness(m[1]); updateProgress(); } });
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") flushDraft(); });
window.addEventListener("pagehide",flushDraft);
const isTrainDay=()=>state.current&&(state.current.startsWith("d")||state.current==="cardio");

/* ---------- abas ---------- */
function tabs(){
  const t=new Date().getDay(), td=state.plan&&state.plan.days.find(d=>d.dow.includes(t));
  const list=[["inicio","Início","resumo"],["treino","Treino",td?"hoje: "+td.n.replace("Corpo inteiro","Corpo"):"seus dias"],["hist","Progresso","gráficos"],["perfil","Perfil","plano"]];
  $("#tabs").classList.remove("scroll"); $("#tabs").style.gridTemplateColumns="repeat(4,1fr)";
  const sel=k=>k==="treino"?isTrainDay():k===state.current;
  $("#tabs").innerHTML=list.map(([k,a,b])=>`<button class="tab" role="tab" id="tab-${k}" aria-selected="${sel(k)}" data-k="${k}" type="button"><b>${a}</b><small>${esc(b)}</small></button>`).join("");
  $$("#tabs .tab").forEach(b=>b.onclick=()=>{ flushDraft(); const k=b.dataset.k; state.current=k==="treino"?(isTrainDay()?state.current:defaultTab()):k; state.leve=false; render(); window.scrollTo({top:0}); });
}
function dayChips(){ const t=new Date().getDay();
  const list=state.plan.days.map((d,i)=>[d.key,d.dow.length?DOWN[d.dow[0]]:"Treino "+(i+1),d.n.replace("Corpo inteiro","Corpo"),d.dow.includes(t)]);
  if(state.plan.cardio.n) list.push(["cardio","Cardio",state.plan.cardio.n+"×/sem",state.plan.cardio.dias.includes(t)]);
  return `<div class="daychips" role="tablist" aria-label="Dia de treino">${list.map(([k,a,b,today])=>`<button type="button" class="dchip${today?" today":""}" data-k="${k}" aria-pressed="${k===state.current}"><b>${a}</b><small>${esc(b)}</small></button>`).join("")}</div>`; }
function onbTabs(){ const list=[["onb",state.pf?"Editar":"Começar","questionário"],["faq","Ajuda","dúvidas"]];
  $("#tabs").classList.remove("scroll"); $("#tabs").style.gridTemplateColumns="repeat(2,1fr)";
  $("#tabs").innerHTML=list.map(([k,a,b])=>`<button class="tab" role="tab" id="tab-${k}" aria-selected="${(["guia","faq"].includes(state.current)?state.current:"onb")===k}" data-k="${k}" type="button"><b>${a}</b><small>${b}</small></button>`).join("");
  $$("#tabs .tab").forEach(b=>b.onclick=()=>{ if($("#q-go")) state.onbDraft=readForm(); state.current=b.dataset.k; render(); window.scrollTo({top:0}); }); }
function render(){ hideTip(); $("#day").onclick=null; $("#day").onchange=null; $("#saveBar").hidden=!(state.plan&&isTrainDay()&&!state.editing); if(!state.pf||state.editing){ onbTabs(); if(state.current==="guia") renderGuia(); else if(state.current==="faq") renderFaq(); else renderOnb(); return; } tabs();
  if(state.current==="hist") renderHist(); else if(state.current==="perfil") renderPerfil(); else if(state.current==="plano") renderPlano(); else if(state.current==="inicio") renderHome(); else if(state.current==="guia") renderGuia(); else if(state.current==="faq") renderFaq(); else if(state.current==="cardio") renderCardio(); else renderDay();
  if(isTrainDay()){ $("#day").insertAdjacentHTML("afterbegin",dayChips()); $$(".dchip").forEach(b=>b.onclick=()=>{ flushDraft(); state.current=b.dataset.k; state.leve=false; render(); window.scrollTo({top:0}); }); const on=$(".dchip[aria-pressed=true]"); if(on) on.scrollIntoView({block:"nearest",inline:"center"}); }
}
/* ---------- início: resumo do dia e atalhos ---------- */
function localWarn(){ return store.mode==="local"?`<details class="card koralocal"><summary><b>Seus treinos estão salvos só neste aparelho</b></summary><div class="gb">
  <p>Abra o Kora <b>sempre pelo mesmo app</b> (o mesmo navegador ou o mesmo link do WhatsApp). Em outro navegador ou celular ele começa vazio.</p>
  <p>De vez em quando, guarde uma cópia: se precisar trocar de aparelho, é só colar em "Já usei o Kora em outro lugar".</p>
  <div class="askrow"><button class="ckbtn" id="bkCopy" type="button">Copiar backup</button></div>
  <p class="note">Para salvar na sua conta Claude (em qualquer aparelho), peça ao João um convite por e-mail para o Kora.</p></div></details>`:""; }
function renderHome(){ const pl=state.plan, pf=state.pf, today=todayISO(), t=new Date().getDay();
  const d=pl.days.find(x=>x.dow.includes(t)), cardioToday=pl.cardio.n&&pl.cardio.dias.includes(t);
  const lifts=state.sessions.filter(s=>s.ex&&Object.keys(s.ex).length);
  const doneToday=state.sessions.some(s=>s.date===today&&(d?s.day===d.key:cardioToday&&s.day==="cardio"));
  const h=new Date().getHours(), hi=h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";
  const dataTxt=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
  let next=null; for(let k=1;k<=7&&!next;k++){ const dw=(t+k)%7; const nd=pl.days.find(x=>x.dow.includes(dw)); if(nd) next={d:nd,k,dw}; }
  const hero=d?`<article class="card hero${doneToday?" done":""}"><span class="kick">${doneToday?"✓ Feito hoje":"Treino de hoje"}</span><div class="exname">${esc(d.n)}</div>
      <p class="note">${d.ex.length} exercícios · ~${d.min} min${d.sport&&d.sport.length?" · + "+esc(d.sport.map(x=>x.split(" (")[0]).join(", ")):""}</p>
      <p class="heroex">${d.ex.slice(0,4).map(e=>esc(chosen(e))).join(" · ")}${d.ex.length>4?" …":""}</p>
      <button class="btn" type="button" data-go="${d.key}">${doneToday?"Ver o treino de hoje":"Começar treino"}</button></article>`
    : cardioToday?`<article class="card hero"><span class="kick">Hoje</span><div class="exname">Cardio</div><p class="note">${esc(pl.cardio.corrida?pl.cardio.corrida.texto:(pl.cardio.mods||[]).join(", ")||"Zona 2")}</p><button class="btn" type="button" data-go="cardio">Abrir cardio</button></article>`
    : `<article class="card hero dayoff"><span class="kick">Hoje</span><div class="exname">Dia de descanso</div><p class="note">Recuperar também é treino.${next?` Próximo: <b>${esc(next.d.n)}</b> ${next.k===1?"amanhã":"na "+DOWN[next.dw].toLowerCase()}.`:""}</p>${next?`<button class="ghost" type="button" data-go="${next.d.key}">Ver o próximo treino</button>`:""}</article>`;
  const wk=weekStart(today); const strip=[1,2,3,4,5,6,0].map((dw,i)=>{ const dd=new Date(wk+"T12:00:00"); dd.setDate(dd.getDate()+i); const iso=isoLocal(dd);
    const pd=pl.days.find(x=>x.dow.includes(dw)), pc=pl.cardio.n&&pl.cardio.dias.includes(dw); const did=state.sessions.some(s=>s.date===iso);
    const st=did?"ok":iso===today?"now":iso<today&&(pd||pc)&&iso>=(pf.inicio||"")?"miss":iso<today?"off":(pd||pc)?"plan":"off";
    return `<div class="wday ${st}"><small>${DOWN[dw].slice(0,3)}</small><i>${did?"✓":dd.getDate()}</i><span>${pd?esc(pd.n.replace("Corpo inteiro","Corpo").split(" ").slice(0,2).join(" ")):pc?"Cardio":"—"}</span></div>`; }).join("");
  const thisW=lifts.filter(s=>weekStart(s.date)===wk); const vol=thisW.reduce((a,s)=>a+tonnage(s),0);
  let streak=0; { let w=wk; for(let k=0;k<52;k++){ const dd=new Date(w+"T12:00:00"); dd.setDate(dd.getDate()-7); w=isoLocal(dd); const n=lifts.filter(s=>weekStart(s.date)===w).length; if(n>=pl.lift) streak++; else break; } }
  const since=isoDaysAgo(6), v7=lifts.length?setsByMuscle(lifts.filter(s=>s.date>=since)):((pl.vol&&pl.vol.v)||{}); const frac={}; MUSCLES.forEach(m=>frac[m]=(v7[m]||0)/((pl.target||{})[m]||1));
  $("#day").innerHTML=`<div class="col"><div class="hello"><h2>${hi}${pf.nome?", "+esc(pf.nome.split(" ")[0]):""}</h2><p class="note">${esc(dataTxt.charAt(0).toUpperCase()+dataTxt.slice(1))} · ${esc(SPLITS[pl.sk].nome.split(" (")[0])}</p></div>${localWarn()}
    ${hero}
    <div class="wstrip">${strip}</div>
    <div class="kpis"><div class="kpi"><b>${thisW.length}/${pl.lift}</b><span>treinos na semana</span></div><div class="kpi"><b>${vol?kfmt(vol):"0"}</b><span>volume na semana</span></div><div class="kpi"><b>${streak}</b><span>semana${streak===1?"":"s"} seguida${streak===1?"":"s"} na meta</span></div></div>
    ${sampleFn&&needsWeekly()?`<button class="card tile wide" type="button" data-go="hist"><span class="ti">✦</span><span><b>Análise da semana</b><small>Toque para o Claude analisar seus treinos</small></span><span class="ar">›</span></button>`:""}
    <button class="card tile body-tile" type="button" data-go="hist"><div class="bt-fig">${bodyPair(frac,null,"mini")}</div><div class="bt-txt"><b>Carga muscular</b><small>${lifts.length?"Últimos 7 dias":"Prévia do seu plano"}. Toque para ver os gráficos de desempenho.</small></div><span class="ar">›</span></button>
    <div class="tiles">
      <button class="card tile" type="button" data-go="hist"><span class="ti">▥</span><b>Desempenho</b><small>Gráficos e evolução</small></button>
      <button class="card tile" type="button" data-go="plano"><span class="ti">☰</span><b>Meu plano</b><small>Dias e divisão</small></button>
      ${pl.cardio.n?`<button class="card tile" type="button" data-go="cardio"><span class="ti">♥</span><b>Cardio</b><small>${pl.cardio.n}× por semana</small></button>`:""}
      <button class="card tile" type="button" data-go="faq"><span class="ti">?</span><b>Ajuda</b><small>RPE e dúvidas</small></button>
    </div></div>`;
  $$("#day [data-go]").forEach(b=>b.onclick=()=>{ state.current=b.dataset.go; state.leve=false; render(); window.scrollTo({top:0}); });   if($("#bkCopy")) $("#bkCopy").onclick=copyBackup;
}
function renderPlano(){ const pl=state.plan, sp=SPLITS[pl.sk], c=pl.cardio;
  $("#day").innerHTML=`<div class="col"><div class="dayhead"><div><h2>Seu plano está pronto</h2><p class="meta">${esc(sp.nome)} · ${pl.lift} dias por semana</p></div></div>
    <article class="card"><ul class="plano">${pl.days.map(d=>`<li><b>${d.dow.length?DOWN[d.dow[0]]:"—"}</b><span>${esc(d.n)}</span><small>${d.ex.length} exercícios · ~${d.min} min</small></li>`).join("")}${c.n?`<li><b>Cardio</b><span>${c.n}× por semana</span><small>${esc((c.mods||[]).join(", "))}</small></li>`:""}</ul></article>
    <article class="card"><div class="exname">Por que ${esc(sp.nome.split(" (")[0].toLowerCase())}</div><p class="note" style="color:var(--fg)">${esc(sp.por)}</p>
      <p class="pc"><span class="pro">+</span> ${esc(sp.pro||"")}</p><p class="pc"><span class="con">−</span> ${esc(sp.contra||"")}</p>
      <p class="note">${state.pf.divisao&&state.pf.divisao!=="auto"?"Você escolheu esta divisão.":esc(AUTO_RULE)}</p>
      <details class="gd"><summary>Comparar com outras divisões</summary><div class="gb col">
        <p class="note">${SPLIT_NOTE} Frequência calculada para os seus ${pl.lift} dias.</p>
        ${splitInfo(state.pf).map(o=>splitCard(o,o.k===pl.sk,o.k===pl.sk?'<p class="note"><b>Em uso</b></p>':`<button class="ghost usesplit" data-k="${o.k}" type="button">Usar esta</button>`)).join("")}
        ${state.pf.divisao&&state.pf.divisao!=="auto"?'<button class="ghost usesplit" data-k="auto" type="button">Voltar ao automático</button>':""}</div></details></article>
    <article class="card"><div class="exname">Por que assim</div><ul class="why3">${pl.why.filter(w=>w.ev!=="frequencia"&&!/divis|corpo inteiro|full body|superior\/inferior/i.test(w.t)).slice(0,3).map(w=>`<li>${esc(w.t)}</li>`).join("")}</ul><p class="note">Tudo baseado em estudos. Detalhes no Perfil.</p></article>
    <article class="card"><div class="exname">Como usar</div><ol class="why3"><li>Abra o treino do dia e faça cada série.</li><li>Anote kg, repetições e o <b>RPE</b> (esforço de 1 a 10) e toque ✓. O descanso começa sozinho.</li><li>Salve no fim. Na próxima vez a ficha diz se é hora de subir a carga.</li></ol></article>
    <button class="btn" id="goTreino" type="button">Ver meu primeiro treino</button></div>`;
  $$(".usesplit").forEach(b=>b.onclick=async()=>{ state.pf=Object.assign({},state.pf,{divisao:b.dataset.k}); state.plan=withExtras(buildPlan(state.pf)); try{ await store.put("perfil",state.pf); setStatus("Divisão alterada."); }catch(e){ setStatus("Não consegui salvar."); } renderPlano(); window.scrollTo({top:0}); });
  $("#goTreino").onclick=()=>{ state.current=defaultTab(); render(); window.scrollTo({top:0}); }; }

/* ---------- questionário ---------- */
const Q_OBJ=[["hipertrofia","Hipertrofia (ganhar músculo)"],["forca","Força"],["saude","Saúde e condicionamento cardiovascular"],["emagrecimento","Emagrecimento"],["misto","Um pouco de tudo"]];
function chipset(name,opts,sel,multi){ return `<div class="qchips" data-name="${name}" data-multi="${multi?1:0}">${opts.map(([v,l])=>`<button type="button" class="qc" data-v="${v}" aria-pressed="${(multi?(sel||[]).map(String).includes(String(v)):String(sel)===String(v))}">${esc(l)}</button>`).join("")}</div>`; }
function renderOnb(){
  const p=state.onbDraft||state.pf||{};
  $("#day").innerHTML=`<div class="col">${state.pf?"":`<details class="card koraimp"><summary><b>Já usei o Kora em outro aparelho ou navegador</b></summary><div class="gb">
    <p>No lugar onde você usava o Kora, abra <b>Perfil → Backup dos dados</b> (ou "Copiar backup" no Início) e copie o texto. Cole aqui:</p>
    <textarea id="onbBk" rows="4" style="width:100%;box-sizing:border-box;font:12px var(--mono);background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:8px" placeholder='{"kora":1,"sessions":[…'></textarea>
    <div class="askrow"><button class="ckbtn" id="onbImp" type="button">Importar meus treinos</button></div></div></details>`}<div class="wizhead"><div class="exname">${state.pf?"Editar seu plano":"Vamos montar seu treino"}</div><span class="note" id="wizN"></span></div>
  <div class="prog"><div class="bar"><i id="wizBar"></i></div></div>
  <article class="card q"><h3>1. Sobre você</h3><p class="exnote">Opcional, menos a pergunta de saúde.</p><div class="ckgrid">
    <label>Nome<input id="q-nome" value="${esc(p.nome||"")}" autocomplete="given-name"></label>
    <label>Idade<input id="q-idade" inputmode="numeric" value="${esc(p.idade||"")}"></label>
    <label>Peso (kg)<input id="q-peso" inputmode="decimal" value="${esc(fmt(p.peso)||"")}"></label>
    <label>Altura (cm)<input id="q-altura" inputmode="numeric" value="${esc(p.altura||"")}"></label></div>
    <p class="ql">Algum médico já pediu para você evitar exercício, ou você sente dor no peito, falta de ar desproporcional ou tontura ao se esforçar?</p>
    ${chipset("saudeQ",[["nao","Não"],["sim","Sim"]],p.saudeQ||"nao")}</article>
  <article class="card q"><h3>2. Experiência</h3>${chipset("exp",[["nunca","Nunca treinei"],["ate6","Menos de 6 meses"],["6a12","6 a 12 meses"],["mais1","Mais de 1 ano"]],p.exp||"nunca")}
    <label class="ql">Se já treinou: há quanto tempo parou?<input id="q-parado" value="${esc(p.parado||"")}" placeholder="ex.: 2 anos"></label></article>
  <article class="card q"><h3>3. Objetivo</h3><p class="ql">Principal</p>${chipset("objetivo",Q_OBJ,p.objetivo||"hipertrofia")}
    <p class="ql">Secundário (opcional)</p>${chipset("secundario",[["","Nenhum"]].concat(Q_OBJ.filter(x=>x[0]!=="misto")),p.secundario||"")}</article>
  <article class="card q"><h3>4. Disponibilidade</h3><p class="ql">Dias em que pode fazer musculação</p>${chipset("dias",[1,2,3,4,5,6,0].map(d=>[d,DOWN[d]]),p.dias||[1,3,5],true)}
    <label class="ql">Horário<input id="q-horario" value="${esc(p.horario||"")}" placeholder="ex.: 7h ou depois das 18h"></label>
    <p class="ql">Tempo por treino</p>${chipset("tempo",[[30,"30 min"],[45,"45 min"],[60,"1 h"],[75,"1h15"],[90,"1h30"]],p.tempo||60)}</article>
  <article class="card q"><h3>4b. Divisão do treino</h3><p class="exnote">${AUTO_RULE}</p>
    <div class="qchips splitlist" data-name="divisao" data-multi="0"><button type="button" class="qc" data-v="auto" aria-pressed="${(p.divisao||"auto")==="auto"}"><b>Automático (recomendado)</b></button>${Object.entries(SPLITS).map(([k,v])=>`<button type="button" class="qc" data-v="${k}" aria-pressed="${p.divisao===k}"><b>${esc(v.nome)}</b><small>${esc(v.quando||"")}</small><small class="pc"><span class="pro">+</span> ${esc(v.pro||"")}</small><small class="pc"><span class="con">−</span> ${esc(v.contra||"")}</small></button>`).join("")}</div>
    <p class="note">${SPLIT_NOTE}</p>
    <div class="rd" id="splitHint"></div></article>
  <article class="card q"><h3>5. Onde treina</h3>${chipset("local",[["completa","Academia completa"],["basica","Academia básica / de prédio"],["casa","Casa com halteres"]],p.local||"completa")}</article>
  <article class="card q"><h3>6. Outras atividades da semana</h3><p class="exnote">Pratica esporte ou luta? Informe os dias e a ficha evita treinar perna na véspera.</p>
    <div id="espList" class="col">${(p.esportes||[]).map((x,i)=>espRow(x,i)).join("")}</div>
    <button type="button" class="ghost" id="espAdd">＋ Adicionar atividade</button></article>
  <article class="card q"><h3>7. Dores e limitações</h3>${chipset("dores",[["joelho","Joelho"],["ombro","Ombro"],["lombar","Lombar"]],p.dores||[],true)}
    <label class="ql">Outra ou detalhes<input id="q-doresTxt" value="${esc(p.doresTxt||"")}"></label></article>
  <article class="card q"><h3>8. O que você quer conseguir?</h3><p class="exnote">Opcional. Cada escolha muda o plano.</p>${chipset("habilidades",Object.entries(DATA.habilidades).map(([k,v])=>[k,v.nome]),p.habilidades||[],true)}</article>
  <article class="card q"><h3>9. Prioridades</h3><p class="ql">Músculos que quer priorizar (ganham mais séries)</p>${chipset("prioridades",MUSCLES.map(m=>[m,m[0].toUpperCase()+m.slice(1)]),p.prioridades||[],true)}
    <label class="ql">Exercícios que não gosta ou não pode fazer (separe por vírgula)<input id="q-evitar" value="${esc(p.evitar||"")}" placeholder="ex.: agachamento livre, barra fixa"></label></article>
  <article class="card q"><h3>10. Rotina</h3><div class="ckgrid">
    <label>Trabalho (horário)<input id="q-trabalho" value="${esc(p.trabalho||"")}" placeholder="ex.: 9h–18h"></label>
    <label>Sono médio (h)<input id="q-sono" inputmode="decimal" value="${esc(fmt(p.sono)||"")}" placeholder="7"></label></div>
    <p class="ql">Nível de estresse</p>${chipset("estresse",[[1,"1 baixo"],[2,"2"],[3,"3"],[4,"4"],[5,"5 alto"]],p.estresse||3)}
    <p class="ql">Volume de treino que você prefere</p>${chipset("volume",[["menor","Menor"],["padrao","Padrão"],["alto","Alto"]],p.volume||"padrao")}</article>
  <article class="card q"><h3>11. Cardio e relógio</h3><p class="ql">Quer cardio no plano?</p>${chipset("cardio",[["sim","Sim"],["nao","Não"]],p.cardio||"sim")}
    <p class="ql">Modalidades que prefere</p>${chipset("cardioMods",[["Bike","Bike"],["Corrida","Corrida"],["Esteira (caminhada inclinada)","Esteira"],["Escada","Escada"],["Elíptico","Elíptico"],["Natação","Natação"]],p.cardioMods||["Bike"],true)}
    <p class="ql">Relógio ou pulseira</p>${chipset("wear",[["whoop","Whoop"],["garmin","Garmin"],["apple","Apple Watch"],["outro","Outro relógio"],["nenhum","Nenhum"]],p.wear||"nenhum")}</article>
  <div class="askrow wiznav"><button class="ghost" id="q-back" type="button">Voltar</button><button class="ckbtn" id="q-next" type="button">Continuar</button><button class="ckbtn" id="q-go" type="button">${state.pf?"Atualizar plano":"Gerar meu plano"}</button></div>
  ${state.pf?'<button class="link" id="q-cancel" type="button">Cancelar</button>':''}</div>`;
  $("#day").onclick=e=>{ const b=e.target.closest(".qc"); if(b){ const g=b.parentElement; if(g.dataset.multi==="1") b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")==="true"?"false":"true"); else g.querySelectorAll(".qc").forEach(c=>c.setAttribute("aria-pressed",String(c===b))); splitHint(); return; }
    const del=e.target.closest(".espdel"); if(del){ del.closest(".esprow").remove(); splitHint(); } };
  $("#day").onchange=e=>{ if(e.target.closest(".esprow")) splitHint(); };
  let espN=(p.esportes||[]).length; $("#espAdd").onclick=()=>{ $("#espList").insertAdjacentHTML("beforeend",espRow({},espN++)); };
  splitHint(); wizard();
  if($("#q-cancel")) $("#q-cancel").onclick=()=>{ state.editing=false; state.current="perfil"; render(); };
  $("#q-go").onclick=saveProfile; if($("#goGuia")) $("#goGuia").onclick=()=>{ state.onbDraft=readForm(); state.current="guia"; render(); window.scrollTo({top:0}); };
  if($("#onbImp")) $("#onbImp").onclick=()=>importBackup($("#onbBk").value);
}
function splitHint(){ const box=$("#splitHint"); if(!box) return;
  const tmp={habilidades:chipVal("habilidades",true),sono:num(($("#q-sono")||{}).value),estresse:Number(chipVal("estresse"))||3,esportes:readSports(),exp:chipVal("exp"),dias:chipVal("dias",true).map(Number),divisao:chipVal("divisao"),objetivo:chipVal("objetivo")||"misto",tempo:Number(chipVal("tempo"))||60,local:chipVal("local")||"completa",prioridades:chipVal("prioridades",true),dores:chipVal("dores",true),inicio:todayISO()};
  if(tmp.dias.length<2){ box.textContent="Escolha pelo menos 2 dias para ver a divisão."; return; }
  const pl=buildPlan(tmp), sp=SPLITS[pl.sk], fr=pl.vol.f, big=["peito","costas","pernas","posterior","ombros"];
  const fq=big.map(m=>`${m} ${fr[m]}×`).join(" · "), low=big.filter(m=>fr[m]<2);
  box.className="rd "+(low.length?"bad":"good");
  box.innerHTML=`<b>${esc(sp.nome)} · ${pl.lift} dias${chipVal("divisao")==="auto"?" (escolha automática)":""}</b><br>${esc(pl.days.map(d=>(d.dow.length?DOWN[d.dow[0]]+" ":"")+d.n+(d.sport&&d.sport.length?" + "+d.sport.map(x=>x.split(" (")[0]).join(", "):"")).join(" → "))}<br><small>Frequência por semana: ${fq}. ${low.length?`${low.join(", ")} treina${low.length>1?"m":""} só 1× por semana: funciona, mas 2× costuma render mais, principalmente para iniciante.`:"Todos os grupos grandes 2× ou mais por semana: ótimo."} Nível: ${esc(sp.nivel)}.</small>`; }
/* ---------- comparação de divisões ---------- */
function splitInfo(pf){ const big=["peito","costas","pernas","posterior","ombros"];
  return Object.entries(SPLITS).map(([k,v])=>{ let f=null, sk=k; try{ const pl=buildPlan(Object.assign({},pf,{divisao:k})); sk=pl.sk; f=Math.round(10*big.reduce((t,m)=>t+pl.vol.f[m],0)/big.length)/10; }catch(e){}
    return {k,v,f,auto:false}; }); }
function splitCard(o,on,btn){ const v=o.v; return `<div class="splitc${on?" on":""}"><div class="splith"><b>${esc(v.nome)}</b>${o.f!=null?`<span class="freq">${fmt(o.f)}× / semana por músculo</span>`:""}</div>
  <p class="quando">${esc(v.quando||v.nivel)}</p><p class="pc"><span class="pro">+</span> ${esc(v.pro||"")}</p><p class="pc"><span class="con">−</span> ${esc(v.contra||"")}</p>${btn||""}</div>`; }
const SPLIT_NOTE="Com o mesmo número de séries na semana, as divisões dão resultados parecidos nos estudos. A melhor é a que cabe na sua agenda e você consegue cumprir. Treinar cada músculo 2× por semana costuma facilitar.";
const AUTO_RULE="Automático: 2–3 dias → corpo inteiro · 4 dias → superior/inferior · 5–6 dias → superior/inferior (iniciante) ou divisões com mais dias (6+ meses de treino).";
/* assistente: perguntas agrupadas em 7 telas curtas */
const WIZ=["Objetivo","Agenda","Local e metas","Sobre você"];
const WIZORD=[2,1,3,4,6,5,7,8,0,9,10,11], WIZSTEP=[0,0,1,1,1,2,2,2,3,3,3,3];
function wizard(){ const orig=$$("#day article.card.q"), nav=$(".wiznav"); orig.forEach(c=>{ const h=c.querySelector("h3"); if(h) h.textContent=h.textContent.replace(/^\d+b?\.\s*/,""); });
  const cards=WIZORD.map(i=>orig[i]).filter(Boolean); cards.forEach((c,j)=>{ c.dataset.step=WIZSTEP[j]; nav.before(c); });
  const wrap=(els,title)=>{ const d=document.createElement("details"); d.className="gd"; d.innerHTML=`<summary>${title}</summary>`; els[0].before(d); els.forEach(e=>d.appendChild(e)); };
  wrap([orig[4]],"Escolher a divisão (opcional)"); wrap([orig[9],orig[10],orig[11]],"Mais ajustes: prioridades, sono, cardio, relógio");
  const show=()=>{ const st=state.onbStep||0; cards.forEach(c=>{ (c.closest("details.gd")||c).hidden=Number(c.dataset.step)!==st; });
    $("#wizN").textContent=`${st+1} de ${WIZ.length} · ${WIZ[st]}`; $("#wizBar").style.width=((st+1)/WIZ.length*100)+"%";
    $("#q-back").hidden=st===0; if($("#q-cancel")) $("#q-cancel").hidden=false; $("#q-next").hidden=st===WIZ.length-1; $("#q-go").hidden=st!==WIZ.length-1&&!state.pf; window.scrollTo({top:0}); };
  $("#q-next").onclick=()=>{ if((state.onbStep||0)===1&&chipVal("dias",true).length<2){ setStatus("Escolha pelo menos 2 dias."); return; } state.onbStep=(state.onbStep||0)+1; show(); };
  $("#q-back").onclick=()=>{ state.onbStep=Math.max(0,(state.onbStep||0)-1); show(); };
  show(); }
function chipVal(name,multi){ const g=$(`.qchips[data-name="${name}"]`); const on=[...g.querySelectorAll('.qc[aria-pressed="true"]')].map(b=>b.dataset.v); return multi?on:(on[0]??""); }
function readForm(){
  const v=id=>$("#q-"+id).value.trim();
  return Object.assign({},state.pf||{},{type:"perfil",nome:v("nome"),idade:v("idade"),peso:num(v("peso"))||null,altura:v("altura"),saudeQ:chipVal("saudeQ"),exp:chipVal("exp"),parado:v("parado"),
    objetivo:chipVal("objetivo")||"misto",secundario:chipVal("secundario"),dias:chipVal("dias",true).map(Number),horario:v("horario"),tempo:Number(chipVal("tempo"))||60,local:chipVal("local")||"completa",
    esportes:readSports(),dores:chipVal("dores",true),doresTxt:v("doresTxt"),prioridades:chipVal("prioridades",true),habilidades:chipVal("habilidades",true),evitar:v("evitar"),trabalho:v("trabalho"),sono:num(v("sono"))||null,
    estresse:Number(chipVal("estresse"))||3,volume:chipVal("volume")||"padrao",divisao:chipVal("divisao")||"auto",cardio:chipVal("cardio")||"sim",cardioMods:chipVal("cardioMods",true),wear:chipVal("wear")||"nenhum",ts:Date.now()}); }
async function saveProfile(){
  const pf=readForm(); state.onbDraft=null; state.onbStep=0;
  if(pf.dias.length<2){ setStatus("Escolha pelo menos 2 dias."); window.scrollTo({top:document.querySelector('[data-name="dias"]').getBoundingClientRect().top+scrollY-120}); return; }
  if(pf.secundario===pf.objetivo) pf.secundario="";
  if(!pf.inicio) pf.inicio=todayISO();
  const old=state.pf; state.pf=pf; state.plan=withExtras(buildPlan(pf)); state.editing=false;
  try{ await store.put("perfil",pf); setStatus(old?"Plano atualizado.":"Plano criado. Bom treino!"); }catch(e){ setStatus("Não consegui salvar o perfil. Tente de novo."); }
  state.current=old?"inicio":"plano"; render(); window.scrollTo({top:0});
}
function defaultTab(){ const t=new Date().getDay(); const d=state.plan&&state.plan.days.find(x=>x.dow.includes(t)); return d?d.key:(state.plan&&state.plan.cardio.dias.includes(t)?"cardio":(state.plan?state.plan.days[0].key:"perfil")); }

/* ---------- treino do dia ---------- */
function nSets(ex){ return state.leve?Math.max(1,Math.ceil(ex.sets/2)):ex.sets; }
function lastTxt(name){ const h=historyFor(name)[0]; return h?`${dstr(h.date)} · ${h.sets.map(s=>`${fmt(s.kg)}×${s.reps}${s.rpe?" @"+fmt(s.rpe):""}`).join("  ")}`:""; }
function plainRx(ex,n){ if(ex.k==="P") return `Faça <b>${n} séries</b> de <b>${ex.lo} a ${ex.hi} repetições</b>, o mais rápido possível. Pare antes de cansar. Descanse <b>1,5 min</b>.`; const r=ex.rpe[ex.rpe.length-1], sobra=Math.max(0,Math.round(10-r)); const rest=ex.rest>=60?(ex.rest%60?fmt(ex.rest/60)+" min":ex.rest/60+" min"):ex.rest+" s";
  return `Faça <b>${n} séries</b> de <b>${ex.lo} a ${ex.hi} repetições</b>. Pare cada série quando sentir que sobrariam <b>${sobra===1?"1 repetição":sobra+" repetições"}</b>. Descanse <b>${rest}</b>.`; }
/* cartão de exemplo explicando cada parte da ficha (aparece até a pessoa fechar) */
function tourHtml(){ return `<article class="card tour" id="tour"><div class="exname">Como ler esta tela</div>
  <ol class="tl">
    <li><span class="kind c">Principal</span> ou <span class="kind">Acessório</span>: os principais vêm primeiro e são os mais importantes. Aqueça neles com 1–2 séries leves (não anote).</li>
    <li>A frase em cima diz <b>quantas séries, quantas repetições e quando parar</b>. Não vá até não aguentar mais: pare quando ainda sobrarem as repetições indicadas.</li>
    <li>A <b>caixa colorida</b> diz o que fazer hoje: <span class="tag t-up">⬆ SUBIR</span> a carga, <span class="tag t-keep">= MANTER</span> e tentar +1 repetição, <span class="tag t-down">⬇ REDUZIR</span> ou <span class="tag t-new">★ PRIMEIRA VEZ</span> (escolha uma carga e anote).</li>
    <li>Cada linha é uma série. <b>Números em cinza são a sugestão.</b> Fez igual? Só toque em <b>✓</b>. Fez diferente? Digite o que fez e depois toque em ✓.</li>
    <li><b>RPE</b> é a nota de esforço: <b>10 − repetições que ainda sairiam</b>. Sobraram 2 → 8. Sobrou 1 → 9. Não saía mais nenhuma → 10. Anote pelo menos na 1ª série: a ficha responde na hora se deve mudar a carga.</li>
    <li>O <b>✓</b> inicia o cronômetro de descanso. Ele apita quando acabar. Com o RPE anotado, aparece embaixo <b>o que fazer na próxima série</b> (subir, manter ou reduzir).</li>
    <li><b>⇄</b> troca o exercício (aparelho ocupado, dor, não gostou). <b>ⓘ</b> explica o porquê e como fazer. <b>＋</b> adiciona um exercício logo depois.</li>
    <li>No fim, toque em <b>Salvar treino de hoje</b>. Pronto: no próximo treino a ficha já calcula as cargas.</li></ol>
  <div class="askrow"><button class="ckbtn" id="tourOk" type="button">Entendi</button><button class="ghost" id="tourGuia" type="button">Ver o guia completo</button></div></article>`; }
/* ---------- exercícios que a pessoa adiciona (prefs.extra[dia] = [{uid, nome, p, sets}]) ----------
   Entram no fim do treino com séries, reps, RPE e descanso do objetivo; têm histórico e progressão como os outros.
   O id usa um uid fixo (não a posição), para o rascunho e a troca nunca irem parar em outro exercício. */
const MUS2P={peito:"chest",costas:"hpull",pernas:"quad",posterior:"ham","glúteos":"glute",ombros:"lateral","braços":"biceps",panturrilha:"calves","abdômen":"core",adutores:"adductor"};
function withExtras(plan){ const pf=state.pf, X=(state.prefs&&state.prefs.extra)||{}; if(!plan||!pf) return plan;
  plan.days.forEach(d=>(X[d.key]||[]).forEach(x=>{ const p=LIB[x.p]?x.p:"core";
    const e=makeEx(p,x.sets||3,pf,GOALS[pf.objetivo]||GOALS.misto,[{t:"Você adicionou este exercício à sua ficha.",ev:null}]);
    e.id=d.key+"_u"+x.uid; e.custom=x.uid; e.opts=[x.nome].concat(pickOpts(LIB[p],pf).filter(o=>o!==x.nome));
    const at=x.after?d.ex.findIndex(y=>y.id===x.after):-1; if(at>=0) d.ex.splice(at+1,0,e); else d.ex.push(e); d.min=Math.round((d.min||0)+exMinutes(e)); }));
  plan.vol=weeklyVolume(plan.days); return plan; }
const normTxt=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
async function saveExtras(msg){ state.plan=withExtras(buildPlan(state.pf)); renderDay(); setStatus(msg); try{ await store.put("prefs",state.prefs); }catch(e){ setStatus("Mudou só nesta tela: não consegui salvar."); } }
function openAdd(d,btn,after){ const sh=$("#sheet"), loc=state.pf.local||"completa", can=AVAIL[loc]||AVAIL.completa; let sets=3;
  const ref=after&&d.ex.find(e=>e.id===after); $("#sheetT").textContent=ref?`Adicionar depois de ${chosen(ref)}`:"Adicionar exercício";
  $("#sheetL").innerHTML=`<input id="addQ" class="addq" type="search" placeholder="Buscar: supino, voador, rosca…" aria-label="Buscar exercício" autocomplete="off">
    <div class="addsets"><span>Séries</span>${[2,3,4].map(n=>`<button type="button" class="qc" data-n="${n}" aria-pressed="${n===sets}">${n}</button>`).join("")}</div>
    <div id="addR" class="sheetl"></div>`;
  const close=()=>{ sh.hidden=true; document.body.style.overflow=""; try{ btn.focus({preventScroll:true}); }catch(e){} };
  const add=async(nome,p)=>{ close(); const X=state.prefs.extra=state.prefs.extra||{}; (X[d.key]=X[d.key]||[]).push(Object.assign({uid:Date.now().toString(36),nome,p,sets},after?{after}:{}));
    await saveExtras(`${nome} adicionado ao ${d.n}.`);
    const nd=state.plan.days.find(x=>x.key===d.key), tp=Number(state.pf.tempo)||60; if(nd&&nd.min>tp+2) setStatus(`${nome} adicionado. O treino agora tem ~${nd.min} min (você marcou ${tp}).`); };
  const show=()=>{ const q=normTxt($("#addQ").value.trim());
    const hits=q.length<2?[]:DATA.exercicios.filter(e=>LIB[e.padrao]&&[e.nome].concat(e.sinonimos||[]).some(n=>normTxt(n).includes(q)))
      .sort((a,b)=>(can.has(b.nome)-can.has(a.nome))||a.nome.length-b.nome.length).slice(0,25);
    $("#addR").innerHTML=(q.length<2?`<p class="note">Digite pelo menos 2 letras.</p>`:"")
      +hits.map(e=>`<button type="button" class="sopt" data-n="${esc(e.nome)}" data-p="${e.padrao}"><span>${esc(e.nome)}</span><small>${esc(LIB[e.padrao].m)}${can.has(e.nome)?"":" · não está no seu local"}</small></button>`).join("")
      +(q.length>=2?`<details class="gd"><summary>Não achei: usar "${esc($("#addQ").value.trim())}"</summary><p class="note">Qual músculo ele trabalha?</p><div class="qchips">${Object.keys(MUS2P).map(m=>`<button type="button" class="qc addown" data-m="${m}">${m[0].toUpperCase()+m.slice(1)}</button>`).join("")}</div></details>`:"");
    $$("#addR .sopt").forEach(b=>b.onclick=()=>add(b.dataset.n,b.dataset.p));
    $$("#addR .addown").forEach(b=>b.onclick=()=>add($("#addQ").value.trim().slice(0,60),MUS2P[b.dataset.m])); };
  $("#addQ").oninput=show; show();
  $$("#sheetL .addsets .qc").forEach(b=>b.onclick=()=>{ sets=Number(b.dataset.n); $$("#sheetL .addsets .qc").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); });
  $("#sheetX").onclick=close; sh.querySelector(".sheet-bg").onclick=close;
  sh.hidden=false; document.body.style.overflow="hidden"; setTimeout(()=>$("#addQ").focus(),50); }
async function removeExtra(d,ex){ const X=state.prefs.extra||{}; X[d.key]=(X[d.key]||[]).filter(x=>x.uid!==ex.custom);
  Object.keys((draft.data&&draft.data.values)||{}).forEach(k=>{ if(k.startsWith(ex.id+"-")) draft.data.values[k]=""; });
  await saveExtras(`${chosen(ex)} removido da ficha.`); }
function renderDay(){
  const d=state.plan.days.find(x=>x.key===state.current); if(!d){ state.current=state.plan.days[0].key; return renderDay(); }
  const cards=d.ex.map(ex0=>{ const name=chosen(ex0), ex=viewEx(ex0,name), sg=suggest(ex), n=nSets(ex), last=historyFor(name)[0];
    const rows=[...Array(n).keys()].map(i=>`<span class="n">${i+1}</span>
      <input inputmode="decimal" id="${ex.id}-kg-${i}" aria-label="Série ${i+1} carga em kg" placeholder="${sg.kg!==""?fmt(sg.kg):"kg"}">
      <input inputmode="numeric" id="${ex.id}-r-${i}" aria-label="Série ${i+1} repetições" placeholder="${state.leve?Math.max(ex.lo,sg.reps-2):sg.reps}">
      <input inputmode="decimal" id="${ex.id}-p-${i}" aria-label="Série ${i+1} RPE" placeholder="${fmt(state.leve?6:ex.rpe[i]||ex.rpe[ex.rpe.length-1])}">
      <input type="hidden" id="${ex.id}-d-${i}"><button type="button" class="okb" data-i="${i}" aria-pressed="false" aria-label="Série ${i+1} feita">✓</button>`).join("");
    const dica=(EXBYNAME[name]&&EXBYNAME[name].dica)||ex.how;
    return `<article class="card ex" data-ex="${ex.id}" data-sets="${n}">
      <div class="ctop"><div class="ctitle"><div class="exname">${ex.k==="P"?"⚡ ":""}${esc(name)}</div>
      <div class="rx"><b>${n} × ${ex.lo}–${ex.hi}${ex.secs?" s":""}</b> · RPE ${fmt(ex.rpe[ex.rpe.length-1])} · ${ex.rest>=60?fmt(Math.round(ex.rest/6)/10)+" min":ex.rest+" s"}</div></div>
      <div class="icons"><button type="button" class="ib infob" aria-label="Por quê e como fazer">ⓘ</button><button type="button" class="ib swapbtn" data-swap="${ex.id}" aria-haspopup="dialog" aria-label="Trocar exercício">⇄</button><button type="button" class="ib addafter" data-after="${ex.id}" aria-haspopup="dialog" aria-label="Adicionar exercício depois deste">＋</button></div></div>
      <div class="info" hidden>${(ex.why||[]).map(w=>`<p>${esc(w.t)}</p>`).join("")}${dica?`<p><b>Como fazer:</b> ${esc(dica)}</p>`:""}${ex.custom?`<button type="button" class="link rmex" data-rm="${ex.id}">Remover da ficha</button>`:""}</div>
      <div class="donesum"></div><div class="body">
      <div class="sug ${sg.cls}">${sg.html}${last?`<span class="lastl"> · última ${last.sets.map(s=>`${fmt(s.kg)}×${s.reps}`).join(" ")}</span>`:""}</div>
      <div class="sets"><span></span><span class="h">kg</span><span class="h">${ex.secs?"seg":"reps"}</span><button type="button" class="h rpeh" aria-label="O que é RPE">RPE ⓘ</button><span></span>${rows}</div>
      <div class="rpescale" ${state.sessions.length||ex!==d.ex[0]?"hidden":""}><b>RPE = esforço de 1 a 10</b><span>10 falha</span><span>9 sobra 1</span><span>8 sobram 2</span><span>7 sobram 3</span><span>≤6 leve</span></div>
      <div class="rd" id="rd-${ex.id}" hidden></div>
      </div></article>`; }).join("");
  const wear=state.pf.wear;
  const avisos=[d.warn, state.analysis&&state.analysis.deload&&state.analysis.deload.recomendar?"A última análise recomenda uma semana leve.":""].filter(Boolean);
  $("#day").innerHTML=`<div class="col"><div class="dayhead"><div><h2>${esc(d.n)}</h2><p class="meta">${d.dow.length?DOWN[d.dow[0]]+" · ":""}${d.ex.length} exercícios · ~${d.min||""} min${d.sport&&d.sport.length?" · + "+esc(d.sport.map(x=>x.split(" (")[0]).join(", ")):""}</p></div>
      <details class="menu"><summary aria-label="Opções do dia">⋯</summary><div class="menub">
        <label class="toggle"><input type="checkbox" id="leve" ${state.leve?"checked":""}> Treino leve hoje</label>
        <button class="link" id="recBtn" type="button">Recuperar o que digitei</button>
        <button class="link" id="tourShow" type="button">❔ Como ler esta tela</button></div></details></div>
    ${avisos.map(a=>`<p class="aviso">${esc(a)}</p>`).join("")}
    ${sampleFn&&needsWeekly()?`<button class="link" id="goAn" type="button">Fazer a análise da semana →</button>`:""}
    <div class="prog"><div class="bar"><i id="progBar"></i></div><span id="progTxt"></span></div>
    ${d.mob?`<details class="gd mobb"><summary>Mobilidade · 5 min</summary><div class="gb"><p>${d.mob.map(esc).join("<br>")}</p></div></details>`:""}
    ${state.prefs.tourVisto?"":tourHtml()}
    ${cards}
    <button type="button" class="ghost" id="addEx">＋ Adicionar exercício</button>
    <details class="gd"><summary>Dados do ${wear!=="nenhum"?wearName(wear):"treino"} (opcional)</summary><div class="cgrid">
      ${effortFields(d.key+"-w",wear)}
      <label>FC média<input inputmode="numeric" id="${d.key}-w-fc" placeholder="bpm"></label>
      <label>Minutos<input inputmode="numeric" id="${d.key}-w-min" placeholder="55"></label></div></details></div>`;
  restoreDraft(); syncDone(); d.ex.forEach(e=>readiness(e.id));
  $("#addEx").onclick=()=>{ flushDraft(); openAdd(d,$("#addEx")); };
  /* guia "Como ler esta tela": aparece até a pessoa tocar em Entendi; volta pelo menu ⋯ */
  if($("#tourOk")) $("#tourOk").onclick=()=>{ state.prefs.tourVisto=true; store.put("prefs",state.prefs).catch(()=>{}); renderDay(); };
  if($("#tourGuia")) $("#tourGuia").onclick=()=>{ flushDraft(); state.current="guia"; render(); window.scrollTo({top:0}); };
  $("#tourShow").onclick=()=>{ state.prefs.tourVisto=false; renderDay(); const t=$("#tour"); if(t) t.scrollIntoView({block:"start"}); };
  $$(".addafter").forEach(b=>b.onclick=()=>{ flushDraft(); openAdd(d,b,b.dataset.after); });
  $$(".rmex").forEach(b=>b.onclick=()=>{ const ex=d.ex.find(e=>e.id===b.dataset.rm); if(ex&&confirm(`Remover ${chosen(ex)} da ficha? O histórico dele continua salvo.`)) { flushDraft(); removeExtra(d,ex); } });
  $$(".okb").forEach(b=>b.onclick=()=>okSet(b));
  $$(".rpeh").forEach(b=>b.onclick=()=>{ const r=b.closest(".card").querySelector(".rpescale"); r.hidden=!r.hidden; });
  $$(".infob").forEach(b=>b.onclick=()=>{ const i=b.closest(".card").querySelector(".info"); i.hidden=!i.hidden; });
  $$("[data-swap]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const ex=d.ex.find(x=>x.id===b.dataset.swap); if(ex) openSwap(ex,b,false); });
  $$(".card.ex .ctop").forEach(t=>t.onclick=e=>{ if(e.target.closest(".icons")) return; const c=t.closest(".card"); if(c.classList.contains("done")) c.classList.toggle("open"); });
  $("#leve").onchange=e=>{ state.leve=e.target.checked; renderDay(); };
  $("#recBtn").onclick=recoverBak; if($("#goAn")) $("#goAn").onclick=()=>{ flushDraft(); state.current="hist"; render(); window.scrollTo({top:0}); };
}
const wearName=w=>({whoop:"Whoop",apple:"Apple Watch",garmin:"Garmin"}[w]||"relógio");
/* campos de esforço por aparelho: Whoop = Strain (0–21); Garmin = Training Effect aeróbico (0–5) + carga de treino; outros = esforço 1–10 */
function effortFields(prefix,wear){
  if(wear==="whoop") return `<label>Strain (0–21)<input inputmode="decimal" id="${prefix}-strain" placeholder="12"></label>`;
  if(wear==="garmin") return `<label>Training Effect<input inputmode="decimal" id="${prefix}-te" placeholder="3,0"></label><label>Carga de treino<input inputmode="numeric" id="${prefix}-load" placeholder="80"></label>`;
  return `<label>Esforço 1–10<input inputmode="decimal" id="${prefix}-strain" placeholder="6"></label>`; }
function readEffort(prefix,o){ [["strain",0,21],["te",0,5],["load",0,1000]].forEach(([k,a,b])=>{ const el=$(`#${prefix}-${k}`); const v=el?num(el.value):NaN; if(v>=a&&v<=b) o[k]=v; }); return o; }
function setDone(id,i){ const h=document.getElementById(`${id}-d-${i}`); return !!(h&&h.value==="1"); }
function syncDone(){ $$(".card.ex").forEach(c=>{ const id=c.dataset.ex, n=Number(c.dataset.sets); let k=0, parts=[];
  c.querySelectorAll(".okb").forEach(b=>{ const i=b.dataset.i, d=setDone(id,i); b.setAttribute("aria-pressed",String(d)); ["kg","r","p"].forEach(f=>{ const el=document.getElementById(`${id}-${f}-${i}`); if(el) el.classList.toggle("dn",d); });
    if(d){ k++; parts.push(`${$(`#${id}-kg-${i}`).value}×${$(`#${id}-r-${i}`).value}`); } });
  const all=k===n; c.classList.toggle("done",all); if(!all) c.classList.remove("open"); c.querySelector(".donesum").textContent=parts.join("  "); }); updateProgress(); }
function updateProgress(){ const bar=$("#progBar"), txt=$("#progTxt"); if(!bar) return; const cs=$$(".card.ex"); const done=cs.filter(c=>c.classList.contains("done")).length;
  bar.style.width=(cs.length?100*done/cs.length:0)+"%"; txt.textContent=done===cs.length&&cs.length?"Treino completo: toque em Salvar":`${done} de ${cs.length} exercícios`; }
let actx=null;
function okSet(b){ const c=b.closest(".card"), id=c.dataset.ex, i=b.dataset.i, hid=document.getElementById(`${id}-d-${i}`);
  if(hid.value==="1"){ hid.value=""; syncDone(); scheduleDraft(); return; }
  const kg=$(`#${id}-kg-${i}`), r=$(`#${id}-r-${i}`);
  if(!kg.value){ if(isFinite(num(kg.placeholder))) kg.value=kg.placeholder; else { kg.focus(); setStatus("Digite a carga desta série antes do ✓."); return; } }
  if(!r.value){ if(isFinite(num(r.placeholder))) r.value=r.placeholder; else { r.focus(); return; } }
  hid.value="1"; try{ if(!actx){ const A=window.AudioContext||window.webkitAudioContext; if(A) actx=new A(); } if(actx&&actx.state==="suspended") actx.resume(); }catch(e){}
  const d=state.plan.days.find(x=>x.key===state.current), ex=d.ex.find(e=>e.id===id), n=Number(c.dataset.sets);
  const nm=c.querySelector(".exname").textContent; const lastOf=[...Array(n).keys()].every(j=>setDone(id,j));
  startRest(ex.rest,lastOf?`Próximo exercício · depois de ${nm}`:`${nm} · série ${Number(i)+2} de ${n}`); syncDone(); scheduleDraft(); }

/* ---------- cronômetro de descanso ---------- */
const rest={end:0,timer:null,lock:null,fired:false};
const fmtT=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
function startRest(sec,lbl){ rest.end=Date.now()+sec*1000; rest.fired=false; $("#restLbl").textContent=lbl; $("#rest").hidden=false; $("#rest").classList.remove("over");
  clearInterval(rest.timer); rest.timer=setInterval(tickRest,250); tickRest(); try{ if(navigator.wakeLock&&!rest.lock) navigator.wakeLock.request("screen").then(l=>{rest.lock=l;}).catch(()=>{}); }catch(e){} }
function beep(){ try{ if(!actx) return; [0,0.25].forEach(t=>{ const o=actx.createOscillator(), g=actx.createGain(); o.frequency.value=880; o.connect(g); g.connect(actx.destination);
  g.gain.setValueAtTime(0.0001,actx.currentTime+t); g.gain.exponentialRampToValueAtTime(0.3,actx.currentTime+t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+t+0.18); o.start(actx.currentTime+t); o.stop(actx.currentTime+t+0.2); }); }catch(e){} }
function tickRest(){ const left=Math.ceil((rest.end-Date.now())/1000); if(left>0){ $("#restT").textContent=fmtT(left); return; }
  $("#restT").textContent="0:00"; $("#rest").classList.add("over");
  if(!rest.fired){ rest.fired=true; $("#restLbl").textContent="Descanso acabou · próxima série"; beep(); try{ navigator.vibrate&&navigator.vibrate([200,100,200]); }catch(e){} }
  if(Date.now()-rest.end>30000) closeRest(); }
function closeRest(){ clearInterval(rest.timer); $("#rest").hidden=true; try{ rest.lock&&rest.lock.release(); }catch(e){} rest.lock=null; }

/* ---------- cardio ---------- */
function renderCardio(){
  const c=state.plan.cardio, wear=state.pf.wear, zl=wearName(wear);
  const plan=(c.corrida?`<div class="banner dl"><b>Correr 5 km:</b> ${esc(c.corrida.texto)}. Faça 3× por semana, em ritmo de conversa. Repita a semana se ficou difícil.</div>`:"")+(c.n?`<p class="exnote"><b>${c.n}× por semana</b>${c.dias.length?` (${c.dias.map(d=>DOWN[d]).join(", ")}${c.n>c.dias.length?" + depois da musculação":""})`:" depois da musculação ou em dias livres"}.
    <br>• <b>Zona 2:</b> ${c.z2min} min num ritmo em que dá para falar frases curtas (60–70% da FC máxima; zona 2 no ${zl}).
    ${c.hiit?"<br>• <b>1× por semana troque por 4×4:</b> 4 min forte (zona 4, fala só palavras soltas) + 3 min leve, 4 vezes. Faça longe do treino de pernas.":"<br>• A partir da 5ª semana, um dos cardios pode virar 4×4 (4 min forte + 3 min leve, 4×)."}</p>`
    :`<p class="exnote">Você escolheu sem cardio no plano. Para saúde, a OMS recomenda 150 min por semana de atividade moderada: caminhar já conta.</p>`);
  const mods=c.mods.length?c.mods:["Bike"];
  const hist=state.sessions.filter(s=>s.cardio).sort((a,b)=>b.ts-a.ts).slice(0,8);
  $("#day").innerHTML=`<div class="col"><div class="dayhead"><h2>Cardio</h2></div><article class="card">${plan}</article>
    <article class="card"><div class="exname">Registrar cardio</div>
      <p class="ql">Tipo</p>${chipset("ctipo",[["z2","Zona 2"],["4x4","4×4"],["livre","Outro"]],"z2")}
      <p class="ql">Modalidade</p>${chipset("cmod",mods.map(m=>[m,m]),mods[0])}
      <div class="cgrid"><label>Minutos<input inputmode="numeric" id="cardio-min" placeholder="30"></label><label>FC média<input inputmode="numeric" id="cardio-fc" placeholder="bpm"></label>
      ${effortFields("cardio",wear)}</div>
      <p class="ql">Minutos em cada zona (opcional, do ${zl})</p><div class="zgrid">${[1,2,3,4,5].map(z=>`<label>Z${z}<input inputmode="numeric" id="cardio-z${z}"></label>`).join("")}</div>
      <div class="rd" id="cfb" hidden></div></article>
    ${hist.length?`<article class="card"><div class="exname">Últimos cardios</div><div class="hist">${hist.map(s=>`<span>${dstr(s.date)} · ${esc(s.cardio.tipo)} · ${esc(s.cardio.mod)} · ${s.cardio.min} min${s.cardio.fc?" · FC "+s.cardio.fc:""}${s.cardio.strain!=null?" · strain "+fmt(s.cardio.strain):""}${s.cardio.te!=null?" · TE "+fmt(s.cardio.te):""}</span>`).join("")}</div></article>`:""}</div>`;
  $$(".qchips .qc").forEach(b=>b.onclick=()=>{ b.parentElement.querySelectorAll(".qc").forEach(c=>c.setAttribute("aria-pressed",String(c===b))); zoneFb(); });
  $$(".zgrid input").forEach(i=>i.addEventListener("input",zoneFb)); restoreDraft(); zoneFb();
}
function zoneFb(){ const z=[1,2,3,4,5].map(i=>num(($("#cardio-z"+i)||{}).value)||0), tot=z.reduce((a,b)=>a+b,0), box=$("#cfb"); if(!box) return; if(!tot){ box.hidden=true; return; }
  const t=chipVal("ctipo"); let m=`Carga (TRIMP) ${Math.round(z.reduce((a,v,i)=>a+v*(i+1),0))}.`;
  if(t==="z2"){ const p=Math.round(100*z[1]/tot); m+=p>=70?` ${p}% em Z2: zona 2 bem feita.`:` Só ${p}% em Z2: ${z[2]+z[3]+z[4]>z[0]?"diminua o ritmo":"aumente um pouco o ritmo"} na próxima.`; }
  if(t==="4x4"){ const h=z[3]+z[4]; m+=h>=12?` ${fmt(h)} min em Z4–Z5: 4×4 bem feito.`:` Só ${fmt(h)} min em Z4–Z5 (alvo ~16): aperte mais nos tiros.`; }
  box.className="rd"; box.textContent=m; box.hidden=false; }

/* ---------- salvar ---------- */
async function saveDay(){
  const now=new Date(), iso=todayISO();
  if(state.current==="cardio"){ const min=num($("#cardio-min").value); const z=[1,2,3,4,5].map(i=>num($("#cardio-z"+i).value)||0); const tot=z.reduce((a,b)=>a+b,0);
    if(!(min>0)&&!tot){ setStatus("Informe os minutos do cardio."); return; }
    const c={tipo:{z2:"Zona 2","4x4":"4×4",livre:"Outro"}[chipVal("ctipo")]||"Zona 2",mod:chipVal("cmod"),min:min>0?min:tot}; const fc=num($("#cardio-fc").value); if(fc>0)c.fc=fc; readEffort("cardio",c); if(tot){ c.zonas=z; c.trimp=Math.round(z.reduce((a,v,i)=>a+v*(i+1),0)); }
    const s={type:"session",date:iso,day:"cardio",cardio:c,ts:now.getTime()}; return persist(s,"cardio-"); }
  const d=state.plan.days.find(x=>x.key===state.current); const ex={}; let count=0;
  d.ex.forEach(e=>{ const name=chosen(e), sg=suggest(viewEx(e,name)), sets=[];
    for(let i=0;i<nSets(e);i++){ const k=$(`#${e.id}-kg-${i}`).value.trim(), r=$(`#${e.id}-r-${i}`).value.trim(); if(!k&&!r&&!setDone(e.id,i)) continue;
      const kg=k?num(k):num(sg.kg), reps=Math.round(r?num(r):num(sg.reps)), rpe=num($(`#${e.id}-p-${i}`).value);
      if(isFinite(kg)&&reps>0){ const s={kg,reps}; if(rpe>=5&&rpe<=10) s.rpe=rpe; sets.push(s); } }
    if(sets.length){ ex[name]=sets; count+=sets.length; } });
  if(!count){ setStatus("Preencha ao menos uma série antes de salvar."); return; }
  const s={type:"session",date:iso,day:d.key,label:d.n,ex,ts:now.getTime()}; if(state.leve) s.leve=true;
  const w={fc:num($(`#${d.key}-w-fc`).value),min:num($(`#${d.key}-w-min`).value)}; Object.keys(w).forEach(k=>{ if(!(w[k]>=0)) delete w[k]; }); readEffort(d.key+"-w",w); if(Object.keys(w).length) s.watch=w;
  return persist(s,d.key+"x",d.key+"-w"); }
async function persist(s,...prefixes){ const btn=$("#saveBtn"); btn.disabled=true;
  try{ state.sessions.push(s); await store.put("s_"+s.ts,s); setStatus(s.cardio?`Cardio salvo em ${dstr(s.date)}.`:`Treino salvo em ${dstr(s.date)}. No próximo, a ficha já mostra as cargas novas.`); for(const p of prefixes) await clearDayDraft(p); state.leve=false; render(); window.scrollTo({top:0}); }
  catch(e){ state.sessions.pop(); setStatus("Não foi possível salvar. Verifique a conexão e tente de novo."); }
  btn.disabled=false; }

/* ---------- histórico, gráficos e recuperação ---------- */
function spark(points,unit){ if(points.length<2) return ""; const W=320,H=90,P=34; const ys=points.map(p=>p.v); let mn=Math.min(...ys), mx=Math.max(...ys); if(mn===mx){mn-=1;mx+=1;}
  const x=i=>P+(W-P-8)*(i/(points.length-1)), y=v=>8+(H-26)*(1-(v-mn)/(mx-mn)); const dd=points.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p.v).toFixed(1)).join(" ");
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução">
    <line x1="${P}" y1="${y(mx)}" x2="${W-8}" y2="${y(mx)}" stroke="var(--line)"/><line x1="${P}" y1="${y(mn)}" x2="${W-8}" y2="${y(mn)}" stroke="var(--line)"/>
    <text x="${P-4}" y="${y(mx)+4}" text-anchor="end" font-size="10" fill="var(--muted)">${fmt(Math.round(mx*10)/10)}</text><text x="${P-4}" y="${y(mn)+4}" text-anchor="end" font-size="10" fill="var(--muted)">${fmt(Math.round(mn*10)/10)}</text>
    <path d="${dd}" fill="none" stroke="var(--accent)" stroke-width="2"/>${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.v)}" r="3" fill="var(--accent)"/>`).join("")}
    <text x="${P}" y="${H-4}" font-size="10" fill="var(--muted)">${dstr(points[0].d)}</text><text x="${W-8}" y="${H-4}" text-anchor="end" font-size="10" fill="var(--muted)">${dstr(points[points.length-1].d)} · ${fmt(Math.round(points[points.length-1].v*10)/10)} ${unit}</text></svg>`; }
function recSignals(cks,wear){ const a=cks.slice().sort((x,y)=>x.week<y.week?-1:1); if(!a.length) return {html:"",n:0}; const cur=a[a.length-1], prev=a.slice(-5,-1);
  const base=k=>{ const v=prev.map(c=>c[k]).filter(x=>x>0); return v.length>=2?v.reduce((t,b)=>t+b,0)/v.length:null; }; const out=[]; let n=0;
  if(cur.sono&&cur.sono<6.5){ n++; out.push(`<div class="al">Sono ${fmt(cur.sono)} h/noite: abaixo de 6,5 h.</div>`); }
  if(cur.rec!=null){ if(cur.rec<34){ n++; out.push(`<div class="al">Recovery médio ${fmt(cur.rec)}% (vermelho no Whoop): semana de pouca recuperação.</div>`); } else if(cur.rec<50) out.push(`<p class="note">Recovery médio ${fmt(cur.rec)}% (amarelo): atenção ao sono e ao volume.</p>`); else out.push(`<p class="note">Recovery médio ${fmt(cur.rec)}%: bom.</p>`); }
  if(cur.prt!=null){ if(cur.prt<25){ n++; out.push(`<div class="al">Prontidão de treino média ${fmt(cur.prt)} (baixa no Garmin): recuperação incompleta.</div>`); } else if(cur.prt<50) out.push(`<p class="note">Prontidão média ${fmt(cur.prt)} (moderada): atenção ao sono e ao volume.</p>`); else out.push(`<p class="note">Prontidão média ${fmt(cur.prt)}: boa.</p>`); }
  const bf=base("fcr"); if(cur.fcr&&bf){ const d=cur.fcr-bf; if(d>=5){ n++; out.push(`<div class="al">FC de repouso ${fmt(cur.fcr)} bpm, ${fmt(Math.round(d))} acima da sua média.</div>`);} }
  const bv=base("vfc"); if(cur.vfc&&bv){ const p=(cur.vfc/bv-1)*100; if(p<=-10){ n++; out.push(`<div class="al">VFC ${fmt(cur.vfc)} ms, ${fmt(Math.round(-p))}% abaixo da sua média.</div>`);} else out.push(`<p class="note">VFC ${fmt(cur.vfc)} ms vs média ${fmt(Math.round(bv))}: normal.</p>`); }
  if(n>=2) out.push(`<div class="al"><b>${n} sinais de cansaço nesta semana.</b> Considere fazer a próxima semana leve (opção "Treino leve").</div>`);
  return {html:out.join(""),n}; }
function renderHist(){
  const ss=state.sessions.slice().sort((a,b)=>b.ts-a.ts), wear=state.pf.wear;
  const names=[...new Set(ss.flatMap(s=>Object.keys(s.ex||{})))];
  const charts=names.map(n=>{ const pts=historyFor(n).filter(x=>!x.leve).slice().reverse().map(x=>({d:x.date,v:sessE1(x.sets)})); const last=historyFor(n)[0];
    return `<article class="card hx"><div class="exname">${esc(n)}</div><div class="last"><b>Última:</b> ${lastTxt(n)}</div>${pts.length>=2?spark(pts,"kg (força est.)")+`<p class="note">Linha subindo = você está ficando mais forte nesse exercício. A ficha junta carga, repetições e RPE numa "força estimada", então vale mesmo quando você sobe só repetições.</p>`:`<p class="note">O gráfico aparece na 2ª vez que você fizer este exercício.</p>`}</article>`; }).join("");
  const wk=weekStart(todayISO()), thisW=ss.filter(s=>weekStart(s.date)===wk);
  const lifts=thisW.filter(s=>s.ex).length, cmin=thisW.reduce((t,s)=>t+(s.cardio?s.cardio.min||0:0),0);
  const cur=state.checkins.find(c=>c.week===wk)||{}; const rec=recSignals(state.checkins,wear); const v=k=>cur[k]!=null?fmt(cur[k]):"";
  const W=wear==="whoop", G=wear==="garmin";
  $("#day").innerHTML=`<div class="col"><div class="dayhead"><h2>Progresso</h2></div>
    <div class="kpis"><div class="kpi"><b>${lifts}/${state.plan.lift}</b><span>treinos na semana</span></div><div class="kpi"><b>${cmin}</b><span>min de cardio</span></div><div class="kpi"><b>${ss.filter(s=>s.ex).length}</b><span>treinos no total</span></div></div>
    ${perfSection()}
    ${sampleFn?`<article class="card"><div class="exname">Análise semanal</div>${needsWeekly()?'<div class="banner">A análise desta semana ainda não foi feita.</div>':""}<p class="exnote">Faça uma vez por semana (domingo ou segunda). Lê seus registros das últimas 4 semanas e diz o que está indo bem, o que ajustar e se precisa de semana leve. Leva até 1–2 min.</p>
      <div class="askrow"><button class="ckbtn" id="askBtn" type="button">Analisar meu treino</button><button class="ghost" id="askStop" type="button" hidden>Parar</button></div><div class="askout" id="askOut" aria-live="polite"></div></article>`:""}
    ${(state.anHist||[]).length?`<article class="card an"><div class="exname">Análises semanais</div>${state.anHist.slice(0,6).map((a,i)=>`<details class="gd"${i?"":" open"}><summary>Semana de ${dstr(a.semana)}${a.deload&&a.deload.recomendar?" · semana leve recomendada":""}</summary><div class="gb"><p>${esc(a.resumo||"")}</p>${(a.acoes||[]).length?`<ul>${a.acoes.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}</div></details>`).join("")}</article>`:""}
    <article class="card"><div class="exname">Recuperação da semana${wear!=="nenhum"?" · "+wearName(wear):""}</div>
      <p class="exnote">Uma vez por semana (domingo), copie as médias dos últimos 7 dias${W?" do app Whoop: Recovery, VFC (HRV), FC de repouso e horas de sono":G?" do Garmin Connect: sono, Prontidão de treino, Status da VFC (média noturna) e FC de repouso":wear==="nenhum"?": quantas horas dormiu por noite, em média":" do app do relógio: sono, FC de repouso e VFC"}. Só o sono é obrigatório.</p>
      <div class="ckgrid"><label>Sono (h/noite)<input inputmode="decimal" id="ck-sono" placeholder="7" value="${v("sono")}"></label>
      ${W?`<label>Recovery médio (%)<input inputmode="numeric" id="ck-rec" placeholder="60" value="${v("rec")}"></label>`:""}
      ${G?`<label>Prontidão (0–100)<input inputmode="numeric" id="ck-prt" placeholder="60" value="${v("prt")}"></label>`:""}
      ${wear!=="nenhum"?`<label>FC repouso (bpm)<input inputmode="numeric" id="ck-fcr" placeholder="58" value="${v("fcr")}"></label><label>${G?"VFC noturna (ms)":"VFC (ms)"}<input inputmode="numeric" id="ck-vfc" placeholder="50" value="${v("vfc")}"></label>`:""}</div>
      <div class="ckrow" style="margin-top:8px"><button class="ckbtn" id="ck-save" type="button" style="flex:1">${cur.week?"Atualizar":"Salvar"}</button></div>${rec.html?`<div class="col" style="gap:6px;margin-top:8px">${rec.html}</div>`:""}</article>
    ${charts?`<details class="gd evo"><summary>Evolução por exercício (${names.length})</summary><div class="gb col">${charts}</div></details>`:'<p class="note">Nenhum treino salvo ainda. Salve um treino e ele aparece aqui com o gráfico de evolução.</p>'}</div>`;
  bindTips($("#day"));
  if($("#askBtn")) $("#askBtn").onclick=runAnalysis;
  $("#ck-save").onclick=async()=>{ const g=id=>{ const el=$("#ck-"+id); return el?num(el.value):NaN; }; const c={type:"checkin",week:wk,ts:Date.now()};
    const sono=g("sono"); if(!(sono>=3&&sono<=12)){ setStatus("Informe o sono entre 3 e 12 h."); return; } c.sono=sono;
    [["rec",0,100],["prt",0,100],["fcr",30,110],["vfc",5,250]].forEach(([k,a,b])=>{ const x=g(k); if(x>=a&&x<=b) c[k]=x; });
    state.checkins=state.checkins.filter(x=>x.week!==wk).concat([c]); try{ await store.put("ck_"+wk,c); setStatus("Recuperação salva."); renderHist(); }catch(e){ setStatus("Não consegui salvar."); } };
}

/* ---------- guia: como funciona a ficha, em linguagem simples ---------- */
function renderGuia(){ if(state.pf&&!state.prefs.guiaVisto){ state.prefs.guiaVisto=true; store.put("prefs",state.prefs).catch(()=>{}); }
  const p=state.pf||{}, kg=p.peso||null, w=p.wear;
  const prot=kg?`${Math.round(kg*1.6)}–${Math.round(kg*2.2)} g por dia (você pesa ${fmt(kg)} kg)`:"1,6–2,2 g por kg de peso por dia";
  const sec=(t,h,open)=>`<details class="gd"${open?" open":""}><summary>${t}</summary><div class="gb">${h}</div></details>`;
  const splitRows=Object.values(SPLITS).map(v=>`<tr><td><b>${esc(v.nome)}</b><br><small>${v.dias.join(" ou ")} dias · ${esc(v.nivel)}</small></td><td>${esc(v.por)}</td></tr>`).join("");
  const wearTxt=w==="whoop"?`<p><b>Whoop.</b> No app, a cada domingo, veja as médias de 7 dias: <b>Recovery</b> (%), <b>HRV</b> (VFC, em ms), <b>FC de repouso</b> e <b>horas de sono</b>. Em cada treino, anote o <b>Strain</b> da atividade (0–21) e a FC média. Recovery verde (67–100%) = pronto; amarelo (34–66%) = normal; vermelho (abaixo de 34%) = recupere-se.</p>`
    :w==="garmin"?`<p><b>Garmin.</b> No Garmin Connect, a cada domingo: <b>sono</b> (média de horas), <b>Prontidão de treino</b> (0–100), <b>Status da VFC</b> (média noturna em ms) e <b>FC de repouso</b>. Em cada treino: <b>Training Effect aeróbico</b> (0–5: 2–2,9 mantém, 3–3,9 melhora, 4+ muito puxado) e <b>carga de treino</b>. Prontidão abaixo de 25 é baixa.</p>`
    :w==="apple"?`<p><b>Apple Watch.</b> No app Saúde, a cada domingo, veja as médias da semana (modo S): sono, FC em repouso e Variabilidade da FC. No app Fitness, cada treino mostra FC média, esforço (1–10) e minutos em cada zona.</p>`
    :`<p>Sem relógio, só o sono da semana já ajuda. Para o cardio, use o teste da fala: zona 2 = dá para conversar em frases curtas.</p>`;
  $("#day").innerHTML=`<div class="col"><div class="dayhead"><h2>Como funciona</h2>${!state.pf||state.editing?'<button class="link" id="backOnb" type="button">← Voltar ao questionário</button>':""}</div>
  ${sec("1. O treino do dia, passo a passo",`<ol>
    <li><b>Abra a aba do dia</b> (o ponto azul marca hoje). Cada cartão é um exercício.</li>
    <li><b>Aqueça</b> nos 2 primeiros exercícios: 1–2 séries leves (metade da carga, poucas reps). Aquecimento não é anotado.</li>
    <li><b>Leia a caixa azul ou verde</b>: ela diz a carga e as reps de hoje, calculadas a partir do último treino.</li>
    <li><b>Faça a série e toque em ✓.</b> Se fez exatamente o sugerido (números em cinza), o ✓ já preenche. Se fez diferente, digite antes do ✓. O ✓ inicia o cronômetro de descanso.</li>
    <li><b>Na 1ª série, anote o RPE.</b> A ficha diz na hora se deve subir, manter ou baixar a carga nas próximas.</li>
    <li>No fim, toque em <b>Salvar treino de hoje</b>. O que você digita fica guardado mesmo se o celular bloquear; se algo sumir, use Opções do dia → Recuperar.</li></ol>`,true)}
  ${sec("2. O que é RPE (e RIR)",`<p><b>RPE</b> é uma nota de 1 a 10 para o quanto a série foi difícil. O jeito mais fácil de dar a nota é pensar: <b>quantas repetições ainda sairiam?</b> Isso se chama <b>RIR</b> (repetições na reserva). <b>RPE = 10 − RIR.</b></p>
    <table class="rpet"><tbody><tr><td>10</td><td>Não sairia nenhuma a mais (falha)</td></tr><tr><td>9</td><td>Sairia mais 1</td></tr><tr><td>8</td><td>Sairiam mais 2</td></tr><tr><td>7</td><td>Sairiam mais 3</td></tr><tr><td>6 ou menos</td><td>Sobrariam 4 ou mais: leve, aquecimento</td></tr></tbody></table>
    <p>Quem está começando costuma achar que está no limite quando ainda sobram 2–3 reps. Por isso a ficha limita o iniciante a <b>RPE 8</b> enquanto aprende a técnica. Depois, para <b>ganhar músculo</b>, os estudos mostram que chegar mais perto da falha (sobrando 0–2 reps) rende um pouco mais; para <b>força</b>, sobrar 1–3 reps dá o mesmo resultado com menos cansaço.</p>`)}
  ${sec("3. Como a carga sobe (dupla progressão)",`<p>Cada exercício tem uma <b>faixa de repetições</b>, por exemplo 8–12.</p><ol>
    <li>Escolha uma carga em que você faça pelo menos 8 reps.</li><li>Em cada treino, tente <b>+1 rep</b> por série com a mesma carga.</li>
    <li>Quando fizer <b>12 em todas as séries</b>, a ficha manda <b>subir a carga</b> (+2,5% no tronco, +5% nas pernas) e você recomeça em 8.</li></ol>
    <p><b>Exemplo:</b> supino 40 kg: 8, 8, 7 → 9, 9, 8 → … → 12, 12, 12 → próximo treino 42 kg × 8.</p>
    <p>Se em 2 treinos seguidos você ficar abaixo do mínimo, a ficha manda baixar 10% e subir de novo. Use <b>a mesma carga em todas as séries de trabalho</b>, senão a ficha não consegue comparar.</p>`)}
  ${sec("4. Trocar exercício",`<p>O botão <b>⇄ Trocar</b> mostra todas as variações daquele movimento que servem para o seu local de treino. Troque quando: o aparelho estiver ocupado, doer, você não gostar ou a carga travar por 3 treinos. Cada variação guarda o próprio histórico. Variar de vez em quando ajuda, mas trocar todo treino atrapalha medir a evolução: o ideal é manter por 4–8 semanas.</p>`)}
  ${sec("5. Divisões de treino: qual escolher",`<p>Divisão é como os músculos são distribuídos nos dias. O que mais pesa no resultado é o <b>total de séries por músculo na semana</b> e treinar perto da falha; com o mesmo total, treinar o músculo 1× ou 2× por semana dá <b>hipertrofia</b> parecida. Para <b>força</b>, treinar o movimento mais vezes na semana ajuda (com retorno cada vez menor). Na prática, <b>2× por semana</b> é a referência: as séries ficam distribuídas e você chega menos cansado nas últimas.</p>
    <div style="overflow-x:auto"><table class="gt"><tbody>${splitRows}</tbody></table></div>
    <p><b>Resumo:</b> 2–3 dias → corpo inteiro. 4 dias → superior/inferior. 5–6 dias → superior/inferior + corpo inteiro ou empurrar/puxar/pernas. "Peito e tríceps / costas e bíceps" funciona, mas só dá 1× por semana com 3 dias. Para mudar, vá em Perfil → Editar.</p>`)}
  ${sec("5b. Musculação junto com outro esporte",`<p>Se você também faz jiu-jitsu, corrida, futebol ou outra atividade, cadastre no Perfil (dias e intensidade). A ficha segue estas regras:</p><ul>
    <li><b>Treino de pernas não fica no mesmo dia nem na véspera de atividade forte de pernas</b> (futebol, corrida, luta). Pernas cansadas rendem menos nos dois.</li>
    <li><b>Treino de tronco no dia de atividade forte é ok.</b> Perna no dia de atividade leve também.</li>
    <li>No mesmo dia, <b>faça a musculação antes</b> e, se der, deixe algumas horas entre os dois.</li>
    <li>Atividades que cansam muito as pernas tiram 1 série dos acessórios de perna; lutas e crossfit tiram 1 série de bíceps e tríceps.</li>
    <li>Atividades moderadas ou fortes <b>contam como cardio</b>: a ficha desconta do cardio recomendado.</li></ul>`)}
  ${sec("6. Volume: quantas séries por semana",`<p>Para ganhar músculo, os estudos mostram que mais séries por semana dão mais resultado até certo ponto: <b>10–20 séries por músculo por semana</b> para quem já treina, e <b>6–12</b> para iniciante. Para força e saúde, menos já resolve. A aba Perfil mostra quantas séries o seu plano dá para cada músculo. Para dar mais séries a um músculo, marque-o como <b>prioridade</b> no Perfil.</p>`)}
  ${sec("7. Descanso entre séries",`<p>Exercícios principais (agachamento, supino, remada, terra): <b>2–3 min</b>. Acessórios: <b>1–1,5 min</b>. Descansar pouco demais nos principais diminui o número de reps e o resultado. O cronômetro da ficha já usa esses tempos.</p>`)}
  ${sec("8. Treino leve e cansaço",`<p>Dormiu mal, está doente ou muito cansado? Em Opções do dia, marque <b>Treino leve</b>: metade das séries, sem forçar. A cada 6–10 semanas, ou quando a ficha mostrar 2 sinais de cansaço (cargas caindo, sono curto, recuperação baixa no relógio), faça uma semana inteira leve. Ela não conta para a progressão.</p>`)}
  ${sec("9. Cardio",`<p><b>Zona 2</b>: ritmo em que dá para conversar em frases curtas (60–70% da FC máxima). Melhora a saúde do coração e a recuperação. <b>4×4</b>: 4 min forte (só palavras soltas) + 3 min leve, 4 vezes. Melhora rápido o condicionamento (VO₂máx). A OMS recomenda <b>150–300 min por semana</b> de atividade moderada para saúde. Se for fazer cardio no mesmo dia das pernas, prefira bike e faça depois da musculação.</p>`)}
  ${sec("10. Relógio: o que anotar",wearTxt+`<p>Os números do relógio são complemento: um dia ruim isolado não quer dizer nada; a ficha olha a média da semana e compara com as suas 4 semanas anteriores.</p>`)}
  ${sec("11. Análise semanal",`<p>Uma vez por semana (domingo ou segunda), abra o <b>Histórico</b> e toque em <b>Analisar meu treino</b>. O Claude lê seus registros e diz o que está evoluindo, o que travou, o que fazer no próximo treino e se é hora de semana leve. A análise fica guardada e você vê as das semanas anteriores.</p>
    <p><b>Quer receber automático?</b> Peça ao seu Claude, numa conversa: <i>"Crie uma tarefa agendada todo domingo às 20h que leia os dados da minha Kora [cole o link da ficha] e me mande a análise semanal."</i> Isso depende do seu plano do Claude; se não der, use o botão.</p>`)}
  ${sec("12. Alimentação e sono",`<p><b>Proteína:</b> ${prot}, dividida em 3–4 refeições. É o que mais ajuda o treino a virar músculo. <b>Sono:</b> 7 h ou mais por noite; abaixo de 6,5 h a recuperação e o desempenho caem.</p>`)}
  ${sec("Base científica",`<p>Cada regra da ficha aponta para a sua fonte. Força da evidência: alta, moderada, baixa ou opinião de especialistas.</p><ul class="refs">${DATA.evidencias.map(e=>`<li><b>${esc(e.tema)}:</b> ${esc(e.regra)} <small>(${esc(e.tipo)}; evidência ${esc(e.forca)}. ${esc(e.fontes.join("; "))})</small></li>`).join("")}</ul>
    <p class="note">Versão ${APP_VERSION}. Ficha educacional: não substitui avaliação médica nem acompanhamento de um profissional de educação física.</p>`)}
  </div>`;
  if($("#backOnb")) $("#backOnb").onclick=()=>{ state.current="onb"; render(); window.scrollTo({top:0}); };
}

/* ---------- recomeçar do zero: apaga tudo desta pessoa (só depois da confirmação na própria tela) ---------- */
async function resetAll(){ const b=$("#resetYes"); b.disabled=true; setStatus("Apagando…");
  try{ if(store.mode==="db"){ const snap=await store.col().get(); for(const d of snap.docs) await store.col().doc(d.id).delete(); }
    [LS,DK].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
    state={pf:null,plan:null,sessions:[],checkins:[],prefs:{swap:{}},analysis:null,anHist:[],current:"onb",leve:false,editing:false};
    Object.assign(draft,{data:null,dirty:false,remote:false,bakR:false,bak:null}); setStatus("Tudo apagado. Vamos começar."); render(); window.scrollTo({top:0}); }
  catch(e){ b.disabled=false; setStatus("Não consegui apagar tudo. Tente de novo."); } }
/* ---------- dúvidas frequentes ---------- */
const FAQ=[
 ["Como a ficha monta o meu treino?","Ela calcula quantas séries cada músculo precisa por semana (pelo seu objetivo, nível e prioridades), ajusta pela sua recuperação (sono, estresse, idade) e pelos esportes que você faz, distribui essas séries nos seus dias livres dentro do tempo que você tem e escolhe cada exercício pelo seu local, nível e dores. Em Perfil → Como o plano foi montado você vê cada decisão e a evidência por trás."],
 ["Por que veio este exercício e não outro?","Toque em \"Por que este exercício\" no cartão. Iniciantes recebem primeiro as versões mais estáveis (máquinas, halteres); quem treina há mais tempo recebe as livres. Se não gostar ou o aparelho estiver ocupado, use ⇄ Trocar."],
 ["O que é RPE?","Uma nota de esforço de 1 a 10. O jeito mais fácil: 10 menos as repetições que ainda sairiam. Sobraram 2? RPE 8. Sobrou 1? RPE 9. Não saía mais nenhuma? RPE 10."],
 ["Preciso anotar o RPE em todas as séries?","Não. O mínimo é na 1ª série de cada exercício: com ela a ficha diz na hora se você deve subir, manter ou reduzir a carga nas próximas."],
 ["Quando a carga sobe?","Quando você faz o número máximo de repetições da faixa em todas as séries (ex.: 12, 12 e 12 numa faixa de 8–12). No treino seguinte a ficha sugere a nova carga e você recomeça em 8."],
 ["E se eu não conseguir fazer o mínimo de repetições?","Uma vez é normal (dia ruim). Se acontecer 2 treinos seguidos, a ficha sugere reduzir 10% e subir de novo."],
 ["Os números em cinza são obrigatórios?","Não, são a sugestão. Se fez igual, toque em ✓ que ele preenche. Se fez diferente, digite o que fez antes de tocar em ✓."],
 ["Perdi o que digitei. E agora?","A ficha guarda tudo enquanto você digita, mesmo se o celular bloquear. Se algo sumir, abra Opções do dia → Recuperar o que digitei hoje."],
 ["Posso treinar num dia diferente do planejado?","Pode. Abra a aba do treino que vai fazer, mesmo que seja outro dia da semana. O que conta é a ordem dos treinos, não o dia exato."],
 ["Faltei uma semana. Começo de onde?","Do treino seguinte ao último que fez. Se ficou mais de 2 semanas parado, use o Treino leve (Opções do dia) no primeiro treino de volta."],
 ["Estou muito cansado ou dormi mal. Treino?","Treine, mas marque Treino leve em Opções do dia: metade das séries, sem forçar. Ele não conta para a progressão."],
 ["Mudou minha rotina. Como refaço o plano?","Perfil → Editar objetivo e rotina. O plano é refeito na hora e o histórico de cargas continua."],
 ["Por que meu treino tem poucos exercícios?","Tempo curto ou metas já cumpridas. A ficha prefere poucos exercícios bem feitos a muitos com pressa. Para mais exercícios, aumente o tempo por treino no Perfil."],
 ["Preciso de relógio?","Não. Sem relógio, anote só o sono da semana. Com Whoop, Garmin ou Apple Watch, a ficha também usa recuperação, FC e VFC."],
 ["O que é a análise semanal?","Uma vez por semana, no Histórico, toque em Analisar meu treino: o Claude lê seus registros e diz o que evoluiu, o que travou e o que fazer no próximo treino."],
 ["Meus dados ficam salvos onde?","Na sua conta Claude, se a ficha foi publicada com as permissões; senão, só neste navegador. Em Perfil → Backup dos dados você copia tudo."],
 ["A ficha substitui um profissional?","Não. É uma ferramenta educacional baseada em estudos. Se tem alguma condição de saúde ou dor, passe por um médico e, se puder, por um profissional de educação física."],["Preciso tomar creatina?","Não é obrigatório. Mas é o suplemento com mais evidência para força e massa magra: 3 a 5 g por dia, todo dia, em qualquer horário. É segura para pessoas saudáveis; se você tem doença renal, fale com seu médico antes."],
["Mulher deve treinar diferente?","Não. Com o mesmo treino, mulheres e homens ganham músculo e força de pernas em proporção parecida, e mulheres costumam ganhar proporcionalmente mais força nos braços. O mesmo plano serve; ajuste só as cargas."],
["Quero emagrecer: musculação ajuda?","Sim. Mesmo sem dieta, a musculação reduz um pouco a gordura, inclusive a da barriga. Para emagrecer sem perder músculo, coma um pouco menos do que gasta (déficit moderado, até ~500 kcal por dia), mantenha a proteína alta e continue treinando pesado."],
["Tenho pouco tempo. Vale a pena treinar 30 minutos?","Vale. Treinos curtos com exercícios compostos e bisets (dois exercícios alternados, como supino e remada) dão bons resultados. Para a saúde, 30–60 minutos de musculação por semana já reduzem o risco de várias doenças."],
["De onde vem o nome Kora?","Kora junta duas palavras. Core, em inglês, é o centro do corpo, de onde sai a força. Cor, em latim, quer dizer coração: é a mesma raiz de \"coragem\" e \"cordial\". Força e saúde num nome só."]];
function koraNote(){ const n=$("#koraNote"); if(n) n.hidden=!n.hidden; }
function renderFaq(){
  $("#day").innerHTML=`<div class="col"><div class="dayhead"><h2>Dúvidas</h2>${!state.pf||state.editing?'<button class="link" id="backOnb" type="button">← Voltar ao questionário</button>':""}</div>
    ${FAQ.map(([q,a],i)=>`<details class="gd"${i?"":" open"}><summary>${esc(q)}</summary><div class="gb"><p>${esc(a)}</p></div></details>`).join("")}
    <button class="ghost" id="toGuia" type="button">Guia completo: RPE, divisões, cardio, ciência</button></div>`;
  $("#toGuia").onclick=()=>{ state.current="guia"; render(); window.scrollTo({top:0}); };
  if($("#backOnb")) $("#backOnb").onclick=()=>{ state.current="onb"; render(); window.scrollTo({top:0}); }; }
/* ---------- perfil ---------- */
let prioSet=new Set();
function renderPerfil(){ const p=state.pf, pl=state.plan, G=GOALS[p.objetivo];
  const ex=pl.days.map((d,i)=>`<li><b>${String.fromCharCode(65+i)} · ${esc(d.n)}</b>${d.dow.length?" ("+DOWN[d.dow[0]]+")":""}${d.sport&&d.sport.length?" · com "+esc(d.sport.join(", ")):""}: ${d.ex.map(e=>esc(chosen(e))).join(", ")}</li>`).join("");
  $("#day").innerHTML=`<div class="col"><div class="dayhead"><h2>${esc(p.nome||"Seu perfil")}</h2></div>
    ${p.saudeQ==="sim"?'<div class="banner">Você marcou um sinal de alerta de saúde: passe por um médico antes de começar e leve este plano para ele ver.</div>':""}
    <button class="ghost" id="toPlano" type="button">Resumo do plano e divisões</button>
    <article class="card"><div class="exname">Seu plano</div>
      <p class="exnote"><b>Objetivo:</b> ${esc(pl.goal)}${pl.goal2?" + "+esc(pl.goal2):""} · <b>Divisão:</b> ${esc(pl.split)} (${pl.lift} dias) · <b>Tempo:</b> ${p.tempo} min · <b>Cardio:</b> ${pl.cardio.n}×/sem</p>
<ul class="plist">${ex}</ul>${pl.notes.map(n=>`<div class="banner dl">${esc(n)}</div>`).join("")}</article>
    <details class="gd"><summary>Volume semanal por músculo</summary><div class="gb">
      <p class="exnote">Séries de trabalho por semana (exercícios que ajudam contam meia série). A meta de cada músculo foi calculada para você (objetivo, nível, prioridades, recuperação e esportes).</p>
      <table class="gt"><tbody>${(prioSet=new Set(p.prioridades||[]),"")}${MUSCLES.map(m=>{ const v=Math.round(pl.vol.v[m]*10)/10, f=pl.vol.f[m]; const t=pl.target[m]; const st=v<t*0.75?["Abaixo","bad"]:v>t*1.3?["Acima","good"]:["Na meta","good"];
        return `<tr><td>${m[0].toUpperCase()+m.slice(1)}${(pl.tWhy[m]||[]).length?`<br><small class="note">${esc(pl.tWhy[m].join("; "))}</small>`:""}</td><td class="tr">${fmt(v)} / ${t} · ${f}×</td><td class="${st[1]}">${st[0]}</td></tr>`; }).join("")}</tbody></table>
      <p class="note">Coluna do meio: séries do plano / meta da semana · treinos por semana. "Abaixo" quase sempre é falta de tempo: aumente o tempo por treino ou marque o músculo como prioridade.</p></div></details>
    <details class="gd" open><summary>Como o plano foi montado</summary><ol class="plist">${pl.why.map(w=>{ const ev=DATA.evidencias.find(x=>x.id===w.ev); return `<li>${esc(w.t)}${ev?` <small class="note">· ${esc(ev.tema)} (evidência ${esc(ev.forca)})</small>`:""}</li>`; }).join("")}</ol></details>
    <div class="askrow"><button class="ckbtn" id="editPf" type="button">Editar objetivo e rotina</button></div>
    <details id="resetBox"><summary>Recomeçar do zero</summary><div class="gb">
      <p>Apaga o perfil, o plano, os treinos, os gráficos e as análises desta ficha, e volta para o questionário. Não dá para desfazer. Se quiser guardar os treinos, copie antes o Backup dos dados.</p>
      <div class="askrow"><button class="ghost" id="resetAsk" type="button">Apagar tudo e recomeçar</button></div>
      <div class="askrow" id="resetConfirm" hidden><button class="ckbtn" id="resetYes" type="button" style="background:var(--plate-red)">Sim, apagar tudo</button><button class="ghost" id="resetNo" type="button">Cancelar</button></div></div></details>
    <details><summary>Backup dos dados</summary><p class="note">Copie o texto abaixo e guarde (ex.: nas Notas). Para restaurar, cole e toque em Importar.</p>
      <textarea id="bk" rows="5" style="width:100%;box-sizing:border-box;font:12px var(--mono);background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:8px">${esc(JSON.stringify({sessions:state.sessions,checkins:state.checkins,pf:state.pf,prefs:state.prefs}))}</textarea>
      <div class="askrow" style="margin-top:8px"><button class="ckbtn" id="bkCopy" type="button">Copiar backup</button><button class="ghost" id="bkImp" type="button">Importar</button></div></details></div>`;
  $("#toPlano").onclick=()=>{ state.current="plano"; render(); window.scrollTo({top:0}); };
  $("#resetAsk").onclick=()=>{ $("#resetConfirm").hidden=false; $("#resetAsk").hidden=true; };
  $("#resetNo").onclick=()=>{ $("#resetConfirm").hidden=true; $("#resetAsk").hidden=false; };
  $("#resetYes").onclick=resetAll;
  $("#editPf").onclick=()=>{ state.editing=true; render(); window.scrollTo({top:0}); };
  $("#bkImp").onclick=()=>importBackup($("#bk").value);
  $("#bkCopy").onclick=copyBackup;
}
/* ---------- backup: copiar e importar (também na primeira tela, para ninguém precisar se recadastrar) ---------- */
const backupText=()=>JSON.stringify({kora:1,sessions:state.sessions,checkins:state.checkins,pf:state.pf,prefs:state.prefs});
async function copyBackup(){ try{ await navigator.clipboard.writeText(backupText()); setStatus("Backup copiado. Cole nas Notas ou mande para você mesmo no WhatsApp."); }catch(e){ state.current="perfil"; render(); setStatus("Copie o texto em Perfil → Backup dos dados."); } }
async function importBackup(txt){ let o; try{ o=JSON.parse(String(txt||"").trim()); }catch(e){ setStatus("Texto de backup inválido: copie o texto inteiro, do { até o }."); return; }
  const ids=new Set(state.sessions.map(s=>s.ts)); const add=(o.sessions||[]).filter(s=>s&&s.type==="session"&&!ids.has(s.ts));
  const wk=new Set((state.checkins||[]).map(c=>c.week)); const ck=(o.checkins||[]).filter(c=>c&&c.week&&!wk.has(c.week));
  try{ for(const s of add){ await store.put("s_"+s.ts,s); state.sessions.push(s); }
    for(const c of ck){ state.checkins.push(c); await store.put("ck_"+c.week,c); }
    if(o.pf&&!state.pf){ state.pf=o.pf; await store.put("perfil",o.pf); }
    if(o.prefs&&!(state.prefs&&state.prefs.extra)){ state.prefs=Object.assign({swap:{}},o.prefs,state.prefs&&Object.keys(state.prefs.swap||{}).length?{swap:state.prefs.swap}:{}); await store.put("prefs",state.prefs); }
    if(state.pf){ state.plan=withExtras(buildPlan(state.pf)); state.editing=false; if(state.current==="onb") state.current="inicio"; }
    render(); setStatus(`${add.length} treino${add.length===1?"":"s"} importado${add.length===1?"":"s"}.`); }catch(e){ setStatus("Falha ao importar. Tente de novo."); } }

/* ---------- análise pelo Claude ---------- */
let sampleFn=null, askCtl=null;
function planSummary(){ return state.plan.days.map((d,i)=>`${String.fromCharCode(65+i)} ${d.n}${d.dow.length?" ("+DOWN[d.dow[0]]+")":""}: `+d.ex.map(e=>`${chosen(e)} ${e.sets}×${e.lo}–${e.hi} RPE ${e.rpe.join("/")}`).join("; ")).join("\n")+`\nCardio: ${state.plan.cardio.n}×/sem, zona 2 ${state.plan.cardio.z2min} min${state.plan.cardio.hiit?" + 4×4 1×/sem":""}.`; }
function analysisPrompt(){ const p=state.pf, since=isoLocal(new Date(Date.now()-28*864e5));
  const ss=state.sessions.filter(s=>s.date>=since).sort((a,b)=>a.ts-b.ts).map(s=>{ const o={data:s.date,treino:s.label||s.day}; if(s.leve)o.leve=true; if(s.ex)o.ex=s.ex; if(s.cardio)o.cardio=s.cardio; if(s.watch)o.relogio=s.watch; return o; });
  return `Você é um preparador físico analisando o treino de ${p.nome||"um aluno"}. Responda em português do Brasil, direto, específico, com números. Não invente dados; com poucos registros, diga isso.
PERFIL: ${p.idade||"?"} anos, ${p.peso||"?"} kg, ${p.altura||"?"} cm. Experiência: ${{nunca:"nunca treinou",ate6:"menos de 6 meses",["6a12"]:"6–12 meses",mais1:"mais de 1 ano"}[p.exp]}. Objetivo: ${GOALS[p.objetivo].nome}${p.secundario?" + "+GOALS[p.secundario].nome:""}. Dias: ${p.dias.map(d=>DOWN[d]).join(", ")}; ${p.tempo} min/treino; local: ${p.local}. Outras atividades: ${sportSummary(p)||p.esporte||"nenhuma"}. Quer conseguir: ${(p.habilidades||[]).map(h=>DATA.habilidades[h]&&DATA.habilidades[h].nome).filter(Boolean).join(", ")||"nada específico"}. Dores: ${(p.dores||[]).join(", ")||"nenhuma"} ${p.doresTxt||""}. Prioridades: ${(p.prioridades||[]).join(", ")||"nenhuma"}. Trabalho: ${p.trabalho||"?"}; sono informado ${p.sono||"?"} h; estresse ${p.estresse}/5. Relógio: ${wearName(p.wear)}. Começou em ${p.inicio}; hoje ${todayISO()} (semana ${weeksIn(p)+1}).
PLANO:\n${planSummary()}\nCOMO O PLANO FOI MONTADO: ${state.plan.why.map(w=>w.t).join(" | ")}\nMETAS DE SÉRIES/SEMANA: ${JSON.stringify(state.plan.target)}
REGRAS: dupla progressão (sobe a carga quando faz o topo da faixa em todas as séries; +2,5% tronco, +5% pernas e acessórios). RPE = 10 − reps que sobravam; iniciantes subestimam ~1–2 reps. ${beginner(p)?"Iniciante: RPE máximo 8; nas 2 primeiras semanas a prioridade é técnica, não carga.":""} Força estimada: e1RM = kg × (1 + (reps + 10 − RPE)/30). Estagnação = 3 sessões sem subir carga nem reps. Carga variando entre séries de trabalho = aquecimento misturado: oriente usar a mesma carga. Semana leve se: 8+ semanas sem uma, ou 2+ sinais (cargas caindo em 3+ exercícios; RPE subindo com a mesma carga; sono < 6,5 h; ${p.wear==="whoop"?"Recovery médio < 34%; ":""}${p.wear==="garmin"?"Prontidão de treino média < 25; ":""}FC repouso ≥5 bpm acima da média; VFC ≥10% abaixo da média). Cardio: zona 2 bem feita = ≥70% do tempo em Z2; 4×4 = ~16 min em Z4–Z5. Combinação com esportes: perna no mesmo dia ou na véspera de atividade forte de pernas atrapalha; superior + atividade forte é ok; perna + atividade leve é ok. Atividades moderadas/fortes contam como cardio. Aderência: compare treinos feitos com ${state.plan.lift}/semana.
REGISTROS (4 semanas): ${JSON.stringify(ss)}
RECUPERAÇÃO SEMANAL (sono h, rec = Recovery % do Whoop, prt = Prontidão de treino do Garmin 0–100, fcr bpm, vfc ms): ${JSON.stringify(state.checkins.map(c=>({semana:c.week,sono:c.sono,rec:c.rec,prt:c.prt,fcr:c.fcr,vfc:c.vfc})))}
ESFORÇO DOS TREINOS: strain = Whoop (0–21); te = Training Effect aeróbico do Garmin (0–5; 2–2,9 manutenção, 3–3,9 melhora, 4+ muito alto); load = carga de treino Garmin (EPOC).
Responda SOMENTE com JSON: {"resumo":"2–3 frases","tabela":[{"exercicio":"…","trabalho":"última: 40 kg × 10, 10, 9 @8","tendencia":"↑|→|↓|novo","proxima":"o que fazer na próxima sessão"}],"alertas":["…"],"deload":{"recomendar":false,"motivo":"…"},"acoes":["…"]} — máx. 10 linhas, 3 alertas, 4 ações.`; }
async function runAnalysis(){ if(!sampleFn) return; const btn=$("#askBtn"), stop=$("#askStop"), out=$("#askOut"); askCtl=new AbortController(); btn.disabled=true; stop.hidden=false; stop.onclick=()=>askCtl.abort();
  const t0=Date.now(); out.innerHTML=`<p class="note" id="askWait">Analisando…</p>`; const tick=setInterval(()=>{ const w=$("#askWait"); if(w) w.textContent=`Analisando… ${Math.round((Date.now()-t0)/1000)} s`; },1000);
  try{ const r=await sampleFn.json(analysisPrompt(),{signal:askCtl.signal,cache:false}); if(!r||typeof r!=="object") throw {code:"invalid_json"};
    const doc=Object.assign({type:"analise",data:todayISO(),semana:weekStart(todayISO())},r); state.analysis=doc; state.anHist=[doc].concat((state.anHist||[]).filter(x=>x.semana!==doc.semana));
    try{ await store.put("analise",doc); await store.put("an_"+doc.semana,doc); }catch(e){} renderAsk(r); }
  catch(e){ out.innerHTML=`<p class="note">${({cancelled:"Análise interrompida.",rate_limited:"Limite de uso atingido. Tente mais tarde.",invalid_json:"Resposta em formato inesperado. Tente de novo."})[e&&e.code]||"Não foi possível analisar agora. Tente de novo."}</p>`; }
  finally{ clearInterval(tick); btn.disabled=false; stop.hidden=true; } }
function renderAsk(r){ const out=$("#askOut"); if(!out) return;
  out.innerHTML=`${r.resumo?`<p style="margin:0">${esc(r.resumo)}</p>`:""}${(r.tabela||[]).length?`<div style="overflow-x:auto"><table><thead><tr><th>Exercício</th><th>Trabalho</th><th></th><th>Próxima</th></tr></thead><tbody>${r.tabela.map(t=>`<tr><td>${esc(t.exercicio)}</td><td class="tr">${esc(t.trabalho)}</td><td>${esc(t.tendencia||"")}</td><td>${esc(t.proxima||"")}</td></tr>`).join("")}</tbody></table></div>`:""}
    ${(r.alertas||[]).map(a=>`<div class="al">${esc(a)}</div>`).join("")}${r.deload?`<p style="margin:0"><b>Semana leve:</b> ${r.deload.recomendar?"sim":"não"} · ${esc(r.deload.motivo||"")}</p>`:""}
    ${(r.acoes||[]).length?`<ul>${r.acoes.map(a=>`<li>${esc(a)}</li>`).join("")}</ul>`:""}<p class="note">Análise guardada no histórico desta semana.</p>`; }
function needsWeekly(){ const wk=weekStart(todayISO()); const recent=state.sessions.some(s=>s.date>=isoLocal(new Date(Date.now()-8*864e5)));
  const done=(state.anHist||[]).some(a=>a.semana===wk); const dow=new Date().getDay(); return recent&&!done&&(dow===0||dow===1||!(state.anHist||[]).length); }

/* ---------- início ---------- */
$("#saveBtn").onclick=saveDay; $("#restX").onclick=closeRest; $("#restAdd").onclick=()=>{ rest.end=Math.max(rest.end,Date.now())+30000; rest.fired=false; $("#rest").classList.remove("over"); tickRest(); };
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&!$("#rest").hidden) tickRest(); });
(async()=>{
  draft.data=draftLocal(); if($("#koraH")) $("#koraH").onclick=koraNote; 
  await store.init(); const o=await store.load();
  if(o.failed){ $("#day").innerHTML=`<div class="col"><article class="card"><div class="exname">Não consegui carregar seus treinos</div>
    <p class="exnote">Seus dados estão salvos na sua conta, mas a conexão falhou agora. <b>Não precisa se cadastrar de novo.</b> Verifique a internet e tente outra vez.</p>
    <div class="askrow"><button class="ckbtn" type="button" onclick="location.reload()">Tentar de novo</button></div></article></div>`; return; }
  state.sessions=o.sessions||[]; state.checkins=o.checkins||[]; state.prefs=Object.assign({swap:{}},o.prefs||{}); state.pf=o.pf||null; state.analysis=o.analysis||null; state.anHist=(o.anHist||[]).sort((a,b)=>a.semana<b.semana?1:-1);
  if(state.pf) state.plan=withExtras(buildPlan(state.pf));
  const dd=o.draft&&o.draft.type==="draft"&&o.draft.date===todayISO()?o.draft:null; draft.remote=!!dd; draft.bakR=!!(o.bak&&o.bak.date===todayISO()); draft.bak=draft.bakR?o.bak:null;
  draft.data=mergeD(dd,draft.data); draft.ready=true;
  state.current=draft.data&&state.plan&&(state.plan.days.some(d=>d.key===draft.data.day)||draft.data.day==="cardio")&&Object.values(draft.data.values||{}).some(v=>v!=="")?draft.data.day:"inicio";
  render(); if(store.migrated) setStatus("Seus treinos deste aparelho foram copiados para a sua conta.");
  try{ if(window.claude&&claude.use) claude.use("sample").then(f=>{ sampleFn=f||null; if(sampleFn&&state.pf&&!state.editing&&state.current!=="perfil"&&state.current!=="guia"&&state.current!=="cardio") render(); }).catch(()=>{}); }catch(e){}
})();

