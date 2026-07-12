# GRIT — Specimen Growth Monitor

Van één `index.html` van 112 KB naar een app waar **content en code gescheiden zijn**.
Gedrag is identiek aan v2 — er is niets herschreven, alleen uit elkaar gehaald en getest.

## Structuur

```
index.html              skelet — laadt css + js, verder niets
manifest.webmanifest    PWA-manifest (Android-installatie)
sw.js                   service worker (offline)
css/app.css             alle styling
icons/                  echte PNG-iconen (192 / 512 / maskable)

data/                   ← HIER pas je content aan, nooit in js/
  exercises.csv         34 oefeningen · bewerk in Excel
  defaults.json         beginstaat van een nieuw profiel
  creature.json         sprites, paletten, items, nav-iconen
  daytypes.json         dagtypes + categorieën
  gamification.json     quests + badges
  formats.json          timerformats (EMOM, AMRAP, ...)
  benchmark.json        Hyrox-benchmarks
  session-types.json    sessietypes voor de agenda

js/
  data.js       laadt /data/, parseert de CSV
  core.js       state, opslaan/laden, XP en levels
  storage.js    versiebeheer, migratie, back-up  ← NIEUW
  creature.js   pixel-engine, sprites, scène
  planner.js    oefeningen, sessieopbouw, plan, badges
  ui.js         router, onboarding, monitor, vandaag
  train.js      rusttimer, loggen, dagelijkse check-in
  timer.js      audio + workout-engine
  hr.js         VITALS: rusthartslag + zones          ← NIEUW
  views.js      benchmark, agenda, oefenbib, corp
  pwa.js        service worker + installatie          ← NIEUW
  boot.js       start de app zodra de data binnen is  ← NIEUW
```

## Oefening toevoegen of aanpassen

1. Open `data/exercises.csv` in Excel (puntkomma-gescheiden, NL-instelling).
2. Voeg een rij toe of pas een cel aan.
3. Opslaan als CSV, pushen naar GitHub. Klaar — geen code, geen Claude nodig.

| kolom | betekenis |
|---|---|
| `id` | unieke sleutel, geen spaties (bv. `sledpush`) |
| `n` | naam zoals die in de app verschijnt |
| `cat` | `STRENGTH` · `CONDITIONING` · `CORE` · `MOBILITY` · `SKILL` |
| `need` | benodigd materiaal: `geen` · `kb` · `band` · `run` · `pullup` |
| `zone` | pijnzone (`knie`, `rug`, `schouder`) — **leeg laten indien geen** |
| `stat` | `power` · `speed` · `endurance` · `core` |
| `wt` | `light` · `mid` · `heavy` (optioneel) |
| `desc` | uitvoeringscue, 1 zin |
| `reg` | makkelijkere variant |
| `prog` | zwaardere variant |
| `alt` | alternatieve oefening-id's, komma-gescheiden (optioneel) |

## Belangrijk: dubbelklikken werkt niet meer

De app haalt haar data op met `fetch()`. Browsers blokkeren dat vanaf `file://`.

- **Online:** gewoon via GitHub Pages. Werkt.
- **Lokaal:** `python3 -m http.server 8000` in deze map, dan `localhost:8000`.

Dat is de enige prijs van de opsplitsing.

## Deployen

Vervang de inhoud van je repo door deze map. Alles is relatief gelinkt (`./`), dus
GitHub Pages werkt zonder aanpassingen.

**Bij elke release:** verhoog `CACHE` in `sw.js` (bv. `grit-v3.0.1`). Doe je dat niet,
dan blijven bezoekers de oude bestanden uit hun cache zien.

## Android

De app is nu een echte installeerbare PWA: manifest + service worker als bestand +
PNG-iconen. Chrome op Android biedt "Toevoegen aan startscherm" aan, en de app opent
fullscreen zonder browserbalk, ook offline.

Wil je later in de Play Store: wrap deze PWA met **Bubblewrap** (Trusted Web Activity).
Dat maakt een APK van exact deze bestanden — je hoeft niets te herschrijven.

## Back-up

Je data zit in `localStorage`. Browsercache wissen = alles weg. Daarom:

- `storage.js` maakt automatisch een schaduwkopie onder een tweede sleutel;
- **CORP → DATA EXPORTEREN** geeft je een JSON-bestand. Doe dit maandelijks.
