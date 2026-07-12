/* GRIT — hr.js  ·  VITALS
   Ochtendmeting van de rusthartslag. Waarom dit werkt: je hartslag in rust
   stijgt VOOR je je slecht voelt — bij ziekte, slaaptekort of te veel
   belasting. Een baseline + afwijking is dus een vroeg alarm, geen grafiekje. */
'use strict';

const HR_BASELINE_DAYS = 7;   // eerste week = nulmeting
const HR_WINDOW        = 14;  // baseline schuift mee over 14 dagen

function hrState(){
  if(!S.hr) S.hr = {maxHR:180, restLog:[], baseline:null};
  return S.hr;
}

/* Zones op basis van maxHR — niet op basis van een gok van 170. */
function hrZones(){
  const m = hrState().maxHR || 180;
  const p = f => Math.round(m*f);
  return [
    {z:'Z1', lo:0,      hi:p(0.70), lab:'HERSTEL'},
    {z:'Z2', lo:p(0.70),hi:p(0.80), lab:'DUURLOOP — hier hoort 80% van je loopvolume'},
    {z:'Z3', lo:p(0.80),hi:p(0.85), lab:'GRIJZE ZONE — vermijden'},
    {z:'Z4', lo:p(0.85),hi:p(0.90), lab:'DREMPEL — enkel interval'},
    {z:'Z5', lo:p(0.90),hi:m,       lab:'ANAEROOB — korte blokken'}
  ];
}

function hrAdd(date, bpm){
  const h = hrState();
  h.restLog = h.restLog.filter(e => e.d !== date);
  h.restLog.push({d:date, bpm:Number(bpm)});
  h.restLog.sort((a,b)=> a.d < b.d ? -1 : 1);
  h.restLog = h.restLog.slice(-180);
  hrBaseline(true);
  save();
}

/* Baseline = gemiddelde van de laatste 14 metingen (min. 7 nodig). */
function hrBaseline(recalc){
  const h = hrState();
  if(!recalc && h.baseline) return h.baseline;
  const pts = h.restLog.slice(-HR_WINDOW);
  if(pts.length < HR_BASELINE_DAYS){ h.baseline = null; return null; }
  h.baseline = Math.round(pts.reduce((a,b)=>a+b.bpm,0)/pts.length);
  return h.baseline;
}

/* Het hele punt van de module: een ADVIES, geen cijfer. */
function hrStatus(bpm){
  const base = hrBaseline();
  if(base === null || bpm == null)
    return {code:'none', kleur:'#6fae5c', kop:'IJKEN',
            advies:`Nog ${Math.max(0, HR_BASELINE_DAYS - hrState().restLog.length)} ochtendmeting(en) nodig voor je nulpunt.`};
  const d = bpm - base;
  if(d <= 4)  return {code:'groen',  kleur:'#6fae5c', kop:'GROEN',  delta:d, advies:'Systeem hersteld. Train zoals gepland.'};
  if(d <= 7)  return {code:'oranje', kleur:'#d9a441', kop:'ORANJE', delta:d, advies:'Verhoogd. Train wel, maar schrap de intensiteit: rustige duurloop i.p.v. interval.'};
  return        {code:'rood',   kleur:'#c0483a', kop:'ROOD',   delta:d, advies:'Sterk verhoogd. Neem een rustdag. Slaaptekort, ziekte in aantocht of te veel belasting.'};
}

function hrToday(){
  const e = hrState().restLog.find(x => x.d === todayStr());
  return e ? e.bpm : null;
}

/* Koppeling met de motor: bij ROOD daalt je recovery-score en stelt de app
   zelf voor om de dag om te zetten. Meten zonder gevolg is tijdverlies. */
function hrAdjustRecovery(){
  const st = hrStatus(hrToday());
  if(st.code === 'rood')   S.recovery = Math.max(0, S.recovery - 25);
  if(st.code === 'oranje') S.recovery = Math.max(0, S.recovery - 10);
}

/* ---------------- VIEW ---------------- */
function vVitals(v){
  const h    = hrState();
  const t    = hrToday();
  const base = hrBaseline();
  const st   = hrStatus(t);
  const log  = h.restLog.slice(-30);

  v.innerHTML = `
   <div class="card" style="border-color:${st.kleur}">
     <div class="lbl">STATUS VANDAAG</div>
     <div style="font-size:22px;color:${st.kleur};margin:6px 0">${st.kop}${st.delta!==undefined?` (${st.delta>0?'+':''}${st.delta})`:''}</div>
     <p>${st.advies}</p>
     <div class="row">
       <button class="btn" id="hrlog">${t?`METING: ${t} BPM — AANPASSEN`:'OCHTENDMETING INVOEREN'}</button>
     </div>
   </div>

   <div class="card">
     <div class="lbl">NULPUNT</div>
     <p>Baseline: <b>${base ?? '—'}</b> bpm · metingen: <b>${h.restLog.length}</b></p>
     <canvas id="hrchart" width="160" height="50" style="width:100%;image-rendering:pixelated;margin-top:8px"></canvas>
     <p class="dim">Meet direct na het wakker worden, vóór je opstaat. Tel 30 sec, verdubbel.</p>
   </div>

   <div class="card">
     <div class="lbl">HYROX-PLAN</div>
     ${S.hyroxStart ? (()=>{
        const wk = hyroxWeek();
        return wk
          ? `<p>Actief — <b>week ${wk} van 20</b>.</p>
             <p class="tiny dim">Gestart op ${S.hyroxStart}. Je agenda volgt nu het vaste schema.</p>
             <div class="row"><button class="btn small ghost" id="planstop">PLAN STOPZETTEN</button></div>`
          : `<p>Plan afgelopen (voorbij week 20).</p>
             <p class="tiny dim">De app genereert je sessies weer zelf.</p>
             <div class="row"><button class="btn small ghost" id="planstop">RESETTEN</button></div>`;
      })() : `<p>Niet gestart.</p>
             <p class="tiny dim">20 weken, 4 dagen/week. Het plan overschrijft de
             gegenereerde sessies; buiten het plan valt de app terug op zichzelf.</p>
             <div class="row"><button class="btn" id="planstart">PLAN STARTEN VANDAAG</button></div>`}
   </div>

   <div class="card">
     <div class="lbl">ZONES (maxHR ${h.maxHR})</div>
     ${hrZones().map(z=>`<p><b>${z.z}</b> ${z.lo}–${z.hi} bpm — ${z.lab}</p>`).join('')}
     <div class="row"><button class="btn small ghost" id="hrmax">MAXHR AANPASSEN</button></div>
   </div>

   <div class="card">
     <div class="lbl">LOGBOEK</div>
     ${log.length ? [...log].reverse().slice(0,10).map(e=>{
        const s=hrStatus(e.bpm);
        return `<p><span style="color:${s.kleur}">■</span> ${e.d} — ${e.bpm} bpm</p>`}).join('')
      : '<p class="dim">Nog geen metingen.</p>'}
   </div>`;

  $('#hrlog').onclick = hrSheet;
  $('#hrmax').onclick = hrMaxSheet;
  const bStart = $('#planstart'), bStop = $('#planstop');
  if(bStart) bStart.onclick = () => {
    startHyroxPlan();
    toast('HYROX-PLAN GESTART — WEEK 1');
    render('vit');
  };
  if(bStop) bStop.onclick = () => {
    if(confirm('Plan stopzetten? De app genereert je sessies dan weer zelf.')){
      stopHyroxPlan(); render('vit');
    }
  };
  drawHRChart();
}

