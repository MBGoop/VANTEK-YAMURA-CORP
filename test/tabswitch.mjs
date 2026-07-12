import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dom=new JSDOM(`<!DOCTYPE html><html><head><meta name="theme-color" content="#2e2450"></head><body><div id="app"></div></body></html>`,
  {runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
const w=dom.window,d=w.document;
w.fetch=async u=>{const t=fs.readFileSync(path.join(ROOT,String(u)),'utf8');return{ok:true,status:200,text:async()=>t,json:async()=>JSON.parse(t)}};
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.structuredClone=o=>JSON.parse(JSON.stringify(o));
// ECHTE rAF van jsdom (pretendToBeVisual) — geen handmatige pomp dit keer
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,p)=>p==='globalAlpha'?1:()=>{},set:()=>true});
const st={grit2:JSON.stringify({schemaVersion:6,profile:{niveau:'beginner',pijnzones:[],parqFlag:false},gear:{kbs:[16],bands:false,trap:false,pullup:false,lopen:'buiten'},creature:{variant:0,name:'TAB'},stats:{power:0,speed:0,grit:0,mobility:0},done:{},quests:{},overrides:{},notes:{},exLog:{},history:[],rpeLog:[],badges:[],xp:0,coins:0,streak:0,energy:70,recovery:70,days:3,dur:30,equipped:[],owned:[],hyroxPRs:[],bw:[],race:null,plan:null,planStart:null,dayOffset:0,lastCheckin:new Date().toISOString().slice(0,10),lastActive:null,fontScale:1,comfort:false,anim:'aan',theme:'tama',weekQuestClaimed:null,lastReviewReward:new Date().toISOString().slice(0,10),lastReview:'2026-07-06',lastLogAt:0,hr:{maxHR:180,restLog:[],baseline:null}})};
Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k]}});
w.AudioContext=function(){return{}};w.navigator.wakeLock={request:async()=>({release(){}})};
const errs=[];w.addEventListener('error',e=>errs.push((e.error?.message||e.message)));
for(const f of ['data','core','storage','creature','planner','ui','train','timer','hr','race','review','views','pwa','boot'])
 {const s=d.createElement('script');s.textContent=fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8');d.body.appendChild(s);}
await new Promise(r=>setTimeout(r,300));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const stat=async(lbl)=>{
  const t1=w.eval('SC.t'); await sleep(250); const t2=w.eval('SC.t');
  const cv=d.querySelector('#scene');
  console.log(lbl.padEnd(34)+': SC.t '+t1+'->'+t2+(t2>t1?' [LOOPT]':' [STIL]')
    +' | canvas-in-DOM: '+(cv?'ja':'nee')
    +' | tekent naar juiste canvas: '+(cv? (w.eval('SC.cv')===cv?'ja':'NEE — DETACHED'):'-'));
};
await sleep(200);
await stat('1. start op MONITOR');
w.render('trn'); await sleep(100);
await stat('2. op TRAINING-tab');
w.render('mon'); await sleep(100);
await stat('3. terug op MONITOR');
w.render('vit'); await sleep(100); w.render('bib'); await sleep(100); w.render('mon'); await sleep(100);
await stat('4. na vit->bib->mon');
// simulatie browser-tab wissel: visibilitychange + rAF pauze
console.log('\n--- browser-tab simulatie (document.hidden) ---');
Object.defineProperty(d,'hidden',{value:true,configurable:true});
d.dispatchEvent(new w.Event('visibilitychange')); await sleep(150);
Object.defineProperty(d,'hidden',{value:false,configurable:true});
d.dispatchEvent(new w.Event('visibilitychange')); await sleep(100);
await stat('5. na hidden->visible');
console.log('\nfouten: '+(errs.length?errs.join(' | '):'geen'));
