/* Kora — motor: gera o plano a partir do perfil. Sem acesso ao DOM: testado em tests/. */
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>{ if(n===""||n==null||!isFinite(n)) return ""; return String(Math.round(Number(n)*100)/100).replace(".",","); };
const num=v=>{ const t=String(v??"").trim().replace(",","."); return t===""?NaN:Number(t); };
function todayISO(){ return isoLocal(new Date()); }
/* data local em AAAA-MM-DD (sem passar por UTC: funciona em qualquer fuso) */
function isoLocal(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function weekStart(iso){ const d=new Date(iso+"T12:00:00"); const k=(d.getDay()+6)%7; d.setDate(d.getDate()-k); return isoLocal(d); }
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

/* exercícios possíveis em cada local (academia completa tem tudo; básica tem o da básica e o de casa; casa só o de casa) */
const AVAIL=(()=>{ const a={completa:new Set(DATA.exercicios.map(e=>e.nome)),basica:new Set(),casa:new Set()};
  DATA.exercicios.forEach(e=>{ const L=e.locais||{}; if(L.casa!=null){ a.casa.add(e.nome); a.basica.add(e.nome); } if(L.basica!=null) a.basica.add(e.nome); }); return a; })();
/* quantas das dores da pessoa o exercício NÃO respeita (só conta a dor que tem opção segura disponível no local) */
function unsafeFor(def,pf){ const can=AVAIL[pf.local||"completa"]||AVAIL.completa;
  const lists=(pf.dores||[]).map(d=>def[d]&&def[d].filter(x=>can.has(x))).filter(l=>l&&l.length);
  return n=>lists.filter(l=>!l.includes(n)).length; }
function pickOpts(def,pf){
  const loc=pf.local||"completa"; let opts=(def.o[loc]||def.o.completa).slice(); const can=AVAIL[loc]||AVAIL.completa;
  (pf.dores||[]).forEach(d=>{ if(def[d]){ const safe=def[d].filter(x=>can.has(x)); opts=safe.concat(opts.filter(x=>!safe.includes(x))); } });
  /* com mais de uma dor: primeiro o que é seguro para todas, depois para a maioria */
  const uns=unsafeFor(def,pf); opts=opts.map((o,i)=>[o,i]).sort((a,b)=>uns(a[0])-uns(b[0])||a[1]-b[1]).map(x=>x[0]);
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
  /* treino de 30 min: descanso de 3 min nos principais deixa músculo sem treino; 2 min ainda está na faixa recomendada (2–3 min) */
  const curto=def.k==="C"&&P.rest>120&&(Number(pf.tempo)||60)<=30; why=why||[];
  if(curto) why=why.concat([{t:"Treino curto: 2 min de descanso nos exercícios principais (ainda dentro dos 2–3 min recomendados) para caber o corpo todo.",ev:"descanso"}]);
  /* iniciante: nada abaixo de 6 reps nos principais (ACSM: 8–12 RM no começo); a carga alta vem depois de aprender o movimento */
  const leve=beginner(pf)&&def.k==="C"&&P.lo<6;
  if(leve) why=why.concat([{t:"Começando: 6–10 repetições nos exercícios principais enquanto aprende o movimento; as cargas altas (4–6 reps) vêm depois de 6 meses.",ev:"faixa-reps"}]);
  return {p,k:def.k,m:def.m,sets,lo:leve?6:P.lo,hi:leve?10:P.hi,rpe,rest:curto?120:P.rest,low:!!def.low,how:def.how||"",why}; }

function buildPlan(pf){
  const why=[], add=(t,ev)=>why.push({t,ev});
  const want=(pf.dias||[]).length||3, lift=liftDays(pf), sk=splitFor(pf,lift), sp=SPLITS[sk];
  const G=GOALS[pf.objetivo]||GOALS.misto, G2=pf.secundario?GOALS[pf.secundario]:null, lv=nivel(pf), skills=(pf.habilidades||[]).filter(h=>HAB[h]);
  /* 1. recuperação: a ficha avisa, mas não corta o volume (a pessoa escolhe a preferência de volume) */
  const rf=1, rr=[];
  if(pf.sono&&pf.sono<6.5) rr.push(`sono de ${fmt(pf.sono)} h`); if(pf.estresse>=4) rr.push("estresse alto");
  if(rr.length) add(`Atenção à recuperação (${rr.join(", ")}): o volume não foi reduzido. Se as cargas começarem a cair, use o Treino leve ou escolha volume menor no Perfil.`,"recuperacao");
  const volPos={menor:-0.15,padrao:0,alto:0.25}[pf.volume||"padrao"]||0;
  /* 2. prioridades efetivas: as escolhidas + as que vêm das habilidades e do esporte */
  const prio=new Map(); (pf.prioridades||[]).forEach(m=>prio.set(m,"você marcou como prioridade"));
  skills.forEach(h=>(HAB[h].prioridades||[]).forEach(m=>{ if(!prio.has(m)) prio.set(m,"habilidade: "+HAB[h].nome.toLowerCase()); }));
  if(skills.includes("esporte")) (pf.esportes||[]).forEach(s=>((DATA.esportes.enfase||{})[s.mod]||[]).forEach(m=>{ if(!prio.has(m)) prio.set(m,"exigido pelo seu esporte ("+s.mod.toLowerCase()+")"); }));
  /* esportes: carga nas pernas/tronco e cardio */
  const esp=pf.esportes||[]; let legW=0, upW=0, aerN=0;
  esp.forEach(x=>{ const S=SPORTS[x.mod]||SPORTS.Outro, k=INT[x.int]||0.6, n=(x.dias||[]).length; legW+=S.leg*k*n; upW+=S.up*k*n; if(S.aer&&k>=0.6) aerN+=n; });
  const PERF=DATA.esportes.perfis||{}; const espAtivos=esp.filter(x=>(INT[x.int]||0.6)>=0.6&&PERF[x.mod]);
  const pernasPesado=espAtivos.some(x=>PERF[x.mod].pernasPesado), espPot=espAtivos.find(x=>PERF[x.mod].potencia)&&!skills.includes("potencia");
  const recom=new Map(); espAtivos.forEach(x=>(PERF[x.mod].recomendados||[]).forEach(n=>{ if(!recom.has(n)) recom.set(n,x.mod); }));
  espAtivos.forEach(x=>add(`${x.mod}: ${PERF[x.mod].resumo}`,PERF[x.mod].ev[0]));
  /* metas semanais por músculo */
  const range=beginner(pf)?G.volIni:G.vol, pos=Math.max(0,Math.min(1,[0.3,0.45,0.6][lv]+volPos)), target={}, tWhy={};
  MUSCLES.forEach(m=>{ let t=range[0]+(range[1]-range[0])*pos, w=[];
    if(SMALL.has(m)&&!prio.has(m)){ t=Math.max(3,range[0]*0.6); w.push("músculo pequeno, já trabalhado nos exercícios grandes"); }
    if(prio.has(m)){ t=Math.min(range[1]+2,t*1.3); w.push(prio.get(m)); }
    if(legW>=1.8&&["pernas","posterior","glúteos","adutores","panturrilha"].includes(m)&&!prio.has(m)){ t*=0.8; w.push("seu esporte já cansa as pernas"); }
    if(upW>=1.8&&m==="braços"){ t*=0.8; w.push("seu esporte já exige a pegada e os braços"); }
    target[m]=Math.max(2,Math.round(t)); tWhy[m]=w; });
  add(`Meta de séries por músculo na semana: ${range[0]}–${range[1]} para o seu objetivo (${G.nome.toLowerCase()}) e nível; você começa perto de ${Math.round(range[0]+(range[1]-range[0])*pos)}${volPos>0?" (você prefere volume alto)":volPos<0?" (você prefere volume menor)":""}.`,"volume");
  /* 3. divisão e frequência */
  const tms=[...Array(lift).keys()].map(i=>T[sp.t[i%sp.t.length]]);
  add(`${lift} dias de musculação → ${sp.nome}. ${sp.por}`,"frequencia");
  const freq={}; MUSCLES.forEach(m=>freq[m]=0); tms.forEach(t=>new Set(t.s.map(s=>LIB[s.p].m)).forEach(m=>freq[m]++));
  /* 4. distribuição: compostos primeiro (contam fração para os auxiliares), depois acessórios até completar a meta, dentro do tempo */
  const cap=(lv===0?6:8)+(volPos>0?2:0), maxSets=lv===0?3:4, minutes=(Number(pf.tempo)||60)-5;
  const days=tms.map((tm,di)=>({key:"d"+(di+1),n:tm.n,ex:[],tm,tk:sp.t[di%sp.t.length]}));
  const got={}; MUSCLES.forEach(m=>got[m]=0);
  /* "braços" é um grupo só, mas bíceps e tríceps são contados à parte: puxadas ajudam o bíceps, empurrões o tríceps; cada um tem metade da meta */
  const ARM={bi:0,tri:0}, armKey=p=>["biceps","hpull","vpull"].includes(p)?"bi":["triceps","hpush","incline","vpush","chest"].includes(p)?"tri":null;
  const credit=(p,s)=>{ got[LIB[p].m]+=s; Object.entries(LIB[p].sec||{}).forEach(([m,w])=>got[m]+=s*w);
    const k=armKey(p); if(k) ARM[k]+=LIB[p].m==="braços"?s:s*((LIB[p].sec||{})["braços"]||0); };
  const perSession=m=>Math.min(cap+(prio.has(m)?2:0),Math.ceil(target[m]/Math.max(1,freq[m])));
  /* blocos de habilidade (vão para o início do treino) */
  const blocks=[]; skills.forEach(h=>{ const b=HAB[h].bloco; if(b) blocks.push({h,...b}); });
  if(espPot) blocks.push({h:"potencia",padrao:"power",vezes:1,esp:espPot.mod});
  const used={}; /* exercícios já usados na semana, para variar */
  days.forEach(d=>{ const slots=d.tm.s.map((s,i)=>({...s,i,def:LIB[s.p]})); let t=0;
    const sess={}; const fit=e=>t+exMinutes(e)<=minutes;
    /* blocos de habilidade: no máximo 1 por treino, nos primeiros treinos compatíveis */
    for(const b of blocks){ if(b.feitos>=b.vezes) continue; const ok=b.padrao==="vpull"?slots.some(s=>s.p==="vpull"||s.p==="hpull"):true; if(!ok) continue;
      const e=makeEx(b.padrao,3,pf,G,[b.esp?{t:`Saltos 1× por semana: melhoram sprint e impulsão em quem joga ${b.esp.toLowerCase()}.`,ev:"coletivos-sprint"}:{t:`Habilidade: ${HAB[b.h].nome.toLowerCase()}. ${HAB[b.h].porque}`,ev:HAB[b.h].ev}]); e.skill=b.h; e.pref=b.preferir&&b.preferir[String(lv)];
      if(b.padrao==="vpull"){ e.k="C"; } if(fit(e)){ d.ex.push(e); t+=exMinutes(e); b.feitos=(b.feitos||0)+1; credit(e.p,e.sets); sess[e.m]=(sess[e.m]||0)+e.sets; break; } }
    const comp=slots.filter(s=>s.def.k==="C"&&!(s.p==="vpull"&&d.ex.some(e=>e.skill==="barra")));
    const left=m=>target[m]-got[m];
    const leftOf=s=>s.def.m==="braços"&&armKey(s.p)?target["braços"]/2-ARM[armKey(s.p)]:left(s.def.m);
    const accFor=s=>{ const m=s.def.m, rest=Math.min(perSession(m)-(sess[m]||0)+(m==="braços"?2:0), Math.ceil(leftOf(s)/Math.max(1,freq[m]-0.5)));
      if(rest<2&&!prio.has(m)) return null; const sets=Math.min(maxSets,Math.max(2,rest));
      const e=makeEx(s.p,sets,pf,G,[{t:`${m[0].toUpperCase()+m.slice(1)}: ${prio.has(m)?prio.get(m)+"; ":""}faltavam ${Math.max(0,Math.round(leftOf(s)))} séries para a meta da semana (${target[m]}).`,ev:"volume"}]); e.o=s.o; e.i=s.i; return e; };
    const put=e=>{ if(!fit(e)){ e.sets=2; e.rpe=e.rpe.slice(0,2); if(!fit(e)) return false; } d.ex.push(e); t+=exMinutes(e); credit(e.p,e.sets); sess[e.m]=(sess[e.m]||0)+e.sets; return true; };
    /* A. compostos com 2 séries garantidas (o resto é completado depois) */
    const planned=new Map();
    /* a cada passo entra o composto do músculo mais longe da meta da semana (no empate, a ordem do modelo): em treino curto, nenhum músculo grande fica de fora */
    const fila=comp.slice(), falta=s=>got[s.def.m]/Math.max(1,target[s.def.m]);
    while(fila.length){ fila.sort((a,b)=>falta(a)-falta(b)||a.i-b.i); const s=fila.shift(); const m=s.def.m, need=perSession(m)-(sess[m]||0); if(need<2) continue;
      const sets=Math.min(maxSets,Math.max(2,Math.min(need,G.C.sets+(lv===2?1:0))));
      const e=makeEx(s.p,2,pf,G,[{t:`${m[0].toUpperCase()+m.slice(1)}: meta de ${target[m]} séries/semana em ${freq[m]} treino${freq[m]>1?"s":""} → ~${perSession(m)} hoje.`,ev:"volume-sessao"}]); e.o=s.o; e.i=s.i;
      if(pernasPesado&&LIB[s.p].low&&!beginner(pf)){ e.lo=4; e.hi=6; e.rest=(Number(pf.tempo)||60)<=30?120:180; e.why.push({t:"Carga alta (4–6 reps) nas pernas: é o que mais melhora a economia na corrida e no ciclismo.",ev:"corrida-forca"}); }
      if(put(e)) planned.set(e,sets); }
    const acc=slots.filter(s=>s.def.k!=="C");
    acc.sort((a,b)=>(leftOf(b)/target[b.def.m]-leftOf(a)/target[a.def.m])||a.i-b.i);
    /* B. acessórios das prioridades */
    for(const s of acc.filter(s=>prio.has(s.def.m))){ const e=accFor(s); if(e) put(e); }
    /* C. completa as séries dos compostos: primeiro até 3, para sobrar tempo aos acessórios dos músculos que ainda não treinaram */
    const grow=lim=>{ for(const [e,sets] of planned){ while(e.sets<Math.min(sets,lim)){ const add1={...e,sets:e.sets+1}; if(t-exMinutes(e)+exMinutes(add1)>minutes) break; t+=exMinutes(add1)-exMinutes(e); credit(e.p,1); sess[e.m]+=1; e.sets++; e.rpe=makeEx(e.p,e.sets,pf,G).rpe; } } };
    grow(3);
    /* D. demais acessórios: maior falta primeiro; músculos pequenos (panturrilha, abdômen, adutores) só depois dos compostos completos */
    for(const s of acc.filter(s=>!prio.has(s.def.m)&&!SMALL.has(s.def.m))){ const e=accFor(s); if(e) put(e); }
    grow(Infinity);
    for(const s of acc.filter(s=>!prio.has(s.def.m)&&SMALL.has(s.def.m))){ const e=accFor(s); if(e) put(e); }
    /* E. treino curto demais (comum nas divisões ABC/ABCDE): completa com os exercícios do modelo que ficaram de fora, até o teto da faixa de volume */
    for(const s of acc.concat(comp)){ if(t>=minutes*0.75) break; if(d.ex.some(e=>e.i===s.i&&e.p===s.p)) continue; const m=s.def.m, room=range[1]*(1+volPos)*(prio.has(m)?1.15:1)*(d.ex.length<4?1.4:1)-got[m]; if(room<2) continue;
      const e=makeEx(s.p,Math.min(3,maxSets),pf,G,[{t:`${m[0].toUpperCase()+m.slice(1)}: sobrava tempo no treino, então entram mais ${Math.min(3,maxSets)} séries (ainda dentro da faixa de ${range[0]}–${range[1]} séries por semana).`,ev:"volume"}]); e.o=s.o; e.i=s.i; put(e); }
    /* ordem: habilidade, compostos, acessórios na ordem do modelo */
    const ord=e=>e.skill?-1:e.k==="C"?0:1; d.ex.sort((a,b)=>ord(a)-ord(b)||(a.i||0)-(b.i||0));
    d.min=Math.round(t+5); delete d.tm; });
  /* prevenção por esporte: exercício específico 1× por semana (2 séries), num dia da região certa */
  const prev=[]; espAtivos.forEach(x=>(PERF[x.mod].prevencao||[]).forEach(p=>{ if(!prev.some(q=>q.nome===p.nome)) prev.push({...p,esp:x.mod}); }));
  prev.forEach(p=>{ const low=LOWER.has(p.padrao); let cand=days.filter(d=>low?regionOf(d).L>0.4:regionOf(d).U>0.4); if(!cand.length) cand=days.slice(); cand.sort((a,b)=>a.min-b.min);
    for(const d of cand){ if(d.ex.some(e=>e.prevNome===p.nome)) break;
      /* o dia já tem um exercício do mesmo padrão: ele vira a prevenção (sem repetir o exercício) */
      const same=d.ex.find(x=>x.p===p.padrao&&!x.prevNome); if(same){ same.prevNome=p.nome; same.prevAlt=p.alt||[]; same.why.push({t:`Prevenção para ${p.esp.toLowerCase()}: ${p.motivo}.`,ev:p.ev}); break; }
      const e=makeEx(p.padrao,2,pf,G,[{t:`Prevenção para ${p.esp.toLowerCase()}: ${p.motivo}.`,ev:p.ev}]); e.prevNome=p.nome; e.prevAlt=p.alt||[];
      /* sem espaço: tira séries do maior acessório do dia (até 2) para caber a prevenção */
      for(let k=0;k<2&&d.min-5+exMinutes(e)>minutes;k++){ const big=d.ex.filter(x=>x.k==="A"&&!x.prevNome&&x.sets>=3).sort((a,b)=>b.sets-a.sets)[0]; if(!big) break; const before=exMinutes(big); big.sets--; big.rpe=big.rpe.slice(0,big.sets); d.min=Math.round(d.min-before+exMinutes(big)); credit(big.p,-1); }
      if(d.min-5+exMinutes(e)<=minutes){ d.ex.push(e); d.min=Math.round(d.min+exMinutes(e)); credit(p.padrao,2); break; } } });
  /* passe final: músculo que ficou abaixo da metade da meta ganha 2 séries onde ainda couber no tempo */
  MUSCLES.forEach(m=>{ if(got[m]>=target[m]*0.5) return;
    for(const d of days){ const tm=T[sp.t[days.indexOf(d)%sp.t.length]]; const s=tm.s.find(x=>LIB[x.p].m===m&&LIB[x.p].k!=="C"&&!d.ex.some(e=>e.p===x.p)); if(!s) continue;
      const e=makeEx(s.p,2,pf,G,[{t:`${m[0].toUpperCase()+m.slice(1)}: estava abaixo da metade da meta da semana; 2 séries para não ficar sem estímulo.`,ev:"volume"}]); e.o=s.o;
      if(d.min-5+exMinutes(e)<=minutes){ d.ex.push(e); d.min=Math.round(d.min+exMinutes(e)); credit(s.p,2); if(got[m]>=target[m]*0.5) break; } } });
  /* hipertrofia: pelo menos 2 séries diretas de bíceps e de tríceps na semana (os compostos contam meia série; o trabalho direto completa).
     Só em dia de tronco ou corpo inteiro: no dia de pernas, o braço tiraria tempo de músculo grande. */
  if(["hipertrofia","misto"].includes(pf.objetivo)) ["biceps","triceps"].forEach(p=>{ if(days.some(d=>d.ex.some(e=>e.p===p))) return;
    const order=days.map((d,i)=>({d,has:T[sp.t[i%sp.t.length]].s.some(x=>x.p===p)})).filter(x=>regionOf(x.d).L<0.5).sort((a,b)=>(b.has-a.has)||(a.d.min-b.d.min));
    for(const {d} of order){ const e=makeEx(p,2,pf,G,[{t:`${p==="biceps"?"Bíceps":"Tríceps"}: 2 séries diretas na semana. Os compostos já trabalham o braço (contam meia série), e o trabalho direto completa para quem busca hipertrofia.`,ev:"volume"}]);
      for(let k=0;k<2&&d.min-5+exMinutes(e)>minutes;k++){ const big=d.ex.filter(x=>x.k==="A"&&!x.prevNome&&x.sets>=3).sort((a,b)=>b.sets-a.sets)[0]; if(!big) break; const before=exMinutes(big); big.sets--; big.rpe=big.rpe.slice(0,big.sets); d.min=Math.round(d.min-before+exMinutes(big)); credit(big.p,-1); }
      if(d.min-5+exMinutes(e)<=minutes){ d.ex.push(e); d.min=Math.round(d.min+exMinutes(e)); credit(p,2); break; } } });
  /* 5. escolha de cada exercício: local, dores e "evitar" (pickOpts), nível técnico e variação na semana */
  const W=[2.5,1,0][lv]; const habCore=skills.includes("costas")?HAB.costas.core:null;
  /* id = dia + padrão de movimento (+ nº se o padrão se repete no dia), nunca a posição: assim uma atualização do motor que muda a ordem
     ou o número de exercícios não leva o rascunho nem a troca de um exercício para outro */
  days.forEach(d=>{ const dayUsed=new Set(), nP={}; d.ex.forEach((e,i)=>{ nP[e.p]=(nP[e.p]||0)+1; e.id=d.key+"_"+e.p+(nP[e.p]>1?nP[e.p]:""); const def=LIB[e.p]; let opts=pickOpts(def,pf); const uns=unsafeFor(def,pf);
    const rot=(e.o||0)%opts.length; opts=opts.slice(rot).concat(opts.slice(0,rot));
    /* dor vem antes de tudo: variação, prevenção e nível nunca trocam um exercício seguro por um que não é */
    const score=(n,ix)=>uns(n)*1000+(e.prevNome?(n===e.prevNome?-100:e.prevAlt.includes(n)?-90+e.prevAlt.indexOf(n):0):0)-(recom.has(n)?6:0)+ix+(Math.max(0,complexity(n)-1))*W+((used[e.p]||[]).includes(n)?4:0)+(dayUsed.has(n)?60:0)-(e.pref&&e.pref.includes(n)?20-e.pref.indexOf(n):0)-(habCore&&e.p==="core"&&habCore.includes(n)?10:0);
    let best=0; opts.forEach((n,ix)=>{ if(score(n,ix)<score(opts[best],best)) best=ix; });
    const pick=opts[best]; e.opts=[pick].concat(opts.filter(x=>x!==pick));
    if(recom.has(pick)&&!e.prevNome) e.why.push({t:`${pick}: recomendado para quem faz ${recom.get(pick).toLowerCase()}.`,ev:(PERF[recom.get(pick)].ev||[])[0]});
    else if(e.pref&&e.pref.includes(pick)) e.why.push({t:`${pick}: a progressão certa para o seu nível.`,ev:"progressao"});
    else if(habCore&&e.p==="core"&&habCore.includes(pick)) e.why.push({t:`${pick}: estabiliza a coluna sem flexioná-la (habilidade: proteger as costas).`,ev:"volume"});
    else if(best>0&&lv===0&&complexity(pick)<complexity(opts[0]===pick?opts[1]||pick:opts[0])) e.why.push({t:`${pick}: mais estável e fácil de aprender que ${opts.find(x=>x!==pick)}; quando dominar, troque no menu.`,ev:"selecao"});
    else if((used[e.p]||[]).length&&!used[e.p].includes(pick)) e.why.push({t:`${pick}: variação diferente do outro treino da semana.`,ev:"variacao"});
    if(dayUsed.has(pick)) e.dup=true;
    (used[e.p]=used[e.p]||[]).push(pick); dayUsed.add(pick); delete e.pref; delete e.o; delete e.i; delete e.prevAlt; });
    /* a única opção segura para a dor já está no treino: sai o exercício repetido (melhor que trocar por um inseguro) */
    if(d.ex.some(e=>e.dup)){ d.ex.filter(e=>e.dup).forEach(e=>credit(e.p,-e.sets)); d.ex=d.ex.filter(e=>!e.dup); d.min=Math.round(d.ex.reduce((a,e)=>a+exMinutes(e),0)+5); } });
  /* treinado (mais de 1 ano): dia de FORÇA (treinos "A": compostos 4–6 reps, 3 min) e dia de HIPERTROFIA (treinos "B": 8–12 reps).
     Variar dentro da semana rende mais força em quem já treina (Moesgaard 2022). Acessórios não mudam. */
  if(lv===2&&["hipertrofia","misto"].includes(pf.objetivo)&&pf.ondulacao!=="nao"){
    const FORCA=new Set(["UA","LA","PA","PuA","LgA","FA"]), HIPER=new Set(["UB","LB","PB","PuB","LgB","FC"]); let mudou=0;
    days.forEach(d=>{ const f=FORCA.has(d.tk), hp=HIPER.has(d.tk); if(!f&&!hp) return;
      d.ex.filter(e=>e.k==="C"&&!e.skill&&!e.prevNome).forEach(e=>{ Object.assign(e,f?{lo:4,hi:6,rest:180}:{lo:8,hi:12,rest:120}); e.rpe=e.rpe.map((r,i)=>f?[8,8,8.5,8.5][i]||8.5:[8,8.5,9,9][i]||9);
        e.why.push({t:f?"Dia de força: carga alta (4–6 reps) e 3 min de descanso nos principais.":"Dia de hipertrofia: 8–12 reps nos principais.",ev:"periodizacao"}); mudou++; });
      /* descanso do dia de força: 3 min se couber; senão 2,5; senão 2 (o original, que sempre coube) */
      const tot=()=>d.ex.reduce((a,e)=>a+exMinutes(e),0)+5, fortes=d.ex.filter(e=>e.rest===180); let m=tot();
      for(const r of [150,120]){ if(!f||m<=(Number(pf.tempo)||60)) break; fortes.forEach(e=>e.rest=r); m=tot(); }
      d.min=Math.round(m); d.n=d.n+(f?" · Força":" · Hipertrofia"); });
    if(mudou) add("Você treina há mais de 1 ano: os treinos A são de força (4–6 reps nos principais) e os B de hipertrofia (8–12). Variar dentro da semana rende mais força em quem já treina.","periodizacao"); }
  /* treino curto (até 45 min): acessórios opostos em bi-set (1 série de cada, descanso depois do par). Mesmo volume, menos tempo */
  if((Number(pf.tempo)||60)<=45){ const PARES=[["biceps","triceps"],["lateral","rear"],["quad","ham"],["glute","adductor"],["calves","core"]];
    days.forEach(d=>{ let poupou=0; PARES.forEach(([a,b])=>{ const x=d.ex.find(e=>e.p===a&&e.k==="A"&&!e.bs), y=d.ex.find(e=>e.p===b&&e.k==="A"&&!e.bs); if(!x||!y) return;
        x.bs="a"; y.bs="b"; x.par=y.id; y.par=x.id; d.ex.splice(d.ex.indexOf(y),1); d.ex.splice(d.ex.indexOf(x)+1,0,y);
        poupou+=Math.min(x.sets,y.sets)*Math.min(x.rest,y.rest)/60; x.why.push({t:"Bi-set com o exercício seguinte: 1 série de cada e descanso depois do par. Mesmo volume em menos tempo.",ev:"tempo-eficiente"}); });
      if(poupou) d.min=Math.max(10,Math.round(d.min-poupou)); }); }
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
  const semTreino=["peito","costas","pernas","posterior","ombros"].filter(m=>!freq[m]);
  if(semTreino.length) notes.push(`Com ${lift} dias, a divisão "${sp.nome}" deixa ${semTreino.join(", ")} sem treino na semana. Escolha "Automático" ou marque mais dias.`);
  if(arr.pen>=2) notes.push("Com os dias de musculação e de esporte que você marcou, algum treino de pernas ficou perto de uma atividade forte. Se puder, deixe 1 dia entre eles.");
  add(`A cada ${CICLO} semanas, 1 semana leve (deload): metade das séries e esforço 6, nos mesmos dias. Serve para controlar o cansaço; parar de vez atrasaria a força.`,"deload");
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
/* séries de trabalho de uma sessão: as da carga mais pesada; mas UMA série mais pesada no fim, depois de 2+ séries com a mesma carga,
   que não superou a força estimada das outras (falhou), é tentativa e não vira base. Se superou, é a carga nova.
   Mais leves antes = aquecimento; mais leves depois = back-off: nenhuma entra na progressão. */
function workSets(sets){ const kgs=sets.map(s=>s.kg||0), mx=Math.max(...kgs), top=sets.filter(s=>(s.kg||0)===mx);
  if(top.length===1&&sets.length>=3&&sets[sets.length-1]===top[0]){ const cnt={}; kgs.slice(0,-1).forEach(k=>cnt[k]=(cnt[k]||0)+1);
    const mode=Object.keys(cnt).map(Number).filter(k=>cnt[k]>=2).sort((a,b)=>cnt[b]-cnt[a]||b-a)[0];
    if(mode!=null){ const rest=sets.filter(s=>(s.kg||0)===mode); if(e1rm(top[0].kg||0,top[0].reps||0,top[0].rpe)<=Math.max(...rest.map(x=>e1rm(x.kg||0,x.reps||0,x.rpe)))) return rest; } }
  return top; }
/* ---------- ciclo de 7 semanas: 6 normais + 1 semana leve (deload: metade das séries, RPE 6, mesmos dias) ---------- */
const CICLO=7;
function cicloSemana(pf,iso){ if(!pf||!pf.inicio) return {semana:0,deload:false,falta:CICLO};
  const w=Math.floor((new Date(iso+"T12:00:00")-new Date(pf.inicio+"T12:00:00"))/(7*864e5))+1, r=w%CICLO;
  return {semana:w,deload:w>=CICLO&&r===0,falta:r===0?0:CICLO-r}; }
/* ---------- progressão de carga (testada em tests/progressao.test.mjs) ----------
   h = histórico do exercício, do mais novo para o mais antigo, sem treinos leves: [{date, sets:[{kg,reps,rpe?}]}].
   Ordem das regras: 1ª vez → técnica → regredir (2 treinos abaixo do mínimo) → RPE longe do alvo → topo da faixa → estagnação → +1 rep. */
function incOf(ex,name){ if(/halter/i.test(name)) return 2; if(ex.k==="C") return ex.low?5:2.5; return /cabo|máquina|cadeira|mesa|peck|leg press|flexora|extensora|abdução/i.test(name)?2.5:1; }
function sugerirCarga(ex,name,h,o){ o=o||{}; const inc=o.inc!=null?o.inc:incOf(ex,name), U=ex.secs?" s":" reps", lo=ex.lo, hi=ex.hi;
  if(ex.k==="P"){ const L=h.length?Math.max(...h[0].sets.map(s=>s.kg||0)):""; return {kg:L===0?0:L,reps:lo,cls:"",regra:"potencia",html:`<span class="tag t-keep">⚡ Potência</span> Rápido, longe da falha`}; }
  if(!h.length) return {kg:ex.secs?0:"",reps:ex.secs?lo:hi,cls:"",regra:"primeira",html:ex.secs?`<span class="tag t-new">★ 1ª vez</span> Segure ${lo} s com boa postura; se for fácil, vá até ${hi} s`:`<span class="tag t-new">★ 1ª vez</span> Comece leve. Se as ${hi} reps saírem fáceis, suba na próxima série`};
  if(o.tecnica){ const L=Math.max(...h[0].sets.map(s=>s.kg||0)); return {kg:L,reps:hi,cls:"",regra:"tecnica",html:`<span class="tag t-keep">= Técnica</span> Mantenha ${fmt(L)} kg`}; }
  const last=h[0].sets, W=workSets(last), L=W[0].kg||0;
  const tm=ex.rpe.reduce((a,b)=>a+b,0)/ex.rpe.length, tLast=ex.rpe[ex.rpe.length-1];
  /* topo batido: todas as séries de trabalho no topo; back-off e aquecimento (mais leves) não contam */
  const naoLeves=last.filter(s=>(s.kg||0)>=L).length, allTop=W.length>=Math.min(ex.sets,naoLeves)&&W.every(s=>s.reps>=hi);
  const comR=W.filter(s=>s.rpe>=5&&s.rpe<=10), avg=comR.length?comR.reduce((a,s)=>a+s.rpe,0)/comR.length:null, lr=W[W.length-1].rpe;
  const best=Math.max(...W.map(s=>e1rm(s.kg||0,s.reps||0,s.rpe))), meanReps=Math.round(W.reduce((a,s)=>a+(s.reps||0),0)/W.length);
  const carga=(reps,dir)=>{ const x=best/(1+(reps+10-tm)/30)/inc; return Math.max(0,(dir<0?Math.floor(x):dir>0?Math.ceil(x):Math.round(x))*inc); };
  const clampR=r=>Math.max(lo,Math.min(hi,r));
  if(allTop&&L===0) return {kg:0,reps:ex.secs?hi+5:hi,cls:"up",regra:"corpo",html:ex.secs?`<span class="tag t-up">⬆ Evolua</span> Tente <strong>${hi+5} s</strong>, ou acrescente carga nas costas`:/elástico/i.test(name)?`<span class="tag t-up">⬆ Evolua</span> Topo da faixa: use um elástico mais forte ou encurte o elástico`:`<span class="tag t-up">⬆ Evolua</span> Peso do corpo no topo: faça mais reps, acrescente carga (mochila) ou troque por uma variação mais difícil no ⇄`};
  /* 1) regredir: 2 treinos seguidos abaixo do mínimo. Só a última série caindo, indo à falha (RPE 9,5+), não conta: foi excesso de esforço */
  const abaixo=sess=>{ const w=workSets(sess.sets), b=w.filter(x=>(x.reps||0)<lo&&!(x.rpe>0&&x.rpe<tm-0.5)); const lastFail=b.length===1&&w.length>=2&&b[0]===w[w.length-1]&&b[0].rpe>=9.5; return b.length>0&&!lastFail; };
  if(L>0&&h.length>=2&&abaixo(h[0])&&abaixo(h[1])){ const nk=Math.max(0,Math.min(L-inc,carga(lo+1,-1)));
    return {kg:nk,reps:lo+1,cls:"stall",regra:"regredir",html:`<span class="tag t-down">⬇ Reduza</span> <strong>${fmt(nk)} kg</strong> · ${lo+1}${U} (2 treinos abaixo de ${lo})`}; }
  /* 2) esforço longe do alvo: 1,5+ ponto num treino, ou 1+ ponto no mesmo sentido em 2 treinos (o erro de estimar o RPE é ~1 rep) */
  const gapOf=sess=>{ const w=workSets(sess.sets).filter(s=>s.rpe>=5&&s.rpe<=10); return w.length?w.reduce((a,s)=>a+s.rpe,0)/w.length-tm:0; };
  const gap=avg==null?0:avg-tm, pgap=h[1]?gapOf(h[1]):0;
  const sure=avg!=null&&(Math.abs(gap)>=1.5||(Math.abs(gap)>=1&&Math.abs(pgap)>=1&&Math.sign(gap)===Math.sign(pgap)));
  if(sure&&L>0){ if(gap>0){ const reps=clampR(meanReps), nk=Math.max(0,Math.min(L-inc,carga(reps,-1)));
      return {kg:nk,reps,cls:"stall",regra:"rpe-alto",html:`<span class="tag t-down">⬇ Reduza</span> <strong>${fmt(nk)} kg</strong> · ${reps}${U} (esforço ${fmt(Math.round(avg*10)/10)}, acima do alvo ${fmt(tm)})`}; }
    const reps=allTop?lo+1:clampR(meanReps); let nk=Math.max(L+inc,carga(reps,0)); nk=Math.min(nk,roundTo(L*1.1,inc)>L?roundTo(L*1.1,inc):L+inc);
    return {kg:nk,reps,cls:"up",regra:"rpe-baixo",html:`<span class="tag t-up">⬆ Suba</span> <strong>${fmt(nk)} kg</strong> · ${reps}${U} (sobraram reps: esforço ${fmt(Math.round(avg*10)/10)}, alvo ${fmt(tm)})`}; }
  /* 3) topo da faixa em todas as séries */
  if(allTop&&!(lr>tLast+0.5)){ const pct=ex.k==="C"?(ex.low?0.05:0.025):0.05; let nk=roundTo(L*(1+pct),inc); if(nk<=L) nk=L+inc;
    return {kg:nk,reps:lo,cls:"up",regra:"topo",html:`<span class="tag t-up">⬆ Suba</span> <strong>${fmt(nk)} kg</strong> · ${lo} reps`}; }
  /* 4) estagnação: 3 treinos sem subir carga nem reps */
  if(h.length>=3&&L>0){ const sc=sess=>{ const w=workSets(sess.sets); return (w[0].kg||0)*1000+w.reduce((a,s)=>a+(s.reps||0),0); };
    if(sc(h[0])<=sc(h[1])&&sc(h[1])<=sc(h[2])) return {kg:L,reps:Math.min(hi,Math.min(...W.map(s=>s.reps))+1),cls:"stall",regra:"estagnado",html:`<span class="tag t-down">⚠ Parado</span> 3 treinos sem progredir com ${fmt(L)} kg: troque a variação no ⇄, ou reduza 10% e reconstrua`}; }
  /* 5) dupla progressão: mesma carga, +1 rep */
  const b0=W.filter(x=>(x.reps||0)<lo), fail=b0.length===1&&W.length>=2&&b0[0]===W[W.length-1]&&b0[0].rpe>=9.5;
  const tr=Math.min(hi,Math.max(lo,Math.min(...W.map(s=>s.reps))+1));
  return {kg:L,reps:tr,cls:"",regra:"manter",html:`<span class="tag t-keep">= Mantenha</span> ${L?`<strong>${fmt(L)} kg</strong> · `:""}meta ${tr}${U}${fail?" · a última série foi até a falha: pare com 1–2 sobrando":""}`};
}
const sessE1=sets=>Math.max(0,...sets.map(s=>e1rm(s.kg||0,s.reps||0,s.rpe)));
const roundTo=(v,s)=>Math.round(v/s)*s;
if(typeof module!=="undefined") module.exports={cicloSemana,CICLO,sugerirCarga,incOf,workSets,complexity,HAB,buildPlan,weeklyVolume,arrangeDays,sportLoad,regionOf,pickOpts,liftDays,splitFor,autoSplit,e1rm,sessE1,LIB,EXBYNAME,SPLITS,GOALS,MUSCLES,SPORTS,LOWER,UPPER,DOWN,beginner,tecnica};
