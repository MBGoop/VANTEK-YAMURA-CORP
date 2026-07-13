/* GRIT — core.js  (gesplitst uit index.html, gedrag ongewijzigd) */
/* =====================================================
   GRIT v3 — Specimen Growth Monitor · VANTEK-YAMURA CORP
   Vanilla JS · localStorage · ?test = testmodus
===================================================== */
'use strict';
const $=s=>document.querySelector(s);
const APP=$('#app');
const TEST=new URLSearchParams(location.search).has('test');
const DAY=86400000;
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Thema als data-attribuut op <html>; de CSS-tokens doen de rest.
   theme-color meta volgt mee zodat de OS-balk klopt in PWA-modus. */
const THEME_META={tama:'#2e2450',dmg:'#0f2a12',bw:'#181818',hyrox:'#15171c'};
function applyTheme(){
  const th=(S&&S.theme)||'tama';
  document.documentElement.dataset.theme=th;
  const m=document.querySelector('meta[name=theme-color]');
  if(m)m.setAttribute('content',THEME_META[th]||THEME_META.tama);
}
const todayStr=()=>{const d=new Date(Date.now()+(S?S.dayOffset*DAY:0));return d.toISOString().slice(0,10)};
const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;

/* ---------------- STATE ---------------- */
let S=null;
function load(){try{const r=localStorage.getItem('grit2');S=r?Object.assign(structuredClone(DEFAULT),JSON.parse(r)):structuredClone(DEFAULT)}catch(e){S=structuredClone(DEFAULT)}}
function save(){localStorage.setItem('grit2',JSON.stringify(S))}
/* tekstgrootte + comfort-modus (scanlines/animatie) toepassen */
function applyVisuals(){
  document.documentElement.style.setProperty('--fs', S.fontScale||1);
  document.body.classList.toggle('comfort', !!S.comfort);
}
/* Animatie uit enkel als comfort-modus AAN is.
   Animatie staat nu standaard ALTIJD aan (geen keuze meer).
   Android's batterijbesparing en reduced-motion negeren we hier — 
   het wezen is visuele feedback en hoort te bewegen. */
function motionOff(){
  return S&&S.comfort?true:false;  /* alleen comfort-modus schakelt het uit */
}

/* Maandag van de week als sleutel — 1 bron van waarheid voor streak-freeze,
   weekquest en weekrapport. (Verhuisd uit review.js: planner.js laadt eerder.) */
function weekKey(ds){
  const d = new Date(ds || todayStr());
  const t = new Date(d);
  t.setDate(d.getDate() - ((d.getDay()+6)%7));
  return t.toISOString().slice(0,10);
}

/* ---------------- XP / LEVEL ---------------- */
const level=()=>Math.min(30,Math.floor(Math.sqrt(S.xp/40))+1);
const xpForNext=()=>40*Math.pow(level(),2);
const stage=()=>level()>=10?3:level()>=4?2:1;
/* ---------------- XP-GROOTBOEK ----------------
   Waarom: gainXP was een blinde optelling. Daardoor KON de app niet weten
   wat ze moest terugnemen bij een foute ingave — verwijderen voelde
   permanent. Elke XP/CR-mutatie krijgt nu een boekingsregel met bron,
   referentie en de stat-deltas. Verwijderen = exact terugboeken. */
function ledgerAdd(src, xp, cr, ref, st){
  if(!S.ledger)S.ledger=[];
  S.ledger.push({id:'L'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
                 d:todayStr(), src, xp:Math.round(xp), cr:Math.round(cr||0),
                 ref:ref||null, st:st||null});
  S.ledger=S.ledger.slice(-400);
}
/* Alle boekingen van één referentie (bv. 'ses:2026-07-13') terugdraaien. */
function revokeRef(ref){
  if(!S.ledger)return {xp:0,cr:0,found:false};
  const hit=S.ledger.filter(e=>e.ref===ref);
  if(!hit.length)return {xp:0,cr:0,found:false};
  let xp=0,cr=0;
  hit.forEach(e=>{
    xp+=e.xp; cr+=e.cr;
    if(e.st)Object.entries(e.st).forEach(([k,v])=>{S.stats[k]=Math.max(0,(S.stats[k]||0)-v)});
  });
  S.xp=Math.max(0,S.xp-xp);
  S.coins=Math.max(0,S.coins-cr);
  S.ledger=S.ledger.filter(e=>e.ref!==ref);
  save();
  return {xp,cr,found:true};
}
function gainXP(x,coins=0,src='overig',ref=null,st=null){
  const l0=level(), st0=stage();
  S.xp+=x; S.coins+=coins;
  ledgerAdd(src,x,coins,ref,st);
  if(level()>l0){
    /* Ceremonie i.p.v. toast: dit is het duurste beloningsmoment van de app. */
    if(typeof celebrateLevel==='function') celebrateLevel(l0, st0);
    else toast(`LEVEL ${level()} — ${S.creature.name} groeit`);
  }
  save();
}

