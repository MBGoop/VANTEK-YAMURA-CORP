/* GRIT — storage.js
   localStorage is fragiel: browsercache wissen = alles weg.
   Daarom: versienummer + migratie + automatische schaduwback-up + export/import. */
'use strict';

const STORE_KEY  = 'grit2';
const BACKUP_KEY = 'grit2-backup';
const SCHEMA_VERSION = 8;

/* Zet oude opslag om naar het huidige schema. Draait 1x na een update. */
function migrate(){
  if(!S) return;
  const v = S.schemaVersion || 1;

  /* Ontbrekende velden ALTIJD aanvullen, niet achter de versiecheck.
     Fout in v3.x: het versienummer werd niet opgehoogd bij nieuwe velden,
     waardoor bestaande gebruikers hyroxPR/customEx nooit kregen en de
     RACE-tab crashte. Idempotent aanvullen is veiliger dan slim zijn. */
  if(!S.hr) S.hr = { maxHR:180, restLog:[], baseline:null };
  if(!S.hr.maxHR)   S.hr.maxHR = 180;
  if(!S.hr.restLog) S.hr.restLog = [];
  if(S.hyroxStart === undefined) S.hyroxStart = null;
  if(S.anim === undefined) S.anim = 'auto';
  if(!S.customEx)  S.customEx  = {};
  if(!S.hyroxPR)   S.hyroxPR   = {};
  if(S.lastReview === undefined) S.lastReview = null;
  if(!S.overrides) S.overrides = {};
  /* v5: ceremonie, weekquest, check-in-kaart, review-beloning */
  if(S.weekQuestClaimed === undefined) S.weekQuestClaimed = null;
  if(S.lastReviewReward === undefined) S.lastReviewReward = null;
  if(S.checkinSnoozed  === undefined) S.checkinSnoozed  = null;
  if(S.lastLogAt       === undefined) S.lastLogAt       = 0;
  /* v6: thema + animatie standaard AAN. 'auto' bleek een valkuil: de OS-
     instelling 'verminder beweging' zette de Tamagotchi onzichtbaar stil.
     Eenmalige migratie; AUTO blijft beschikbaar als bewuste keuze. */
  if(S.theme === undefined) S.theme = 'tama';
  /* v7: XP-grootboek + verval. Bestaande gebruikers starten met een leeg
     grootboek: hun oude XP is niet geboekt, dus die kan niet exact worden
     teruggedraaid. Dat melden we eerlijk in de wis-bevestiging i.p.v. te
     doen alsof het exact is. */
  if(!S.ledger) S.ledger = [];
  /* v8: dagelijkse side-quests verwijderd. De oude S.quests-data laten we
     staan (schaadt niet, kost niets) maar er wordt niets meer aan toegevoegd.
     De weekquest blijft: die is gebouwd op je echte trainingsdata, niet op
     losse tekstjes. */
  if(!S.quests) S.quests = {};
  if(S.decayCharged === undefined) S.decayCharged = 0;
  if(S.decayPot === undefined) S.decayPot = 0;
  if(S.schemaVersion < 6 && S.anim === 'auto') S.anim = 'aan';
  /* v6: blessure/alternatief-systeem verwijderd — velden neutraliseren */
  if(S.profile){ S.profile.pijnzones = []; S.profile.parqFlag = false; }

  if(v < SCHEMA_VERSION){
    S.schemaVersion = SCHEMA_VERSION;
    save();
    console.log(`[GRIT] migratie v${v} -> v${SCHEMA_VERSION}`);
  }
}

/* Schaduwback-up: bewaart de vorige goede staat onder een 2e sleutel.
   Als de hoofdsleutel ooit corrupt raakt, is dit je vangnet. */
function autoBackup(){
  try{
    const cur = localStorage.getItem(STORE_KEY);
    if(cur && cur.length > 20) localStorage.setItem(BACKUP_KEY, cur);
  }catch(e){}
}

