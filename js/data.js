/* GRIT — data.js
   Laadt alle content uit /data/ en zet ze als globals klaar.
   Content aanpassen = een CSV/JSON bewerken. Nooit meer code aanraken. */
'use strict';

const DATA_FILES = {
  defaults : 'data/defaults.json',
  creature : 'data/creature.json',
  daytypes : 'data/daytypes.json',
  gamif    : 'data/gamification.json',
  formats  : 'data/formats.json',
  bench    : 'data/benchmark.json',
  types    : 'data/session-types.json'
};

/* Mini CSV-parser: puntkomma-gescheiden (Excel NL), respecteert "quotes". */
function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){
      if(c==='"'&&text[i+1]==='"'){cell+='"';i++}
      else if(c==='"'){q=false}
      else cell+=c;
    } else if(c==='"'){q=true}
    else if(c===';'){row.push(cell);cell=''}
    else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}
    else if(c!=='\r'){cell+=c}
  }
  if(cell||row.length){row.push(cell);rows.push(row)}
  const head=rows.shift().map(h=>h.trim());
  return rows.filter(r=>r.length>1&&r[0].trim()).map(r=>{
    const o={}; head.forEach((h,i)=>o[h]=(r[i]||'').trim()); return o;
  });
}

/* CSV-rijen -> het EX-object dat de engine verwacht */
function rowsToEX(rows){
  const EX={};
  rows.forEach(r=>{
    /* zone mag leeg zijn (oefening zonder pijnzone) -> moet null blijven,
       niet '' — de engine test op null bij het filteren van alternatieven. */
    const e={n:r.n,cat:r.cat,need:r.need,zone:r.zone||null,stat:r.stat,
             desc:r.desc,reg:r.reg,prog:r.prog};
    if(r.wt)  e.wt=r.wt;
    if(r.alt) e.alt=r.alt.split(',').map(x=>x.trim()).filter(Boolean);
    EX[r.id]=e;
  });
  return EX;
}

async function loadData(){
  const [csv, ...jsons] = await Promise.all([
    fetch('data/exercises.csv').then(r=>{if(!r.ok)throw new Error('exercises.csv');return r.text()}),
    ...Object.values(DATA_FILES).map(u=>fetch(u).then(r=>{if(!r.ok)throw new Error(u);return r.json()}))
  ]);
  const keys = Object.keys(DATA_FILES);
  const D = {}; keys.forEach((k,i)=>D[k]=jsons[i]);

  window.EX            = rowsToEX(parseCSV(csv));
  window.DEFAULT       = D.defaults;
  window.PALETTES      = D.creature.PALETTES;
  window.VARIANT_NAMES = D.creature.VARIANT_NAMES;
  window.SPRITES       = D.creature.SPRITES;
  window.ITEMS         = D.creature.ITEMS;
  window.NAVICONS      = D.creature.NAVICONS;
  window.DAYTYPES      = D.daytypes.DAYTYPES;
  window.CATS          = D.daytypes.CATS;
  window.QUESTS        = D.gamif.QUESTS;
  window.BADGES        = D.gamif.BADGES;
  window.FORMATS       = D.formats.FORMATS;
  window.BENCHMARK     = D.bench.BENCHMARK;
  window.ALL_TYPES     = D.types.ALL_TYPES;

  console.log(`[GRIT] data geladen — ${Object.keys(window.EX).length} oefeningen`);
}
