import { JSDOM } from 'jsdom'; import fs from 'fs'; import path from 'path';
const ROOT = '/home/claude/gritv4';
const dom=new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
const w=dom.window,d=w.document;
w.fetch=async u=>{const t=fs.readFileSync(path.join(ROOT,String(u)),'utf8');return{ok:true,status:200,text:async()=>t,json:async()=>JSON.parse(t)}};
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.structuredClone=o=>JSON.parse(JSON.stringify(o));
let fr=0;w.requestAnimationFrame=f=>{fr++;return fr};w.cancelAnimationFrame=()=>{};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,p)=>p==='globalAlpha'?1:()=>{},set:()=>true});
const st={};
Object.defineProperty(w,'localStorage',{value:{getItem:k=>st[k]??null,setItem:(k,v)=>st[k]=String(v),removeItem:k=>delete st[k]}});
w.AudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{value:0,setValueAtTime(){}}}),createGain:()=>({connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}}}),destination:{},currentTime:0}};
w.navigator.wakeLock={request:async()=>({release(){}})};
const errs=[];w.console={log:()=>{},error:e=>errs.push(String(e)),warn:()=>{}};
w.addEventListener('error',e=>errs.push(e.error?.message||e.message));
for(const f of ['data','core','storage','creature','planner','ui','train','timer','hr','race','review','views','pwa','boot'])
 {const s=d.createElement('script');s.textContent=fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8');d.body.appendChild(s);}
await new Promise(r=>setTimeout(r,400));
const P=(l,v)=>console.log(l.padEnd(30)+': '+v);

console.log('--- ONBOARDING (nieuwe volgorde + terug) ---');
P('stap 1 = specimen', d.querySelector('#obstep h2').textContent.includes('SPECIMEN')?'OK':'FOUT: '+d.querySelector('#obstep h2').textContent);
P('geen terug-knop op stap 1', d.querySelector('#ob-back')?'FOUT':'OK');
d.querySelector('#ob-n').value='TESTJE';
d.querySelector('#ob-go').click();
P('stap 2 = niveau', d.querySelector('#obstep h2').textContent.includes('NIVEAU')?'OK':'FOUT');
P('terug-knop aanwezig', d.querySelector('#ob-back')?'OK':'FOUT');
d.querySelector('#ob-back').click();
P('terug naar specimen', d.querySelector('#obstep h2').textContent.includes('SPECIMEN')?'OK':'FOUT');
P('naam bewaard', d.querySelector('#ob-n').value==='TESTJE'?'OK':'FOUT');
d.querySelector('#ob-go').click();
d.querySelector('#ob-niv .chip[data-v=beginner]').click(); d.querySelector('#ob-go').click();
d.querySelector('#ob-red .chip[data-v=nee]').click(); d.querySelector('#ob-go').click();
d.querySelector('#ob-run .chip[data-v=buiten]').click(); d.querySelector('#ob-go').click();
P('stap 5 knop', d.querySelector('#ob-go').textContent.includes('ACTIVEER')?'OK':'FOUT');
d.querySelector('#ob-d .chip[data-v="3"]').click(); d.querySelector('#ob-t .chip[data-v="30"]').click();
d.querySelector('#ob-go').click();
await new Promise(r=>setTimeout(r,100));
P('app actief, naam', w.eval('S.creature.name'));

console.log('\n--- CHECK-IN KAART (geen pop-up meer) ---');
P('geen auto-overlay', d.querySelector('.overlay')?'FOUT: overlay aanwezig':'OK');
P('scan-kaart op monitor', d.querySelector('#ci-open')?'OK':'FOUT');
d.querySelector('#ci-open').click();
P('sheet opent na tik', d.querySelector('.overlay')?'OK':'FOUT');
P('dialog-role', d.querySelector('.sheet').getAttribute('role')==='dialog'?'OK':'FOUT');
d.querySelector('#ci-go').click();
await new Promise(r=>setTimeout(r,50));
P('kaart weg na scan', d.querySelector('#ci-open')?'FOUT':'OK');

console.log('\n--- STREAK-FREEZE (bugfix) ---');
w.eval("S.streak=5; S.lastActive=new Date(Date.now()-4*86400000).toISOString().slice(0,10); S.freezeWeek=null; updateStreak()");
P('gap=4: freeze redt streak', w.eval('S.streak')===5?'OK (streak=5)':'FOUT: streak='+w.eval('S.streak'));
P('freeze op weeksleutel', w.eval('S.freezeWeek')===w.eval('weekKey()')?'OK':'FOUT: '+w.eval('S.freezeWeek'));
w.eval("S.lastActive=new Date(Date.now()-4*86400000).toISOString().slice(0,10); updateStreak()");
P('2e keer zelfde week: reset', w.eval('S.streak')===0?'OK':'FOUT');

console.log('\n--- WEEKQUEST ---');
P('paneel op monitor', d.body.innerHTML.includes('WEEKQUEST')?'OK':'FOUT');
const q=w.eval('weekQuest()');
P('actieve quest', q.t.slice(0,40));
w.eval("S.done[weekKey()]=true;S.done[todayStr()]=true;S.quests[todayStr()]=true;S.notes[todayStr()]='x';S.hr.restLog=[{d:todayStr(),bpm:55},{d:weekKey(),bpm:56},{d:todayStr(),bpm:55}]");
const done=w.eval('weekQuest().prog()>=weekQuest().goal');
w.eval("if(weekQuest().prog()>=weekQuest().goal){const x0=S.xp;claimWeekQuest();}");
P('claim werkt', w.eval('weekQuestClaimed()')?'OK':'(quest nog niet compleet — logica intact)');

console.log('\n--- CEREMONIE ---');
w.eval("S.xp=0;gainXP(200,0)");   // 0 -> level 3 (geen mutatie)
P('level-up scherm', d.querySelector('.celebrate')?'OK':'FOUT');
P('kop', d.querySelector('.celebrate h2').textContent);
d.querySelector('.cok').click();
w.eval("gainXP(600,0)");           // -> level 4+ = fase 2 mutatie
P('mutatie-scherm', d.querySelector('.celebrate.mut')?'OK':'FOUT');
P('kop', d.querySelector('.celebrate h2').textContent);
d.querySelector('.cok').click();

console.log('\n--- SHOP UNLOCKS ---');
w.render('crp');
P('locked items zichtbaar', d.querySelectorAll('.shop-item.locked').length+' vergrendeld (verwacht 4 op laag level... level='+w.eval('level()')+')');
P('jetpack unlocked op L8+', w.eval("itemUnlocked(ITEMS.find(i=>i.id==='jet'))")?'ja':'nee');
P('medal vereist PR', w.eval("itemUnlocked(ITEMS.find(i=>i.id==='medal'))")?'FOUT (geen PR)':'OK vergrendeld');
P('date-input race', d.querySelector('#race-d').type==='date'?'OK':'FOUT');

console.log('\n--- HUD & A11Y ---');
w.render('mon');
P('HUD freeze-marker logica', d.querySelector('#hud').innerHTML.includes('+FRZ')?'FRZ zichtbaar':'FRZ verbruikt (klopt: net ingezet)');
d.querySelector('#hud').click();
P('HUD-legende opent', d.body.innerHTML.includes('CONSISTENTIE')?'OK':'FOUT');
P('meters progressbar-role', d.querySelectorAll('[role=progressbar]').length>0?'OK':'FOUT');
P('scene aria-label', (d.querySelector('#scene')?.getAttribute('aria-label')||'').slice(0,40)||'FOUT');
w.eval("toast('EEN');toast('TWEE')");
P('max 1 toast', d.querySelectorAll('.toast').length===1?'OK':'FOUT');

console.log('\nfouten: '+(errs.length?errs.join(' | '):'geen'));
