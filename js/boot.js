/* GRIT — boot.js
   Volgorde is nu belangrijk: de data komt van de server, dus de app mag pas
   starten als alles binnen is. Vroeger stond alles in één bestand en was dat
   automatisch geregeld — dit is de prijs (en het enige echte nadeel) van de
   opsplitsing. */
'use strict';

(async function boot(){
  try{
    await loadData();          // data.js  -> vult EX, DEFAULT, SPRITES, ...
    load();                    // core.js  -> S uit localStorage of DEFAULT
    migrate();                 // storage.js -> schema bijwerken
    autoBackup();              // storage.js -> schaduwkopie van de vorige staat
    applyVisuals();

    const hash = location.hash.replace('#','');
    const tabs = ['mon','trn','agd','vit','bib','crp'];
    applyTheme();
    render(tabs.includes(hash) ? hash : 'mon');
  }catch(err){
    console.error('[GRIT] boot mislukt:', err);
    document.getElementById('app').innerHTML = `
      <div style="padding:24px;color:#cfe8a9;font-family:monospace;line-height:1.6">
        <p><b>SYSTEEMFOUT — DATA NIET GELADEN</b></p>
        <p style="font-size:11px;opacity:.8">${err.message}</p>
        <p style="font-size:11px;opacity:.8">
          Open je dit bestand rechtstreeks vanaf je schijf? Dat kan niet meer:
          de browser blokkeert het laden van /data/. Draai het via GitHub Pages,
          of lokaal met <code>python3 -m http.server</code>.
        </p>
      </div>`;
  }
})();
