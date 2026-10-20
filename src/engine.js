/* Ficha de Treino — motor: gera o plano a partir do perfil. Sem acesso ao DOM: testado em tests/. */
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>{ if(n===""||n==null||!isFinite(n)) return ""; return String(Math.round(Number(n)*100)/100).replace(".",","); };
const num=v=>{ const t=String(v??"").trim().replace(",","."); return t===""?NaN:Number(t); };
function todayISO(){ const n=new Date(); return new Date(n.getTime()-n.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function weekStart(iso){ const d=new Date(iso+"T12:00:00"); const k=(d.getDay()+6)%7; d.setDate(d.getDate()-k); return d.toISOString().slice(0,10); }
const dstr=iso=>{ const [y,m,d]=iso.split("-"); return `${d}/${m}`; };
const DOWN=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
/* ---------- dados: vêm de data/*.json, embutidos em DATA pelo build (scripts/build.mjs) ---------- */
const MUSCLES=DATA.padroes.musculos;
const LOCAIS=["completa","basica","casa"], CUIDADOS=["joelho","ombro","lombar"];
/* monta a biblioteca por padrão de movimento: opções por local e listas seguras por região, na ordem definida em exercicios.json */
const LIB=(()=>{ const lib={};
  for(const [p,m] of Object.entries(DATA.padroes.padroes)) lib[p]={k:m.tipo,m:m.musculo,sec:m.auxiliares,low:m.membroInferior,n:m.nome,how:m.dica,o:{}};
  const by=(key,pick)=>DATA.exercicios.filter(e=>lib[e.padrao]&&pick(e)!=null).sort((a,b)=>pick(a)-pick(b));
  for(const p of Object.keys(lib)){ for(const loc of LOCAIS) lib[p].o[loc]=by(p,e=>e.padrao===p?e.locais[loc]:null).map(e=>e.nome);
    for(const c of CUIDADOS){ const l=by(p,e=>e.padrao===p&&e.seguroPara?e.seguroPara[c]:null).map(e=>e.nome); if(l.length) lib[p][c]=l; } }
  return lib; })();
const EXBYNAME=Object.fromEntries(DATA.exercicios.map(e=>[e.nome,e]));
const T=DATA.divisoes.modelos, SPLITS=DATA.divisoes.divisoes, TIME_EX=DATA.divisoes.exerciciosPorTempo, GOALS=DATA.objetivos;
const SPORTS=DATA.esportes.modalidades, INT=DATA.esportes.intensidade;

/* ---------- divisões (modelos de treino) ----------
   Cada divisão tem modelos de sessão; os dias de musculação recebem os modelos em ordem, repetindo (com 6 dias o ABC vira ABCABC). */
const S=(p,o)=>({p,o:o||0});
function autoSplit(n,pf){ if(n<=3) return "full"; if(n===4) return "ul"; if(n===5) return beginner(pf)?"ul":"ulf"; return beginner(pf)?"ul":"ppl"; }
/* ---------- parâmetros por objetivo ---------- */
const beginner=pf=>pf.exp==="nunca"||pf.exp==="ate6";
function weeksIn(pf){ if(!pf||!pf.inicio) return 0; return Math.floor((new Date(todayISO()+"T12:00:00")-new Date(pf.inicio+"T12:00:00"))/(7*864e5)); }
const tecnica=pf=>beginner(pf)&&weeksIn(pf)<2;

function pickOpts(def,pf){
  const loc=pf.local||"completa"; let opts=(def.o[loc]||def.o.completa).slice();
  (pf.dores||[]).forEach(d=>{ if(def[d]) opts=def[d].concat(opts.filter(x=>!def[d].includes(x))); });
  const ban=(pf.evitar||"").toLowerCase().split(/[,;\n\/]| e | ou /).map(s=>s.trim()).filter(s=>s.length>=4);
  const nomes=o=>[o].concat((EXBYNAME[o]&&EXBYNAME[o].sinonimos)||[]).map(x=>x.toLowerCase());
  const ok=opts.filter(o=>!ban.some(b=>nomes(o).some(n=>n.includes(b))));
  return (ok.length?ok:opts).filter((x,i,a)=>a.indexOf(x)===i);
}
function splitFor(pf,lift){ const k=pf.divisao&&pf.divisao!=="auto"&&SPLITS[pf.divisao]?pf.divisao:autoSplit(lift,pf); return k; }
function liftDays(pf){ const want=(pf.dias||[]).length||3; let lift=Math.min(want,6); if(beginner(pf)&&lift>4&&(!pf.divisao||pf.divisao==="auto")) lift=4; return Math.max(2,lift); }

/* volume semanal: séries por músculo, contando 1 para o músculo principal e frações para os auxiliares (contagem fracionada, como em Pelland 2025) */
function weeklyVolume(days){ const v={}, f={}; MUSCLES.forEach(m=>{ v[m]=0; f[m]=0; });
  days.forEach(d=>{ const hit=new Set(); d.ex.forEach(e=>{ v[e.m]+=e.sets; hit.add(e.m); Object.entries(LIB[e.p].sec||{}).forEach(([m,w])=>{ v[m]+=e.sets*w; }); }); hit.forEach(m=>f[m]++); });
  return {v,f}; }

/* ---------- planejador ----------
   Raciocina em 5 passos, e cada decisão guarda o motivo (plan.why / ex.why) e a evidência (id em evidencias.json):
   1. nível e recuperação  2. metas de séries por músculo na semana  3. divisão e frequência
   4. distribuição das séries por treino, dentro do tempo disponível  5. escolha de cada exercício */
const HAB=DATA.habilidades, SMALL=new Set(["panturrilha","abdômen","adutores"]);
const nivel=pf=>beginner(pf)?0:pf.exp==="6a12"?1:2;
/* complexidade técnica: 1 = guiado/estável (máquina, cabo, smith), 2 = halteres/kettlebell, 3 = livre com barra */
function complexity(n){ if(/máquina|articulad|smith|cabo|cadeira|mesa|leg press|hack|peck|graviton|crossover|puxada|pulldown|pêndulo|belt|polia|corda|elástico|voador/i.test(n)) return 1;
  if(/livre|com barra|terra|frontal|pendlay|good morning|sumô com barra|curvada com barra|em pé com barra|landmine|militar|zercher|com salto|caixa|nordic|pistol/i.test(n)) return 3; return 2; }
const exMinutes=e=>e.sets*(0.75+e.rest/60)+1;
function makeEx(p,sets,pf,G,why){ const def=LIB[p], P=def.k==="C"?G.C:def.k==="P"?{lo:3,hi:5,rpe:[6],rest:90}:G.A;
  let rpe=[]; for(let i=0;i<sets;i++) rpe.push(P.rpe[Math.min(i,P.rpe.length-1)]);
  if(beginner(pf)) rpe=rpe.map(r=>Math.min(r,8)); if(tecnica(pf)&&def.k!=="P") rpe=rpe.map((r,i)=>i?7:6.5);
  return {p,k:def.k,m:def.m,sets,lo:P.lo,hi:P.hi,rpe,rest:P.rest,low:!!def.low,how:def.how||"",why:why||[]}; }

function buildPlan(pf){
  const why=[], add=(t,ev)=>why.push({t,ev});
  const want=(pf.dias||[]).length||3, lift=liftDays(pf), sk=splitFor(pf,lift), sp=SPLITS[sk];
  const G=GOALS[pf.objetivo]||GOALS.misto, G2=pf.secundario?GOALS[pf.secundario]:null, lv=nivel(pf), skills=(pf.habilidades||[]).filter(h=>HAB[h]);
  /* 1. recuperação */
  let rf=1; const rr=[];
  if(pf.sono&&pf.sono<6){ rf*=0.8; rr.push(`sono de ${pf.sono} h`); } else if(pf.sono&&pf.sono<7){ rf*=0.9; rr.push(`sono de ${pf.sono} h`); }
  if(pf.estresse>=5){ rf*=0.85; rr.push("estresse alto"); } else if(pf.estresse==4){ rf*=0.9; rr.push("estresse moderado-alto"); }
  if(Number(pf.idade)>=50){ rf*=0.9; rr.push(`${pf.idade} anos`); }
  rf=Math.max(0.7,rf); if(rr.length) add(`Volume inicial ${Math.round((1-rf)*100)}% menor por causa de ${rr.join(", ")}. Melhorando a recuperação, refaça o plano no Perfil.`,"recuperacao");
  /* 2. prioridades efetivas: as escolhidas + as que vêm das habilidades e do esporte */
  const prio=new Map(); (pf.prioridades||[]).forEach(m=>prio.set(m,"você marcou como prioridade"));
  skills.forEach(h=>(HAB[h].prioridades||[]).forEach(m=>{ if(!prio.has(m)) prio.set(m,"habilidade: "+HAB[h].nome.toLowerCase()); }));
  if(skills.includes("esporte")) (pf.esportes||[]).forEach(s=>((DATA.esportes.enfase||{})[s.mod]||[]).forEach(m=>{ if(!prio.has(m)) prio.set(m,"exigido pelo seu esporte ("+s.mod.toLowerCase()+")"); }));
  /* esportes: carga nas pernas/tronco e cardio */
  const esp=pf.esportes||[]; let legW=0, upW=0, aerN=0;
  esp.forEach(x=>{ const S=SPORTS[x.mod]||SPORTS.Outro, k=INT[x.int]||0.6, n=(x.dias||[]).length; legW+=S.leg*k*n; upW+=S.up*k*n; if(S.aer&&k>=0.6) aerN+=n; });
  /* metas semanais por músculo */
  const range=beginner(pf)?G.volIni:G.vol, pos=[0.3,0.45,0.6][lv], target={}, tWhy={};
  MUSCLES.forEach(m=>{ let t=range[0]+(range[1]-range[0])*pos, w=[];
    if(SMALL.has(m)&&!prio.has(m)){ t=Math.max(3,range[0]*0.6); w.push("músculo pequeno, já trabalhado nos exercícios grandes"); }
    if(prio.has(m)){ t=Math.min(range[1]+2,t*1.3); w.push(prio.get(m)); }
    if(legW>=1.8&&["pernas","posterior","glúteos","adutores","panturrilha"].includes(m)&&!prio.has(m)){ t*=0.8; w.push("seu esporte já cansa as pernas"); }
    if(upW>=1.8&&m==="braços"){ t*=0.8; w.push("seu esporte já exige a pegada e os braços"); }
    target[m]=Math.max(2,Math.round(t*rf)); tWhy[m]=w; });
  add(`Meta de séries por músculo na semana: ${range[0]}–${range[1]} para o seu objetivo (${G.nome.toLowerCase()}) e nível; você começa perto de ${Math.round(range[0]+(range[1]-range[0])*pos)}.`,"volume");
  /* 3. divisão e frequência */
  const tms=[...Array(lift).keys()].map(i=>T[sp.t[i%sp.t.length]]);
  add(`${lift} dias de musculação → ${sp.nome}. ${sp.por}`,"frequencia");
  const freq={}; MUSCLES.forEach(m=>freq[m]=0); tms.forEach(t=>new Set(t.s.map(s=>LIB[s.p].m)).forEach(m=>freq[m]++));
  /* 4. distribuição: compostos primeiro (contam fração para os auxiliares), depois acessórios até completar a meta, dentro do tempo */
  const cap=lv===0?6:8, maxSets=lv===0?3:4, minutes=(Number(pf.tempo)||60)-5;
  const days=tms.map((tm,di)=>({key:"d"+(di+1),n:tm.n,ex:[],tm}));
  const got={}; MUSCLES.forEach(m=>got[m]=0);
  const credit=(p,s)=>{ got[LIB[p].m]+=s; Object.entries(LIB[p].sec||{}).forEach(([m,w])=>got[m]+=s*w); };
  const perSession=m=>Math.min(cap+(prio.has(m)?2:0),Math.ceil(target[m]/Math.max(1,freq[m])));
  /* blocos de habilidade (vão para o início do treino) */
  const blocks=[]; skills.forEach(h=>{ const b=HAB[h].bloco; if(b) blocks.push({h,...b}); });
  const used={}; /* exercícios já usados na semana, para variar */
  days.forEach(d=>{ const slots=d.tm.s.map((s,i)=>({...s,i,def:LIB[s.p]})); let t=0;
    const sess={}; const fit=e=>t+exMinutes(e)<=minutes;
    /* blocos de habilidade: no máximo 1 por treino, nos primeiros treinos compatíveis */
    for(const b of blocks){ if(b.feitos>=b.vezes) continue; const ok=b.padrao==="vpull"?slots.some(s=>s.p==="vpull"||s.p==="hpull"):true; if(!ok) continue;
      const e=makeEx(b.padrao,3,pf,G,[{t:`Habilidade: ${HAB[b.h].nome.toLowerCase()}. ${HAB[b.h].porque}`,ev:HAB[b.h].ev}]); e.skill=b.h; e.pref=b.preferir&&b.preferir[String(lv)];
      if(b.padrao==="vpull"){ e.k="C"; } if(fit(e)){ d.ex.push(e); t+=exMinutes(e); b.feitos=(b.feitos||0)+1; credit(e.p,e.sets); sess[e.m]=(sess[e.m]||0)+e.sets; break; } }
    const comp=slots.filter(s=>s.def.k==="C"&&!(s.p==="vpull"&&d.ex.some(e=>e.skill==="barra")));
    const left=m=>target[m]-got[m];
    const accFor=s=>{ const m=s.def.m, rest=Math.min(perSession(m)-(sess[m]||0), Math.ceil(left(m)/Math.max(1,freq[m]-0.5)));
      if(rest<2&&!prio.has(m)) return null; const sets=Math.min(maxSets,Math.max(2,rest));
      const e=makeEx(s.p,sets,pf,G,[{t:`${m[0].toUpperCase()+m.slice(1)}: ${prio.has(m)?prio.get(m)+"; ":""}faltavam ${Math.max(0,Math.round(left(m)))} séries para a meta da semana (${target[m]}).`,ev:"volume"}]); e.o=s.o; e.i=s.i; return e; };
    const put=e=>{ if(!fit(e)){ e.sets=2; e.rpe=e.rpe.slice(0,2); if(!fit(e)) return false; } d.ex.push(e); t+=exMinutes(e); credit(e.p,e.sets); sess[e.m]=(sess[e.m]||0)+e.sets; return true; };
    /* A. compostos com 2 séries garantidas (o resto é completado depois) */
    const planned=new Map();
    for(const s of comp){ const m=s.def.m, need=perSession(m)-(sess[m]||0); if(need<2) continue;
      const sets=Math.min(maxSets,Math.max(2,Math.min(need,G.C.sets+(lv===2?1:0))));
      const e=makeEx(s.p,2,pf,G,[{t:`${m[0].toUpperCase()+m.slice(1)}: meta de ${target[m]} séries/semana em ${freq[m]} treino${freq[m]>1?"s":""} → ~${perSession(m)} hoje.`,ev:"volume-sessao"}]); e.o=s.o; e.i=s.i;
      if(put(e)) planned.set(e,sets); }
    const acc=slots.filter(s=>s.def.k!=="C");
    acc.sort((a,b)=>(left(b.def.m)/target[b.def.m]-left(a.def.m)/target[a.def.m])||a.i-b.i);
    /* B. acessórios das prioridades */
    for(const s of acc.filter(s=>prio.has(s.def.m))){ const e=accFor(s); if(e) put(e); }
    /* C. completa as séries dos compostos */
    for(const [e,sets] of planned){ while(e.sets<sets){ const extra=e.sets*0+1; const add1={...e,sets:e.sets+extra}; if(t-exMinutes(e)+exMinutes(add1)>minutes) break; t+=exMinutes(add1)-exMinutes(e); credit(e.p,1); sess[e.m]+=1; e.sets++; e.rpe=makeEx(e.p,e.sets,pf,G).rpe; } }
    /* D. demais acessórios: maior falta primeiro */
    for(const s of acc.filter(s=>!prio.has(s.def.m))){ const e=accFor(s); if(e) put(e); }
    /* ordem: habilidade, compostos, acessórios na ordem do modelo */
    const ord=e=>e.skill?-1:e.k==="C"?0:1; d.ex.sort((a,b)=>ord(a)-ord(b)||(a.i||0)-(b.i||0));
    d.min=Math.round(t+5); delete d.tm; });
  /* passe final: músculo que ficou abaixo da metade da meta ganha 2 séries onde ainda couber no tempo */
  MUSCLES.forEach(m=>{ if(got[m]>=target[m]*0.5) return;
    for(const d of days){ const tm=T[sp.t[days.indexOf(d)%sp.t.length]]; const s=tm.s.find(x=>LIB[x.p].m===m&&LIB[x.p].k!=="C"&&!d.ex.some(e=>e.p===x.p)); if(!s) continue;
      const e=makeEx(s.p,2,pf,G,[{t:`${m[0].toUpperCase()+m.slice(1)}: estava abaixo da metade da meta da semana; 2 séries para não ficar sem estímulo.`,ev:"volume"}]); e.o=s.o;
      if(d.min-5+exMinutes(e)<=minutes){ d.ex.push(e); d.min=Math.round(d.min+exMinutes(e)); credit(s.p,2); if(got[m]>=target[m]*0.5) break; } } });
  /* 5. escolha de cada exercício: local, dores e "evitar" (pickOpts), nível técnico e variação na semana */
  const W=[2.5,1,0][lv]; const habCore=skills.includes("costas")?HAB.costas.core:null;
  days.forEach(d=>d.ex.forEach((e,i)=>{ e.id=d.key+"x"+i; const def=LIB[e.p]; let opts=pickOpts(def,pf);
    const rot=(e.o||0)%opts.length; opts=opts.slice(rot).concat(opts.slice(0,rot));
    const score=(n,ix)=>ix+(Math.max(0,complexity(n)-1))*W+((used[e.p]||[]).includes(n)?4:0)-(e.pref&&e.pref.includes(n)?20-e.pref.indexOf(n):0)-(habCore&&e.p==="core"&&habCore.includes(n)?10:0);
    let best=0; opts.forEach((n,ix)=>{ if(score(n,ix)<score(opts[best],best)) best=ix; });
    const pick=opts[best]; e.opts=[pick].concat(opts.filter(x=>x!==pick));
    if(e.pref&&e.pref.includes(pick)) e.why.push({t:`${pick}: a progressão certa para o seu nível.`,ev:"progressao"});
    else if(habCore&&e.p==="core"&&habCore.includes(pick)) e.why.push({t:`${pick}: estabiliza a coluna sem flexioná-la (habilidade: proteger as costas).`,ev:"volume"});
    else if(best>0&&lv===0&&complexity(pick)<complexity(opts[0]===pick?opts[1]||pick:opts[0])) e.why.push({t:`${pick}: mais estável e fácil de aprender que ${opts.find(x=>x!==pick)}; quando dominar, troque no menu.`,ev:"selecao"});
    else if((used[e.p]||[]).length&&!used[e.p].includes(pick)) e.why.push({t:`${pick}: variação diferente do outro treino da semana.`,ev:"variacao"});
    (used[e.p]=used[e.p]||[]).push(pick); delete e.pref; delete e.o; delete e.i; }));
  /* dias da semana: organiza em volta dos esportes */
  const dows=(pf.dias||[1,3,5]).map(Number).sort((a,b)=>((a+6)%7)-((b+6)%7));
  const arr=arrangeDays(days,dows,pf); const ordered=arr.order.map(i=>days[i]);
  ordered.forEach((d,i)=>{ d.dow=dows[i]!=null?[dows[i]]:[]; }); days.sort((a,b)=>ordered.indexOf(a)-ordered.indexOf(b));
  days.forEach(d=>{ const t=d.dow.length?sportsOn(pf,d.dow[0]):[]; const r=regionOf(d); const ld=d.dow.length?sportLoad(pf,d.dow[0]):{leg:0}; const nd=d.dow.length?sportLoad(pf,(d.dow[0]+1)%7):{leg:0};
    d.sport=t.map(x=>`${x.mod} (${x.int})`); d.warn=r.L>0.5&&ld.leg>=0.6?"Perna no mesmo dia de uma atividade forte de pernas: faça a musculação antes e não vá até o limite.":r.L>0.5&&nd.leg>=0.6?"Amanhã tem atividade forte de pernas: pare 1–2 reps antes do RPE indicado.":"";
    if(skills.includes("mobilidade")) d.mob=r.L>0.5?["Mobilidade de quadril (90/90) · 1 min","Tornozelo no degrau · 1 min","Agachamento profundo segurando · 1 min","Ponte de glúteo · 15 reps"]:r.U>0.5?["Rotação torácica deitado de lado · 1 min","Deslizamento de braços na parede · 10 reps","Rotação externa com elástico · 15 reps","Cat-camel · 10 reps"]:["90/90 de quadril · 1 min","Rotação torácica · 1 min","Agachamento profundo · 1 min","Deslizamento na parede · 10 reps"]; });
  if(esp.length) add(`Treinos organizados em volta de ${esp.map(s=>s.mod.toLowerCase()).join(", ")}: perna longe dos dias de atividade forte de pernas.`,"concorrente");
  /* cardio */
  const extra=dows.slice(days.length);
  let cardioBase=pf.cardio==="nao"?0:Math.max(G.cardio,G2?Math.min(G2.cardio,2):0);
  skills.forEach(h=>{ if(HAB[h].cardioMin) cardioBase=Math.max(cardioBase,HAB[h].cardioMin); });
  const cardioN=Math.max(0,cardioBase-aerN);
  const cardio={n:cardioN,mods:skills.includes("corrida")?["Corrida"]:(pf.cardioMods&&pf.cardioMods.length?pf.cardioMods:["Bike"]),dias:extra,
    z2min:pf.objetivo==="saude"||pf.objetivo==="emagrecimento"?"30–45":"20–30",hiit:(["saude","misto","emagrecimento"].includes(pf.objetivo)||pf.secundario==="saude")&&weeksIn(pf)>=4};
  if(skills.includes("corrida")){ const w=Math.min(8,weeksIn(pf)+1); const run=[1,1.5,2,3,5,8,12,20][w-1], walk=[1.5,1.5,1.5,1.5,2,2,1,0][w-1];
    cardio.corrida={semana:w,texto:walk?`Semana ${w}: ${Math.round(30/(run+walk))}× (${fmt(run)} min correndo + ${fmt(walk)} min caminhando)`:`Semana ${w}: 25–30 min correndo leve, sem parar`}; }
  if(cardioN||aerN) add(aerN?`Suas atividades contam como ${aerN} sessão(ões) de cardio; ${cardioN?`faltam ${cardioN} por semana`:"cardio extra é opcional"}.`:`Cardio ${cardioN}× por semana para o seu objetivo.`,"atividade");
  skills.forEach(h=>add(`${HAB[h].nome}: ${HAB[h].porque}`,HAB[h].ev));
  const vol=weeklyVolume(days);
  const notes=[];
  if(want>lift) notes.push(`Você marcou ${want} dias. Para quem está começando, ${lift} dias de musculação dão o melhor resultado; ${extra.length?`os dias extras (${extra.map(d=>DOWN[d]).join(", ")}) ficam para cardio`:"os outros dias ficam livres ou para cardio"}.`);
  if(!sp.dias.includes(lift)) notes.push(`A divisão "${sp.nome}" foi pensada para ${sp.dias.join(" ou ")} dias; com ${lift} dias alguns grupos treinam com frequência desigual.`);
  if(arr.pen>=2) notes.push("Com os dias de musculação e de esporte que você marcou, algum treino de pernas ficou perto de uma atividade forte. Se puder, deixe 1 dia entre eles.");
  if(tecnica(pf)) notes.push("Semanas 1 e 2: fase de técnica. Use cargas em que sobram 3–4 repetições e foque em aprender o movimento.");
  return {sk,split:sp.nome,por:sp.por,goal:G.nome,goal2:G2?G2.nome:null,days,cardio,notes,lift,vol,target,tWhy,freq,why,skills,rf,
    targetRange:range};
}
/* ---------- outras atividades da rotina (esportes) ----------
   leg/up = quanto a atividade cansa pernas / tronco (0–1); aer = conta como cardio.
   Regras de combinação (treino concorrente, Wilson 2012): perna + atividade forte de perna no mesmo dia ou na véspera = evitar;
   superior + atividade forte = ok; perna + atividade leve = ok. */
const LOWER=new Set(["squat","hinge","quad","ham","glute","adductor","calves"]), UPPER=new Set(["hpush","incline","vpush","hpull","vpull","lateral","rear","chest","biceps","triceps"]);
function sportsOn(pf,dow){ return (pf.esportes||[]).filter(s=>(s.dias||[]).map(Number).includes(dow)); }
function sportLoad(pf,dow){ let leg=0,up=0; sportsOn(pf,dow).forEach(s=>{ const S=SPORTS[s.mod]||SPORTS.Outro, k=INT[s.int]||0.6; leg=Math.max(leg,S.leg*k); up=Math.max(up,S.up*k); }); return {leg,up}; }
function regionOf(day){ const n=day.ex.length||1; const L=day.ex.filter(e=>LOWER.has(e.p)).length/n, U=day.ex.filter(e=>UPPER.has(e.p)).length/n; return {L,U}; }
/* escolhe a ordem dos treinos nos dias de musculação que menos atrapalha as outras atividades */
function arrangeDays(days,dows,pf){
  if(!(pf.esportes||[]).length||days.length<2) return {order:days.map((_,i)=>i),pen:0};
  const R=days.map(regionOf), nx=d=>(d+1)%7, pv=d=>(d+6)%7;
  const cost=ord=>{ let c=0; ord.forEach((ti,i)=>{ const d=dows[i]; if(d==null) return; const r=R[ti], same=sportLoad(pf,d), next=sportLoad(pf,nx(d)), prev=sportLoad(pf,pv(d));
      c+=r.L*same.leg*(same.leg>=0.6?4:1)+r.U*same.up*0.4+r.L*next.leg*(next.leg>=0.6?2.5:0.5)+r.L*prev.leg*1;
      const j=dows.indexOf(nx(d)); if(j>=0&&j<ord.length){ const r2=R[ord[j]]; if(r.L>0.6&&r2.L>0.6) c+=1.5; } });
    return c; };
  const idx=days.map((_,i)=>i); let best=idx.slice(), bc=cost(idx);
  const perm=(a,k)=>{ if(k===a.length){ const c=cost(a); if(c<bc-1e-9){ bc=c; best=a.slice(); } return; } for(let i=k;i<a.length;i++){ [a[k],a[i]]=[a[i],a[k]]; perm(a,k+1); [a[k],a[i]]=[a[i],a[k]]; } };
  if(days.length<=6) perm(idx.slice(),0);
  return {order:best,pen:bc}; }
function sportSummary(pf){ return (pf.esportes||[]).map(s=>`${s.mod} (${s.int||"moderada"}, ${(s.dias||[]).map(d=>DOWN[d]).join("/")||"sem dia"}${s.min?", "+s.min+" min":""})`).join("; "); }
const e1rm=(kg,reps,rpe)=>kg*(1+(reps+(rpe>=5&&rpe<=10?10-rpe:2))/30);
const sessE1=sets=>Math.max(0,...sets.map(s=>e1rm(s.kg||0,s.reps||0,s.rpe)));
const roundTo=(v,s)=>Math.round(v/s)*s;
if(typeof module!=="undefined") module.exports={complexity,HAB,buildPlan,weeklyVolume,arrangeDays,sportLoad,regionOf,pickOpts,liftDays,splitFor,autoSplit,e1rm,sessE1,LIB,EXBYNAME,SPLITS,GOALS,MUSCLES,SPORTS,LOWER,UPPER,DOWN,beginner,tecnica};
