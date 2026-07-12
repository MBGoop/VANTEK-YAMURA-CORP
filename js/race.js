/* GRIT — race.js  ·  HYROX RACEPLAN
   Geïnspireerd op PaceRox/RoxFit, maar volledig offline berekend.

   De insteek: Hyrox is een looprace met workouts erin, geen workout met een
   loopje. Bijna iedereen verliest de race in de eerste twee runs — te snel
   starten, dan instorten bij station 3-4. Een raceplan is dus geen luxe:
   het is het verschil tussen finishen en overleven.

   Twee dingen die de app moet doen:
   1. Doeltijd -> concrete splits per run en per station.
   2. Je zwakste station aanwijzen. Data van racesplits laat zien dat de
      grootste verschillen tussen atleten vallen bij WALL BALLS en BURPEES,
      niet bij het lopen. Daar win of verlies je minuten. */
'use strict';

/* De 8 stations in racevolgorde, met hun aandeel in de totale stationstijd.
   Wall balls en burpees wegen het zwaarst — daar zit de meeste spreiding. */
const STATIONS = [
  {id:'ski',     n:'SkiErg 1000m',        w:0.115},
  {id:'sledpu',  n:'Sled Push 50m',       w:0.115},
  {id:'sledpl',  n:'Sled Pull 50m',       w:0.135},
  {id:'burpee',  n:'Burpee Broad Jump',   w:0.155},
  {id:'row',     n:'Roeien 1000m',        w:0.115},
  {id:'farmer',  n:'Farmers Carry 200m',  w:0.065},
  {id:'lunge',   n:'Sandbag Lunges 100m', w:0.130},
  {id:'wallball',n:'Wall Balls 100x',     w:0.170}
];

/* Verdeling van de totale tijd. Roxzone = de transitiezone; die telt mee
   als looptijd, want dat is het feitelijk ook. */
const PROFILES = {
  runner: {n:'RUNNER',  run:0.50, stat:0.42, rox:0.08, tip:'Sterk op de runs, verlies op de stations. Ga NIET harder op de runs — pak je winst bij wall balls.'},
  hybrid: {n:'HYBRID',  run:0.47, stat:0.45, rox:0.08, tip:'Uitgebalanceerd. Je grootste risico is de eerste run te snel aanvatten.'},
  strong: {n:'STRONG',  run:0.44, stat:0.48, rox:0.08, tip:'Sterk op de stations. Je tijdwinst zit in loopvolume — 80% rustig lopen.'}
};

/* Runs worden trager naarmate de race vordert. Dat is geen slappe pacing,
   dat is fysiologie: na 7 stations loop je nu eenmaal trager.
   Vuistregel: je slechtste run hoort run 5 of 6 te zijn, niet run 8.
   Zie je run 7-8 instorten, dan was de eerste helft te snel. */
const RUN_CURVE = [0.93, 0.96, 0.99, 1.01, 1.03, 1.05, 1.02, 1.01];

const mmss = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;

function racePlan(goalSec, profileKey){
  const P = PROFILES[profileKey] || PROFILES.hybrid;
  const runTotal  = goalSec * P.run;
  const statTotal = goalSec * P.stat;
  const roxTotal  = goalSec * P.rox;

  const avgRun = runTotal / 8;
  const sumC   = RUN_CURVE.reduce((a,b)=>a+b,0) / 8;
  const runs   = RUN_CURVE.map(c => avgRun * (c/sumC));
  const stats  = STATIONS.map(s => ({...s, sec: statTotal * s.w}));

  return {profile:P, runs, stats, rox:roxTotal/8, runTotal, statTotal, roxTotal, goalSec};
}

/* Zwakste station = grootste afwijking tussen jouw PR en het doeltempo. */
function weakestStation(plan){
  let worst=null, worstGap=0;
  plan.stats.forEach(s=>{
    const pr = S.hyroxPR[s.id];
    if(!pr) return;
    const gap = (pr - s.sec) / s.sec;      /* relatief, niet absoluut */
    if(gap > worstGap){ worstGap = gap; worst = {...s, pr, gap}; }
  });
  return worst;
}

/* ---------------- VIEW ---------------- */
let RACEGOAL = null, RACEPROF = null;

