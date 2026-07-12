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
  return {key:k, swapped:EX[k].zone&&S.profile.pijnzones.includes(EX[k].zone)};
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
  /* per-datum oefening-overrides toepassen op de main-set */
  const ov=S.overrides[ds];
  if(ov&&ov.ex){
    w.main=w.main.map((it,i)=>{
      if(ov.ex.rm&&ov.ex.rm.includes(i))return null;
      if(ov.ex.swap&&ov.ex.swap[i]&&typeof it[0]==='object'){
        return [{key:ov.ex.swap[i],swapped:EX[ov.ex.swap[i]].zone&&S.profile.pijnzones.includes(EX[ov.ex.swap[i]].zone)}, it[1]];
      }
      return it;
    }).filter(Boolean);
    if(ov.ex.add)ov.ex.add.forEach(a=>w.main.push([{key:a.key,swapped:false}, a.dose||'3x8']));
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
/* basis-sessie uit het gegenereerde plan (zonder overrides) */
function basePlanSession(ds){
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
  return {type:ov.type||base.type, idx:base?base.idx:0};
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

/* ---------------- RECOVERY / STREAK / QUESTS ---------------- */
function computeRecovery(sleep,feel){
  const recent=S.rpeLog.slice(-3);
  const rpePen=recent.filter(r=>r>=9).length*12 + (recent.length?Math.max(0,(recent.reduce((a,b)=>a+b,0)/recent.length-7))*6:0);
  S.recovery=Math.max(5,Math.min(100,Math.round(sleep*12+feel*10-rpePen)));
  S.energy=Math.max(5,Math.min(100,Math.round(sleep*14+feel*8)));
}
function dayMode(){return S.recovery<40?'light':S.recovery>=70?'push':'normal'}
function updateStreak(){
  if(!S.lastActive)return;
  const gap=Math.floor((new Date(todayStr())-new Date(S.lastActive))/DAY);
  if(gap===3){
    const wk=todayStr().slice(0,8);
    if(S.freezeWeek!==wk){S.freezeWeek=wk;save();toast('STREAK-FREEZE ingezet [1x/week]')}
    else S.streak=0;
  }else if(gap>3)S.streak=0;
}
function bumpStreakIfNew(){
  if(S._streakDay!==todayStr()){S.streak++;S._streakDay=todayStr()}
  save();
}
function todaysQuest(){const d=new Date(todayStr());return QUESTS[(d.getDate()+d.getMonth())%QUESTS.length]}

/* ---------------- BADGES / MIJLPALEN ---------------- */
function checkBadges(){
  BADGES.forEach(b=>{
    if(!S.badges.includes(b.id)&&b.test()){
      S.badges.push(b.id);save();
      toast(`🏅 BADGE: ${b.name}`);
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
