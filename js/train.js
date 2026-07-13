/* GRIT — train.js  (gesplitst uit index.html, gedrag ongewijzigd) */
let REST={int:null,el:null};
function startRest(sec){
  stopRest();
  const el=document.createElement('div');el.className='resttimer';el.textContent=`RUST ${sec}`;
  document.body.appendChild(el);REST.el=el;
  let left=sec;
  REST.int=setInterval(()=>{
    left--;
    if(left<=0){stopRest();toast('RUST VOORBIJ — volgende set!');return}
    el.textContent=`RUST ${left}`;
  },1000);
}
function stopRest(){if(REST.int)clearInterval(REST.int);if(REST.el)REST.el.remove();REST={int:null,el:null}}

/* logsheet met gewichten */
/* progressie-suggestie op basis van vorige log + RPE */
function progressTip(k){
  const l=S.exLog[k];
  if(!l||!l.length)return '';
  const last=l[l.length-1];
  if(!last.r)return '';
  /* als vorige RPE laag was OF reps hoog: stel voor te verzwaren */
  const kbs=S.gear&&S.gear.kbs.length?[...S.gear.kbs].sort((a,b)=>a-b):[];
  const nextKB=kbs.find(x=>x>last.w);
  if(last.r>=12&&nextKB)return `tip: probeer ${nextKB}kg`;
  if(last.r>=10)return `tip: mik op ${last.w}kg x ${last.r+2}`;
  return `tip: herhaal ${last.w}kg x ${last.r}, dan opbouwen`;
}
function logSheet(ses, ds){
  ds = ds || todayStr();
  const retro = ds !== todayStr();            /* sessie uit het verleden loggen */
  const mode=dayMode();
  const w=sessionPlan(ds, retro?false:mode==='light');
  /* alle main-oefeningen met een gewichtscomponent */
  const wtItems=w.main.filter(it=>Array.isArray(it)&&typeof it[0]==='object'&&EX[it[0].key].wt&&has('kb'));
  const wtHtml=wtItems.length?`
    <label style="margin-top:14px">Gebruikte gewichten (optioneel)</label>
    ${wtItems.map(it=>{const k=it[0].key;const last=lastLog(k);const ovl=(S.overrides[ds]&&S.overrides[ds].ex&&S.overrides[ds].ex.list||[]).find(x=>x.key===k);const sug=(ovl&&ovl.kg)||(last?last.w:suggestKB(k));const tip=progressTip(k);
      return `<div style="margin-top:8px">
        <div class="row"><span class="body" style="flex:1">${EX[k].n}</span>
        <input class="mini" type="number" inputmode="decimal" data-wk="${k}" placeholder="KG" value="${sug||''}">
        <input class="mini" type="number" inputmode="numeric" data-rk="${k}" placeholder="REPS" value="${last?last.r:''}"></div>
        ${tip?`<p class="tiny dim" style="margin-top:2px">${tip}</p>`:''}
      </div>`}).join('')}`:'';
  const o=sheet(`
    <h2 style="font-size:10px">PROTOCOL LOGGEN${retro?` — ${ds}`:''}</h2>
    <label for="rpe">Hoe zwaar voelde het? (RPE)</label>
    <input type="range" id="rpe" min="1" max="10" value="7">
    <div class="row tiny dim"><span>LICHT</span><div class="spacer"></div><b id="rpev" style="color:var(--g3b)">7</b><div class="spacer"></div><span>MAXIMAAL</span></div>
    ${wtHtml}
    <label style="margin-top:14px">Notitie (optioneel)</label>
    <input type="text" id="lg-note" maxlength="80" placeholder="bv. knie voelde goed, KB te licht" value="${S.notes[ds]||''}">
    <label style="margin-top:14px">Alles gedaan zoals gepland?</label>
    <div class="chips" id="lg-c"><button class="chip sel" data-v="1">JA</button><button class="chip" data-v="0.6">DEELS</button></div>
    <button class="btn" style="margin-top:18px" id="lg-go">OPSLAAN</button>`);
  o.querySelector('#rpe').oninput=e=>o.querySelector('#rpev').textContent=e.target.value;
  let frac=1;
  o.querySelectorAll('#lg-c .chip').forEach(c=>c.onclick=()=>{frac=+c.dataset.v;o.querySelectorAll('#lg-c .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel')});
  o.querySelector('#lg-go').onclick=()=>{
    const rpe=+o.querySelector('#rpe').value;
    S.rpeLog.push(rpe);S.rpeLog=S.rpeLog.slice(-10);
    const noteVal=o.querySelector('#lg-note').value.trim();
    if(noteVal)S.notes[ds]=noteVal; else delete S.notes[ds];
    /* gewichten opslaan */
    o.querySelectorAll('[data-wk]').forEach(inp=>{
      const k=inp.dataset.wk, wv=parseFloat(inp.value);
      const rv=parseInt(o.querySelector(`[data-rk="${k}"]`).value);
      if(wv>0){
        if(!S.exLog[k])S.exLog[k]=[];
        S.exLog[k].push({d:ds,w:wv,r:rv>0?rv:null});
        S.exLog[k].sort((a,b)=>a.d<b.d?-1:1);
        S.exLog[k]=S.exLog[k].slice(-20);
      }
    });
    S.done[ds]=true;
    S.lastLogAt=Date.now();       /* wezen viert het meteen (happy-mood) */
    /* streak enkel bijwerken voor vandaag — anders kan je hem achteraf 'kopen' */
    if(!retro){ S.lastActive=ds; bumpStreakIfNew(); }
    const map={strength:'power',strengthL:'power',strengthU:'power',conditioning:'speed',conditioning2:'speed',mixed:'grit',circuit:'grit',mobility:'mobility'};
    const dSt={[map[ses.type]]:Math.round(3*frac), grit:1};
    S.stats[map[ses.type]]+=dSt[map[ses.type]];
    S.stats.grit+=1;
    const xp=Math.round((20+S.dur*0.6)*frac), cn=Math.round(10*frac);
    gainXP(xp,cn,'sessie','ses:'+ds,dSt);
    /* historie loggen */
    S.history.push({d:ds,type:ses.type,rpe,frac,xp});
    S.history.sort((a,b)=>a.d<b.d?-1:1);
    S.history=S.history.slice(-100);
    o.remove();toast(`+${xp} XP / +${cn} CR — DATA VERWERKT`);
    checkBadges();
    if(S.rpeLog.length>=2&&S.rpeLog.slice(-2).every(r=>r>=9))toast('WAARSCHUWING: 2 zware sessies — volgende automatisch lichter');
    render(retro?'trn':'mon');
  };
}

