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
/* animatie uit als comfort AAN of systeem reduced-motion */
/* Animatie uit? Volgorde: comfort-modus > expliciete keuze > systeeminstelling.
   Belangrijk: Android zet bij BATTERIJBESPARING prefers-reduced-motion aan.
   Daardoor stond het figuurtje stil zonder dat je iets had aangeraakt.
   Met S.anim='aan' overrule je dat. */
function motionOff(){
  if(S&&S.comfort)return true;
  if(S&&S.anim==='aan')return false;
  if(S&&S.anim==='uit')return true;
  return REDUCED;                 /* 'auto' */
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
function gainXP(x,coins=0){
  const l0=level(), st0=stage();
  S.xp+=x; S.coins+=coins;
  if(level()>l0){
    /* Ceremonie i.p.v. toast: dit is het duurste beloningsmoment van de app. */
    if(typeof celebrateLevel==='function') celebrateLevel(l0, st0);
    else toast(`LEVEL ${level()} — ${S.creature.name} groeit`);
  }
  save();
}
function dominantStat(){
  const e=Object.entries(S.stats).sort((a,b)=>b[1]-a[1]);
  return e[0][1]===0?null:e[0][0];
}
