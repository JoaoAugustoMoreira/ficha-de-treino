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

/* ---------- mapa muscular: frente e costas, desenho anatômico próprio ----------
   Só o lado esquerdo é desenhado; o direito é o espelho. Cada forma pertence a um dos 10 grupos do app. */
const SIL=[[70,4],[76,5],[80,10],[80,18],[77,24],[76,28],[80,31],[88,34],[96,37],[104,40],[109,46],[111,55],[110,64],[111,74],[111,84],[108,94],[109,104],[111,114],[109,126],[105,136],[104,142],[106,150],[103,155],[99,151],[99,142],[98,130],[97,116],[96,104],[96,94],[95,82],[93,70],[91,78],[89,90],[86,100],[85,108],[87,116],[92,128],[95,142],[94,156],[91,168],[88,178],[91,190],[92,202],[88,216],[84,230],[85,240],[86,246],[78,248],[74,246],[75,236],[74,224],[73,210],[72,198],[74,186],[74,178],[74,164],[72,146],[70,134]];
function silhouette(){ const right=SIL, left=SIL.slice(1,-1).map(([x,y])=>[140-x,y]).reverse(); const pts=right.concat(left); const n=pts.length; let d=`M${pts[0][0]} ${pts[0][1]}`;
  for(let i=0;i<n;i++){ const p0=pts[(i-1+n)%n], p1=pts[i], p2=pts[(i+1)%n], p3=pts[(i+2)%n];
    const c1=[p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6], c2=[p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6];
    d+=` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`; }
  return d+" Z"; }
