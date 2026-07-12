import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dom=new JSDOM(`<!DOCTYPE html><html><head><meta name="theme-color" content="#2e2450"></head><body><div id="app"></div></body></html>`,
  {runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
const w=dom.window,d=w.document;
w.fetch=async u=>{const t=fs.readFileSync(path.join(ROOT,String(u)),'utf8');return{ok:true,status:200,text:async()=>t,json:async()=>JSON.parse(t)}};
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.structuredClone=o=>JSON.parse(JSON.stringify(o));
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,p)=>p==='globalAlpha'?1:()=>{},set:()=>true});
const st={grit2:JSON.stringify({schemaVersion:6,profile:{niveau:'beginner',pijnzones:[],parqFlag:false},gear:{kbs:[16],bands:false,trap:false,pullup:false,lopen:'buiten'},creature:{variant:0,name:'WD'},stats:{power:0,speed:0,grit:0,mobility:0},done:{},quests:{},overrides:{},notes:{},exLog:{},history:[],rpeLog:[],badges:[],xp:0,coins:0,streak:0,energy:70,recovery:70,days:3,dur:30,equipped:[],owned:[],hyroxPRs:[],bw:[],race:null,plan:null,planStart:null,dayOffset:0,lastCheckin:new Date().toISOString().slice(0,10),lastActive:null,fontScale:1,comfort:false,anim:'aan',theme:'tama',weekQuestClaimed:null,lastReviewReward:new Date().toISOString().slice(0,10),lastReview:'2026-07-06',lastLogAt:0,hr:{maxHR:180,restLog:[],baseline:null}})};
Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k]}});
w.AudioContext=function(){return{}};w.navigator.wakeLock={request:async()=>({release(){}})};
const errs=[];w.addEventListener('error',e=>errs.push(e.error?.message||e.message));
for(const f of ['data','core','storage','creature','planner','ui','train','timer','hr','race','review','views','pwa','boot'])
 {const s=d.createElement('script');s.textContent=fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8');d.body.appendChild(s);}
await new Promise(r=>setTimeout(r,300));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const P=(l,v)=>console.log(l.padEnd(38)+': '+v);
const running=async()=>{const a=w.eval('SC.t');await sleep(250);return w.eval('SC.t')>a};

P('1. lus draait op monitor', (await running())?'JA':'NEE');

// SCENARIO A (de gemelde bug): bevroren lus met verouderd raf-id
w.eval('cancelAnimationFrame(SC.raf)');            // browser 'vergeet' de frame
await sleep(1100);                                  // hartslag veroudert > 1s
P('2. lus kunstmatig bevroren', (await running())?'FOUT: draait nog':'OK: staat stil (raf-id nog truthy: '+(w.eval('SC.raf')?'ja':'nee')+')');
d.dispatchEvent(new w.Event('visibilitychange'));   // terugkeer in beeld
await sleep(100);
P('3. watchdog na visibilitychange', (await running())?'HERSTART — OK':'FOUT: nog bevroren');

// SCENARIO B: bfcache-herstel (pageshow)
w.eval('cancelAnimationFrame(SC.raf)'); await sleep(1100);
w.dispatchEvent(new w.Event('pageshow'));
await sleep(100);
P('4. watchdog na pageshow (bfcache)', (await running())?'HERSTART — OK':'FOUT');

// SCENARIO C: exception in één frame mag de lus niet doden
w.eval("const orig=SC.ctx; let n=0; SC.ctx=new Proxy({},{get:(t,p)=>p==='globalAlpha'?1:()=>{if(n++===3)throw new Error('kapotte frame')},set:()=>true});");
await sleep(300);
P('5. lus overleeft frame-exception', (await running())?'OK — zelfherstellend':'FOUT: dood');

// SCENARIO D: motionOff-gebruiker mag NIET geanimeerd worden door de watchdog
w.eval("S.anim='uit';save();mountScene()"); await sleep(100);
d.dispatchEvent(new w.Event('visibilitychange')); await sleep(100);
P('6. anim=UIT blijft statisch na watchdog', (await running())?'FOUT: beweegt':'OK — blijft stil');
w.eval("S.anim='aan';save();mountScene()");

// SCENARIO E: app-tabwissel blijft werken
w.render('trn'); await sleep(80); w.render('mon'); await sleep(80);
P('7. app-tabwissel trn->mon', (await running())?'OK':'FOUT');

console.log('\nfouten: '+(errs.length?errs.join(' | '):'geen'));
