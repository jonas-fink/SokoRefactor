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

Sprachen und Zielgruppen sind **absichtlich gemischt**, inklusive Leerstellen:
der Feierabendmarkt hat weder das eine noch das andere und muss deshalb bei
jedem Sprach- und Zielgruppenfilter sichtbar bleiben („leer = keine Angabe =
matcht immer"). Ohne so einen Fall im Bestand fällt genau dieser Fehler beim
Testen nicht auf.

## Veranstaltungen (ScrapedEvents)

```bash
npm run seed:events              # anlegen/auffrischen
npm run seed:events -- --delete  # wieder entfernen
```

12 erfundene Veranstaltungen (`source: 'demo'`, `externalId: DEMO-E…`), Termine
wie oben relativ zu heute. **Warum überhaupt:** `kassel.de` liefert keine
Sprach- oder Zielgruppenangaben, der echte Bestand hat diese Felder also
durchgehend leer. Damit sind die Filter auf Events zwar korrekt, aber nicht
prüfbar — man sieht nie, ob der Filter greift oder nur alles durchlässt. Diese
zwölf Datensätze sind die Gegenprobe. Der Scraper fasst sie nicht an (er
upserted auf seine eigenen `externalId`s).

## Beratungsstellen

`demo-beratungen.csv` — 15 **erfundene** Beratungsstellen, drei je Beratungs-Kategorie
(`behoerden`, `asyl`, `familie`, `gesundheit`, `finanzen`), mit den Spalten
`sprachen`/`zielgruppe` (drei Zeilen lassen `zielgruppe` bewusst leer), für
Präsentationen und zum Durchtesten der Oberfläche. Namen, Telefonnummern und Angebote sind frei
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

## Alles zusammen

```bash
npm run seed:categories                                    # Voraussetzung
npm run seed:activities
npm run seed:events
npm run import:beratungen -- seed/demo-beratungen.csv demo
```

Zum Format siehe `docs/PARTNER-IMPORT.md`. **Achtung:** Felder mit Kommas gehören in
Anführungszeichen — auch `oeffnungszeiten`, wenn ein Tag mehrere Zeitspannen hat
(`"mo 08:00-12:00,13:00-16:00"`). Sonst verschieben sich die Spalten still.