/* formas do lado direito da figura (x > 70); o outro lado é espelhado. Proporções de fisiculturista: ombros largos, cintura fina, "V". */
const FOREARM='<path d="M98.5 95 C107 99 111.5 109 110.5 122 C108.5 130 105.5 136 103.5 141 C102 128 101 114 98 101 Z"/><path d="M97.5 101 C100 114 101 127 101.5 141 L99 141 C97.5 127 96.5 114 96 101 Z"/>';
const ARM_FRONT='<path d="M94.5 62 C102 64 107 73 106 86 C104 94 99 96 95.5 92 C94 84 93.8 73 94.5 62 Z"/><path d="M106.8 66 C110.8 72 111.8 82 109.2 93.5 C107.2 91 106.6 80 106.8 70 Z"/>'+FOREARM;
const ARM_BACK='<path d="M94 60 C99 66 101 78 100 90 C97 94 95 91 94 86 C93 78 93 70 94 61 Z"/><path d="M101 61 C108 66 111 78 108.5 92 C105 96 102 93 101 88 C102 78 102 70 101 63 Z"/>'+FOREARM;
const ANAT={
  front:[
    ["costas",'<path d="M76 27 C82 30 88 33 94 36 C87 37.5 81 36.5 76 34 Z"/>'],
    ["ombros",'<path d="M92 36 C102 37 110 42 111.5 51 C112 59 109.5 64 106 69 C104 60 101.5 51 97 44 Z"/><path d="M89 38 C96 38.5 99.5 42 100.5 48 C99 55 96.5 60 93.5 64 C91 56 89 48 87.5 42 Z"/>'],
    ["peito",'<path d="M71 40 C78 38 86 39 90 42 C88 46 84 48.5 78 49 C75 49 72.5 48 71 47 Z"/><path d="M71 49 C76 51 84 50 90.5 45 C94 50 95 57 93 63.5 C86.5 68.5 77 69.5 71 66.5 Z"/>'],
    ["braços",ARM_FRONT],
    ["abdômen",'<rect x="71.4" y="70" width="7.2" height="8" rx="2.6"/><rect x="71.4" y="80" width="7.6" height="8" rx="2.6"/><rect x="71.4" y="90" width="7.4" height="8" rx="2.6"/><rect x="71.4" y="100" width="6.8" height="8" rx="2.6"/><path d="M71.4 110 H77.8 C77 118 74.2 124 71.4 128 Z"/><path d="M81 70 C86 74 89 82 88.5 94 C87.5 101 87 106 87.5 112 C84 110 82 107 81 104 Z"/><path d="M90.5 66 L95 68 L92 71.5 Z"/><path d="M89.5 73 L94 75 L91 78.5 Z"/><path d="M88.8 80 L93 82 L90.3 85.2 Z"/>'],
    ["pernas",'<path d="M86 118 C94 128 96.5 146 93 166 C91 175 88 179 85 176 C85.5 160 85 142 82 126 Z"/><path d="M78 124 C85 136 86.5 154 84 172 C82 177 79 177 77.5 173 C76 158 75.5 140 76 126 Z"/><path d="M76 156 C81 162 82 172 78 181 C74.5 179 73.5 172 74 164 Z"/><path d="M87 114 C83 128 79 144 75.6 158 L74.4 157 C77.5 143 81.5 127 85.5 113 Z"/>'],
    ["glúteos",'<path d="M86.5 106 C89.5 110 90.5 116 88.5 121 C86.5 118 84.5 113 83.5 108 Z"/>'],
    ["adutores",'<path d="M71.5 132 C75 137 75.6 146 74.8 156 C72.8 152 71.8 144 71 136 Z"/>'],
    ["panturrilha",'<path d="M83 184 C87 196 87 212 84 228 L80.5 228 C80 212 80 198 80 186 Z"/><path d="M88 184 C92.5 194 92 206 88 216 C86.5 206 86 196 86 186 Z"/><path d="M75 186 C72 196 72 208 74.5 218 L78 218 C78.5 206 78.5 196 78 188 Z"/>']],
  back:[
    ["costas",'<path d="M70 22 C76 26 84 32 94 37 C86 40 78 42 71.5 46 Z"/><path d="M71.5 47 C77 45 82 45 86 47 C80 56 75 66 71.5 76 Z"/><path d="M78.5 48.5 C84 46.5 89 48 92 52 C90 58 86 62 81.5 63 C79.5 58 78.5 53 78.5 48.5 Z"/><path d="M86.5 62.5 C89 60.5 92 60.5 93 64 L88.5 68 Z"/><path d="M88.5 67 C93.5 71 92.5 83 88.5 94 C84.5 102 78.5 108 73.5 110 L73 79 C77.5 73 82.5 69 88.5 67 Z"/><path d="M71.5 79 C74.5 83 75.5 96 75.5 112 L71.5 114 Z"/>'],
    ["ombros",'<path d="M94 37 C103 38 110 43 111.5 52 C111 60 108.5 65 105.5 68 C102 59 99 51 93 44 Z"/>'],
    ["braços",ARM_BACK],
    ["glúteos",'<path d="M86 112 C90 116 90.5 122 88.5 126 C84.5 122 80.5 118.5 77 116.5 Z"/><path d="M89 121 C92 131 88 141 79.5 143 C73.5 143 71.2 139 71.2 130 C71.2 122 75 118.5 80 118.5 Z"/>'],
    ["posterior",'<path d="M88 145 C94 156 93 170 87 182 L82.5 182 C84 168 84 156 82 145 Z"/><path d="M81 145 C82.5 158 81.5 170 79.5 182 L75 182 C73.5 168 72.5 156 72.5 147 Z"/>'],
    ["panturrilha",'<path d="M87 184 C93 192 92 206 86 216 C83.5 208 82.5 198 82.5 186 Z"/><path d="M81.5 186 C82 200 81 212 76.5 220 C71.5 210 71.5 196 74.5 186 Z"/><path d="M86 216.5 C86 224 84 230 82 234 L77 234 C76 228 76 222 76 219.5 Z"/>']]};
