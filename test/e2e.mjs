import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
const ROOT='/home/claude/v6';
const dom=new JSDOM(`<!DOCTYPE html><html><head><meta name="theme-color" content="#2e2450"></head><body><div id="app"></div></body></html>`,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
const w=dom.window,d=w.document;
w.fetch=async u=>{const t=fs.readFileSync(path.join(ROOT,String(u)),'utf8');return{ok:true,status:200,text:async()=>t,json:async()=>JSON.parse(t)}};
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.structuredClone=o=>JSON.parse(JSON.stringify(o));
w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,p)=>p==='globalAlpha'?1:()=>{},set:()=>true});
const T=new Date().toISOString().slice(0,10);
const st={grit2:JSON.stringify({schemaVersion:6,profile:{niveau:'gemiddeld',pijnzones:[],parqFlag:false},gear:{kbs:[16,24],bands:true,trap:false,pullup:false,lopen:'buiten'},creature:{variant:0,name:'MICH'},stats:{power:0,speed:0,grit:0,mobility:0},done:{},quests:{},overrides:{},notes:{},exLog:{},history:[],rpeLog:[],badges:[],xp:100,coins:20,streak:2,energy:70,recovery:70,days:4,dur:45,equipped:[],owned:[],hyroxPRs:[],bw:[],race:null,plan:null,planStart:null,dayOffset:0,lastCheckin:T,lastActive:T,fontScale:1,comfort:false,theme:'tama',weekQuestClaimed:null,lastReviewReward:T,lastReview:T,lastLogAt:0,hr:{maxHR:180,restLog:[],baseline:null}})};
Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k]}});
w.AudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{value:0,setValueAtTime(){}}}),createGain:()=>({connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0}};
w.navigator.wakeLock={request:async()=>({release(){}})};
const errs=[];w.addEventListener('error',e=>errs.push(e.error?.message||e.message));
for(const f of ['data','core','storage','creature','planner','ui','train','timer','hr','race','review','views','pwa','boot'])
 {const s=d.createElement('script');s.textContent=fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8');d.body.appendChild(s);}
await new Promise(r=>setTimeout(r,400));
const P=(l,v)=>console.log(l.padEnd(34)+': '+v);

// zorg dat vandaag een trainingsdag is
// forceer een sessie op vandaag via een override (robuuster dan dayOffset)
w.eval("S.overrides[todayStr()]={type:'strength'};save()");
w.render('trn');
P('trainingsdag actief', d.querySelector('#logbtn')?'ja':'NEE — rustdag');

console.log('\n--- SESSIE LOGGEN VIA DE UI ---');
const xp0=w.eval('S.xp'), cr0=w.eval('S.coins');
d.querySelector('#logbtn').click();
await new Promise(r=>setTimeout(r,80));
const wIn=d.querySelector('[data-wk]');
if(wIn){ wIn.value='24'; const k=wIn.dataset.wk; d.querySelector(`[data-rk="${k}"]`).value='10';
  P('gewicht ingevuld voor', k+' = 24kg x10'); }
d.querySelector('#lg-note').value='testsessie';
d.querySelector('#lg-go').click();
await new Promise(r=>setTimeout(r,80));
P('XP / CR na loggen', `${xp0}->${w.eval('S.xp')} | ${cr0}->${w.eval('S.coins')}`);
P('stats', JSON.stringify(w.eval('S.stats')));
P('grootboek-ref', w.eval("S.ledger[S.ledger.length-1].ref")+' xp='+w.eval("S.ledger[S.ledger.length-1].xp"));
P('gewicht opgeslagen', JSON.stringify(w.eval('S.exLog')).slice(0,60));

console.log('\n--- GEWICHT ZICHTBAAR IN SESSIE + AGENDA ---');
w.render('trn');
P('@24kg in de sessieregel', d.body.innerHTML.includes('@24kg')?'OK — blijft staan':'FOUT');
w.eval("TRNSUB='agenda'"); w.render('trn');
w.eval("daySheet(todayStr())"); await new Promise(r=>setTimeout(r,50));
P('@24kg in agenda-daysheet', d.querySelector('.overlay')?.innerHTML.includes('@24kg')?'OK':'(daysheet toont sessie anders)');

console.log('\n--- LOG WISSEN: EXACT TERUGBOEKEN ---');
d.querySelector('#ds-unlog')?.click();
await new Promise(r=>setTimeout(r,60));
const cf=[...d.querySelectorAll('#cf-y')].pop();
P('bevestiging toont bedrag', /(\d+) XP/.test(d.body.innerHTML)?'ja':'nee');
cf.click(); await new Promise(r=>setTimeout(r,80));
P('XP / CR na wissen', `${w.eval('S.xp')} (start ${xp0}) | ${w.eval('S.coins')} (start ${cr0})`);
P('exact terug op start', (w.eval('S.xp')===xp0&&w.eval('S.coins')===cr0)?'OK':'FOUT');
P('stats teruggedraaid', JSON.stringify(w.eval('S.stats')));
P('gewicht van die dag weg', JSON.stringify(w.eval('S.exLog'))==='{}'?'OK':'nog: '+JSON.stringify(w.eval('S.exLog')));
P('done/history opgeruimd', `done=${Object.keys(w.eval('S.done')).length} history=${w.eval('S.history.length')}`);
console.log('\nfouten: '+(errs.length?errs.join(' | '):'geen'));
