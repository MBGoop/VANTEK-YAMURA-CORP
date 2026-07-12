/* GRIT — timer.js  (gesplitst uit index.html, gedrag ongewijzigd) */
let AC=null;
function actx(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}}return AC}
function blip(freq=440,dur=0.12,type='square',vol=0.15){
  const ac=actx();if(!ac)return;
  if(ac.state==='suspended')ac.resume();
  const o=ac.createOscillator(),g=ac.createGain();
  o.type=type;o.frequency.value=freq;
  g.gain.setValueAtTime(0,ac.currentTime);
  g.gain.linearRampToValueAtTime(vol,ac.currentTime+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+dur);
  o.connect(g);g.connect(ac.destination);
  o.start();o.stop(ac.currentTime+dur);
}
function buzz(ms){if(navigator.vibrate&&S.cues!==false)navigator.vibrate(ms)}
/* cue-types in space-sfeer */
function cueTick(){if(S.cues===false)return;blip(660,0.06,'square',0.08)}          /* zachte klok-tik */
function cueCountdown(){if(S.cues===false)return;blip(880,0.1,'sine',0.14);buzz(40)} /* 3-2-1 sonar-ping */
function cueSwitch(){if(S.cues===false)return;blip(1320,0.14,'square',0.16);blip(990,0.14,'square',0.12);buzz([60,40,60])} /* stationswissel: dubbele sci-fi */
function cueWork(){if(S.cues===false)return;blip(1046,0.16,'sawtooth',0.16);buzz(80)}  /* WERK: fel */
function cueRest(){if(S.cues===false)return;blip(392,0.2,'sine',0.14);buzz(50)}        /* RUST: laag/kalm */
function cueDone(){if(S.cues===false)return;[523,659,784,1046].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'square',0.16),i*140));buzz([100,60,100,60,200])} /* mission complete */
function flash(color){const el=$('#engineCard');if(!el)return;el.style.transition='none';el.style.boxShadow=`0 0 0 3px ${color}, 0 4px 0 #081a0a`;setTimeout(()=>{el.style.transition='box-shadow .4s';el.style.boxShadow='0 4px 0 #081a0a'},200)}

/* --- engine state --- */
const ENG={raf:null,running:false,paused:false,start:0,elapsed:0,lastWhole:-1,cfg:null,phase:null,round:0,onFinish:null};
/* Screen Wake Lock: je scherm mag niet in slaap vallen tijdens een AMRAP.
   Werkt in Chrome op Android. Kleine moeite, grootste ergernis weg. */
let WAKE=null;
async function wakeOn(){
  try{ if('wakeLock' in navigator && !WAKE) WAKE = await navigator.wakeLock.request('screen'); }
  catch(e){ /* geweigerd of niet ondersteund — timer werkt gewoon door */ }
}
function wakeOff(){ try{ WAKE && WAKE.release(); }catch(e){} WAKE=null; }
/* Terug uit de achtergrond? Lock opnieuw aanvragen, anders is hij weg. */
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && ENG.running) wakeOn();
});

function stopEngine(){if(ENG.raf)cancelAnimationFrame(ENG.raf);ENG.raf=null;ENG.running=false;ENG.paused=false;wakeOff()}


