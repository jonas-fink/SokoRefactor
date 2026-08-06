# Demo-Daten

## Angebote (Activities)

```bash
npm run seed:activities              # anlegen/auffrischen
npm run seed:activities -- --delete  # wieder entfernen
```

10 erfundene Nachbarschaftsangebote, verteilt über alle Activity-Kategorien
(`familie`, `sport`, `bildung`, `kunst`, `natur`, `markt`). Die Termine liegen
**relativ zu heute** (+2 bis +28 Tage), damit im Sammlungs-Kalender immer etwas
steht; ein erneuter Lauf schiebt sie wieder nach vorn. Tabelle in
`src/scripts/seedDemoActivities.ts`, Eigentümer ist der erste Admin-Account.

## Beratungsstellen

`demo-beratungen.csv` — 15 **erfundene** Beratungsstellen, drei je Beratungs-Kategorie
(`behoerden`, `asyl`, `familie`, `gesundheit`, `finanzen`), für Präsentationen und
zum Durchtesten der Oberfläche. Namen, Telefonnummern und Angebote sind frei
erfunden; die Adressen sind echte Kasseler Straßen, damit Karte und Geocoding
funktionieren. **Keine echten Träger, keine echten Nummern.**

```bash
npm run import:beratungen -- seed/demo-beratungen.csv demo   # anlegen/aktualisieren
```

Wiederholtes Ausführen aktualisiert (Upsert auf `externalId`), es entstehen keine
Dubletten. Alles wieder entfernen:

```bash
node --conditions dev --env-file=.env -e "
const m=await import('mongoose'); const {connectDB}=await import('#config'); const {Beratung}=await import('#models');
await connectDB(); console.log(await Beratung.deleteMany({source:'demo'})); await m.default.disconnect();"
```

Zum Format siehe `docs/PARTNER-IMPORT.md`. **Achtung:** Felder mit Kommas gehören in
Anführungszeichen — auch `oeffnungszeiten`, wenn ein Tag mehrere Zeitspannen hat
(`"mo 08:00-12:00,13:00-16:00"`). Sonst verschieben sich die Spalten still.
