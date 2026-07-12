import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dom=new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
const w=dom.window,d=w.document;
w.fetch=async u=>{const t=fs.readFileSync(path.join(ROOT,String(u)),'utf8');return{ok:true,status:200,text:async()=>t,json:async()=>JSON.parse(t)}};
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.structuredClone=o=>JSON.parse(JSON.stringify(o));
let q=[],fr=0;w.requestAnimationFrame=f=>{fr++;if(fr<3)q.push(f);return fr};w.cancelAnimationFrame=()=>{q=[]};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});

// BELANGRIJK: simuleer MB's BESTAANDE opslag — schemaVersion 3, zonder hyroxPR
const oud={schemaVersion:3,profile:{naam:'MB',niveau:'beginner',pijnzones:['knie'],parqFlag:false},
  gear:{kbs:[12,16],bands:true,trap:false,pullup:false,lopen:'buiten'},
  creature:{variant:0,name:'GRIT'},stats:{power:5,speed:3,grit:4,mobility:2},
  done:{},quests:{},overrides:{},notes:{},exLog:{},history:[],rpeLog:[],badges:[],
  xp:100,coins:20,streak:2,energy:80,recovery:70,days:4,dur:45,equipped:[],
  hyroxPRs:[],plan:null,planStart:null,dayOffset:0,lastCheckin:null,lastActive:null,fontScale:1,comfort:false};
const st={grit2:JSON.stringify(oud)};
Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k]}});
w.AudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{value:0,setValueAtTime(){}}}),createGain:()=>({connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}}}),destination:{},currentTime:0}};
w.confirm=()=>true; w.navigator.wakeLock={request:async()=>({release(){}})};
const errs=[];w.console={log:()=>{},error:e=>errs.push(String(e)),warn:()=>{}};
w.addEventListener('error',e=>errs.push(e.error?.message||e.message));
for(const f of ['data','core','storage','creature','planner','ui','train','timer','hr','race','review','views','pwa','boot'])
 {const s=d.createElement('script');s.textContent=fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8');d.body.appendChild(s);}
await new Promise(r=>setTimeout(r,400));
const P=(l,v)=>console.log(l.padEnd(26)+': '+v);

console.log('--- MIGRATIE VAN BESTAANDE OPSLAG (v3, zonder hyroxPR) ---');
P('schemaVersion', w.eval('S.schemaVersion'));
P('hyroxPR aangemaakt', w.eval('S.hyroxPR&&typeof S.hyroxPR==="object"')?'✓':'✗');
P('customEx aangemaakt', w.eval('S.customEx&&typeof S.customEx==="object"')?'✓':'✗');
w.eval("generatePlan()");
w.eval("TRNSUB='race'"); w.render('trn');
P('RACE-tab', d.querySelector('#view').innerHTML.includes('SPLITS')?'✓ rendert nu wél':'✗ nog steeds leeg');

console.log('\n--- NAAMCONSISTENTIE (pijnzone knie) ---');
const ds=w.eval("todayStr()");
let ses=w.eval(`sessionForDate('${ds}')`);
if(!ses){ w.eval(`S.overrides['${ds}']={type:'strength'}`); ses=w.eval(`sessionForDate('${ds}')`); }
const main=w.eval(`sessionPlan('${ds}').main.filter(i=>typeof i[0]==='object')`);
const first=main[0];
P('training toont', w.eval(`itemName({key:'${first[0].key}',swapped:${!!first[0].swapped}})`));
P('bewerk-sheet toont', w.eval(`exLabel({key:'${first[0].key}',swapped:${!!first[0].swapped}})`));
P('zelfde naam?', w.eval(`itemName({key:'${first[0].key}',swapped:${!!first[0].swapped}})===exLabel({key:'${first[0].key}',swapped:${!!first[0].swapped}})`)?'✓ identiek':'✗ verschilt');
P('hint bij regressie', w.eval(`exHint('${first[0].key}',{swapped:${!!first[0].swapped}})`).replace(/<[^>]+>/g,'').slice(0,50));

console.log('\n--- BEWERKEN ---');
w.eval(`editSessionSheet('${ds}')`);
let o=[...d.querySelectorAll('.overlay')].pop();
const namesBefore=[...o.querySelectorAll('.ex.edit .nm')].map(x=>x.textContent);
P('oefeningen', namesBefore.join(' | ').slice(0,60));
P('knoppen per rij', [...o.querySelectorAll('.ex.edit')][0].querySelectorAll('.altbtn').length + ' (▲▼ SET WISSEL X)');
o.querySelector('[data-dn="0"]').click();           // eerste naar beneden
o=[...d.querySelectorAll('.overlay')].pop();
const namesAfter=[...o.querySelectorAll('.ex.edit .nm')].map(x=>x.textContent);
P('na ▼ verplaatst', namesAfter[0]===namesBefore[1] && namesAfter[1]===namesBefore[0] ? '✓ volgorde gewisseld':'✗');
P('bewaard in override', w.eval(`S.overrides['${ds}'].ex.list.length`)+' items');
// dose aanpassen
o.querySelector('[data-ed="0"]').click();
o=[...d.querySelectorAll('.overlay')].pop();
o.querySelector('#d-s').value='4'; o.querySelector('#d-r').value='12'; o.querySelector('#d-kg').value='16';
o.querySelector('#d-ok').click();
P('sets/reps/gewicht', w.eval(`(()=>{const x=S.overrides['${ds}'].ex.list[0];return x.dose+' @ '+x.kg+'KG'})()`));
// komt het terug in de training?
w.eval("TRNSUB='vandaag'"); w.render('trn');
P('zichtbaar in training', d.querySelector('#view').innerHTML.includes('4x12')?'✓ 4x12 staat er':'✗');
console.log('\nfouten:', errs.length?errs.slice(0,3):'geen ✓');
