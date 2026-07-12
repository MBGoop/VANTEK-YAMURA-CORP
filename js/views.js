/* GRIT — views.js  (gesplitst uit index.html, gedrag ongewijzigd) */
function vBench(el){
  const best=S.hyroxPRs.length?Math.min(...S.hyroxPRs.map(p=>p.sec)):null;
  const last=S.hyroxPRs.length?S.hyroxPRs[S.hyroxPRs.length-1]:null;
  const daysSince=last?Math.floor((new Date(todayStr())-new Date(last.date))/DAY):null;
  const due=daysSince===null||daysSince>=28;
  el.innerHTML=`
   <div class="panel" id="engineCard">
     <h2>${BENCHMARK.name}</h2>
     <div class="block">
       <h4>WAAROM</h4>
       <p class="tiny" style="line-height:2">Dit circuit verandert <b>nooit</b> — daarom kan je het maandelijks herhalen en je tijd eerlijk vergelijken. Je échte vooruitgangsmeter, los van je dagelijkse plan. ${due?'<b style="color:var(--g3b)">Nu aanbevolen.</b>':`Volgende test over ${28-daysSince} dagen.`}</p>
     </div>
     <div class="block">
       <h4>${BENCHMARK.rounds} RONDES · 6 STATIONS</h4>
       ${BENCHMARK.stations.map((s,i)=>`<div class="station"><span class="no">${i+1}</span><div class="exmain"><span class="nm">${s.t}</span></div></div>`).join('')}
     </div>
     <p class="tiny dim">Warm 5 min op. For Time: de klok loopt tot je klaar bent. Rusten mag, tijd tikt door.</p>
     <button class="btn" style="margin-top:12px" id="bench-go">START BENCHMARK</button>
   </div>
   <div class="panel inv">
     <h2>RECORDS</h2>
     ${best?`<p class="tiny">BESTE TIJD: <b style="color:var(--g3b)">${fmtTime(best)}</b>${last?` · laatste: ${fmtTime(last.sec)} (${last.date})`:''}</p>`:'<p class="tiny dim">Nog geen benchmark gedaan. Zet je nulmeting neer.</p>'}
     <ul class="pr-list">${S.hyroxPRs.slice(-8).reverse().map(p=>`<li><span>${p.date}</span><b>${fmtTime(p.sec)}${p.sec===best?' [PR]':''}</b></li>`).join('')}</ul>
     ${S.hyroxPRs.length>=2?`<canvas id="benchchart" width="160" height="50" style="width:100%;image-rendering:pixelated;border:2px solid var(--g1);border-radius:var(--r);background:var(--g0);margin-top:8px"></canvas>`:''}
   </div>`;
  $('#bench-go').onclick=()=>{
    actx();
    startEngine('fortime',{cap:0},{label:'BENCHMARK',onFinish:(sec)=>{
      const oldBest=S.hyroxPRs.length?Math.min(...S.hyroxPRs.map(p=>p.sec)):Infinity;
      S.hyroxPRs.push({date:todayStr(),sec});S.hyroxPRs=S.hyroxPRs.slice(-24);
      S.lastActive=todayStr();bumpStreakIfNew();
      S.stats.grit+=4;S.stats.speed+=2;
      const pr=sec<oldBest;
      gainXP(pr?60:35,pr?25:12);
      toast(pr?`!! NIEUW RECORD: ${fmtTime(sec)} !!`:`BENCHMARK: ${fmtTime(sec)} — opgeslagen`);
      render('trn');
    }});
  };
  if(S.hyroxPRs.length>=2)drawBenchChart();
}
function drawBenchChart(){
  const cv=$('#benchchart');if(!cv)return;
  const ctx=cv.getContext('2d');const P=pal();
  ctx.fillStyle=P[0];ctx.fillRect(0,0,160,50);
  const pts=S.hyroxPRs.slice(-10);
  const min=Math.min(...pts.map(p=>p.sec))-5,max=Math.max(...pts.map(p=>p.sec))+5;
  const X=i=>Math.round(8+i*(144/(pts.length-1)));
  const Y=v=>Math.round(44-((v-min)/(max-min))*38);
  ctx.fillStyle=P[2];
  for(let i=0;i<pts.length-1;i++){const x1=X(i),y1=Y(pts[i].sec),x2=X(i+1),y2=Y(pts[i+1].sec);
    const st=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
    for(let s=0;s<=st;s++)ctx.fillRect(Math.round(x1+(x2-x1)*s/st),Math.round(y1+(y2-y1)*s/st),1,1)}
  ctx.fillStyle=P[3];pts.forEach((p,i)=>ctx.fillRect(X(i)-1,Y(p.sec)-1,3,3));
  ctx.fillStyle=P[2];ctx.font='6px monospace';ctx.fillText('lager=beter',8,10);
}

