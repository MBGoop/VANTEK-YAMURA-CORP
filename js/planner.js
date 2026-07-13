/* GRIT — planner.js  (gesplitst uit index.html, gedrag ongewijzigd) */
function has(need){
  if(!S.gear)return need==='geen';
  return need.split('|').some(n=>({
    geen:true, kb:S.gear.kbs.length>0, kb2:S.gear.kbs.length>1,
    band:S.gear.bands, trap:S.gear.trap, run:S.gear.lopen!=='nee'
  })[n]);
}
function pick(keys,rot=0){
  /* alle beschikbare opties (materiaal-gefilterd), dan roteren op basis van rot */
  const avail=keys.filter(k=>has(EX[k].need));
  const pool=avail.length?avail:[keys[keys.length-1]];
  const k=pool[((rot%pool.length)+pool.length)%pool.length];
  return {key:k};
}
/* gewichtssuggestie uit eigen KB's */
function suggestKB(key){
  if(!S.gear||!S.gear.kbs.length)return null;
  const e=EX[key]; if(!e||!e.wt)return null;
  const sorted=[...S.gear.kbs].sort((a,b)=>a-b);
  if(e.wt==='heavy')return sorted[sorted.length-1];
  if(e.wt==='light')return sorted[0];
  return sorted[Math.floor((sorted.length-1)/2)];
}
function lastLog(key){const l=S.exLog[key];return l&&l.length?l[l.length-1]:null}