function vRace(v){
  const goal = RACEGOAL ?? (S.raceGoalSec || 90*60);
  const prof = RACEPROF ?? (S.raceProfile || 'hybrid');
  const plan = racePlan(goal, prof);
  const weak = weakestStation(plan);
  const cd   = raceCountdown();

  v.innerHTML = `
   <div class="panel">
     <div class="row"><h2 style="margin:0">RACEPLAN</h2><div class="spacer"></div>
       <span class="tiny dim">${cd!==null && cd>=0 ? cd+' DAGEN' : 'geen datum'}</span></div>

     <label style="margin-top:12px">Doeltijd</label>
     <div class="chips" id="goal-pick">
       ${[75,80,90,100,110,120].map(m=>`<button class="chip ${Math.round(goal/60)===m?'sel':''}" data-m="${m}">${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}</button>`).join('')}
     </div>

     <label style="margin-top:12px">Jouw type</label>
     <div class="chips" id="prof-pick">
       ${Object.entries(PROFILES).map(([k,p])=>`<button class="chip ${prof===k?'sel':''}" data-p="${k}">${p.n}</button>`).join('')}
     </div>
     <p class="tiny" style="margin-top:8px">${plan.profile.tip}</p>
   </div>

   <div class="panel">
     <h2>SPLITS</h2>
     <p class="tiny dim">Lopen ${mmss(plan.runTotal)} · stations ${mmss(plan.statTotal)} · roxzone ${mmss(plan.roxTotal)}</p>
     <div style="margin-top:10px">
       ${plan.runs.map((r,i)=>{
         const st = plan.stats[i];
         const isWeak = weak && weak.id===st.id;
         return `<div class="split run"><span>RUN ${i+1}</span><span>${mmss(r)}</span></div>
                 <div class="split ${isWeak?'weak':''}"><span>${isWeak?'⚠ ':''}${st.n}</span><span>${mmss(st.sec)}</span></div>`;
       }).join('')}
     </div>
     <p class="tiny dim" style="margin-top:8px">Run 1 moet gênant rustig voelen.</p>
   </div>

   <div class="panel">
     <h2>STATION-PR'S</h2>
     <p class="tiny dim">Log je beste tijd per station.</p>
     ${weak ? `<div class="warnbox" style="margin-top:10px">ZWAKSTE STATION: ${weak.n} —
       ${Math.round(weak.gap*100)}% boven je doeltempo. Dáár liggen je minuten,
       niet op de runs. Drill dit wekelijks.</div>` :
       `<p class="tiny dim" style="margin-top:8px">Nog te weinig PR's om je zwakste station aan te wijzen.</p>`}
     <div style="margin-top:10px">
       ${STATIONS.map(s=>{
          const pr = S.hyroxPR[s.id];
          return `<div class="split"><span>${s.n}</span>
            <span><b style="color:var(--g3b)">${pr?mmss(pr):'—'}</b>
            <button class="altbtn" data-pr="${s.id}">SET</button></span></div>`;
       }).join('')}
     </div>
   </div>`;

  v.querySelectorAll('#goal-pick .chip').forEach(c=>c.onclick=()=>{
    RACEGOAL = (+c.dataset.m)*60; S.raceGoalSec = RACEGOAL; save(); render('trn');
  });
  v.querySelectorAll('#prof-pick .chip').forEach(c=>c.onclick=()=>{
    RACEPROF = c.dataset.p; S.raceProfile = RACEPROF; save(); render('trn');
  });
  v.querySelectorAll('[data-pr]').forEach(b=>b.onclick=()=>prSheet(b.dataset.pr));
}

function prSheet(id){
  const st = STATIONS.find(x=>x.id===id);
  const cur = S.hyroxPR[id];
  const o = sheet(`
    <h3>${st.n}</h3>
    <p class="tiny dim">Je beste tijd, in minuten en seconden.</p>
    <div class="row" style="margin-top:10px">
      <input class="mini" id="pmin" type="number" inputmode="numeric" min="0" max="30"
             placeholder="MIN" value="${cur?Math.floor(cur/60):''}">
      <input class="mini" id="psec" type="number" inputmode="numeric" min="0" max="59"
             placeholder="SEC" value="${cur?Math.round(cur%60):''}">
    </div>
    <div class="row" style="margin-top:12px">
      <button class="btn" id="pok">OPSLAAN</button>
      ${cur?'<button class="btn small ghost" id="pdel">WISSEN</button>':''}
    </div>`);
  o.querySelector('#pok').onclick = () => {
    const m = parseInt(o.querySelector('#pmin').value,10)||0;
    const sec = parseInt(o.querySelector('#psec').value,10)||0;
    const t = m*60+sec;
    if(t<=0){ toast('ONGELDIGE TIJD'); return; }
    const old = S.hyroxPR[id];
    S.hyroxPR[id] = t; save(); o.remove();
    toast(old && t<old ? `NIEUW PR — ${mmss(old-t)} sneller` : 'PR OPGESLAGEN');
    render('trn');
  };
  const del = o.querySelector('#pdel');
  if(del) del.onclick = () => { delete S.hyroxPR[id]; save(); o.remove(); render('trn'); };
}