/* ---------------- EXTERNE SESSIE (buiten de app getraind) ---------------- */
let EXTKIND='gym';
/* XP-curve voor externe activiteit: lineair naar duur, maar met een
   afvlakking. Zo is 'even 5 min wandelen' geen goudmijn en blijft een
   uur fietsen volwaardige training. */
const EXT_TYPES={
  gym:  {lab:'KRACHT / GYM', st:'power',    f:1.0},
  run:  {lab:'LOPEN',        st:'speed',    f:1.0},
  walk: {lab:'WANDELEN',     st:'mobility', f:0.5},
  bike: {lab:'FIETSEN',      st:'speed',    f:0.8},
  other:{lab:'ANDERS',       st:'grit',     f:0.8}
};
function extXP(kind,dur,rpe){
  const T=EXT_TYPES[kind]||EXT_TYPES.other;
  const basis=10+Math.min(dur,90)*0.55;          /* afgevlakt boven 90 min */
  const intens=0.85+(rpe/10)*0.3;                /* RPE weegt licht mee */
  const xp=Math.round(basis*T.f*intens);
  return {xp, cn:Math.max(3,Math.round(xp*0.45)), T};
}
function externalLogSheet(ds){
  ds = ds || todayStr();
  EXTKIND='gym';
  const o=sheet(`
    <h2 style="font-size:10px">EXTERNE SESSIE</h2>
    <p class="tiny dim">Getraind buiten de app? Registreer het hier. Telt mee voor streak, XP en stats.</p>
    <label>Soort</label>
    <div class="chips" id="ext-kind">
      ${Object.entries(EXT_TYPES).map(([k,v])=>`<button class="chip ${k==='gym'?'sel':''}" data-v="${k}">${v.lab}</button>`).join('')}
    </div>
    <div id="ext-fields"></div>
    <label style="margin-top:14px">Hoe zwaar voelde het? (RPE)</label>
    <input type="range" id="ext-rpe" min="1" max="10" value="7">
    <div class="row tiny dim"><span>LICHT</span><div class="spacer"></div><b id="ext-rpev" style="color:var(--g3b)">7</b><div class="spacer"></div><span>MAXIMAAL</span></div>
    <label style="margin-top:14px">Notitie (optioneel)</label>
    <input type="text" id="ext-note" maxlength="80" placeholder="bv. MSA sled + wall balls">
    <button class="btn" style="margin-top:18px" id="ext-go">REGISTREREN</button>`);
  const renderFields=()=>{
    const box=o.querySelector('#ext-fields');
    if(EXTKIND==='gym'||EXTKIND==='other'){
      box.innerHTML=`<label style="margin-top:14px">Duur (min)</label><input class="mini" type="number" inputmode="numeric" id="ext-dur" value="45" style="width:auto">`;
    }else{
      box.innerHTML=`
        <div class="row" style="margin-top:6px">
          <div><label>Afstand (km)</label><input class="mini" type="number" inputmode="decimal" id="ext-km" placeholder="5"></div>
          <div><label>Duur (min)</label><input class="mini" type="number" inputmode="numeric" id="ext-dur" placeholder="30"></div>
        </div>
        <p class="tiny dim" id="ext-pace" style="margin-top:4px"></p>`;
      const upd=()=>{
        const km=parseFloat(o.querySelector('#ext-km').value),mn=parseFloat(o.querySelector('#ext-dur').value);
        const p=o.querySelector('#ext-pace');
        if(km>0&&mn>0){const pace=mn/km;p.textContent=`tempo: ${Math.floor(pace)}:${String(Math.round((pace%1)*60)).padStart(2,'0')} min/km`}
        else p.textContent='';
      };
      o.querySelector('#ext-km').oninput=upd;o.querySelector('#ext-dur').oninput=upd;
    }
  };
  renderFields();
  o.querySelectorAll('#ext-kind .chip').forEach(c=>c.onclick=()=>{
    EXTKIND=c.dataset.v;o.querySelectorAll('#ext-kind .chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');renderFields();
  });
  o.querySelector('#ext-rpe').oninput=e=>o.querySelector('#ext-rpev').textContent=e.target.value;
  o.querySelector('#ext-go').onclick=()=>{
    const rpe=+o.querySelector('#ext-rpe').value;
    const dur=parseInt((o.querySelector('#ext-dur')||{}).value)||30;
    const note=o.querySelector('#ext-note').value.trim();
    let extra='',km=null;
    if(EXTKIND!=='gym'&&EXTKIND!=='other'){km=parseFloat((o.querySelector('#ext-km')||{}).value)||null;if(km)extra=` ${km}km`}
    const {xp,cn,T}=extXP(EXTKIND,dur,rpe);
    const dSt={[T.st]:3, grit:1};
    S.stats[T.st]=(S.stats[T.st]||0)+3; S.stats.grit+=1;
    S.rpeLog.push(rpe);S.rpeLog=S.rpeLog.slice(-10);
    S.done[ds]=true;S.lastActive=todayStr();S.lastLogAt=Date.now();bumpStreakIfNew();
    gainXP(xp,cn,'extern','ses:'+ds,dSt);
    const fullNote=(note?note:'')+(km?` (${km}km, ${dur}min)`:` (${dur}min)`);
    if(fullNote)S.notes[ds]=fullNote;
    S.history.push({d:ds,type:'ext_'+EXTKIND,rpe,frac:1,xp,km,dur});
    S.history=S.history.slice(-100);
    o.remove();toast(`${T.lab} GEREGISTREERD${extra} — +${xp} XP / +${cn} CR`);
    checkBadges();
    render('mon');
  };
}