/* ---------------- PLAN GENERATOR ---------------- */
function buildSession(type,week,dur,taper=1,rotBase=0){
  const scale=(dur<=20?0.7:dur<=30?1:dur<=45?1.3:1.6)*taper;
  const st=b=>{let v=b+(week>=2?1:0);if(week===4)v=Math.max(2,Math.round(v*0.7));v=Math.round(v*taper);return Math.max(2,Math.min(5,Math.round(v*(scale>1.2?1.15:1))))};
  const rondes=b=>{let v=b+(week===2||week===3?1:0);if(week===4)v=Math.max(2,v-1);return Math.max(2,Math.round(v*scale))||2};
  const int=week===3?' / korter rusten':'';
  const w={warm:[],main:[],fin:[],cool:[],type,week};
  /* r = rotatie-index: verschilt per week EN per slot, zodat oefeningen echt variëren */
  const r=(slot)=>rotBase+slot;
  const P=(keys,slot)=>pick(keys,r(slot));
  if(type==='strength'||type==='strengthL'){
    w.warm=[['march','3 min'],'hip hinges + band pull-aparts'];
    w.main=[
      [P(['gobletsquat','bwsquat','gobletbox','splitsquat'],0),`${st(3)}x8${int}`],
      [P(['kbdl','hinge','sldl'],1),`${st(3)}x8`],
      [P(['lunge','splitsquat','lunge2'],2),`${st(3)}x10/been`],
      [P(['core','hips'],3),`${st(3)}x8/zijde`]];
    w.fin=[[P(['swing','wallball','mountain','burpee'],4),`${rondes(3)} min EMOM`]];
  }else if(type==='strengthU'){
    w.warm=[['march','3 min'],'schouder-cirkels + pull-aparts'];
    w.main=[
      [P(['pushup','declpush','pikepush'],0),`${st(3)}x10`],
      [P(['kbrow','bandrow'],1),`${st(3)}x8/kant`],
      [P(['press','pikepush'],2),`${st(3)}x6-8`],
      [P(['shoulders','bandpull'],3),`${st(3)}x15`]];
    w.fin=[[P(['core','mountain'],4),`${rondes(2)} rondes`]];
  }else if(type==='conditioning'||type==='conditioning2'){
    w.warm=[['march','5 min op tempo komen']];
    w.main=[[P(['runint','trapint','shuttle','highknee','march'],0),`${rondes(8)} intervallen${int}`]];
    w.fin=[[P(['carry','mountain','jumpingjack'],1),`${rondes(3)}x gangetje`]];
  }else if(type==='mixed'){
    w.warm=[['march','4 min + hinges']];
    w.main=[
      [P(['gobletsquat','bwsquat','gobletbox','splitsquat'],0),`${st(3)}x8`],
      [P(['pushup','declpush','pikepush'],1),`${st(3)}x8`],
      [P(['bandrow','kbrow'],2),`${st(3)}x10`],
      [P(['runint','trapint','highknee','march'],3),`${rondes(5)} intervallen`]];
    w.fin=[[P(['wallball','burpee','mountain'],4),`${rondes(3)} min AMRAP`]];
  }else if(type==='circuit'){
    w.warm=[['march','5 min']];
    w.main=[
      [P(['runint','trapint','highknee','march'],0),'2 min tempo'],
      [P(['kbdl','hinge','sldl'],1),'10 reps'],
      [P(['wallball','squathold'],2),'8 reps'],
      [P(['carry','lunge2'],3),'20 m'],
      [P(['burpee','mountain'],4),`${week>=3?8:6} reps`],
      [P(['sled','stepup','jumpingjack'],5),'20 m / 10 reps']];
    w.fin=[['ROND',`${rondes(3)}`]];
  }else{
    w.warm=[['march','3 min losjes']];
    w.main=[
      [P(['hips'],0),'3 min'],
      [P(['ankles'],1),'3 min'],
      [P(['shoulders','bandpull'],2),'3 min'],
      [P(['core'],3),'2 rondes']];
    w.fin=[['ROND','rustige wandeling als afsluiter']];
  }
  w.cool=['3-5 min stretchen + rustig ademen'];
  return w;
}
/* absoluut weeknummer sinds planstart: rotatie-basis voor oefeningvariatie */
function absWeek(ds){
  if(!S.planStart)return 0;
  const d=Math.floor((new Date(ds)-new Date(S.planStart))/DAY);
  return Math.max(0,Math.floor(d/7));
}
/* volledige sessie voor een datum: type-resolver + taper + oefening-overrides */
function sessionPlan(ds,forceLight){
  const ses=sessionForDate(ds);
  if(!ses)return null;
  const week=weekForDate(ds);
  const dur=forceLight?Math.max(20,S.dur-15):S.dur;
  const w=buildSession(ses.type,week,dur,taperFactor(ds),absWeek(ds));
  w.meta=ses;
  /* Expliciete lijst (gebruiker heeft de sessie zelf samengesteld) wint altijd.
     Veel robuuster dan losse rm/swap/add-lagen: wat je ziet is wat er staat. */
  const ovl=S.overrides[ds];
  if(ovl && ovl.ex && ovl.ex.list){
    w.main = ovl.ex.list.map(x =>
      (x.key==='march'||x.key==='ROND')
        ? [x.key, x.dose]
        : [{key:x.key}, x.dose]
    ).filter(x => x[0]==='march' || x[0]==='ROND' || EX[x[0].key]);
    w.meta=ses;
    return w;
  }
  /* per-datum oefening-overrides toepassen op de main-set (oud model) */
  const ov=S.overrides[ds];
  if(ov&&ov.ex){
    w.main=w.main.map((it,i)=>{
      if(ov.ex.rm&&ov.ex.rm.includes(i))return null;
      if(ov.ex.swap&&ov.ex.swap[i]&&typeof it[0]==='object'){
        return [{key:ov.ex.swap[i]}, it[1]];
      }
      return it;
    }).filter(Boolean);
    if(ov.ex.add)ov.ex.add.forEach(a=>w.main.push([{key:a.key}, a.dose||'3x8']));
  }
  return w;
}
function generatePlan(){
  S.plan={types:DAYTYPES[S.days],slots:{2:[1,4],3:[1,3,5],4:[1,3,5,6],5:[1,2,3,5,6],6:[1,2,3,4,5,6]}[S.days]};
  S.planStart=todayStr();save();
}
function weekForDate(ds){
  if(!S.planStart)return 1;
  const d=Math.floor((new Date(ds)-new Date(S.planStart))/DAY);
  if(d<0)return 1;
  return (Math.floor(d/7)%4)+1;
}
function planWeek(){return weekForDate(todayStr())}
/* --- VAST PLAN (data/plan.json) ---------------------------------------
   Het plan is de blauwdruk: staat er voor deze dag een sessie in, dan wint die.
   Staat er niets (dag buiten het plan, of plan uitgeschakeld), dan valt de app
   terug op zijn eigen generator. Zo blijft alles werken zoals vroeger. */
function planStartDate(){ return S.hyroxStart || null; }

function planEntry(ds){
  if(!S.hyroxStart) return null;
  if(typeof PLAN === 'undefined' || !PLAN || !PLAN.weeks) return null;
  const d = Math.floor((new Date(ds) - new Date(S.hyroxStart)) / DAY);
  if(d < 0) return null;
  const W = PLAN.weeks[Math.floor(d/7)];        // week 1 = index 0
  if(!W) return null;                           // voorbij week 20 -> generator
  const s = W.sessions.find(x => x.dow === new Date(ds).getDay());
  if(!s) return null;
  return {week:W.week, block:W.block, focus:W.focus,
          type:s.type, titel:s.titel, detail:s.detail, hr:s.hr};
}
/* week 1..20 van het Hyrox-plan (null = niet in het plan) */
function hyroxWeek(ds){ const p = planEntry(ds||todayStr()); return p ? p.week : null; }
/* plan starten vanaf vandaag */
function startHyroxPlan(){ S.hyroxStart = todayStr(); save(); }
function stopHyroxPlan(){ S.hyroxStart = null; save(); }

