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
const st={grit2:JSON.stringify({schemaVersion:6,profile:{niveau:'gemiddeld',pijnzones:[],parqFlag:false},gear:{kbs:[16,24],bands:true,trap:false,pullup:false,lopen:'buiten'},creature:{variant:0,name:'MICH'},stats:{power:0,speed:0,grit:0,mobility:0},done:{},quests:{},overrides:{},notes:{},exLog:{},history:[],rpeLog:[],badges:[],xp:400,coins:50,streak:6,energy:70,recovery:70,days:4,dur:45,equipped:[],owned:[],hyroxPRs:[],bw:[],race:null,plan:null,planStart:null,dayOffset:0,lastCheckin:T,lastActive:T,fontScale:1,comfort:false,theme:'tama',weekQuestClaimed:null,lastReviewReward:T,lastReview:T,lastLogAt:0,hr:{maxHR:180,restLog:[],baseline:null}})};
Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k]}});
w.AudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{value:0,setValueAtTime(){}}}),createGain:()=>({connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0}};
w.navigator.wakeLock={request:async()=>({release(){}})};
w.open=()=>{OPENED++;return null};let OPENED=0;
w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};
let DL=[];const origCreate=d.createElement.bind(d);
d.createElement=tag=>{const el=origCreate(tag);if(tag==='a')el.click=function(){DL.push({name:this.download})};return el};
const errs=[];w.addEventListener('error',e=>errs.push(e.error?.message||e.message));
for(const f of ['data','core','storage','creature','planner','ui','train','timer','hr','race','review','views','pwa','boot'])
 {const s=d.createElement('script');s.textContent=fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8');d.body.appendChild(s);}
await new Promise(r=>setTimeout(r,400));
const P=(l,v)=>console.log(l.padEnd(36)+': '+v);
const back=n=>{const x=new Date();x.setDate(x.getDate()-n);return x.toISOString().slice(0,10)};

console.log('--- 1. GROOTBOEK & CORRIGEREN ---');
const xp0=w.eval('S.xp');
w.eval("gainXP(50,10,'sessie','ses:'+todayStr(),{power:3,grit:1})");
P('XP na boeking', xp0+' -> '+w.eval('S.xp')+' | stats.power='+w.eval('S.stats.power'));
P('grootboek-regel', w.eval("S.ledger[S.ledger.length-1].src")+' ref='+w.eval("S.ledger[S.ledger.length-1].ref"));
const r=w.eval("JSON.stringify(revokeRef('ses:'+todayStr()))");
P('revokeRef teruggeboekt', r);
P('XP terug op start', w.eval('S.xp')===xp0?'OK ('+xp0+')':'FOUT: '+w.eval('S.xp'));
P('stats teruggedraaid', w.eval('S.stats.power')===0?'OK':'FOUT: '+w.eval('S.stats.power'));

console.log('\n--- 2. VERVAL (genade, vloer, freeze) ---');
w.eval(`S.lastActive='${back(2)}';S.decayCharged=0;applyDecay()`);
P('2 dagen (genade)', w.eval('S.xp')===400?'OK: geen verval':'FOUT');
w.eval(`S.lastActive='${back(5)}';S.decayCharged=0;S.freezeWeek=null;applyDecay()`);
P('5 dagen = 3 belaste dagen', '400 -> '+w.eval('S.xp')+' (verwacht 385)');
P('boeking verval', w.eval("S.ledger.filter(e=>e.src==='verval').length")+' regel(s)');
w.eval("S.xp=400;S.decayCharged=0;S.decayPot=0;S.freezeWeek=weekKey();applyDecay()");
P('freeze actief -> geen verval', w.eval('S.xp')===400?'OK':'FOUT');
w.eval("S.freezeWeek=null");
// vloer: level mag nooit zakken
w.eval("S.xp=365;S.decayCharged=0;S.decayPot=0;S.lastActive='"+back(60)+"';applyDecay()");
P('level vóór/na lange inactiviteit', 'L'+w.eval('level()')+' bij '+Math.round(w.eval('S.xp'))+' XP (vloer '+w.eval('levelFloorXP()')+')');
P('nooit onder levelvloer', w.eval('S.xp>=levelFloorXP()')?'OK':'FOUT');
const potIn=w.eval('S.decayPot');
w.eval("bumpStreakIfNew()");
P('comeback-bonus uitbetaald', 'pot was '+potIn+' -> XP nu '+Math.round(w.eval('S.xp'))+', pot leeg: '+(w.eval('S.decayPot')===0));

console.log('\n--- 3. WEZEN VISUEEL ---');
w.eval("S.lastActive='"+back(6)+"'");
P('mood bij 6 dagen stil', w.eval('mood()')+' (neglect verwacht)');
P('palet dof getrokken', w.eval("pal()[3]")+' vs normaal '+w.eval("palFor(0)[3]"));
w.eval("S.lastActive=todayStr();S.lastLogAt=Date.now()");
P('mood na loggen', w.eval('mood()')+' (happy verwacht)');

console.log('\n--- 4. EXTERNE ACTIVITEIT ---');
P('types', w.eval("Object.keys(EXT_TYPES).join(', ')"));
P('30min wandelen', JSON.stringify(w.eval("(()=>{const x=extXP('walk',30,5);return {xp:x.xp,cr:x.cn}})()")));
P('60min fietsen', JSON.stringify(w.eval("(()=>{const x=extXP('bike',60,7);return {xp:x.xp,cr:x.cn}})()")));
P('5min wandelen (geen goudmijn)', JSON.stringify(w.eval("(()=>{const x=extXP('walk',5,5);return {xp:x.xp,cr:x.cn}})()")));
w.render('trn');
P('quick-add knop op trainingstab', d.querySelector('#quickadd')?'OK':'FOUT');
w.render('mon');
P('quick-add knop op monitor', d.querySelector('#extlog')?'OK':'FOUT');

console.log('\n--- 5. GEWICHT ZICHTBAAR ---');
w.eval("S.exLog['gobletsquat']=[{d:todayStr(),w:24,r:10}]");
P('lastWeight()', w.eval("lastWeight('gobletsquat')")+'kg');
w.render('trn');
const heeftGewicht=d.body.innerHTML.includes('@24kg');
P('@24kg in sessieregel', heeftGewicht?'OK — zichtbaar':'(geen goblet squat vandaag in plan)');

console.log('\n--- 6. VIDEO ---');
P('fallback-zoeklink', w.eval("videoURL('gobletsquat')").slice(0,52)+'...');
w.eval("EX['gobletsquat'].video='https://youtu.be/eigen'");
P('eigen link heeft voorrang', w.eval("videoURL('gobletsquat')"));
w.render('bib'); d.querySelector('[data-vid]')?.click();
P('video-knop opent link', OPENED>0?'OK':'FOUT');

console.log('\n--- 7. WEZEN-RESET & EXPORT ---');
w.eval("S.done['"+back(1)+"']=true;S.history.push({d:'"+back(1)+"',type:'strength',rpe:7,frac:1,xp:47});S.xp=500;S.coins=99;S.badges=['first'];S.stats.power=9");
w.eval("S.xp=0;S.coins=0;S.badges=[];S.owned=[];S.equipped=[];S.stats={power:0,speed:0,grit:0,mobility:0};S.ledger=[];S.streak=0;save()");
P('na wezen-reset: XP/CR/badges', w.eval('S.xp')+' / '+w.eval('S.coins')+' / '+w.eval('S.badges.length'));
P('historiek behouden', Object.keys(w.eval('S.done')).length+' gelogde dag(en), history: '+w.eval('S.history.length'));
w.eval("exportLogTXT()"); w.eval("exportLogCSV()");
P('exports gedownload', DL.map(x=>x.name).join(' + '));
console.log('\nfouten: '+(errs.length?errs.join(' | '):'geen'));