function checkinSheet(){
  if(document.querySelector('.overlay'))return;
  const o=sheet(`
    <h2 style="font-size:10px">DAGELIJKSE SCAN</h2>
    <p class="tiny dim">Twee metingen, dan kalibreert de monitor je dag.</p>
    <label for="ci-s">Slaapkwaliteit</label>
    <input type="range" id="ci-s" min="1" max="5" value="3">
    <div class="row tiny dim"><span>BRAK</span><div class="spacer"></div><span>ALS EEN ROOS</span></div>
    <label style="margin-top:12px" for="ci-f">Algemeen gevoel</label>
    <input type="range" id="ci-f" min="1" max="5" value="3">
    <div class="row tiny dim"><span>MOE</span><div class="spacer"></div><span>TOPVORM</span></div>
    <button class="btn" style="margin-top:18px" id="ci-go">SCAN VOLTOOIEN</button>`);
  o.querySelector('#ci-go').onclick=()=>{
    computeRecovery(+o.querySelector('#ci-s').value,+o.querySelector('#ci-f').value);
    S.lastCheckin=todayStr();save();o.remove();
    const m=dayMode();
    toast(m==='push'?'KALIBRATIE: PUSH-DAG':m==='light'?'KALIBRATIE: LIGHT-DAG':'KALIBRATIE: NORMAAL PROTOCOL');
    render();
  };
}

/* =====================================================
   WORKOUT ENGINE — For Time / AMRAP / EMOM / HIIT
   + space-stijl audio/haptische cues
===================================================== */
/* --- space audio: Web Audio bliepjes, geen bestanden --- */