/* basis-sessie: eerst het plan, dan het gegenereerde schema */
function basePlanSession(ds){
  const pe = planEntry(ds);
  if(pe) return {type:pe.type, idx:0, plan:pe};
  if(!S.plan)return null;
  const dow=new Date(ds).getDay();
  const idx=S.plan.slots.indexOf(dow);
  if(idx<0)return null;
  return {type:S.plan.types[idx],idx};
}
/* uiteindelijke sessie inclusief overrides:
   ov.rest=true -> rustdag ; ov.type -> ander dagtype ; ov.movedTo -> verplaatst weg
   een dag kan ook een INKOMENDE verplaatsing hebben (andere dag met movedTo=ds) */
function sessionForDate(ds){
  const ov=S.overrides[ds]||{};
  if(ov.rest)return null;
  /* inkomende verplaatsing? zoek een dag die hierheen verplaatst is */
  for(const src in S.overrides){
    if(S.overrides[src].movedTo===ds){
      const base=S.overrides[src].type||(basePlanSession(src)||{}).type;
      if(base)return {type:base,moved:true,from:src};
    }
  }
  if(ov.movedTo)return null; /* deze dag is weg-verplaatst */
  const base=basePlanSession(ds);
  if(!base&&!ov.type)return null;
  /* plan-info meegeven, tenzij de gebruiker het dagtype zelf overschreef */
  return {type:ov.type||base.type, idx:base?base.idx:0,
          plan:(!ov.type && base) ? base.plan : null};
}
/* taper: als er een race is, in de laatste 10 dagen volume afbouwen */
function taperFactor(ds){
  if(!S.race||!S.race.date)return 1;
  const daysToRace=Math.floor((new Date(S.race.date)-new Date(ds))/DAY);
  if(daysToRace<0||daysToRace>10)return 1;
  if(daysToRace<=2)return 0.5;      /* laatste 2 dagen: heel licht */
  if(daysToRace<=6)return 0.7;      /* wedstrijdweek */
  return 0.85;                       /* week ervoor */
}
function raceCountdown(){
  if(!S.race||!S.race.date)return null;
  const d=Math.floor((new Date(S.race.date)-new Date(todayStr()))/DAY);
  return d;
}

/* ---------------- RECOVERY / STREAK ---------------- */
function computeRecovery(sleep,feel){
  const recent=S.rpeLog.slice(-3);
  const rpePen=recent.filter(r=>r>=9).length*12 + (recent.length?Math.max(0,(recent.reduce((a,b)=>a+b,0)/recent.length-7))*6:0);
  S.recovery=Math.max(5,Math.min(100,Math.round(sleep*12+feel*10-rpePen)));
  S.energy=Math.max(5,Math.min(100,Math.round(sleep*14+feel*8)));
}
function dayMode(){return S.recovery<40?'light':S.recovery>=70?'push':'normal'}
/* Bugfix v5: de freeze werkte op maandbasis (slice(0,8) = 'JJJJ-MM-') en
   triggerde alleen bij gap===3 exact. Wie de app pas op dag 4 opende,
   verloor de streak zonder dat de freeze ooit werd ingezet — precies het
   scenario waarvoor hij bestaat. Nu: echte weeksleutel + venster 3–5 dagen. */
function updateStreak(){
  if(!S.lastActive)return;
  const gap=Math.floor((new Date(todayStr())-new Date(S.lastActive))/DAY);
  if(gap<3)return;
  const wk=weekKey();
  if(gap<=5 && S.freezeWeek!==wk){
    S.freezeWeek=wk;save();
    toast('STREAK-FREEZE ingezet — streak gered [1x per week]');
  }else if(S.streak>0){
    S.streak=0;save();
  }
}
/* Freeze nog beschikbaar deze week? Zichtbaar vangnet i.p.v. verrassing. */
function freezeAvailable(){ return S.freezeWeek!==weekKey(); }
function bumpStreakIfNew(){
  /* Elke echte activiteit stopt het verval en betaalt de comeback uit.
     Eén plek, zodat geen enkel logpad dit kan vergeten. */
  if(typeof comebackBonus==='function') comebackBonus();
  if(S._streakDay!==todayStr()){S.streak++;S._streakDay=todayStr()}
  save();
}

/* ---------------- WEEKQUEST ----------------
   Eén grotere opdracht per week, roteert automatisch. Predicaten horen in
   code (JSON gooit functies weg) — zelfde redenering als bij BADGES.
   Doel: de losse modules (VITALS, plan, notities) aan de loop koppelen. */