/* ---------------- AGENDA ---------------- */
function vAgenda(el){
  const now=new Date(todayStr());
  const view=new Date(now.getFullYear(),now.getMonth()+AGDOFF,1);
  const monthNames=['JANUARI','FEBRUARI','MAART','APRIL','MEI','JUNI','JULI','AUGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DECEMBER'];
  const first=new Date(view.getFullYear(),view.getMonth(),1);
  const startDow=(first.getDay()+6)%7; /* ma=0 */
  const daysInM=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
  let cells='';
  ['MA','DI','WO','DO','VR','ZA','ZO'].forEach(d=>cells+=`<div class="h">${d}</div>`);
  for(let i=0;i<startDow;i++)cells+=`<div class="d out"></div>`;
  for(let d=1;d<=daysInM;d++){
    const ds=`${view.getFullYear()}-${String(view.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const ses=sessionForDate(ds);
    const done=S.done[ds], quest=S.quests[ds];
    const edited=!!S.overrides[ds];
    const isRace=S.race&&S.race.date===ds;
    const mk=ses?({strength:'STR',strengthL:'STR',strengthU:'STR',conditioning:'CND',conditioning2:'CND',mixed:'MIX',circuit:'RUN',mobility:'MOB'})[ses.type]:'';
    cells+=`<button class="d ${ds===todayStr()?'today':''} ${done?'done':''}" data-d="${ds}">${isRace?'🎯':d}<span class="mk">${done?'[OK]':mk}${quest&&!done?'*':''}${edited?'~':''}</span></button>`;
  }
  el.innerHTML=`
   <div class="panel">
     <div class="row">
       <button class="btn small ghost" id="ag-prev">&lt;</button>
       <h2 style="margin:0;flex:1;text-align:center">${monthNames[view.getMonth()]} ${view.getFullYear()}</h2>
       <button class="btn small ghost" id="ag-next">&gt;</button>
     </div>
     <div class="cal" style="margin-top:10px">${cells}</div>
     <div class="legend"><span>[OK]=GEDAAN</span><span>STR/CND/MIX/RUN/MOB=GEPLAND</span><span>*=QUEST</span><span>~=AANGEPAST</span><span>🎯=WEDSTRIJD</span></div>
     <p class="tiny dim center" style="margin-top:8px">Tik op een dag om te bewerken (verplaatsen, type, oefeningen, rust).</p>
   </div>
   <div class="panel inv">
     <h2>DEZE CYCLE</h2>
     <p class="tiny dim">Week ${planWeek()} van 4. Week 2: +1 set. Week 3: intenser. Week 4: deload (bewust lichter). Daarna start automatisch een nieuwe cycle.</p>
     <p class="tiny dim" style="margin-top:6px">Consistentie (14 dagen): <b style="color:var(--g3b)">${consistency()}%</b></p>
   </div>`;
  $('#ag-prev').onclick=()=>{AGDOFF--;render('agd')};
  $('#ag-next').onclick=()=>{AGDOFF++;render('agd')};
  el.querySelectorAll('.cal .d[data-d]').forEach(b=>b.onclick=()=>daySheet(b.dataset.d));
}
function daySheet(ds){
  const ses=sessionForDate(ds);
  const isRest=!ses;
  const w=ses?sessionPlan(ds):null;
  const extSes=S.history.filter(h=>h.d===ds&&h.type&&h.type.startsWith('ext_'));
  const extHtml=extSes.length?`<div class="block"><h4>EXTERN GEREGISTREERD</h4>${extSes.map(h=>`<p>${dayLabel(h.type)}${h.km?` · ${h.km}km`:''}${h.dur?` · ${h.dur}min`:''} · RPE ${h.rpe}</p>`).join('')}</div>`:'';
  const o=sheet(`
    <h2 style="font-size:10px">${ds}${ses?' — '+dayLabel(ses.type):' — RUSTDAG'}</h2>
    <p class="tiny dim">Week ${weekForDate(ds)} van de cycle${weekForDate(ds)===4?' [DELOAD]':''}${S.done[ds]?' — [OK] GEDAAN':''}${ses&&ses.moved?' — [VERPLAATST HIERHEEN]':''}</p>
    ${extHtml}
    ${w?`${renderBlock('WARM-UP',w.warm)}${renderBlock('MAIN SET',w.main)}${renderBlock('FINISHER',w.fin)}`:(extSes.length?'':'<p class="tiny dim" style="margin-top:8px">Geen protocol op deze dag.</p>')}
    <div class="row" style="margin-top:14px;flex-wrap:wrap">
      <button class="btn small ghost" id="ds-rest">${isRest?'MAAK TRAININGSDAG':'MAAK RUSTDAG'}</button>
      ${ses?'<button class="btn small ghost" id="ds-type">ANDER TYPE</button>':''}
      ${ses?'<button class="btn small ghost" id="ds-move">VERPLAATS</button>':''}
      ${ses?'<button class="btn small ghost" id="ds-ex">OEFENINGEN</button>':''}
    </div>
    ${S.overrides[ds]?'<button class="btn small ghost" style="margin-top:8px;color:var(--g3b)" id="ds-reset">AANPASSINGEN WISSEN</button>':''}
  `);
  const rest=o.querySelector('#ds-rest');
  if(rest)rest.onclick=()=>{
    S.overrides[ds]=S.overrides[ds]||{};
    if(isRest){delete S.overrides[ds].rest; if(!basePlanSession(ds))S.overrides[ds].type='mixed';}
    else{S.overrides[ds].rest=true;}
    cleanOverride(ds);save();o.remove();render('agd');
  };
  const typ=o.querySelector('#ds-type');
  if(typ)typ.onclick=()=>{o.remove();pickTypeSheet(ds)};
  const mov=o.querySelector('#ds-move');
  if(mov)mov.onclick=()=>{o.remove();moveSheet(ds)};
  const exb=o.querySelector('#ds-ex');
  if(exb)exb.onclick=()=>{o.remove();editSessionSheet(ds)};
  const rst=o.querySelector('#ds-reset');
  if(rst)rst.onclick=()=>{delete S.overrides[ds];save();o.remove();render('agd')};
}
/* verwijder lege override-objecten */
function cleanOverride(ds){
  const ov=S.overrides[ds];
  if(ov&&!ov.rest&&!ov.type&&!ov.movedTo&&(!ov.ex||(!ov.ex.rm&&!ov.ex.swap&&!ov.ex.add)))delete S.overrides[ds];
}
function pickTypeSheet(ds){
  const cur=sessionForDate(ds);
  const o=sheet(`<h2 style="font-size:10px">${ds} — KIES TYPE</h2>
    <div class="chips" style="margin-top:10px">${ALL_TYPES.map(([v,l])=>`<button class="chip ${cur&&cur.type===v?'sel':''}" data-v="${v}">${l}</button>`).join('')}</div>`);
  o.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    S.overrides[ds]=S.overrides[ds]||{};
    S.overrides[ds].type=c.dataset.v;
    delete S.overrides[ds].rest;
    if(S.overrides[ds].ex)delete S.overrides[ds].ex; /* oefening-overrides gelden niet meer bij ander type */
    save();o.remove();render('agd');
  });
}
function moveSheet(ds){
  const base=new Date(ds);
  let opts='';
  for(let i=1;i<=6;i++){
    const t=new Date(base.getTime()+i*DAY).toISOString().slice(0,10);
    opts+=`<button class="chip" data-d="${t}">${['ZO','MA','DI','WO','DO','VR','ZA'][new Date(t).getDay()]} ${t.slice(8)}/${t.slice(5,7)}</button>`;
  }
  const o=sheet(`<h2 style="font-size:10px">${ds} — VERPLAATS NAAR</h2>
    <p class="tiny dim">Kies een dag binnen de komende week. De sessie verschuift; de oude dag wordt rust.</p>
    <div class="chips" style="margin-top:10px">${opts}</div>`);
  o.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    const dest=c.dataset.d;
    if(sessionForDate(dest)){toast('DIE DAG HEEFT AL EEN SESSIE');return}
    S.overrides[ds]=S.overrides[ds]||{};
    S.overrides[ds].movedTo=dest;
    save();o.remove();render('agd');
  });
}
/* oefeningen aanpassen: vervangen, verwijderen, toevoegen */
function editSessionSheet(ds){
  const ses=sessionForDate(ds);
  if(!ses){toast('GEEN SESSIE OP DEZE DAG');return}
  const w=sessionPlan(ds);
  const rows=w.main.map((it,i)=>{
    if(typeof it[0]!=='object')return `<div class="ex"><span>${it[0]}</span><div class="spacer"></div><span class="dose">${it[1]}</span></div>`;
    const e=EX[it[0].key];
    return `<div class="ex"><div class="exmain"><span class="nm">${e.n}</span><span class="hint">${it[1]}</span></div>
      <button class="altbtn" data-swap="${i}">WISSEL</button>
      <button class="altbtn" data-rm="${i}">X</button></div>`;
  }).join('');
  const o=sheet(`<h2 style="font-size:10px">${ds} — OEFENINGEN</h2>
    <p class="tiny dim">Vervang, verwijder of voeg toe. Blijft bewaard voor deze dag.</p>
    <div class="block"><h4>MAIN SET</h4>${rows}</div>
    <button class="btn ghost" style="margin-top:10px" id="es-add">+ OEFENING TOEVOEGEN</button>
    <button class="btn" style="margin-top:8px" id="es-done">KLAAR</button>`);
  o.querySelectorAll('[data-swap]').forEach(b=>b.onclick=()=>{o.remove();swapPicker(ds,+b.dataset.swap)});
  o.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{
    S.overrides[ds]=S.overrides[ds]||{};S.overrides[ds].ex=S.overrides[ds].ex||{};
    S.overrides[ds].ex.rm=[...(S.overrides[ds].ex.rm||[]),+b.dataset.rm];
    save();o.remove();editSessionSheet(ds);
  });
  o.querySelector('#es-add').onclick=()=>{o.remove();addPicker(ds)};
  o.querySelector('#es-done').onclick=()=>{o.remove();render(TAB==='agd'?'agd':'trn')};
}
function availableEx(){return Object.keys(EX).filter(k=>has(EX[k].need))}
function swapPicker(ds,idx){
  const list=availableEx();
  const o=sheet(`<h2 style="font-size:10px">VERVANG DOOR</h2>
    <div id="swlist">${CATS.filter(c=>c!=='ALLE').map(cat=>`
      <div class="block"><h4>${cat}</h4>${list.filter(k=>EX[k].cat===cat).map(k=>`<div class="ex"><span class="nm">${EX[k].n}</span><div class="spacer"></div><button class="altbtn" data-k="${k}">KIES</button></div>`).join('')}</div>`).join('')}</div>`);
  o.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
    S.overrides[ds]=S.overrides[ds]||{};S.overrides[ds].ex=S.overrides[ds].ex||{};
    S.overrides[ds].ex.swap=S.overrides[ds].ex.swap||{};
    S.overrides[ds].ex.swap[idx]=b.dataset.k;
    save();o.remove();editSessionSheet(ds);
  });
}
function addPicker(ds){
  const list=availableEx();
  const o=sheet(`<h2 style="font-size:10px">OEFENING TOEVOEGEN</h2>
    ${CATS.filter(c=>c!=='ALLE').map(cat=>`
      <div class="block"><h4>${cat}</h4>${list.filter(k=>EX[k].cat===cat).map(k=>`<div class="ex"><span class="nm">${EX[k].n}</span><div class="spacer"></div><button class="altbtn" data-k="${k}">+</button></div>`).join('')}</div>`).join('')}`);
  o.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
    S.overrides[ds]=S.overrides[ds]||{};S.overrides[ds].ex=S.overrides[ds].ex||{};
    S.overrides[ds].ex.add=[...(S.overrides[ds].ex.add||[]),{key:b.dataset.k,dose:'3x10'}];
    save();o.remove();editSessionSheet(ds);
  });
}

/* ---------------- OEFENBIB ---------------- */
function vBib(el){
  const keys=Object.keys(EX).filter(k=>BIBCAT==='ALLE'||EX[k].cat===BIBCAT);
  el.innerHTML=`
   <div class="panel">
     <h2>OEFENBIBLIOTHEEK</h2>
     <div class="chips">${CATS.map(c=>`<button class="chip ${BIBCAT===c?'sel':''}" data-c="${c}">${c}</button>`).join('')}</div>
     <div id="biblist">
     ${keys.map(k=>{const e=EX[k];const av=has(e.need);const sug=suggestKB(k);const last=lastLog(k);
       const matNaam=e.need==='geen'?'Geen / huisraad':e.need.replace('|','/');
       return `<div class="bibitem ${av?'':'na'}">
         <div class="row"><span class="nm">${e.n}</span><div class="spacer"></div><span class="badge" style="font-size:6px">${e.cat}</span></div>
         <p class="meta">Doel: ${e.stat.toUpperCase()} &nbsp;·&nbsp; Materiaal: ${matNaam}${av?'':' (niet beschikbaar)'}</p>
         ${sug||last?`<p class="meta">${sug?`Suggestie: ${sug}kg`:''}${sug&&last?' &nbsp;·&nbsp; ':''}${last?`Vorige keer: ${last.w}kg x ${last.r||'?'}`:''}</p>`:''}
         <p>${e.desc}</p>
         <div class="rp">
           <div><b>Makkelijker:</b> ${e.reg}</div>
           <div style="margin-top:4px"><b>Zwaarder:</b> ${e.prog}</div>
         </div>
       </div>`}).join('')}
     </div>
   </div>`;
  el.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{BIBCAT=c.dataset.c;render('bib')});
}

/* ---------------- CORP (depot + crew + bodyweight) ---------------- */
function vCorp(el){
  el.innerHTML=`
   <div class="panel">
    <h2>CORP DEPOT</h2>
    <p class="tiny dim">Credits verdien je met trainen. Uitrusting = specimen pimpen.</p>
    <div class="shop-grid" style="margin-top:10px">
      ${ITEMS.map((it,i)=>{
        const owned=S.owned.includes(it.id), eq=S.equipped.includes(it.id);
        return `<button class="shop-item ${owned?'owned':''} ${eq?'eq':''}" data-id="${it.id}">
          <canvas id="si${i}"></canvas>
          <div>${it.name}</div>
          <div class="price">${owned?(eq?'[AAN]':'ZET AAN'):it.price+' CR'}</div>
        </button>`}).join('')}
    </div>
   </div>
   <div class="panel">
     <h2>LICHAAMSGEWICHT</h2>
     <canvas id="bwchart" width="160" height="60"></canvas>
     <div class="row" style="margin-top:8px">
       <input class="mini" type="number" inputmode="decimal" id="bw-in" placeholder="KG" style="flex:1;width:auto">
       <button class="btn small" id="bw-log">LOG</button>
     </div>
     <p class="tiny dim" style="margin-top:6px">Wekelijks wegen volstaat. Trend telt, niet de dagelijkse schommeling.</p>
   </div>
   <div class="panel">
     <h2>🎯 MISSIEDOEL (WEDSTRIJD)</h2>
     ${S.race?`<p class="tiny">${S.race.name} — ${S.race.date}</p><p class="tiny dim" style="margin-top:4px">${(()=>{const d=raceCountdown();return d<0?'Voorbij':'Nog '+d+' dagen — plan tapert automatisch af in de laatste 10 dagen.'})()}</p>
        <button class="btn ghost" style="margin-top:10px" id="race-clear">DOEL WISSEN</button>`
       :`<p class="tiny dim">Stel een wedstrijd of einddatum in. De laatste 10 dagen bouwt het plan volume af zodat je fris aan de start staat.</p>
        <label>Naam</label><input type="text" id="race-n" maxlength="16" placeholder="bv. HYROX GENT">
        <label>Datum</label><input type="text" id="race-d" inputmode="numeric" placeholder="JJJJ-MM-DD">
        <button class="btn" style="margin-top:12px" id="race-set">DOEL INSTELLEN</button>`}
   </div>
   <div class="panel inv">
     <h2>CREW-DOSSIER</h2>
     <p class="tiny">NIVEAU: ${S.profile.niveau.toUpperCase()}</p>
     <p class="tiny dim">${S.days} D/WEEK — ${S.dur} MIN/SESSIE</p>
     <p class="tiny dim">MATERIAAL: ${S.gear.kbs.length?'KB '+S.gear.kbs.join('+')+'KG ':''}${S.gear.bands?'/ BANDS ':''}${S.gear.trap?'/ TRAP ':''}${S.gear.pullup?'/ PULL-UP BAR ':''}/ LOPEN: ${S.gear.lopen.toUpperCase()}</p>
     ${S.profile.pijnzones.length?`<p class="tiny dim">GEVOELIGE ZONES: ${S.profile.pijnzones.join(', ').toUpperCase()} [ALTERNATIEVEN ACTIEF]</p>`:''}
     <button class="btn ghost" style="margin-top:12px" id="rename">SPECIMEN HERNOEMEN</button>
     <button class="btn ghost" style="margin-top:8px" id="replan">PLAN OPNIEUW GENEREREN</button>
     <button class="btn ghost" style="margin-top:8px" id="logboek">LOGBOEK / DAGBOEK</button>
   </div>
   <div class="panel">
     <h2>WEERGAVE</h2>
     <label>Tekstgrootte</label>
     <div class="chips" id="fs-pick">
       <button class="chip ${S.fontScale===0.85?'sel':''}" data-v="0.85">KLEIN</button>
       <button class="chip ${(S.fontScale||1)===1?'sel':''}" data-v="1">NORMAAL</button>
       <button class="chip ${S.fontScale===1.2?'sel':''}" data-v="1.2">GROOT</button>
     </div>
     <label>Rustige modus (scanlines + animatie uit)</label>
     <div class="chips" id="comfort-pick">
       <button class="chip ${!S.comfort?'sel':''}" data-v="0">AAN (retro)</button>
       <button class="chip ${S.comfort?'sel':''}" data-v="1">RUSTIG</button>
     </div>
   </div>
   <div class="panel inv">
     <h2>SYSTEEM</h2>
     <button class="btn ghost" id="installapp">INSTALLEER APP OP TOESTEL</button>
     <p class="tiny dim" style="margin-top:8px">Werkt offline zodra geinstalleerd. Op Android: knop hierboven of Chrome-menu > Toevoegen aan startscherm. Op iPhone: deel-knop > Zet op beginscherm.</p>
     <p class="tiny dim" style="margin-top:6px">Wearables (Garmin): gepland voor v1.5 — de dagelijkse scan doet nu hetzelfde werk.</p>
     <p class="tiny dim" style="margin-top:6px">Algemene fitness-suggesties, geen medisch advies. Bij pijn of klachten: arts of kinesist. Alle data lokaal (localStorage), geen account, geen cloud.</p>
     <button class="btn ghost" style="margin-top:12px" id="export">DATA EXPORTEREN (BACK-UP)</button>
     <button class="btn ghost" style="margin-top:8px" id="import">BACK-UP IMPORTEREN</button>
     <button class="btn ghost" style="margin-top:8px;color:var(--g3b)" id="reset">VOLLEDIGE RESET</button>
   </div>`;
  ITEMS.forEach((it,i)=>drawPreview($('#si'+i),S.creature.variant,stage(),[it.id]));
  el.querySelectorAll('.shop-item').forEach(b=>b.onclick=()=>{
    const it=ITEMS.find(x=>x.id===b.dataset.id);
    if(!S.owned.includes(it.id)){
      if(S.coins<it.price){toast('ONVOLDOENDE CREDITS — ga trainen');return}
      S.coins-=it.price;S.owned.push(it.id);S.equipped.push(it.id);
      toast(`${it.name} AANGESCHAFT`);
    }else{
      S.equipped=S.equipped.includes(it.id)?S.equipped.filter(x=>x!==it.id):[...S.equipped,it.id];
    }
    save();render('crp');
  });
  drawBwChart();
  $('#bw-log').onclick=()=>{
    const kg=parseFloat($('#bw-in').value);
    if(!(kg>20&&kg<400)){toast('VOER GELDIG GEWICHT IN');return}
    S.bw=S.bw.filter(b=>b.d!==todayStr());
    S.bw.push({d:todayStr(),kg});S.bw=S.bw.slice(-30);
    save();toast('GEWICHT GELOGD');render('crp');
  };
  $('#rename').onclick=()=>{
    const n=prompt('Nieuwe specimen-naam:',S.creature.name);
    if(n&&n.trim()){S.creature.name=n.trim().toUpperCase().slice(0,14);save();toast('NAAM BIJGEWERKT');render('crp')}
  };
  $('#replan').onclick=()=>{if(confirm('Nieuw plan genereren? Je agenda-aanpassingen blijven, maar de cyclus herstart vandaag.')){generatePlan();toast('NIEUW 4-WEEKPLAN GEGENEREERD');TRNSUB='vandaag';render('trn')}};
  $('#reset').onclick=()=>{if(confirm('Zeker? Specimen, streak en credits verdwijnen definitief.')){localStorage.removeItem('grit2');location.href=location.pathname}};
  const rs=$('#race-set');
  if(rs)rs.onclick=()=>{
    const nm=($('#race-n').value.trim()||'WEDSTRIJD').toUpperCase();
    const dt=$('#race-d').value.trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(dt)||isNaN(new Date(dt))){toast('DATUM ALS JJJJ-MM-DD');return}
    if(new Date(dt)<new Date(todayStr())){toast('DATUM MOET IN DE TOEKOMST LIGGEN');return}
    S.race={name:nm,date:dt};save();toast('DOEL INGESTELD — taper geactiveerd');render('crp');
  };
  const rc=$('#race-clear');
  if(rc)rc.onclick=()=>{S.race=null;save();toast('DOEL GEWIST');render('crp')};
  $('#installapp').onclick=()=>{
    if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;}
    else toast('Gebruik het browsermenu > Toevoegen aan startscherm');
  };
  $('#export').onclick=exportBackup;   /* -> storage.js */
  el.querySelectorAll('#fs-pick .chip').forEach(c=>c.onclick=()=>{S.fontScale=parseFloat(c.dataset.v);save();applyVisuals();render('crp')});
  el.querySelectorAll('#comfort-pick .chip').forEach(c=>c.onclick=()=>{S.comfort=c.dataset.v==='1';save();applyVisuals();render('crp')});
  $('#logboek').onclick=logbookSheet;
  $('#import').onclick=()=>{
    const inp=document.createElement('input');inp.type='file';inp.accept='application/json,.json';
    inp.onchange=e=>{
      const f=e.target.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=()=>{try{
        const data=JSON.parse(r.result);
        if(!data.creature||!data.stats){toast('ONGELDIG BACK-UP BESTAND');return}
        if(confirm('Back-up terugzetten? Dit overschrijft je huidige data.')){
          autoBackup();                       /* vangnet vóór overschrijven */
          S=Object.assign(structuredClone(DEFAULT),data);
          migrate();                          /* oude back-up -> huidig schema */
          save();toast('BACK-UP HERSTELD');render('mon');
        }
      }catch(err){toast('KON BESTAND NIET LEZEN')}};
      r.readAsText(f);
    };
    inp.click();
  };
}
/* logboek / dagboek: sessie-historie + notities + mijlpalen chronologisch */
function logbookSheet(){
  const items=[];
  S.history.slice().reverse().forEach(h=>{
    const note=S.notes[h.d];
    items.push(`<div class="block"><div class="row"><span class="nm" style="color:var(--g3b)">${h.d}</span><div class="spacer"></div><span class="tiny dim">${dayLabel(h.type)}</span></div>
      <p class="dim">RPE ${h.rpe||'?'} · +${h.xp} XP${h.frac<1?' · deels':''}${h.km?` · ${h.km}km`:''}${h.dur&&h.type&&h.type.startsWith('ext_')?` · ${h.dur}min`:''}</p>
      ${note?`<p>&ldquo;${note}&rdquo;</p>`:''}</div>`);
  });
  sheet(`<h2 style="font-size:10px">LOGBOEK</h2>
    <p class="tiny dim">Chronologisch overzicht van je sessies en notities.</p>
    ${items.length?items.join(''):'<p style="margin-top:10px">Nog geen sessies gelogd. Je eerste komt hier te staan.</p>'}`);
}
function drawBwChart(){
  const cv=$('#bwchart');if(!cv)return;
  const ctx=cv.getContext('2d');
  const P=pal();
  ctx.fillStyle=P[0];ctx.fillRect(0,0,160,60);
  const pts=S.bw.slice(-12);
  if(pts.length<2){ctx.fillStyle=P[2];ctx.fillRect(6,28,4,4);return}
  const min=Math.min(...pts.map(p=>p.kg))-1, max=Math.max(...pts.map(p=>p.kg))+1;
  const X=i=>Math.round(8+i*(144/(pts.length-1)));
  const Y=v=>Math.round(52-((v-min)/(max-min))*44);
  /* raster */
  ctx.fillStyle=P[1];
  for(let y=8;y<56;y+=12)ctx.fillRect(4,y,152,1);
  /* lijn: blokjes tussen punten */
  ctx.fillStyle=P[2];
  for(let i=0;i<pts.length-1;i++){
    const x1=X(i),y1=Y(pts[i].kg),x2=X(i+1),y2=Y(pts[i+1].kg);
    const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
    for(let s=0;s<=steps;s++)ctx.fillRect(Math.round(x1+(x2-x1)*s/steps),Math.round(y1+(y2-y1)*s/steps),1,1);
  }
  /* punten */
  ctx.fillStyle=P[3];
  pts.forEach((p,i)=>ctx.fillRect(X(i)-1,Y(p.kg)-1,3,3));
  /* labels */
  ctx.fillStyle=P[2];ctx.font='6px monospace';
  ctx.fillText(String(pts[pts.length-1].kg)+'KG',120,10);
}

/* ---------------- TESTMODE ---------------- */
function testPanel(){return `<div class="panel" style="border-style:dashed">
  <h2>[TESTMODE]</h2>
  <div class="row" style="flex-wrap:wrap">
    <button class="btn small ghost" id="t-xp">+100 XP</button>
    <button class="btn small ghost" id="t-c">+50 CR</button>
    <button class="btn small ghost" id="t-day">DAG +1</button>
    <button class="btn small ghost" id="t-low">RC LAAG</button>
  </div></div>`}
function bindTest(){
  if(!TEST)return;
  const b=(id,fn)=>{const e=$(id);if(e)e.onclick=fn};
  b('#t-xp',()=>{gainXP(100,0);render()});
  b('#t-c',()=>{S.coins+=50;save();render()});
  b('#t-day',()=>{S.dayOffset++;S.lastCheckin=null;save();render()});
  b('#t-low',()=>{S.recovery=25;save();render()});
}
