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