function hrSheet(){
  const cur = hrToday() ?? '';
  const o = sheet(`
    <h3>OCHTENDMETING</h3>
    <p class="dim">Rusthartslag, gemeten vlak na het wakker worden.</p>
    <input id="hrv" type="number" inputmode="numeric" min="30" max="140" value="${cur}" placeholder="bpm">
    <div class="row">
      <button class="btn" id="hrok">OPSLAAN</button>
      <button class="btn small ghost" id="hrx">ANNULEER</button>
    </div>`);
  const inp = o.querySelector('#hrv'); inp.focus();
  o.querySelector('#hrx').onclick = () => o.remove();
  o.querySelector('#hrok').onclick = () => {
    const val = parseInt(inp.value,10);
    if(!val || val < 30 || val > 140){ toast('ONGELDIGE WAARDE'); return; }
    hrAdd(todayStr(), val);
    hrAdjustRecovery(); save();
    o.remove();
    const st = hrStatus(val);
    toast(`${st.kop} — ${st.code==='rood'?'RUSTDAG AANGERADEN':'GELOGD'}`);
    render('vit');
  };
}

function hrMaxSheet(){
  const o = sheet(`
    <h3>MAXIMALE HARTSLAG</h3>
    <p class="dim">Schat je niet te laag in: als je ooit hoger liep dan je maxHR,
    kleurt elke training vals rood. Vuistregel: hoogste waarde die je ooit zag, +3.</p>
    <input id="mx" type="number" inputmode="numeric" min="140" max="220" value="${hrState().maxHR}">
    <div class="row">
      <button class="btn" id="mxok">OPSLAAN</button>
      <button class="btn small ghost" id="mxx">ANNULEER</button>
    </div>`);
  o.querySelector('#mxx').onclick = () => o.remove();
  o.querySelector('#mxok').onclick = () => {
    const val = parseInt(o.querySelector('#mx').value,10);
    if(!val || val < 140 || val > 220){ toast('ONGELDIGE WAARDE'); return; }
    hrState().maxHR = val; save(); o.remove(); render('vit');
  };
}

/* Pixel-lijngrafiek in dezelfde stijl als de benchmark-chart. */
function drawHRChart(){
  const cv = $('#hrchart'); if(!cv) return;
  const ctx = cv.getContext('2d'); const P = pal();
  ctx.fillStyle = P[0]; ctx.fillRect(0,0,160,50);
  const pts = hrState().restLog.slice(-30);
  if(pts.length < 2){
    ctx.fillStyle = P[2]; ctx.font = '6px monospace';
    ctx.fillText('nog te weinig metingen', 8, 26); return;
  }
  const vals = pts.map(p=>p.bpm);
  const min = Math.min(...vals)-3, max = Math.max(...vals)+3;
  const X = i => Math.round(8 + i*(144/(pts.length-1)));
  const Y = v => Math.round(44 - ((v-min)/(max-min))*38);

  const base = hrBaseline();
  if(base !== null){                       // baselinelijn (gestippeld)
    ctx.fillStyle = P[1];
    for(let x=8; x<152; x+=3) ctx.fillRect(x, Y(base), 2, 1);
  }
  ctx.fillStyle = P[2];
  for(let i=0;i<pts.length-1;i++){
    const x1=X(i), y1=Y(vals[i]), x2=X(i+1), y2=Y(vals[i+1]);
    const st = Math.max(Math.abs(x2-x1), Math.abs(y2-y1));
    for(let s=0;s<=st;s++)
      ctx.fillRect(Math.round(x1+(x2-x1)*s/st), Math.round(y1+(y2-y1)*s/st), 1, 1);
  }
  pts.forEach((p,i)=>{
    ctx.fillStyle = hrStatus(p.bpm).kleur;
    ctx.fillRect(X(i)-1, Y(p.bpm)-1, 3, 3);
  });
  ctx.fillStyle = P[2]; ctx.font = '6px monospace';
  ctx.fillText('lager=beter', 8, 10);
}
