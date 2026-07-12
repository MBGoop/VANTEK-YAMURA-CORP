/* GRIT — pwa.js
   De oude versie registreerde een service worker via een Blob-URL. Dat werkt
   niet betrouwbaar: een blob-SW heeft geen geldige scope, dus Chrome op Android
   beschouwde de app niet als installeerbaar. Nu: een echte sw.js in de root +
   een echt manifest. Dat is precies wat Android nodig heeft om GRIT als app op
   het startscherm te zetten en offline te draaien. */
'use strict';

let deferredPrompt = null;

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        // Update gevonden? Meld het, maar overval de gebruiker niet midden in een set.
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw && nw.addEventListener('statechange', () => {
            if(nw.state === 'installed' && navigator.serviceWorker.controller){
              if(typeof toast === 'function') toast('NIEUWE VERSIE — HERLAAD DE APP');
            }
          });
        });
      })
      .catch(() => {/* offline-modus is optioneel, app werkt sowieso */});
  });
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if(typeof S !== 'undefined' && S && S.profile && typeof toast === 'function')
    toast('TIP: INSTALLEER VIA CORP > INSTALLEER APP');
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if(typeof toast === 'function') toast('GRIT GEINSTALLEERD');
});