function exportBackup(){
  const blob = new Blob([JSON.stringify(S,null,1)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `grit-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  if(typeof toast==='function') toast('BACK-UP GEDOWNLOAD');
}

function importBackup(file, cb){
  const r = new FileReader();
  r.onload = () => {
    try{
      const data = JSON.parse(r.result);
      if(!data || typeof data !== 'object') throw new Error('geen geldig bestand');
      autoBackup();
      S = Object.assign(structuredClone(DEFAULT), data);
      migrate(); save();
      if(typeof toast==='function') toast('BACK-UP HERSTELD');
      cb && cb(true);
    }catch(e){
      if(typeof toast==='function') toast('FOUT: ONGELDIG BESTAND');
      cb && cb(false);
    }
  };
  r.readAsText(file);
}

/* Herstel uit de schaduwback-up (laatste redmiddel binnen de app zelf) */
function restoreShadow(){
  try{
    const b = localStorage.getItem(BACKUP_KEY);
    if(!b) return false;
    S = Object.assign(structuredClone(DEFAULT), JSON.parse(b));
    migrate(); save();
    return true;
  }catch(e){ return false; }
}

/* =====================================================
   LEESBARE EXPORT (v6)
   Back-up (JSON) blijft bestaan voor herstel — die is voor de machine.
   Dit hier is voor jou: wat deed ik, wanneer, met welk gewicht, en
   hoe verhield zich dat tot mijn planning.
===================================================== */
function download(name, text, mime){
  const blob=new Blob([text],{type:mime||'text/plain;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;a.click();
  URL.revokeObjectURL(a.href);
}
function sesLabelFor(h){
  if(!h) return '';
  if(h.type&&h.type.startsWith('ext_')){
    const k=h.type.slice(4);
    return (typeof EXT_TYPES!=='undefined'&&EXT_TYPES[k]?EXT_TYPES[k].lab:'EXTERN');
  }
  return typeof dayLabel==='function'?dayLabel(h.type):(h.type||'SESSIE');
}
/* Alle dagen tussen eerste plan-dag en vandaag, met gepland + gedaan. */
function buildLogRows(){
  const rows=[];
  const start=S.planStart||Object.keys(S.done).sort()[0]||todayStr();
  const d0=new Date(start), d1=new Date(todayStr());
  for(let d=new Date(d0); d<=d1; d.setDate(d.getDate()+1)){
    const ds=d.toISOString().slice(0,10);
    const ses=typeof sessionForDate==='function'?sessionForDate(ds):null;
    const gepland=ses?(typeof dayLabel==='function'?dayLabel(ses.type):ses.type):'rustdag';
    const h=(S.history||[]).filter(x=>x.d===ds);
    const gedaan=S.done[ds]?(h.length?h.map(sesLabelFor).join(' + '):'gelogd'):'';
    const rpe=h.length?h.map(x=>x.rpe).join('/'):'';
    const xp=h.reduce((a,x)=>a+(x.xp||0),0)||'';
    const km=h.map(x=>x.km).filter(Boolean).join('/');
    const dur=h.map(x=>x.dur).filter(Boolean).join('/');
    /* gewichten die op deze dag gelogd zijn */
    const gew=Object.entries(S.exLog||{}).flatMap(([k,arr])=>
      arr.filter(e=>e.d===ds).map(e=>`${(typeof EX!=='undefined'&&EX[k]?EX[k].n:k)} ${e.w}kg${e.r?` x${e.r}`:''}`)).join(', ');
    const plWk=ses&&ses.plan?`wk${ses.plan.week}/20 ${ses.plan.block}`:'';
    rows.push({ds,gepland,gedaan,status:S.done[ds]?'GEDAAN':(ses?'GEMIST':'-'),
               rpe,xp,km,dur,gew,notitie:(S.notes[ds]||'').replace(/[;\n\r]/g,' '),plan:plWk});
  }
  return rows;
}
/* CSV voor Excel — puntkomma's, want Nederlandstalige Excel verwacht die. */
function exportLogCSV(){
  const rows=buildLogRows();
  const head=['datum','week/blok','gepland','status','gedaan','rpe','duur_min','afstand_km','gewichten','xp','notitie'];
  const lines=[head.join(';')].concat(rows.map(r=>
    [r.ds,r.plan,r.gepland,r.status,r.gedaan,r.rpe,r.dur,r.km,r.gew,r.xp,r.notitie]
      .map(x=>String(x==null?'':x)).join(';')));
  download(`grit-logboek-${todayStr()}.csv`,'\uFEFF'+lines.join('\r\n'),'text/csv;charset=utf-8');
  if(typeof toast==='function')toast('LOGBOEK GEDOWNLOAD (CSV)');
}
/* Leesbaar tekstrapport — open in Kladblok, print, of stuur door. */
function exportLogTXT(){
  const rows=buildLogRows();
  const gedaan=rows.filter(r=>r.status==='GEDAAN').length;
  const gemist=rows.filter(r=>r.status==='GEMIST').length;
  const L=[];
  L.push('GRIT — TRAININGSLOGBOEK');
  L.push('VANTEK-YAMURA CORP — BUILDING STRONGER BODIES(TM)');
  L.push('='.repeat(60));
  L.push(`Specimen : ${S.creature.name} (level ${level()}, fase ${stage()}, ${Math.round(S.xp)} XP)`);
  L.push(`Periode  : ${rows.length?rows[0].ds:'-'} t/m ${todayStr()}`);
  L.push(`Sessies  : ${gedaan} gedaan, ${gemist} gemist  ·  streak ${S.streak}`);
  if(S.race&&S.race.date)L.push(`Wedstrijd: ${S.race.name} op ${S.race.date}`);
  if(S.hyroxPRs&&S.hyroxPRs.length){
    const best=S.hyroxPRs.reduce((a,b)=>a.sec<b.sec?a:b);
    L.push(`Benchmark: beste ${typeof fmtTime==='function'?fmtTime(best.sec):best.sec+'s'} (${best.date})`);
  }
  L.push('='.repeat(60));L.push('');
  rows.forEach(r=>{
    if(r.status==='-'&&!r.gedaan)return;                    /* lege rustdagen overslaan */
    L.push(`${r.ds}  [${r.status}]${r.plan?'  ('+r.plan+')':''}`);
    L.push(`   gepland : ${r.gepland}`);
    if(r.gedaan) L.push(`   gedaan  : ${r.gedaan}${r.dur?` — ${r.dur} min`:''}${r.km?` — ${r.km} km`:''}${r.rpe?` — RPE ${r.rpe}`:''}`);
    if(r.gew)    L.push(`   gewicht : ${r.gew}`);
    if(r.notitie)L.push(`   notitie : ${r.notitie}`);
    if(r.xp)     L.push(`   beloning: +${r.xp} XP`);
    L.push('');
  });
  download(`grit-logboek-${todayStr()}.txt`, L.join('\r\n'));
  if(typeof toast==='function')toast('LOGBOEK GEDOWNLOAD (TXT)');
}
