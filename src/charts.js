/* Kora — desempenho: mapa muscular (desenho próprio), treinos por semana, dias de treino, volume semanal e equilíbrio muscular.
   Uma cor só (verde-oliva) em escala de intensidade; texto sempre em tinta neutra; toque/hover em cada marca mostra o valor. */

const MUS_LBL={pernas:"Quadríceps",posterior:"Posterior",glúteos:"Glúteos",adutores:"Adutores",peito:"Peito",costas:"Costas",ombros:"Ombros",braços:"Braços",panturrilha:"Panturrilha",abdômen:"Abdômen"};
const MUS_SHORT={pernas:"Quad.",posterior:"Post.",glúteos:"Glút.",adutores:"Adut.",peito:"Peito",costas:"Costas",ombros:"Ombros",braços:"Braços",panturrilha:"Pant.",abdômen:"Abd."};

/* músculo principal e auxiliares de um exercício salvo (pelo nome) */
function musOf(name){ const e=EXBYNAME[name]; const p=e&&LIB[e.padrao]; return p?{m:p.m,sec:p.sec||{}}:null; }
/* séries por músculo (contagem fracionada: auxiliares contam a fração do padrão) */
function setsByMuscle(sessions){ const v={}; MUSCLES.forEach(m=>v[m]=0);
  sessions.forEach(s=>Object.entries(s.ex||{}).forEach(([n,sets])=>{ const mm=musOf(n); if(!mm) return; const k=sets.length; v[mm.m]+=k; Object.entries(mm.sec).forEach(([m,w])=>{ if(m in v) v[m]+=k*w; }); }));
  return v; }
