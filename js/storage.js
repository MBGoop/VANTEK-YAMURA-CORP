/* GRIT — storage.js
   localStorage is fragiel: browsercache wissen = alles weg.
   Daarom: versienummer + migratie + automatische schaduwback-up + export/import. */
'use strict';

const STORE_KEY  = 'grit2';
const BACKUP_KEY = 'grit2-backup';
const SCHEMA_VERSION = 3;

/* Zet oude opslag om naar het huidige schema. Draait 1x na een update. */
function migrate(){
  if(!S) return;
  const v = S.schemaVersion || 1;
  if(v >= SCHEMA_VERSION){ S.schemaVersion = SCHEMA_VERSION; return; }

  // v1/v2 -> v3: hartslag-module toegevoegd
  if(!S.hr) S.hr = { maxHR:180, restLog:[], baseline:null };
  if(!S.hr.maxHR)   S.hr.maxHR = 180;
  if(!S.hr.restLog) S.hr.restLog = [];
  if(S.hyroxStart === undefined) S.hyroxStart = null;
  if(S.anim === undefined) S.anim = 'auto';
  if(!S.customEx)  S.customEx  = {};
  if(!S.hyroxPR)   S.hyroxPR   = {};
  if(S.lastReview === undefined) S.lastReview = null;   // vast Hyrox-plan nog niet gestart

  S.schemaVersion = SCHEMA_VERSION;
  save();
  console.log(`[GRIT] migratie v${v} -> v${SCHEMA_VERSION}`);
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
