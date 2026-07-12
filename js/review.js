/* GRIT — review.js  ·  WEEKREVIEW
   Verschijnt op zondag, één keer per week.

   Waarom dit werkt: losse cijfers per dag zeggen niets. Een tracker wordt pas
   nuttig als hij één keer per week een conclusie trekt die je gedrag verandert.
   Daarom geen dashboard vol grafiekjes, maar 3 tot 5 zinnen met een oordeel —
   inclusief het onaangename oordeel als je te hard traint. */
'use strict';

/* weekKey() staat sinds v5 in core.js — planner.js (streak-freeze) en de
   weekquest hebben hem ook nodig en laden vóór dit bestand. */

function weekStats(){
  const start = new Date(weekKey());
  let planned=0, done=0, rpes=[], types={};
  for(let i=0;i<7;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const ds = d.toISOString().slice(0,10);
    if(ds > todayStr()) break;
    const ses = sessionForDate(ds);
    if(ses) planned++;
    if(S.done[ds]) done++;
    const h = S.history.find(x=>x.d===ds);
    if(h){ rpes.push(h.rpe); types[h.type]=(types[h.type]||0)+1; }
  }
  const avgRpe = rpes.length ? +(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1) : null;

  /* rusthartslag: begin vs eind van de week */
  const log = (S.hr?.restLog||[]).filter(e=>e.d>=weekKey());
  const hrTrend = log.length>=2 ? log[log.length-1].bpm - log[0].bpm : null;

  return {planned, done, avgRpe, types, hrTrend, hrCount:log.length};
}

/* De kern: een oordeel, geen samenvatting. */
function reviewVerdict(w){
  const out = [];
  if(w.planned === 0) out.push('Geen sessies gepland deze week.');
  else if(w.done >= w.planned) out.push(`Alle ${w.planned} sessies afgewerkt. Dat is de week die telt.`);
  else if(w.done === 0) out.push('Nul sessies. Eén week missen is geen ramp — twee wel. Zet morgen een korte in.');
  else out.push(`${w.done} van ${w.planned} sessies. ${w.done/w.planned >= 0.75 ? 'Ruim voldoende.' : 'Onder de maat, maar recupereerbaar.'}`);

  if(w.avgRpe !== null){
    if(w.avgRpe >= 8)      out.push(`Gemiddelde RPE ${w.avgRpe} — te hoog. Dit is de klassieke fout: alles op "medium-hard". Te zwaar om te herstellen, te licht om echt te prikkelen. Volgende week bewust trager op je duurlopen.`);
    else if(w.avgRpe <= 5) out.push(`Gemiddelde RPE ${w.avgRpe} — je laat wat liggen. Eén sessie mag echt pijn doen.`);
    else                   out.push(`Gemiddelde RPE ${w.avgRpe} — goede spreiding tussen rustig en hard.`);
  }

  if(w.hrTrend !== null){
    if(w.hrTrend >= 5)      out.push(`Rusthartslag steeg ${w.hrTrend} bpm over de week. Dat is je lichaam dat om rust vraagt. Neem volgende week een dag extra.`);
    else if(w.hrTrend <= -3) out.push(`Rusthartslag daalde ${Math.abs(w.hrTrend)} bpm. Je motor wordt beter — dit is het duidelijkste teken van vooruitgang dat er bestaat.`);
    else                     out.push('Rusthartslag stabiel. Herstel loopt gelijk met de belasting.');
  } else if(w.hrCount < 3){
    out.push('Te weinig ochtendmetingen om je herstel te beoordelen. Meet dagelijks — het kost 30 seconden.');
  }

  const wk = hyroxWeek();
  if(wk){
    const nxt = PLAN.weeks[wk];   /* volgende week = index wk (0-based) */
    if(nxt) out.push(`Volgende week: wk ${nxt.week} — ${nxt.focus}`);
    else    out.push('Volgende week valt buiten het plan. Race gehad?');
  }
  return out;
}

function reviewSheet(force){
  const w = weekStats();
  const lines = reviewVerdict(w);
  const o = sheet(`
    <h2 style="font-size:10px">WEEKRAPPORT</h2>
    <p class="tiny dim">Week van ${weekKey()}</p>
    <div class="panel inv" style="margin-top:12px">
      <p><b style="color:var(--g3b)">${w.done}/${w.planned}</b> sessies
      ${w.avgRpe!==null?` &nbsp;·&nbsp; RPE <b style="color:var(--g3b)">${w.avgRpe}</b>`:''}
      ${w.hrTrend!==null?` &nbsp;·&nbsp; HR <b style="color:var(--g3b)">${w.hrTrend>0?'+':''}${w.hrTrend}</b>`:''}</p>
    </div>
    ${lines.map(l=>`<p class="tiny" style="margin-top:10px">${l}</p>`).join('')}
    <button class="btn" style="margin-top:18px" id="rv-ok">BEGREPEN${S.lastReviewReward!==weekKey()?' — +20 XP':''}</button>`);
  o.querySelector('#rv-ok').onclick = () => {
    S.lastReview = weekKey();
    /* Reflectie belonen, niet alleen zweet: 1x per week. Bonus bij >=75%
       van de geplande sessies — consistentie is het gedrag dat telt. */
    if(S.lastReviewReward !== weekKey()){
      S.lastReviewReward = weekKey();
      const bonus = w.planned>0 && w.done/w.planned>=0.75;
      gainXP(20, bonus?15:0);
      toast(bonus?'+20 XP / +15 CR — sterke week':'+20 XP — rapport verwerkt');
    }
    save(); o.remove();
  };
  if(!force){ S.lastReview = weekKey(); save(); }
}

/* Trigger: zondag, één keer per week, en alleen als er iets te zeggen valt. */
function maybeReview(){
  if(new Date(todayStr()).getDay() !== 0) return;   /* enkel zondag */
  if(S.lastReview === weekKey()) return;            /* al gezien */
  if(!S.profile) return;
  setTimeout(()=>{
    /* Herchecken in de timeout: elke render queuet er een, en snel
       tab-wisselen mag geen stapel rapporten opleveren. */
    if(S.lastReview === weekKey()) return;
    if(document.querySelector('.overlay')) return;  /* nooit over een open sheet heen */
    reviewSheet(false);
  }, 900);
}