const r1=x=>Math.round(x*10)/10;
function isoDaysAgo(n){ const d=new Date(Date.now()-n*864e5); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function lastWeeks(n){ const out=[]; let w=weekStart(todayISO()); for(let i=0;i<n;i++){ out.unshift(w); const d=new Date(w+"T12:00:00"); d.setDate(d.getDate()-7); w=d.toISOString().slice(0,10); } return out; }
const lifted=s=>s.ex&&Object.keys(s.ex).length>0;
function tonnage(s){ return Object.values(s.ex||{}).reduce((t,sets)=>t+sets.reduce((u,x)=>u+(x.kg||0)*(x.reps||0),0),0); }
const kfmt=v=>v>=1000?fmt(Math.round(v/100)/10)+" t":fmt(Math.round(v))+" kg";

/* ---------- mapa muscular: contornos anatômicos (src/corpo.js), frente e costas ----------
   Cada contorno pertence a um dos 10 grupos do app; os sem grupo (cabeça, mãos, joelhos, pés) ficam em tom neutro. */
const BODY_VB={front:"0 0 724 1448",back:"724 0 724 1448"};
/* físico de fisiculturista: cada músculo é engrossado a partir do próprio centro (largura, altura) */
const BULK={deltoids:[1.2,1.06],chest:[1.1,1.07],biceps:[1.34,1.05],triceps:[1.32,1.05],forearm:[1.26,1.03],trapezius:[1.15,1.11],"upper-back":[1.1,1.04],
  "lower-back":[1.06,1.02],abs:[1.05,1.02],obliques:[1.13,1.03],quadriceps:[1.27,1.04],adductors:[1.13,1.02],hamstring:[1.25,1.03],gluteal:[1.1,1.06],calves:[1.35,1.05],tibialis:[1.22,1.02],neck:[1.35,1.0],head:[.92,.92],hair:[.92,.92]};
/* direção das fibras de cada músculo (graus; 90 = vertical), espelhada no outro lado do corpo */
const FIBER={chest:-18,deltoids:78,biceps:80,triceps:80,forearm:74,abs:90,obliques:55,trapezius:28,"upper-back":58,"lower-back":90,gluteal:32,quadriceps:84,hamstring:88,adductors:66,calves:88,tibialis:84};
let bodyUid=0;
function bodyFigure(side,frac,tip,cls){ const uid="kb"+(++bodyUid); const mid=side==="front"?362:1086; const angs=new Set();
  const parts=CORPO[side].map(([m,slug,d,cx,cy])=>{ const k=BULK[slug]; const tr=k?` transform="translate(${cx} ${cy}) scale(${k[0]} ${k[1]}) translate(${-cx} ${-cy})"`:"";
    const sh=`<path d="${d}" fill="url(#${uid}sh)"${tr} stroke="none" pointer-events="none"/>`;
    if(!m){ const fill=slug==="hair"?"var(--body-line)":"var(--body-base)"; return `<path d="${d}" fill="${fill}"${tr}/>`+sh; }
    const f=Math.max(0,Math.min(1,frac[m]||0)); const fill=f>0?`fill="var(--accent)" fill-opacity="${(0.16+0.84*f).toFixed(2)}"`:`fill="var(--body-mus)"`;
    let fib=""; if(FIBER[slug]!=null){ const a=Math.round(cx<mid?FIBER[slug]:180-FIBER[slug]); angs.add(a); fib=`<path d="${d}" fill="url(#${uid}f${a})"${tr} stroke="none" pointer-events="none"/>`; }
    return `<path class="mus" d="${d}" ${fill}${tr} data-tip="${esc(tip?tip[m]||"":"")}"/>${sh}${fib}`; }).join("");
  const shade=`<linearGradient id="${uid}sh" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".42" stop-color="#fff" stop-opacity=".04"/><stop offset=".75" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>`;
  const defs=shade+[...angs].map(a=>`<pattern id="${uid}f${a}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(${a-90})"><line x1="0" y1="0" x2="0" y2="9" stroke="var(--surface)" stroke-opacity=".4" stroke-width="1.7"/></pattern>`).join("");
  return `<svg class="body ${cls||""}" viewBox="${BODY_VB[side]}" role="img" aria-label="Músculos trabalhados, ${side==="front"?"frente":"costas"}"><defs>${defs}</defs><g stroke="var(--surface)" stroke-width="3" stroke-linejoin="round">${parts}</g></svg>`; }
function bodyPair(frac,tip,cls){ return `<div class="bodypair ${cls||""}">${bodyFigure("front",frac,tip,cls)}${bodyFigure("back",frac,tip,cls)}</div>`; }

/* ---------- barras verticais com linha de meta opcional ---------- */
function barChart(items,opt){ opt=opt||{}; const W=320,H=150,L=30,B=22,T=10; const n=items.length; const mx=Math.max(opt.goal||0,...items.map(i=>i.v),1);
  const step=(W-L-6)/n, bw=Math.max(6,Math.min(22,step-6)); const y=v=>T+(H-T-B)*(1-v/mx);
  const ticks=opt.ticks||[0,mx/2,mx];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label||"")}">
    ${ticks.map(t=>`<line x1="${L}" x2="${W-4}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${L-5}" y="${(y(t)+3.5).toFixed(1)}" text-anchor="end" class="ax">${opt.yfmt?opt.yfmt(t):fmt(Math.round(t))}</text>`).join("")}
    ${opt.goal?`<line x1="${L}" x2="${W-4}" y1="${y(opt.goal).toFixed(1)}" y2="${y(opt.goal).toFixed(1)}" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W-4}" y="${(y(opt.goal)-5).toFixed(1)}" text-anchor="end" class="ax goal">Meta ${fmt(opt.goal)}</text>`:""}
    ${items.map((it,i)=>{ const x=L+step*i+(step-bw)/2, h=Math.max(0,y(0)-y(it.v)); const top=y(it.v);
      const bar=h>0?`<path d="M${x.toFixed(1)} ${y(0)} V${(top+4).toFixed(1)} Q${x.toFixed(1)} ${top.toFixed(1)} ${(x+4).toFixed(1)} ${top.toFixed(1)} H${(x+bw-4).toFixed(1)} Q${(x+bw).toFixed(1)} ${top.toFixed(1)} ${(x+bw).toFixed(1)} ${(top+4).toFixed(1)} V${y(0)} Z" fill="var(--accent)" fill-opacity="${it.cur?1:.72}"/>`:"";
      return `<g class="hit" data-tip="${esc(it.tip)}"><rect x="${(L+step*i).toFixed(1)}" y="${T}" width="${step.toFixed(1)}" height="${H-T-B+4}" fill="transparent"/>${bar}</g>${it.lbl?`<text x="${(x+bw/2).toFixed(1)}" y="${H-6}" text-anchor="middle" class="ax">${esc(it.lbl)}</text>`:""}`; }).join("")}
    <line x1="${L}" x2="${W-4}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)" stroke-width="1"/></svg>`; }

/* ---------- dias de treino: semanas × dias da semana ---------- */
function dayGrid(sessions,weeks){ const byDate={}; sessions.forEach(s=>{ const o=byDate[s.date]||(byDate[s.date]={lift:false,cardio:false,lbl:[]}); if(lifted(s)){ o.lift=true; o.lbl.push(s.label||"Musculação"); } if(s.cardio) { o.cardio=true; o.lbl.push("Cardio"); } });
  const C=14, G=4, L=30, cols=weeks.length; const W=L+cols*(C+G), H=7*(C+G)+16; const names=["seg","ter","qua","qui","sex","sáb","dom"]; const today=todayISO();
  let cells="";
  weeks.forEach((w,ci)=>{ for(let r=0;r<7;r++){ const d=new Date(w+"T12:00:00"); d.setDate(d.getDate()+r); const iso=d.toISOString().slice(0,10); if(iso>today) continue; const o=byDate[iso];
    const fill=o?(o.lift?'fill="var(--accent)"':'fill="var(--accent)" fill-opacity=".4"'):'fill="var(--surface-2)"';
    cells+=`<rect class="hit" x="${L+ci*(C+G)}" y="${r*(C+G)}" width="${C}" height="${C}" rx="4" ${fill} data-tip="${esc(dstr(iso)+(o?" · "+o.lbl.join(" + "):" · sem treino"))}"/>`; } });
  const months=weeks.map((w,i)=>{ const d=new Date(w+"T12:00:00"); return (i===0||d.getDate()<=7)?`<text x="${L+i*(C+G)}" y="${H-2}" class="ax">${["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"][d.getMonth()]}</text>`:""; }).join("");
  return `<svg class="chart grid" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dias de treino">${names.map((n,r)=>`<text x="${L-6}" y="${r*(C+G)+C-3}" text-anchor="end" class="ax">${n}</text>`).join("")}${cells}${months}</svg>`; }