const WEEKQUESTS=[
  {id:'hr3',  t:'Meet 3 ochtenden je rusthartslag (VITALS)', goal:3, xp:40, cr:10,
   prog:()=> (S.hr&&S.hr.restLog?S.hr.restLog.filter(e=>e.d>=weekKey()&&e.d<=todayStr()).length:0)},
  {id:'ses3', t:'Voltooi 3 sessies deze week',               goal:3, xp:40, cr:10,
   prog:()=> Object.keys(S.done).filter(d=>d>=weekKey()&&d<=todayStr()).length},
  {id:'note2',t:'Schrijf bij 2 sessies een notitie',         goal:2, xp:30, cr:8,
   prog:()=> Object.keys(S.notes).filter(d=>d>=weekKey()&&d<=todayStr()).length},
  {id:'ext2', t:'Log 2 externe activiteiten (loop/fiets/wandel)', goal:2, xp:35, cr:10,
   prog:()=> (S.history||[]).filter(h=>h.d>=weekKey()&&h.d<=todayStr()&&h.type&&h.type.startsWith('ext_')).length}
];
function isoWeekNum(ds){
  const d=new Date(ds||todayStr());
  const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const dayNum=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-dayNum+3);
  const firstThu=new Date(Date.UTC(t.getUTCFullYear(),0,4));
  return 1+Math.round(((t-firstThu)/DAY-3+((firstThu.getUTCDay()+6)%7))/7);
}
function weekQuest(){ return WEEKQUESTS[isoWeekNum()%WEEKQUESTS.length] }
function weekQuestClaimed(){ return S.weekQuestClaimed===weekKey() }
function claimWeekQuest(){
  const q=weekQuest();
  if(weekQuestClaimed()||q.prog()<q.goal)return;
  S.weekQuestClaimed=weekKey();
  gainXP(q.xp,q.cr);
  toast(`WEEKQUEST VOLTOOID — +${q.xp} XP / +${q.cr} CR`);
}

/* ---------------- BADGES / MIJLPALEN ---------------- */
/* BADGES bevatten predicaat-functies (b.test) en horen dus in code, niet in JSON:
   JSON.stringify gooit functies stilzwijgend weg. */
const BADGES=[
  {id:'first',   name:'EERSTE CONTACT',  desc:'Je eerste sessie gelogd',            test:()=>S.history.length>=1},
  {id:'ten',     name:'TIEN MISSIES',     desc:'10 sessies voltooid',                test:()=>S.history.length>=10},
  {id:'streak7', name:'ZEVEN OP EEN RIJ', desc:'Streak van 7 bereikt',               test:()=>S.streak>=7},
  {id:'cycle',   name:'CYCLUS VOLTOOID',  desc:'Een volledige 4-weken cyclus door',  test:()=>S.planStart&&Math.floor((new Date(todayStr())-new Date(S.planStart))/DAY)>=28},
  {id:'bench',   name:'NULMETING',        desc:'Eerste benchmark neergezet',         test:()=>S.hyroxPRs.length>=1},
  {id:'pr',      name:'RECORDBREKER',     desc:'Een benchmark-PR verbeterd',         test:()=>S.hyroxPRs.length>=2&&S.hyroxPRs[S.hyroxPRs.length-1].sec<Math.min(...S.hyroxPRs.slice(0,-1).map(p=>p.sec))},
  {id:'iron',    name:'IJZEREN WIL',      desc:'25 sessies voltooid',                test:()=>S.history.length>=25},
  {id:'evolve',  name:'MUTATIE',          desc:'Specimen naar fase 2 gegroeid',      test:()=>stage()>=2},
  {id:'apex',    name:'APEX SPECIMEN',    desc:'Specimen naar fase 3 gegroeid',      test:()=>stage()>=3},
];

function checkBadges(){
  BADGES.forEach(b=>{
    if(!S.badges.includes(b.id)&&b.test()){
      S.badges.push(b.id);save();
      toast(`★ BADGE: ${b.name}`);
      if(S.cues!==false&&typeof cueDone==='function')cueDone();
    }
  });
}
/* wekelijkse samenvatting: sessies deze kalenderweek */
function weekSummary(){
  const now=new Date(todayStr());
  const mon=new Date(now);mon.setDate(now.getDate()-((now.getDay()+6)%7));
  const monStr=mon.toISOString().slice(0,10);
  let planned=0,done=0,rpeSum=0,rpeN=0;
  for(let i=0;i<7;i++){
    const ds=new Date(mon.getTime()+i*DAY).toISOString().slice(0,10);
    if(sessionForDate(ds))planned++;
    if(S.done[ds])done++;
  }
  S.history.filter(h=>h.d>=monStr).forEach(h=>{if(h.rpe){rpeSum+=h.rpe;rpeN++}});
  const prThisWeek=S.hyroxPRs.some(p=>p.date>=monStr&&p.sec===Math.min(...S.hyroxPRs.map(x=>x.sec)));
  return {planned,done,avgRpe:rpeN?Math.round(rpeSum/rpeN*10)/10:null,prThisWeek};
}