/* partes sem grupo do app (pescoço, joelho, banda iliotibial): dão o volume do corpo, sem cor de intensidade */
const NEUTRAL={front:'<path d="M76 178.5 C80 176.5 86 176.5 89.5 179.5 C88.5 184.5 85 186.5 81 186.5 C78 186.5 76 183.5 76 178.5 Z"/><path d="M86.5 214.5 C88.2 222 86.5 230 84.2 234.5 L82.2 234.5 C83.2 226 84.8 220 86.5 214.5 Z"/>',
  back:'<path d="M76 180 C80 178.5 86 178.5 89 181 C88 185 85 186.5 81 186.5 C78 186.5 76 184 76 180 Z"/><path d="M91.5 128 C94.5 140 95 152 93 162 L90.5 158 C91.5 148 91.5 138 89.5 129 Z"/>'};
/* linhas de definição (só desenho, sem toque): fibras do peitoral, cabeças do deltoide, separações do quadríceps e da panturrilha */
const DEF={front:'<path d="M74 55 C80 57 86 55 90 50"/><path d="M75 61 C81 63 87 61 91 57"/><path d="M99 46 C101 52 102 58 102 63"/><path d="M80 136 C81.5 148 81.5 160 80.5 168"/><path d="M89 132 C91 144 91 156 89 166"/><path d="M98 70 C100 76 100 82 99 88"/><path d="M104 108 C105 114 105 120 104 126"/><path d="M95 42 C96 46 96.5 50 96 54"/><path d="M104 46 C106 51 106.5 56 105.5 61"/><path d="M84 190 C85 200 85 210 83.5 220"/><path d="M73 74 H78"/><path d="M81.5 76 C84 80 85.5 86 85.5 92"/>',
  back:'<path d="M80 98 C83 94 86 88 87 82"/><path d="M78 104 C82 100 85 96 87 90"/><path d="M78 126 C82 130 85 134 86 138"/><path d="M85 194 C86 200 86 206 85 210"/><path d="M78 196 C77.5 202 77.5 208 78 212"/><path d="M104 70 C105.5 78 105.5 84 104 90"/><path d="M85 152 C86 160 86 168 85 176"/><path d="M78 152 C78.5 160 78.5 168 78 176"/><path d="M83 52 C85 54 87 57 88 60"/><path d="M99 44 C101 50 102.5 56 102.5 62"/><path d="M76 60 C78 64 78.5 70 78 76"/><path d="M73 88 V108"/>'};
const SIL_D=silhouette();
function bodyFigure(side,frac,tip,cls){
  const shapes=ANAT[side].map(([m,sh])=>{ const f=Math.max(0,Math.min(1,frac[m]||0)); const fill=f>0?`fill="var(--accent)" fill-opacity="${(0.16+0.84*f).toFixed(2)}"`:`fill="var(--body-mus)"`;
    return `<g class="mus" ${fill} data-tip="${esc(tip?tip[m]||"":"")}">${sh}<g transform="translate(140 0) scale(-1 1)">${sh}</g></g>`; }).join("");
  return `<svg class="body ${cls||""}" viewBox="0 0 140 252" role="img" aria-label="Músculos trabalhados, ${side==="front"?"frente":"costas"}">
    <defs><linearGradient id="kshade-${side}${cls||""}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>
    <path d="${SIL_D}" fill="var(--body-base)" stroke="var(--body-line)" stroke-width="1"/>
    <g fill="var(--body-mus)" stroke="var(--surface)" stroke-width=".9">${NEUTRAL[side]}<g transform="translate(140 0) scale(-1 1)">${NEUTRAL[side]}</g></g>
    ${side==="back"?'<path d="M70 28 V116" stroke="var(--body-line)" stroke-width=".8"/>':'<path d="M64 22 C67 24 73 24 76 22" fill="none" stroke="var(--body-line)" stroke-width=".8"/>'}
    <g stroke="var(--surface)" stroke-width=".9" stroke-linejoin="round">${shapes}</g>
    <g class="def" fill="none" stroke="var(--surface)" stroke-opacity=".55" stroke-width=".7" stroke-linecap="round" pointer-events="none">${DEF[side]}<g transform="translate(140 0) scale(-1 1)">${DEF[side]}</g></g>
    <path d="${SIL_D}" fill="url(#kshade-${side}${cls||""})" pointer-events="none"/></svg>`; }
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
