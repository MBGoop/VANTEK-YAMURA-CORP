/* GRIT — ui.js  (gesplitst uit index.html, gedrag ongewijzigd) */
/* ---------------- UI HELPERS ---------------- */
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}
function sheet(html){
  const o=document.createElement('div');o.className='overlay';
  o.innerHTML=`<div class="sheet">${html}</div>`;
  o.addEventListener('click',e=>{if(e.target===o)o.remove()});
  document.body.appendChild(o);return o;
}
function meter(lab,val){return `<div class="meter"><div class="lab"><span>${lab}</span><span>${Math.round(val)}%</span></div><div class="bar"><div class="fill" style="width:${Math.min(100,val)}%"></div></div></div>`}

/* =====================================================
   ONBOARDING — CREW INTAKE (idem v2)
===================================================== */
const OB={step:0,data:{pijnzones:[],kbs:[],variant:0}};
const OB_STEPS=5;
function renderOnboarding(){
  cancelAnimationFrame(SC.raf);
  APP.innerHTML=`<div id="onb">
    <div class="corp">VANTEK-YAMURA CORP — BUILDING STRONGER BODIES(TM)</div>
    <div class="term-header" style="margin-top:10px">
      <h1>CREW INTAKE</h1>
      <div class="tiny dim">SPECIMEN GROWTH MONITOR v4.0</div>
    </div>
    <div class="dots">${Array.from({length:OB_STEPS},(_,i)=>`<span class="${i<=OB.step?'on':''}"></span>`).join('')}</div>
    <div id="obstep"></div>
  </div>`;
  [obProfile,obParq,obGear,obTime,obCreature][OB.step]($('#obstep'));
}
function obNext(){OB.step++;renderOnboarding()}
function obProfile(el){
  el.innerHTML=`
    <h2 style="font-size:10px;margin-bottom:4px">[01] NIVEAU</h2>
    <p class="tiny dim">Dit bepaalt je start-intensiteit. De rest leert de app van je logs.</p>
    <label>Trainingsniveau</label>
    <div class="chips" id="ob-niv">
      <button class="chip" data-v="beginner">BEGINNER</button>
      <button class="chip" data-v="gemiddeld">GEMIDDELD</button>
      <button class="chip" data-v="gevorderd">GEVORDERD</button>
    </div>
    <label>Startgewicht (kg) — optioneel, voor de gewichtsgrafiek</label>
    <input type="number" id="ob-g" inputmode="decimal" value="${OB.data.gewicht||''}" placeholder="bv. 80 (mag leeg)">
    <button class="btn" id="ob-go" style="margin-top:18px">VERDER &gt;</button>`;
  let niv=OB.data.niveau||null;
  el.querySelectorAll('#ob-niv .chip').forEach(c=>{if(c.dataset.v===niv)c.classList.add('sel');c.onclick=()=>{niv=c.dataset.v;el.querySelectorAll('#ob-niv .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel')}});
  $('#ob-go').onclick=()=>{
    if(!niv){toast('KIES EEN NIVEAU');return}
    const g=parseFloat($('#ob-g').value);
    OB.data.niveau=niv; OB.data.gewicht=(g>20&&g<400)?g:null;
    obNext();
  };
}
function obParq(el){
  el.innerHTML=`
    <h2 style="font-size:10px;margin-bottom:4px">[02] VEILIGHEIDSCHECK</h2>
    <p class="tiny dim">Eerlijk antwoorden. Dit is GEEN medisch advies.</p>
    <label>Pijn op de borst of duizeligheid bij inspanning?</label>
    <div class="chips" id="ob-red"><button class="chip" data-v="nee">NEE</button><button class="chip" data-v="ja">JA</button></div>
    <label>Gevoelige zones (meerdere mogelijk)</label>
    <div class="chips" id="ob-pijn">
      <button class="chip" data-v="knie">KNIE</button>
      <button class="chip" data-v="rug">RUG</button>
      <button class="chip" data-v="schouder">SCHOUDER</button>
      <button class="chip" data-v="geen">GEEN</button>
    </div>
    <div id="ob-warn"></div>
    <button class="btn" id="ob-go" style="margin-top:18px">VERDER &gt;</button>`;
  let red=null;
  el.querySelectorAll('#ob-red .chip').forEach(c=>c.onclick=()=>{red=c.dataset.v;el.querySelectorAll('#ob-red .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');
    $('#ob-warn').innerHTML=red==='ja'?`<div class="warnbox">!! Check dit eerst met je huisarts. De monitor blijft bruikbaar, maar alles blijft rustig (low-intensity modus).</div>`:''});
  el.querySelectorAll('#ob-pijn .chip').forEach(c=>c.onclick=()=>{
    const v=c.dataset.v;
    if(v==='geen'){OB.data.pijnzones=[];el.querySelectorAll('#ob-pijn .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');return}
    el.querySelector('#ob-pijn .chip[data-v=geen]').classList.remove('sel');
    c.classList.toggle('sel');
    OB.data.pijnzones=[...el.querySelectorAll('#ob-pijn .chip.sel')].map(x=>x.dataset.v).filter(v=>v!=='geen');
  });
  $('#ob-go').onclick=()=>{if(red===null){toast('Beantwoord de eerste vraag');return}OB.data.parqFlag=red==='ja';obNext()};
}
function obGear(el){
  el.innerHTML=`
    <h2 style="font-size:10px;margin-bottom:4px">[03] UITRUSTING</h2>
    <label>Kettlebells (kg, komma-gescheiden, leeg=geen)</label>
    <input type="text" id="ob-kb" inputmode="numeric" placeholder="bv. 12, 16" value="${OB.data.kbs.join(', ')}">
    <label>Verder in huis:</label>
    <div class="chips" id="ob-g2">
      <button class="chip" data-v="bands">BANDS</button>
      <button class="chip" data-v="pullup">PULL-UP BAR</button>
      <button class="chip" data-v="trap">TRAP</button>
    </div>
    <label>Lopen?</label>
    <div class="chips" id="ob-run">
      <button class="chip" data-v="buiten">BUITEN</button>
      <button class="chip" data-v="binnen">BINNEN</button>
      <button class="chip" data-v="nee">LIEVER NIET</button>
    </div>
    <p class="tiny dim" style="margin-top:10px">Rugzak+boeken, stoel en handdoek rekenen we standaard mee.</p>
    <button class="btn" id="ob-go" style="margin-top:18px">VERDER &gt;</button>`;
  el.querySelectorAll('#ob-g2 .chip').forEach(c=>c.onclick=()=>c.classList.toggle('sel'));
  let run=null;
  el.querySelectorAll('#ob-run .chip').forEach(c=>c.onclick=()=>{run=c.dataset.v;el.querySelectorAll('#ob-run .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel')});
  $('#ob-go').onclick=()=>{
    if(!run){toast('Kies een loop-optie');return}
    OB.data.kbs=$('#ob-kb').value.split(',').map(s=>parseFloat(s)).filter(n=>n>0);
    OB.data.bands=!!el.querySelector('#ob-g2 .chip[data-v=bands].sel');
    OB.data.pullup=!!el.querySelector('#ob-g2 .chip[data-v=pullup].sel');
    OB.data.trap=!!el.querySelector('#ob-g2 .chip[data-v=trap].sel');
    OB.data.lopen=run;obNext();
  };
}
function obTime(el){
  el.innerHTML=`
    <h2 style="font-size:10px;margin-bottom:4px">[04] ROOSTER</h2>
    <label>Dagen per week</label>
    <div class="chips" id="ob-d">${[2,3,4,5,6].map(d=>`<button class="chip" data-v="${d}">${d}</button>`).join('')}</div>
    <label>Sessieduur</label>
    <div class="chips" id="ob-t">${[20,30,45,60].map(d=>`<button class="chip" data-v="${d}">${d} MIN</button>`).join('')}</div>
    <button class="btn" id="ob-go" style="margin-top:18px">VERDER &gt;</button>`;
  let d=null,t=null;
  el.querySelectorAll('#ob-d .chip').forEach(c=>c.onclick=()=>{d=+c.dataset.v;el.querySelectorAll('#ob-d .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel')});
  el.querySelectorAll('#ob-t .chip').forEach(c=>c.onclick=()=>{t=+c.dataset.v;el.querySelectorAll('#ob-t .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel')});
  $('#ob-go').onclick=()=>{if(!d||!t){toast('Kies dagen en duur');return}OB.data.days=d;OB.data.dur=t;obNext()};
}
function obCreature(el){
  el.innerHTML=`
    <h2 style="font-size:10px;margin-bottom:4px">[05] SPECIMEN TOEWIJZEN</h2>
    <p class="tiny dim">Kies je bio-klasse. Zelfde specimen, ander lab-milieu.</p>
    <div class="pick-variant" id="ob-c">
      ${[0,1,2].map(i=>`<button data-v="${i}"><canvas id="pc${i}"></canvas>${VARIANT_NAMES[i]}</button>`).join('')}
    </div>
    <label>Specimen-naam</label><input type="text" id="ob-n" maxlength="14" placeholder="bv. GRIT-9">
    <button class="btn" id="ob-go" style="margin-top:18px">ACTIVEER MONITOR</button>`;
  [0,1,2].forEach(i=>drawPreview($('#pc'+i),i,1));
  let sel=0; el.querySelector('#ob-c button').classList.add('sel');
  el.querySelectorAll('#ob-c button').forEach(b=>b.onclick=()=>{sel=+b.dataset.v;el.querySelectorAll('#ob-c button').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')});
  $('#ob-go').onclick=()=>{
    const name=($('#ob-n').value.trim()||'SPECIMEN-01').toUpperCase();
    S.profile={niveau:OB.data.niveau,pijnzones:OB.data.pijnzones,parqFlag:OB.data.parqFlag};
    S.gear={kbs:OB.data.kbs,bands:OB.data.bands,pullup:OB.data.pullup,trap:OB.data.trap,lopen:OB.data.lopen};
    S.days=OB.data.days;S.dur=OB.data.dur;
    S.creature={variant:sel,name};
    S.bw=OB.data.gewicht?[{d:todayStr(),kg:OB.data.gewicht}]:[];
    generatePlan();save();
    toast(`SPECIMEN "${name}" GEACTIVEERD`);
    render('mon');
  };
}

/* =====================================================
   HOOFD-UI · nav: MON / TRN / AGD / BIB / CORP
===================================================== */
let TAB='mon', TRNSUB='vandaag', BIBCAT='ALLE', AGDOFF=0;
function render(tab){
  TAB=tab||TAB;
  applyVisuals();
  if(!S.profile){renderOnboarding();return}
  if(ENG.raf&&!(TAB==='trn'&&(TRNSUB==='timer'||TRNSUB==='bench'))){stopEngine();}
  stopRest();
  if(TAB!=='mon')cancelAnimationFrame(SC.raf);
  updateStreak();save();
  const cons=consistency();
  APP.innerHTML=`
   <div class="corp">VANTEK-YAMURA CORP — BUILDING STRONGER BODIES(TM)</div>
   <div id="hud">
     <div class="stat">EN <b>${S.energy}%</b></div>
     <div class="stat">RC <b>${S.recovery}%</b></div>
     <div class="stat">CS <b>${cons}%</b></div>
     <div class="spacer"></div>
     <div class="stat">STRK <b>${S.streak}</b></div>
     <div class="stat">CR <b>${S.coins}</b></div>
   </div>
   <div id="view" style="padding-top:10px"></div>
   <nav id="mainnav">
     ${[['mon','MONITOR'],['trn','TRAINING'],['agd','AGENDA'],['vit','VITALS'],['bib','OEFENBIB'],['crp','CORP']].map(([id,t])=>`<button data-t="${id}" class="${TAB===id?'active':''}"><canvas class="nic" data-i="${id}"></canvas>${t}</button>`).join('')}
   </nav>`;
  document.querySelectorAll('#mainnav button').forEach(b=>{
    drawNavIcon(b.querySelector('.nic'),b.dataset.t,b.classList.contains('active'));
    b.onclick=()=>render(b.dataset.t);
  });
  ({mon:vMonitor,trn:vTrain,agd:vAgenda,vit:vVitals,bib:vBib,crp:vCorp})[TAB]($('#view'));
  if(S.lastCheckin!==todayStr())setTimeout(checkinSheet,400);
}
function consistency(){
  let planned=0,doneN=0;
  for(let i=0;i<14;i++){
    const d=new Date(new Date(todayStr())-i*DAY).toISOString().slice(0,10);
    if(sessionForDate(d)){planned++;if(S.done[d])doneN++}
  }
  return planned?Math.round(doneN/planned*100):100;
}

/* ---------------- MONITOR ---------------- */
function speech(){
  const mode=dayMode();
  const gap=S.lastActive?Math.floor((new Date(todayStr())-new Date(S.lastActive))/DAY):0;
  if(gap>=3)return `SPECIMEN INACTIEF. 10 minuten activiteit volstaat om het protocol te hervatten.`;
  if(mode==='light')return `HERSTELMODUS ACTIEF. Vandaag rustig — herstel is ook data.`;
  if(mode==='push')return `ALLE WAARDEN NOMINAAL. Specimen klaar voor zware belasting.`;
  return `SYSTEMEN OK. Wachtend op input van operator.`;
}
function vMonitor(el){
  const ses=sessionForDate(todayStr());
  const done=S.done[todayStr()];
  const mode=dayMode();
  const q=todaysQuest(), qDone=S.quests[todayStr()];
  const lvlPrev=40*Math.pow(level()-1,2);
  const xpPct=Math.min(100,(S.xp-lvlPrev)/(xpForNext()-lvlPrev)*100);
  el.innerHTML=`
   <div id="sceneWrap">
     <canvas id="scene"></canvas>
     <div class="lvlbar"><span class="tiny">L${level()}</span><div class="bar"><div class="fill" style="width:${xpPct}%"></div></div><span class="tiny">${VARIANT_NAMES[S.creature.variant]}</span></div>
     <div class="nameplate">&#9998; ${S.creature.name}<div class="sub">FASE ${stage()}/3 · ${dominantStat()?('DOMINANT: '+dominantStat().toUpperCase()):'GEEN DATA'}</div></div>
   </div>
   <div class="speech">${speech()}</div>
   <div class="panel">
     <div class="row"><h2 style="margin:0">DAGPROTOCOL</h2><div class="spacer"></div><span class="badge ${mode==='light'?'light':''}">${mode==='light'?'LIGHT':mode==='push'?'PUSH':'NORMAAL'}</span></div>
     ${ses?(done?`<p class="tiny" style="margin-top:8px">[OK] ${dayLabel(ses.type)} voltooid. Data verwerkt.</p>`
       :`<p class="tiny" style="margin-top:8px">${dayLabel(ses.type)} — ${S.dur} MIN — WEEK ${planWeek()}${planWeek()===4?' [DELOAD]':''}</p><button class="btn" style="margin-top:10px" id="gotrain">START PROTOCOL</button>`)
       :`<p class="tiny" style="margin-top:8px">RUSTDAG. Streak loopt door.</p>`}
     <button class="btn ghost" style="margin-top:8px" id="extlog">+ EXTERNE SESSIE REGISTREREN</button>
     <p class="tiny dim" style="margin-top:6px">Getraind buiten de app (MSA, gaan lopen...)? Log het hier — telt volwaardig mee.</p>
   </div>
   <div class="panel inv">
     <div class="row"><h2 style="margin:0">SIDE-QUEST</h2><div class="spacer"></div><span class="tiny dim">+${q.xp} XP</span></div>
     <p class="tiny" style="margin-top:6px">${q.t}</p>
     ${qDone?`<p class="tiny dim" style="margin-top:6px">[OK] uitgevoerd</p>`:`<button class="btn ghost" style="margin-top:10px" id="qbtn">MELD UITGEVOERD</button>`}
   </div>
   ${raceBanner()}
   <div class="panel">
     <h2>SPECIMEN-STATS</h2>
     ${meter('POWER',statPct('power'))}
     ${meter('SPEED',statPct('speed'))}
     ${meter('GRIT',statPct('grit'))}
     ${meter('MOBILITY',statPct('mobility'))}
   </div>
   ${(()=>{const ws=weekSummary();return `<div class="panel inv">
     <h2>DEZE WEEK</h2>
     <p>Sessies: <b style="color:var(--g3b)">${ws.done}/${ws.planned}</b>${ws.avgRpe?` &nbsp;·&nbsp; gem. RPE: <b style="color:var(--g3b)">${ws.avgRpe}</b>`:''}${ws.prThisWeek?' &nbsp;·&nbsp; 🏆 PR!':''}</p>
     ${ws.done>=ws.planned&&ws.planned>0?'<p class="dim">Alle geplande sessies gedaan. Sterk werk.</p>':ws.done>0?'<p class="dim">Goed bezig — hou het ritme vast.</p>':'<p class="dim">Nog een lege week. Eerste sessie zet de toon.</p>'}
   </div>`})()}
   ${S.badges.length?`<div class="panel">
     <h2>BADGES (${S.badges.length}/${BADGES.length})</h2>
     <div class="chips">${S.badges.slice(-6).map(id=>{const b=BADGES.find(x=>x.id===id);return b?`<span class="chip sel" style="font-size:7px">🏅 ${b.name}</span>`:''}).join('')}</div>
     <button class="btn small ghost" style="margin-top:8px" id="allbadges">ALLE BADGES</button>
   </div>`:''}
   ${TEST?testPanel():''}`;
  mountScene();
  const g=$('#gotrain');if(g)g.onclick=()=>{TRNSUB='vandaag';render('trn')};
  const xl=$('#extlog');if(xl)xl.onclick=externalLogSheet;
  const ab=$('#allbadges');if(ab)ab.onclick=badgeSheet;
  const qb=$('#qbtn');if(qb)qb.onclick=()=>{S.quests[todayStr()]=true;S.lastActive=todayStr();bumpStreakIfNew();gainXP(q.xp,5);checkBadges();toast(`+${q.xp} XP / +5 CR`);render()};
  bindTest();
}
function badgeSheet(){
  sheet(`<h2 style="font-size:10px">BADGES — ${S.badges.length}/${BADGES.length}</h2>
    ${BADGES.map(b=>{const got=S.badges.includes(b.id);return `<div class="block" style="${got?'':'opacity:.45'}">
      <div class="row"><span class="nm" style="color:${got?'var(--g3b)':'var(--g2)'}">${got?'🏅':'🔒'} ${b.name}</span></div>
      <p>${b.desc}</p></div>`}).join('')}`);
}
function statPct(k){return Math.min(100,S.stats[k]*2)}
function raceBanner(){
  const d=raceCountdown();
  if(d===null)return '';
  if(d<0)return `<div class="panel inv"><h2>MISSIE VOLBRACHT</h2><p class="tiny dim">${S.race.name} was op ${S.race.date}. Zet een nieuw doel in CORP.</p></div>`;
  const tap=d<=10?' — TAPER ACTIEF':'';
  return `<div class="panel"><div class="row"><h2 style="margin:0">🎯 ${S.race.name}</h2><div class="spacer"></div><span class="badge">${d===0?'VANDAAG!':'NOG '+d+' D'}</span></div><p class="tiny dim" style="margin-top:6px">Doeldatum: ${S.race.date}${tap}</p></div>`;
}

/* ---------------- TRAINING (subtabs: VANDAAG / TIMER / BENCHMARK) ---------------- */
const dayLabel=t=>({strength:'STRENGTH',strengthL:'STRENGTH LOWER',strengthU:'STRENGTH UPPER',conditioning:'CONDITIONING',conditioning2:'CONDITIONING',mixed:'MIXED',circuit:'HYROX-CIRCUIT',mobility:'MOBILITY',ext_gym:'GYM / KRACHT (EXTERN)',ext_run:'LOOP (EXTERN)'})[t]||t;
function vTrain(el){
  el.innerHTML=`
   <div class="subtabs">
     <button id="st-v" class="${TRNSUB==='vandaag'?'on':''}">VANDAAG</button>
     <button id="st-t" class="${TRNSUB==='timer'?'on':''}">TIMER</button>
     <button id="st-b" class="${TRNSUB==='bench'?'on':''}">BENCHMARK</button>
   </div>
   <div id="trnbody"></div>`;
  $('#st-v').onclick=()=>{TRNSUB='vandaag';render('trn')};
  $('#st-t').onclick=()=>{TRNSUB='timer';render('trn')};
  $('#st-b').onclick=()=>{TRNSUB='bench';render('trn')};
  ({vandaag:vToday,timer:vTimer,bench:vBench})[TRNSUB]($('#trnbody'));
}
function vToday(el){
  const week=planWeek();
  const dows=['ZO','MA','DI','WO','DO','VR','ZA'];
  const base=new Date(todayStr());const mon=new Date(base);mon.setDate(base.getDate()-((base.getDay()+6)%7));
  let strip='';
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);const ds=d.toISOString().slice(0,10);
    const ses=sessionForDate(ds);
    strip+=`<div class="wday ${ds===todayStr()?'today':''} ${S.done[ds]?'done':''}"><div class="t">${dows[d.getDay()]}</div>${ses?({strength:'STR',strengthL:'STR',strengthU:'STR',conditioning:'CND',conditioning2:'CND',mixed:'MIX',circuit:'RUN',mobility:'MOB'})[ses.type]:'--'}</div>`;
  }
  const ses=sessionForDate(todayStr());
  const mode=dayMode();
  let body='';
  if(!ses){body=`<div class="panel center"><p class="tiny">RUSTDAG GEPROGRAMMEERD.</p><p class="tiny dim" style="margin-top:6px">Zin in iets kleins? Side-quest op de monitor telt mee.</p></div>`}
  else{
    const w=sessionPlan(todayStr(), mode==='light');
    const tap=taperFactor(todayStr())<1;
    const lightNote=mode==='light'?`<div class="warnbox">HERSTELMODUS: sessie automatisch verlicht. Luisteren naar je lijf = winnen.</div>`:'';
    const taperNote=tap?`<div class="warnbox">TAPER ACTIEF: wedstrijd nadert, volume bewust afgebouwd zodat je fris aan de start staat.</div>`:'';
    const deloadNote=week===4?`<div class="warnbox">DELOAD-WEEK: dit is bewust lichter (minder sets). Je lijf herstelt en groeit juist in deze week — geen fout, wel de bedoeling.</div>`:'';
    /* plan-kaart: wat zegt het vaste Hyrox-schema over vandaag? */
    const pl=ses.plan;
    const planNote=pl?`<div class="panel" style="border-color:var(--g3)">
      <div class="lbl">HYROX WK ${pl.week}/20 — ${pl.block.toUpperCase()}</div>
      <p><b>${pl.titel}</b></p>
      <p class="tiny">${pl.detail}</p>
      <p class="tiny dim">Hartslag: ${pl.hr} &nbsp;·&nbsp; ${pl.focus}</p>
    </div>`:'';
    const note=S.notes[todayStr()];
    body=`<div class="panel">
      <div class="row"><h2 style="margin:0">${dayLabel(ses.type)}</h2><div class="spacer"></div>${ses.moved?'<span class="tiny dim">[VERPLAATST] </span>':''}<span class="tiny dim">WK ${week}${week===4?' DELOAD':''}</span></div>
      ${planNote}${lightNote}${taperNote}${deloadNote}
      ${renderBlock('WARM-UP',w.warm)}
      ${renderBlock('MAIN SET',w.main,true)}
      ${renderBlock('FINISHER',w.fin)}
      <div class="block"><h4>COOLDOWN</h4><div class="ex"><span>${w.cool[0]}</span></div></div>
      <div class="row" style="margin-top:10px">
        <button class="btn small ghost" id="rest60">RUST 60S</button>
        <button class="btn small ghost" id="rest90">RUST 90S</button>
        <button class="btn small ghost" id="opentimer">TIMER</button>
        <button class="btn small ghost" id="editday">AANPASSEN</button>
      </div>
      ${note?`<div class="block" style="margin-top:10px"><h4>JOUW NOTITIE</h4><p>${note}</p></div>`:''}
      ${S.done[todayStr()]?`<p class="center tiny" style="margin-top:12px">[OK] vandaag gelogd</p>`:`<button class="btn" style="margin-top:12px" id="logbtn">PROTOCOL LOGGEN</button>`}
      <p class="tiny dim center" style="margin-top:10px">ALT = pijnvrij alternatief. Aanhoudende pijn: professional raadplegen.</p>
    </div>`;
  }
  el.innerHTML=`<div class="week-strip">${strip}</div>${body}${TEST?testPanel():''}`;
  bindAlt(el);
  const lb=$('#logbtn');if(lb)lb.onclick=()=>logSheet(ses);
  const r6=$('#rest60'),r9=$('#rest90');
  if(r6)r6.onclick=()=>startRest(60);
  if(r9)r9.onclick=()=>startRest(90);
  const ed=$('#editday');if(ed)ed.onclick=()=>editSessionSheet(todayStr());
  const ot=$('#opentimer');if(ot)ot.onclick=()=>{TRNSUB='timer';render('trn')};
  bindTest();
}
function bindAlt(el){
  el.querySelectorAll('.altbtn').forEach(b=>b.onclick=()=>{
    const ex=b.closest('.ex,.station');
    ex.classList.add('swapped');
    ex.querySelector('.nm').textContent=EX[b.dataset.k].reg;
    b.remove();
    toast('ALTERNATIEF GELADEN — rustig opbouwen');
  });
}
function exHint(key){
  const e=EX[key];
  const parts=[];
  const sug=suggestKB(key);
  const last=lastLog(key);
  if(last)parts.push(`VORIGE: ${last.w}KG x ${last.r}`);
  else if(sug)parts.push(`TIP: ${sug}KG`);
  return parts.length?`<span class="hint">${parts.join(' · ')}</span>`:'';
}
function renderBlock(title,items,withHints=false){
  return `<div class="block"><h4>${title}</h4>${items.map(it=>{
    if(typeof it==='string')return `<div class="ex"><span>${it}</span></div>`;
    const [a,dose]=it;
    if(a==='march'||a==='ROND'){const e=a==='ROND'?null:EX.march;return `<div class="ex"><span class="nm">${e?e.n:''}</span><div class="spacer"></div><span class="dose">${dose}</span></div>`}
    const e=EX[a.key];
    const nm=a.swapped?e.reg:e.n;
    return `<div class="ex ${a.swapped?'swapped':''}">
      <div class="exmain"><span class="nm">${nm}</span>${withHints?exHint(a.key):''}</div>
      <span class="dose">${dose}</span>
      ${e.reg!=='—'&&!a.swapped?`<button class="altbtn" data-k="${a.key}">ALT</button>`:''}
    </div>`;
  }).join('')}</div>`;
}
/* rusttimer */