/* subtab TIMER */
let TIMERCFG=null;
function vTimer(el){
  /* voorstel op basis van dagsessie */
  const ses=sessionForDate(todayStr());
  const suggestType=ses&&(ses.type==='circuit')?'fortime':ses&&ses.type.startsWith('conditioning')?'hiit':'amrap';
  el.innerHTML=`
   <div class="panel" id="engineCard">
     <h2>WORKOUT ENGINE</h2>
     <p class="tiny dim">Kies een format, stel in, en train. Cues + trilling bij elke wissel. Werkt los of bovenop je dagsessie.</p>
     <div class="chips" style="margin-top:10px" id="fmtpick">
       ${Object.entries(FORMATS).map(([k,f])=>`<button class="chip ${TIMERCFG&&TIMERCFG.fmt===k?'sel':''}" data-f="${k}">${f.name}</button>`).join('')}
     </div>
     <div id="fmtcfg"></div>
   </div>
   <div class="panel inv">
     <div class="row"><h2 style="margin:0">CUES</h2><div class="spacer"></div>
       <button class="btn small ghost" id="cuetog">${S.cues===false?'UIT':'AAN'}</button></div>
     <p class="tiny dim">Space-bliepjes + trilling bij aftellen en wissels. Tik AAN/UIT om te wisselen.</p>
   </div>`;
  el.querySelectorAll('#fmtpick .chip').forEach(c=>c.onclick=()=>{
    TIMERCFG={fmt:c.dataset.f};renderTimerCfg();
    el.querySelectorAll('#fmtpick .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');
  });
  $('#cuetog').onclick=()=>{S.cues=(S.cues===false);save();if(S.cues!==false){actx();cueSwitch()}render('trn')};
  if(!TIMERCFG)TIMERCFG={fmt:suggestType};
  el.querySelector(`#fmtpick .chip[data-f="${TIMERCFG.fmt}"]`).classList.add('sel');
  renderTimerCfg();
}
function renderTimerCfg(){
  const box=$('#fmtcfg');if(!box)return;
  const f=TIMERCFG.fmt;
  let inputs='';
  if(f==='fortime')inputs=`<label>Tijdslimiet (min, 0 = geen)</label><input class="mini" type="number" id="c-cap" value="20" style="width:auto">`;
  if(f==='amrap')inputs=`<label>Duur (min)</label><input class="mini" type="number" id="c-dur" value="12" style="width:auto">`;
  if(f==='emom')inputs=`<label>Aantal minuten</label><input class="mini" type="number" id="c-min" value="10" style="width:auto">`;
  if(f==='hiit')inputs=`
     <div class="row"><div><label>Werk (sec)</label><input class="mini" type="number" id="c-work" value="30"></div>
     <div><label>Rust (sec)</label><input class="mini" type="number" id="c-rest" value="15"></div>
     <div><label>Rondes</label><input class="mini" type="number" id="c-rnd" value="8"></div></div>`;
  box.innerHTML=`
    <p class="tiny" style="margin-top:12px;line-height:2">${FORMATS[f].desc}</p>
    ${inputs}
    <button class="btn" style="margin-top:14px" id="c-go">START ${FORMATS[f].name}</button>`;
  $('#c-go').onclick=()=>{actx();startEngine(f,readCfg(f))};
}
function readCfg(f){
  const v=id=>{const e=$(id);return e?parseInt(e.value)||0:0};
  if(f==='fortime')return {cap:v('#c-cap')*60};
  if(f==='amrap')return {dur:v('#c-dur')*60};
  if(f==='emom')return {mins:v('#c-min')};
  if(f==='hiit')return {work:v('#c-work'),rest:v('#c-rest'),rounds:v('#c-rnd')};
}
/* de eigenlijke runner: full-screen overlay met grote klok */
function startEngine(fmt,cfg,opts={}){
  wakeOn();
  ENG.cfg={fmt,...cfg};ENG.running=true;ENG.paused=false;ENG.elapsed=0;ENG.lastWhole=-1;ENG.round=0;ENG.phase='work';
  ENG.onFinish=opts.onFinish||null;
  ENG.total = fmt==='amrap'?cfg.dur : fmt==='emom'?cfg.mins*60 : fmt==='hiit'?(cfg.work+cfg.rest)*cfg.rounds : (cfg.cap||0);
  ENG.start=Date.now();
  const ov=document.createElement('div');ov.className='overlay';ov.id='engineOverlay';
  ov.innerHTML=`<div class="sheet" style="text-align:center">
    <h2 style="font-size:10px" id="eng-title">${FORMATS[fmt].name}${opts.label?' — '+opts.label:''}</h2>
    <div id="eng-phase" class="badge" style="margin:8px auto;display:inline-block">GO</div>
    <div class="timer" id="eng-clock" style="font-size:40px">00:00</div>
    <div id="eng-sub" class="tiny dim"></div>
    <div id="eng-round" class="timer" style="font-size:18px;margin:6px 0"></div>
    ${fmt==='amrap'||fmt==='fortime'?`<button class="btn ghost" style="margin-top:6px" id="eng-count">RONDE +1 <span id="eng-rc">(0)</span></button>`:''}
    <div class="row" style="margin-top:12px">
      <button class="btn ghost" id="eng-pause">PAUZE</button>
      <button class="btn" id="eng-stop">${fmt==='fortime'?'FINISH':'STOP'}</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  let rc=0;
  const rcBtn=ov.querySelector('#eng-count');
  if(rcBtn)rcBtn.onclick=()=>{rc++;ov.querySelector('#eng-rc').textContent=`(${rc})`;cueTick();ENG.round=rc};
  ov.querySelector('#eng-pause').onclick=e=>{
    ENG.paused=!ENG.paused;
    if(ENG.paused){ENG.pauseAt=Date.now();e.target.textContent='HERVAT'}
    else{ENG.start+=Date.now()-ENG.pauseAt;e.target.textContent='PAUZE'}
  };
  ov.querySelector('#eng-stop').onclick=()=>finishEngine(rc);
  cueCountdown();
  tickEngine();
}
function tickEngine(){
  if(!ENG.running)return;
  ENG.raf=requestAnimationFrame(tickEngine);
  if(ENG.paused)return;
  const t=(Date.now()-ENG.start)/1000;
  ENG.elapsed=t;
  const clock=$('#eng-clock'),phaseEl=$('#eng-phase'),subEl=$('#eng-sub'),roundEl=$('#eng-round');
  const whole=Math.floor(t);
  const {fmt}=ENG.cfg;
  /* countdown-tikjes laatste 3 sec van een fase/totaal */
  if(fmt==='fortime'){
    if(clock)clock.textContent=fmtTime(t);
    if(ENG.total&&t>=ENG.total){cueDone();finishEngine(ENG.round);return}
    if(ENG.total&&subEl)subEl.textContent=`limiet ${fmtTime(ENG.total)}`;
  }
  else if(fmt==='amrap'){
    const left=Math.max(0,ENG.total-t);
    if(clock)clock.textContent=fmtTime(left);
    if(subEl)subEl.textContent='resterend';
    if(whole!==ENG.lastWhole&&left<=3&&left>0)cueCountdown();
    if(left<=0){cueDone();finishEngine(ENG.round);return}
  }
  else if(fmt==='emom'){
    const minIdx=Math.floor(t/60);
    const inMin=t%60;
    if(clock)clock.textContent=fmtTime(60-inMin);
    if(roundEl)roundEl.textContent=`MINUUT ${Math.min(minIdx+1,ENG.cfg.mins)} / ${ENG.cfg.mins}`;
    if(subEl)subEl.textContent='tot volgende minuut';
    if(minIdx!==ENG.round&&minIdx<ENG.cfg.mins){ENG.round=minIdx;cueSwitch();flash('var(--g3)');if(phaseEl)phaseEl.textContent='GO'}
    if(whole!==ENG.lastWhole&&(60-inMin)<=3&&(60-inMin)>0)cueCountdown();
    if(t>=ENG.total){cueDone();finishEngine(ENG.cfg.mins);return}
  }
  else if(fmt==='hiit'){
    const cycle=ENG.cfg.work+ENG.cfg.rest;
    const rnd=Math.floor(t/cycle);
    const inCycle=t%cycle;
    const inWork=inCycle<ENG.cfg.work;
    const phaseLeft=inWork?ENG.cfg.work-inCycle:cycle-inCycle;
    if(clock)clock.textContent=fmtTime(phaseLeft);
    if(roundEl)roundEl.textContent=`RONDE ${Math.min(rnd+1,ENG.cfg.rounds)} / ${ENG.cfg.rounds}`;
    /* fase-wissel detecteren */
    const nowPhase=inWork?'work':'rest';
    if(nowPhase!==ENG.phase||rnd!==ENG.round){
      ENG.phase=nowPhase;ENG.round=rnd;
      if(nowPhase==='work'){cueWork();flash('var(--g3b)');if(phaseEl){phaseEl.textContent='WERK';phaseEl.style.borderStyle='solid'}}
      else{cueRest();flash('var(--g2)');if(phaseEl){phaseEl.textContent='RUST';phaseEl.style.borderStyle='dashed'}}
    }
    if(subEl)subEl.textContent=inWork?'WERKEN':'rustig aan';
    if(whole!==ENG.lastWhole&&phaseLeft<=3&&phaseLeft>0)cueCountdown();
    if(t>=ENG.total){cueDone();finishEngine(ENG.cfg.rounds);return}
  }
  ENG.lastWhole=whole;
}
function finishEngine(rounds){
  stopEngine();
  const ov=$('#engineOverlay');if(ov)ov.remove();
  const sec=Math.round(ENG.elapsed);
  /* benchmark? aparte opslag + PR */
  if(ENG.onFinish){ENG.onFinish(sec,rounds);return}
  /* gewone timer: kleine beloning, telt als activiteit */
  S.lastActive=todayStr();S.lastLogAt=Date.now();bumpStreakIfNew();
  S.stats.grit+=2;
  gainXP(15,6);
  toast(`ENGINE KLAAR — ${fmtTime(sec)}${rounds?` / ${rounds} rondes`:''} · +15 XP`);
  render('trn');
}

/* =====================================================
   BENCHMARK — vast circuit, maandelijkse PR-test
===================================================== */
