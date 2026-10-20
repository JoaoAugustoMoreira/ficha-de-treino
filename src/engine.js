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

function buildPlan(pf){
  const want=(pf.dias||[]).length||3, lift=liftDays(pf), sk=splitFor(pf,lift), sp=SPLITS[sk];
  const G=GOALS[pf.objetivo]||GOALS.misto, G2=pf.secundario?GOALS[pf.secundario]:null;
  const maxEx=TIME_EX[pf.tempo]||6, prio=new Set(pf.prioridades||[]);
  const days=[...Array(lift).keys()].map(di=>{ const tm=T[sp.t[di%sp.t.length]];
    let slots=tm.s.map((s,si)=>({...s,si,def:LIB[s.p]}));
    const comp=slots.filter(x=>x.def.k==="C"), acc=slots.filter(x=>x.def.k!=="C");
    acc.sort((a,b)=>(prio.has(b.def.m)?1:0)-(prio.has(a.def.m)?1:0)||a.si-b.si);
    slots=comp.slice(0,Math.max(2,maxEx-2)).concat(acc).concat(comp.slice(Math.max(2,maxEx-2))).slice(0,maxEx);
    const key="d"+(di+1);
    const ex=slots.map((x,i)=>{ const P=x.def.k==="C"?G.C:G.A; const opts=pickOpts(x.def,pf);
      const rot=x.o%opts.length; const ord=opts.slice(rot).concat(opts.slice(0,rot));
      let sets=P.sets+(prio.has(x.def.m)?1:0); if(maxEx<=4&&x.def.k!=="C") sets=Math.min(sets,2); sets=Math.min(sets,4);
      let rpe=P.rpe.slice(0,1); while(rpe.length<sets) rpe.push(P.rpe[Math.min(rpe.length,P.rpe.length-1)]);
      if(beginner(pf)) rpe=rpe.map(r=>Math.min(r,8)); if(tecnica(pf)) rpe=rpe.map((r,i)=>i?7:6.5);
      return {id:key+"x"+i,p:x.p,k:x.def.k,m:x.def.m,opts:ord,sets,lo:P.lo,hi:P.hi,rpe,rest:P.rest,low:!!x.def.low,how:x.def.how||""}; });
    return {key,n:tm.n,ex};
  });
  const dows=(pf.dias||[1,3,5]).map(Number).sort((a,b)=>((a+6)%7)-((b+6)%7));
  const arr=arrangeDays(days,dows,pf); const ordered=arr.order.map(i=>days[i]);
  ordered.forEach((d,i)=>{ d.dow=dows[i]!=null?[dows[i]]:[]; }); days.sort((a,b)=>ordered.indexOf(a)-ordered.indexOf(b));
  /* esportes que cansam as pernas ou o tronco tiram 1 série dos acessórios daquela região (mínimo 2) */
  const esp=pf.esportes||[]; let legW=0, upW=0, aerN=0;
  esp.forEach(x=>{ const S=SPORTS[x.mod]||SPORTS.Outro, k=INT[x.int]||0.6, n=(x.dias||[]).length; legW+=S.leg*k*n; upW+=S.up*k*n; if(S.aer&&k>=0.6) aerN+=n; });
  const cutReg=(set)=>days.forEach(d=>d.ex.forEach(e=>{ if(e.k!=="C"&&set.has(e.p)&&e.sets>2){ e.sets--; e.rpe=e.rpe.slice(0,e.sets); } }));
  const espNotes=[];
  if(legW>=1.8){ cutReg(new Set(["quad","ham","glute","adductor","calves"])); espNotes.push("Suas atividades já cansam bastante as pernas: os acessórios de perna têm 1 série a menos."); }
  if(upW>=1.8){ cutReg(new Set(["biceps","triceps"])); espNotes.push("Suas atividades já exigem muito do tronco e da pegada: bíceps e tríceps têm 1 série a menos."); }
  days.forEach(d=>{ const t=d.dow.length?sportsOn(pf,d.dow[0]):[]; const r=regionOf(d); const ld=d.dow.length?sportLoad(pf,d.dow[0]):{leg:0}; const nd=d.dow.length?sportLoad(pf,(d.dow[0]+1)%7):{leg:0};
    d.sport=t.map(x=>`${x.mod} (${x.int})`); d.warn=r.L>0.5&&ld.leg>=0.6?"Perna no mesmo dia de uma atividade forte de pernas: faça a musculação antes e não vá até o limite.":r.L>0.5&&nd.leg>=0.6?"Amanhã tem atividade forte de pernas: pare 1–2 reps antes do RPE indicado.":""; });
  const extra=dows.slice(days.length);
  const cardioBase=pf.cardio==="nao"?0:Math.max(G.cardio,G2?Math.min(G2.cardio,2):0); const cardioN=Math.max(0,cardioBase-aerN);
  if(aerN&&cardioBase) espNotes.push(aerN>=cardioBase?`Suas atividades (${aerN}×/semana) já cobrem o cardio do seu objetivo: cardio extra é opcional.`:`Suas atividades contam como ${aerN} sessão(ões) de cardio; faltam ${cardioN} por semana.`);
  const cardio={n:cardioN,mods:(pf.cardioMods&&pf.cardioMods.length?pf.cardioMods:["Bike"]),dias:extra,
    z2min:pf.objetivo==="saude"||pf.objetivo==="emagrecimento"?"30–45":"20–30",hiit:(["saude","misto","emagrecimento"].includes(pf.objetivo)||pf.secundario==="saude")&&weeksIn(pf)>=4};
  const target=beginner(pf)?G.volIni:G.vol;
  /* equilíbrio de volume: músculo muito acima da meta perde séries nos acessórios dele (mínimo 2), começando pelo último exercício do treino */
  for(let guard=0;guard<40;guard++){ const vv=weeklyVolume(days).v; const over=MUSCLES.filter(m=>!prio.has(m)&&vv[m]>target[1]+1); if(!over.length) break;
    let cut=false; for(const m of over){ for(const d of days.slice().reverse()){ const e=d.ex.slice().reverse().find(x=>x.k!=="C"&&x.m===m&&x.sets>2); if(e){ e.sets--; e.rpe=e.rpe.slice(0,e.sets); cut=true; break; } } }
    if(!cut) break; }
  const vol=weeklyVolume(days);
  const notes=[];
  if(want>lift) notes.push(`Você marcou ${want} dias. Para quem está começando, ${lift} dias de musculação dão o melhor resultado; ${extra.length?`os dias extras (${extra.map(d=>DOWN[d]).join(", ")}) ficam para cardio`:"os outros dias ficam livres ou para cardio"}.`);
  if(!sp.dias.includes(lift)) notes.push(`A divisão "${sp.nome}" foi pensada para ${sp.dias.join(" ou ")} dias; com ${lift} dias alguns grupos treinam com frequência desigual. Veja o volume semanal na aba Perfil.`);
  espNotes.forEach(n=>notes.push(n)); if(arr.pen>=2) notes.push("Com os dias de musculação e de esporte que você marcou, algum treino de pernas ficou perto de uma atividade forte. Se puder, deixe 1 dia entre eles.");
  if(tecnica(pf)) notes.push("Semanas 1 e 2: fase de técnica. Use cargas em que sobram 3–4 repetições (RPE 6–7) e foque em aprender o movimento.");
  return {sk,split:sp.nome,por:sp.por,goal:G.nome,goal2:G2?G2.nome:null,days,cardio,notes,lift,vol,target};
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
if(typeof module!=="undefined") module.exports={buildPlan,weeklyVolume,arrangeDays,sportLoad,regionOf,pickOpts,liftDays,splitFor,autoSplit,e1rm,sessE1,LIB,EXBYNAME,SPLITS,GOALS,MUSCLES,SPORTS,LOWER,UPPER,DOWN,beginner,tecnica};
