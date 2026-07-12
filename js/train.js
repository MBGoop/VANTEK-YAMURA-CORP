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
function logSheet(ses){
  const mode=dayMode();
  const w=sessionPlan(todayStr(), mode==='light');
  /* alle main-oefeningen met een gewichtscomponent */
  const wtItems=w.main.filter(it=>Array.isArray(it)&&typeof it[0]==='object'&&EX[it[0].key].wt&&has('kb'));
  const wtHtml=wtItems.length?`
    <label style="margin-top:14px">Gebruikte gewichten (optioneel)</label>
    ${wtItems.map(it=>{const k=it[0].key;const last=lastLog(k);const sug=last?last.w:suggestKB(k);const tip=progressTip(k);
      return `<div style="margin-top:8px">
        <div class="row"><span class="body" style="flex:1">${EX[k].n}</span>
        <input class="mini" type="number" inputmode="decimal" data-wk="${k}" placeholder="KG" value="${sug||''}">
        <input class="mini" type="number" inputmode="numeric" data-rk="${k}" placeholder="REPS" value="${last?last.r:''}"></div>
        ${tip?`<p class="tiny dim" style="margin-top:2px">${tip}</p>`:''}
      </div>`}).join('')}`:'';
  const o=sheet(`
    <h2 style="font-size:10px">PROTOCOL LOGGEN</h2>
    <label>Hoe zwaar voelde het? (RPE${S.profile.parqFlag?' — hou het onder 6':''})</label>
    <input type="range" id="rpe" min="1" max="10" value="7">
    <div class="row tiny dim"><span>LICHT</span><div class="spacer"></div><b id="rpev" style="color:var(--g3b)">7</b><div class="spacer"></div><span>MAXIMAAL</span></div>
    ${wtHtml}
    <label style="margin-top:14px">Notitie (optioneel)</label>
    <input type="text" id="lg-note" maxlength="80" placeholder="bv. knie voelde goed, KB te licht" value="${S.notes[todayStr()]||''}">
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
    if(noteVal)S.notes[todayStr()]=noteVal; else delete S.notes[todayStr()];
    /* gewichten opslaan */
    o.querySelectorAll('[data-wk]').forEach(inp=>{
      const k=inp.dataset.wk, wv=parseFloat(inp.value);
      const rv=parseInt(o.querySelector(`[data-rk="${k}"]`).value);
      if(wv>0){
        if(!S.exLog[k])S.exLog[k]=[];
        S.exLog[k].push({d:todayStr(),w:wv,r:rv>0?rv:null});
        S.exLog[k]=S.exLog[k].slice(-20);
      }
    });
    S.done[todayStr()]=true;S.lastActive=todayStr();bumpStreakIfNew();
    const map={strength:'power',strengthL:'power',strengthU:'power',conditioning:'speed',conditioning2:'speed',mixed:'grit',circuit:'grit',mobility:'mobility'};
    S.stats[map[ses.type]]+=Math.round(3*frac);
    S.stats.grit+=1;
    const xp=Math.round((20+S.dur*0.6)*frac), cn=Math.round(10*frac);
    gainXP(xp,cn);
    /* historie loggen */
    S.history.push({d:todayStr(),type:ses.type,rpe,frac,xp});
    S.history=S.history.slice(-100);
    o.remove();toast(`+${xp} XP / +${cn} CR — DATA VERWERKT`);
    checkBadges();
    if(S.rpeLog.length>=2&&S.rpeLog.slice(-2).every(r=>r>=9))toast('WAARSCHUWING: 2 zware sessies — volgende automatisch lichter');
    render('mon');
  };
}

/* ---------------- EXTERNE SESSIE (buiten de app getraind) ---------------- */
let EXTKIND='gym';
function externalLogSheet(){
  EXTKIND='gym';
  const o=sheet(`
    <h2 style="font-size:10px">EXTERNE SESSIE</h2>
    <p class="tiny dim">Getraind buiten de app? Registreer het hier. Telt mee voor streak, XP en stats.</p>
    <label>Soort</label>
    <div class="chips" id="ext-kind">
      <button class="chip sel" data-v="gym">KRACHT / GYM</button>
      <button class="chip" data-v="run">LOOP</button>
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
    if(EXTKIND==='gym'){
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
    if(EXTKIND==='run'){km=parseFloat((o.querySelector('#ext-km')||{}).value)||null;if(km)extra=` ${km}km`}
    /* stats: gym -> power/grit, run -> speed/endurance(grit) */
    if(EXTKIND==='gym'){S.stats.power+=3;S.stats.grit+=1;}
    else{S.stats.speed+=3;S.stats.grit+=1;}
    S.rpeLog.push(rpe);S.rpeLog=S.rpeLog.slice(-10);
    S.done[todayStr()]=true;S.lastActive=todayStr();bumpStreakIfNew();
    const xp=Math.round(20+dur*0.6), cn=Math.round(10);
    gainXP(xp,cn);
    const label=EXTKIND==='gym'?'GYM / KRACHT':'LOOP';
    const fullNote=(note?note:'')+(EXTKIND==='run'&&km?` (${km}km, ${dur}min)`:'');
    if(fullNote)S.notes[todayStr()]=fullNote;
    S.history.push({d:todayStr(),type:'ext_'+EXTKIND,rpe,frac:1,xp,km,dur});
    S.history=S.history.slice(-100);
    o.remove();toast(`${label} GEREGISTREERD${extra} — +${xp} XP`);
    checkBadges();
    render('mon');
  };
}

function checkinSheet(){
  if(document.querySelector('.overlay'))return;
  const o=sheet(`
    <h2 style="font-size:10px">DAGELIJKSE SCAN</h2>
    <p class="tiny dim">Twee metingen, dan kalibreert de monitor je dag.</p>
    <label>Slaapkwaliteit</label>
    <input type="range" id="ci-s" min="1" max="5" value="3">
    <div class="row tiny dim"><span>BRAK</span><div class="spacer"></div><span>ALS EEN ROOS</span></div>
    <label style="margin-top:12px">Algemeen gevoel</label>
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