/* ---------------- VERVAL (aftakeling) ----------------
   Regels, bewust begrensd:
   - 2 dagen genade: rustdagen zijn geen falen (bij 4x/week zijn er 3).
   - daarna -5 XP per gemiste dag.
   - je zakt NOOIT een level of fase: de vloer is de XP-drempel van je
     huidige level. Een mutatie afpakken zou de duurste beloning van de
     app vernietigen — dat is de grens.
   - een actieve streak-freeze pauzeert het verval (niet twee straffen).
   - alles komt in het grootboek: geen mysterieus verdwijnende punten. */
const DECAY_GRACE=2, DECAY_PER_DAY=5;
function levelFloorXP(){ return 40*Math.pow(level()-1,2); }
function daysInactive(){
  if(!S.lastActive)return 0;
  return Math.floor((new Date(todayStr())-new Date(S.lastActive))/DAY);
}
function applyDecay(){
  if(!S.lastActive)return;
  const gap=daysInactive();
  if(gap<=DECAY_GRACE)return;
  if(S.freezeWeek===weekKey())return;          /* vangnet actief -> geen verval */
  const due=gap-DECAY_GRACE;
  const already=S.decayCharged||0;
  const nieuwe=due-already;
  if(nieuwe<=0)return;
  const floor=levelFloorXP();
  const voor=S.xp;
  S.xp=Math.max(floor, S.xp-nieuwe*DECAY_PER_DAY);
  const verlies=Math.round(voor-S.xp);
  S.decayCharged=due;
  if(verlies>0){
    ledgerAdd('verval',-verlies,0,'decay:'+todayStr());
    S.decayPot=(S.decayPot||0)+verlies;        /* pot voor de comeback-bonus */
    if(typeof toast==='function')toast(`${S.creature.name} takelt af — -${verlies} XP`);
  }
  save();
}
/* Comeback: de weg terug moet korter voelen dan de val.
   Eerste sessie na verval geeft de helft van het verlies terug. */
function comebackBonus(){
  const pot=S.decayPot||0;
  S.decayCharged=0; S.decayPot=0;
  if(pot<=0){save();return 0;}
  const terug=Math.max(5,Math.round(pot*0.5));
  S.xp+=terug;
  ledgerAdd('comeback',terug,0,'comeback:'+todayStr());
  save();
  if(typeof toast==='function')toast(`${S.creature.name} veert op — +${terug} XP hersteld`);
  return terug;
}
function dominantStat(){
  const e=Object.entries(S.stats).sort((a,b)=>b[1]-a[1]);
  return e[0][1]===0?null:e[0][0];
}


/* ---------------- OEFENVIDEO ----------------
   Eigen link uit exercises.csv (kolom 'video') heeft voorrang. Is die leeg,
   dan bouwen we een gerichte zoeklink — zo staat er nooit een dood veld.
   Bewust GEEN embed: dat breekt offline-werking, blaast de app op en geeft
   copyright-gedoe bij een store-release. Een link naar buiten is hier juist. */
function videoURL(key){
  const e=EX[key]; if(!e)return null;
  if(e.video) return e.video;
  return 'https://www.youtube.com/results?search_query='+encodeURIComponent(e.n+' oefening techniek');
}
function openVideo(key){
  const u=videoURL(key); if(!u)return;
  window.open(u,'_blank','noopener');
}