/* ---------- equilíbrio muscular: radar, feito (área) × meta (contorno tracejado) ---------- */
function radar(actual,target){ const ms=MUSCLES, n=ms.length, W=320, H=280, cx=W/2, cy=H/2+4, R=96;
  const mx=Math.max(...ms.map(m=>Math.max(actual[m]||0,target[m]||0)),1);
  const pt=(i,v)=>{ const a=-Math.PI/2+2*Math.PI*i/n, r=R*v/mx; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; };
  const poly=vals=>ms.map((m,i)=>pt(i,vals[m]||0).map(x=>x.toFixed(1)).join(",")).join(" ");
  const rings=[0.5,1].map(f=>`<polygon points="${ms.map((m,i)=>pt(i,mx*f).map(x=>x.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join("");
  const spokes=ms.map((m,i)=>{ const [x,y]=pt(i,mx); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/>`; }).join("");
  const labels=ms.map((m,i)=>{ const [x,y]=pt(i,mx*1.2); const anc=Math.abs(x-cx)<8?"middle":x<cx?"end":"start"; return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="${anc}" class="ax lbl">${MUS_SHORT[m]}</text>`; }).join("");
  const dots=ms.map((m,i)=>{ const [x,y]=pt(i,actual[m]||0); return `<g class="hit" data-tip="${esc(MUS_LBL[m]+": "+fmt(r1(actual[m]||0))+" séries/semana · meta "+fmt(target[m]||0))}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="transparent"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/></g>`; }).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Equilíbrio muscular">${rings}${spokes}
    <polygon points="${poly(target)}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <polygon points="${poly(actual)}" fill="var(--accent)" fill-opacity=".22" stroke="var(--accent)" stroke-width="2"/>${dots}${labels}</svg>`; }

/* ---------- seção "Desempenho" da aba Progresso ---------- */
function perfSection(){
  const ss=state.sessions.filter(lifted); const empty=!ss.length;
  const target=state.plan.target||{}; const planned=(state.plan.vol&&state.plan.vol.v)||{};
  // carga muscular: últimos 7 dias × meta semanal (sem treinos ainda: mostra o que o plano prevê)
  const since=isoDaysAgo(6); const v7=empty?planned:setsByMuscle(ss.filter(s=>s.date>=since));
  const frac={}, tip={}; MUSCLES.forEach(m=>{ const t=target[m]||1; frac[m]=v7[m]/t; tip[m]=`${MUS_LBL[m]}: ${fmt(r1(v7[m]))} de ${fmt(target[m]||0)} séries ${empty?"previstas no plano":"(meta da semana)"}`; });
  const ranked=MUSCLES.filter(m=>target[m]).map(m=>[m,frac[m]]).sort((a,b)=>b[1]-a[1]);
  const top=ranked.filter(x=>x[1]>0).slice(0,2).map(x=>MUS_LBL[x[0]].toLowerCase()), low=ranked.filter(x=>x[1]<0.5).slice(-2).map(x=>MUS_LBL[x[0]].toLowerCase());
  const weeks=lastWeeks(12), cw=weekStart(todayISO());
  const perW=weeks.map(w=>({w,s:ss.filter(s=>weekStart(s.date)===w)}));
  const mlbl=w=>dstr(w);
  const tpw=barChart(perW.map((x,i)=>({v:x.s.length,cur:x.w===cw,lbl:i%3===0?mlbl(x.w):"",tip:`Semana de ${dstr(x.w)}: ${x.s.length} treino${x.s.length===1?"":"s"}`})),{goal:state.plan.lift,label:"Treinos por semana",ticks:Array.from({length:Math.max(state.plan.lift,...perW.map(x=>x.s.length))+1},(_,i)=>i)});
  const vol=perW.map(x=>x.s.reduce((t,s)=>t+tonnage(s),0)); const vmx=Math.max(...vol,1);
  const vpw=barChart(perW.map((x,i)=>({v:vol[i],cur:x.w===cw,lbl:i%3===0?mlbl(x.w):"",tip:`Semana de ${dstr(x.w)}: ${kfmt(vol[i])} levantados`})),{label:"Volume semanal",ticks:[0,vmx/2,vmx],yfmt:t=>t>=1000?fmt(Math.round(t/100)/10)+"t":fmt(Math.round(t))});
  const vNow=vol[vol.length-2]||0, vPrev=vol[vol.length-3]||0;
  // equilíbrio: média semanal das últimas 4 semanas
  const since28=isoDaysAgo(27); const v28=empty?Object.fromEntries(MUSCLES.map(m=>[m,(planned[m]||0)])):setsByMuscle(ss.filter(s=>s.date>=since28)); const wk4=Math.max(1,Math.min(4,new Set(ss.filter(s=>s.date>=since28).map(s=>weekStart(s.date))).size)); const avg={}; MUSCLES.forEach(m=>avg[m]=v28[m]/wk4);
  const under=MUSCLES.filter(m=>target[m]&&avg[m]<target[m]*0.7).map(m=>MUS_LBL[m].toLowerCase());
  const days=new Set(state.sessions.filter(s=>s.date>=isoDaysAgo(83)).map(s=>s.date)).size;
  return `<div class="dayhead perfh"><h2>Desempenho</h2></div>
    <article class="card perf"><div class="exname">Carga muscular</div><p class="note">${empty?"Você ainda não salvou treinos: o mapa mostra quanto o seu plano trabalha cada músculo por semana. Depois do 1º treino, ele passa a mostrar o que você fez nos últimos 7 dias.":"Últimos 7 dias. Mais escuro = mais perto da meta de séries da semana."} Toque num músculo.</p>
      ${bodyPair(frac,tip)}
      <div class="legend"><span>pouco</span><i class="lgramp"></i><span>meta</span></div>
      <p class="note">${empty?"":top.length?`Mais trabalhado: <b>${top.join(" e ")}</b>.`:""}${!empty&&low.length?` Abaixo da metade da meta: <b>${low.join(" e ")}</b>.`:""}</p></article>
    <article class="card perf"><div class="exname">Treinos por semana</div><p class="note">Sessões de musculação. Linha tracejada: a meta do seu plano (${state.plan.lift} por semana).${empty?" As barras aparecem quando você salvar treinos.":""}</p>${tpw}</article>
    <article class="card perf"><div class="exname">Dias de treino</div><p class="note">Últimas 12 semanas · ${days} dia${days===1?"":"s"} com treino. Verde-claro: só cardio.</p><div class="gridwrap">${dayGrid(state.sessions,weeks)}</div></article>
    <article class="card perf"><div class="exname">Volume semanal</div><p class="note">${empty?"Aparece quando você salvar treinos. ":""}Peso total levantado (kg × repetições) por semana${vPrev&&vNow?` · semana passada ${kfmt(vNow)} (${vNow>=vPrev?"+":""}${fmt(Math.round((vNow/vPrev-1)*100))}% vs. a anterior)`:""}. A barra escura é a semana atual, ainda em andamento.</p>${vpw}</article>
    <article class="card perf"><div class="exname">Equilíbrio muscular</div><p class="note">${empty?"Prévia: séries que o seu plano prevê por grupo (área verde) × a meta (tracejado). Com treinos salvos, mostra a média das últimas 4 semanas.":`Séries por semana em cada grupo (média das últimas ${wk4} semana${wk4>1?"s":""}). Área verde: o que você fez. Tracejado: a meta do plano.`}</p>${radar(avg,target)}
      ${under.length?`<p class="note">Abaixo de 70% da meta: <b>${under.join(", ")}</b>.</p>`:`<p class="note">Todos os grupos perto da meta: treino equilibrado.</p>`}
      <details class="how"><summary>Ver em tabela</summary><table class="mt"><thead><tr><th>Grupo</th><th>Feito/sem.</th><th>Meta</th></tr></thead><tbody>${MUSCLES.map(m=>`<tr><td>${MUS_LBL[m]}</td><td>${fmt(r1(avg[m]))}</td><td>${fmt(target[m]||0)}</td></tr>`).join("")}</tbody></table></details></article>
    ${recentSessions(ss)}`; }

/* ---------- treinos recentes: cartão com mini-mapa muscular e a lista de exercícios ---------- */
function recentSessions(ss){ const list=ss.slice().sort((a,b)=>b.ts-a.ts).slice(0,5); if(!list.length) return "";
  return `<div class="dayhead perfh"><h2>Treinos recentes</h2></div>`+list.map(s=>{ const v=setsByMuscle([s]); const mx=Math.max(...Object.values(v),1); const frac={}, tip={}; MUSCLES.forEach(m=>{ frac[m]=v[m]/mx; tip[m]=`${MUS_LBL[m]}: ${fmt(r1(v[m]))} séries`; });
    const nSets=Object.values(s.ex).reduce((t,x)=>t+x.length,0);
    return `<article class="card sess"><div class="sessl">${bodyPair(frac,tip,"mini")}</div><div class="sessr"><div class="exname">${esc(s.label||"Treino")}</div>
      <p class="note">${dstr(s.date)} · ${nSets} séries · ${kfmt(tonnage(s))}${s.leve?" · leve":""}</p>
      <ul class="sesslist">${Object.entries(s.ex).map(([n,sets])=>{ const kgs=[...new Set(sets.map(x=>x.kg||0))]; return `<li><span>${esc(n)}</span><b>${sets.length} × ${kgs.length===1&&kgs[0]>0?fmt(kgs[0])+" kg × ":""}${sets.map(x=>x.reps).join("/")}</b></li>`; }).join("")}</ul></div></article>`; }).join(""); }

/* toque/hover: um único balão para todas as marcas */
function hideTip(){ const t=document.getElementById("ktip"); if(t) t.hidden=true; document.querySelectorAll(".on-tip").forEach(e=>e.classList.remove("on-tip")); }
window.addEventListener("scroll",hideTip,{passive:true});
function bindTips(root){ let tipEl=document.getElementById("ktip"); if(!tipEl){ tipEl=document.createElement("div"); tipEl.id="ktip"; tipEl.setAttribute("role","status"); tipEl.hidden=true; document.body.appendChild(tipEl); }
  const show=(el,ev)=>{ const t=el.getAttribute("data-tip"); if(!t) return; tipEl.textContent=t; tipEl.hidden=false; const r=el.getBoundingClientRect(); const x=Math.min(window.innerWidth-12,Math.max(12,(ev&&ev.clientX)||r.left+r.width/2)); tipEl.style.left=x+"px"; tipEl.style.top=(r.top+window.scrollY-8)+"px";
    root.querySelectorAll(".on-tip").forEach(e=>e.classList.remove("on-tip")); el.classList.add("on-tip"); };
  root.querySelectorAll("[data-tip]").forEach(el=>{ if(!el.getAttribute("data-tip")) return; el.addEventListener("pointerenter",e=>{ if(e.pointerType==="mouse") show(el,e); }); el.addEventListener("click",e=>{ e.stopPropagation(); show(el,e); }); el.addEventListener("pointerleave",e=>{ if(e.pointerType==="mouse"){ tipEl.hidden=true; el.classList.remove("on-tip"); } }); });
  document.addEventListener("click",()=>{ tipEl.hidden=true; root.querySelectorAll(".on-tip").forEach(e=>e.classList.remove("on-tip")); },{once:true}); }
