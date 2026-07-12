import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
const ROOT='/home/claude/gritv5';
const dom=new JSDOM(`<!DOCTYPE html><html><head><meta name="theme-color" content="#2e2450"></head><body><div id="app"></div></body></html>`,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
const w=dom.window,d=w.document;
w.fetch=async u=>{const t=fs.readFileSync(path.join(ROOT,String(u)),'utf8');return{ok:true,status:200,text:async()=>t,json:async()=>JSON.parse(t)}};
w.matchMedia=q=>({matches:q.includes('reduced-motion'),addEventListener(){}}); // simuleer 'verminder beweging' AAN!
w.structuredClone=o=>JSON.parse(JSON.stringify(o));
let queue=[];let id=0;
w.requestAnimationFrame=f=>{queue.push([++id,f]);return id};
w.cancelAnimationFrame=cid=>{queue=queue.filter(([i])=>i!==cid)};
const pump=()=>{const q=queue;queue=[];q.forEach(([,f])=>{try{f(16)}catch(e){console.log('FRAME-EXCEPTIE:',e.message)}})};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,p)=>p==='globalAlpha'?1:()=>{},set:()=>true});
const st={};
Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k]}});
w.AudioContext=function(){return{}};w.navigator.wakeLock={request:async()=>({release(){}})};
const errs=[];w.addEventListener('error',e=>errs.push(e.error?.message||e.message));
for(const f of ['data','core','storage','creature','planner','ui','train','timer','hr','race','review','views','pwa','boot'])
 {const s=d.createElement('script');s.textContent=fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8');d.body.appendChild(s);}
await new Promise(r=>setTimeout(r,300));
const P=(l,v)=>console.log(l.padEnd(32)+': '+v);

console.log('--- ONBOARDING: 4 STAPPEN, GEEN BLESSURE-STAP ---');
P('dots', d.querySelectorAll('.dots span').length+' (4 verwacht)');
d.querySelector('#ob-n').value='THEMA'; d.querySelector('#ob-go').click();
P('stap 2', d.querySelector('#obstep h2').textContent);
d.querySelector('#ob-niv .chip[data-v=gemiddeld]').click(); d.querySelector('#ob-go').click();
P('stap 3 (= uitrusting?)', d.querySelector('#obstep h2').textContent);
d.querySelector('#ob-run .chip[data-v=buiten]').click(); d.querySelector('#ob-go').click();
P('stap 4 activator', d.querySelector('#ob-go').textContent.trim());
d.querySelector('#ob-d .chip[data-v="4"]').click(); d.querySelector('#ob-t .chip[data-v="30"]').click();
d.querySelector('#ob-go').click(); await new Promise(r=>setTimeout(r,100));
P('actief zonder parq', w.eval('S.profile.niveau')+' / parq='+w.eval('S.profile.parqFlag'));

console.log('\n--- ANIMATIE: default AAN, zelfs met reduce-motion OS ---');
P('REDUCED (OS-instelling)', w.eval('REDUCED'));
P('S.anim', w.eval('S.anim'));
P('motionOff()', w.eval('motionOff()')+' (false verwacht)');
const t0=w.eval('SC.t'); for(let i=0;i<8;i++)pump();
P('frames', t0+' -> '+w.eval('SC.t')+' (loopt)');

console.log('\n--- THEMA-SYSTEEM ---');
P('data-theme default', d.documentElement.dataset.theme);
P('scenepalet tama', w.eval('pal()[3]'));
w.eval("S.theme='dmg';applyTheme()");
P('data-theme na switch', d.documentElement.dataset.theme);
P('scenepalet dmg', w.eval('pal()[3]')+' (#b6d98a verwacht)');
P('theme-color meta', d.querySelector('meta[name=theme-color]').getAttribute('content'));
w.eval("S.theme='bw';applyTheme()"); P('bw palet', w.eval('pal()[0]'));
w.eval("S.theme='hyrox';applyTheme()"); P('hyrox accent', w.eval('pal()[3]'));
w.eval("S.theme='tama';applyTheme()");

console.log('\n--- MOBILE FIXES & STROOMLIJNING ---');
w.render('trn');
P('actiegrid aanwezig', d.querySelector('.acts')?'OK (2x2 grid)':'FOUT');
P('geen ALT-knoppen in sessie', d.querySelector('[data-k]')?'FOUT':'OK');
w.eval("editSessionSheet(todayStr())");
const btns=d.querySelectorAll('.overlay .exbtns')[0];
P('bewerk-knoppen per rij', btns?btns.querySelectorAll('button').length+' (4: geen WISSEL)':'geen sessie vandaag — ok');
d.querySelector('.overlay')?.remove();
w.render('mon');
P('MISSIES samengevoegd', d.body.innerHTML.includes('MISSIES')&&!d.body.innerHTML.includes('<h2 style="margin:0">SIDE-QUEST')?'OK':'FOUT');
P('badges weg van monitor', d.querySelector('#allbadges')?'FOUT':'OK');
w.render('crp');
P('badges in CORP', d.querySelector('#allbadges')?'OK':'FOUT');
P('themapicker in SYSTEEM', d.querySelector('#theme-pick')?'OK':'FOUT');
console.log('\nfouten: '+(errs.length?errs.join('|'):'geen'));

// extra: forceer een trainingsdag en hertest het actiegrid
console.log('\n--- ACTIEGRID OP TRAININGSDAG ---');
w.eval("S.dayOffset=0");
const found=(()=>{for(let i=0;i<7;i++){const dt=new Date();dt.setDate(dt.getDate()-0);const probe=w.eval(`(()=>{for(let i=0;i<7;i++){const d=new Date(todayStr());d.setDate(d.getDate()+i);const ds=d.toISOString().slice(0,10);if(sessionForDate(ds))return i}return -1})()`);return probe}})();
if(found>0){ w.eval(`S.dayOffset=${-found}`); } // schuif plan zodat vandaag een sessie heeft
w.render('trn');
console.log('acts-grid nu'.padEnd(32)+': '+(d.querySelector('.acts')?'OK — 4 knoppen in 2x2':'nog steeds rustdag'));
if(d.querySelector('.acts'))console.log('knoppen'.padEnd(32)+': '+[...d.querySelectorAll('.acts button')].map(b=>b.textContent).join(' | '));
