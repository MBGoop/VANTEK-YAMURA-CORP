# Smoke test

Boot de app in een virtuele browser (jsdom) en controleert:
migratie van oude opslag, naamconsistentie, bewerken/verplaatsen,
sets-reps-gewicht, RACE-tab, weekrapport.

```bash
npm install jsdom
node test/smoke.mjs
```

Draai dit na elke wijziging. Deze test vond de badge-bug
(JSON.stringify gooit functies weg) en de migratie-bug (RACE-tab leeg).
