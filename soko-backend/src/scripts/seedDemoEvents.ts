import mongoose from 'mongoose';
import { connectDB } from '#config';
import { ScrapedEvent } from '#models';

/**
 * Demo-Veranstaltungen für Präsentationen und zum Durchtesten der Filter.
 *
 * Warum überhaupt: `kassel.de` liefert **keine** Sprach- oder
 * Zielgruppenangaben, der echte Bestand hat diese Felder also durchgehend leer.
 * Damit sind Sprach- und Zielgruppenfilter auf Events zwar korrekt (leer matcht
 * immer), aber nicht prüfbar — man sieht nie, ob der Filter greift oder nur
 * alles durchlässt. Diese zwölf Datensätze liefern die fehlende Gegenprobe.
 *
 * `source: 'demo'` hält sie vom Scraper-Bestand getrennt; der Scraper fasst sie
 * nicht an (er upserted auf seine eigenen `externalId`s).
 *
 * Anlegen:   npm run seed:events
 * Entfernen: npm run seed:events -- --delete
 */
const DEMO = [
    {
        externalId: 'DEMO-E01',
        title: 'Stadtteilfest Nordstadt',
        description:
            'Bühne, Essensstände und ein Flohmarkt für Kinder. Der ganze Stadtteil auf einer Straße.',
        category: 'markt',
        locationName: 'Holländischer Platz',
        availableLanguages: [],
        targetAudience: ['familien'],
        inTage: 3,
        stunde: 14,
    },
    {
        externalId: 'DEMO-E02',
        title: 'Lesung auf Ukrainisch und Deutsch',
        description:
            'Zweisprachige Lesung mit anschließendem Gespräch. Eintritt frei, keine Anmeldung nötig.',
        category: 'kunst',
        locationName: 'Stadtbibliothek Kassel',
        availableLanguages: ['de', 'uk'],
        targetAudience: ['gefluechtete'],
        inTage: 5,
        stunde: 19,
    },
    {
        externalId: 'DEMO-E03',
        title: 'Führung durch die Karlsaue',
        description:
            'Zwei Stunden Parkgeschichte zu Fuß. Festes Schuhwerk empfohlen, Strecke weitgehend eben.',
        category: 'natur',
        locationName: 'Auedamm',
        availableLanguages: ['de'],
        targetAudience: ['senioren'],
        inTage: 7,
        stunde: 11,
    },
    {
        externalId: 'DEMO-E04',
        title: 'Kinderkino im Wesertor',
        description:
            'Zeichentrickfilm für Kinder ab vier Jahren, danach Popcorn und Malen im Foyer.',
        category: 'familie',
        locationName: 'Bürgerhaus Wesertor',
        availableLanguages: ['de', 'tr'],
        targetAudience: ['kinder', 'familien'],
        inTage: 8,
        stunde: 15,
    },
    {
        externalId: 'DEMO-E05',
        title: 'Open-Air-Konzert am Bugasee',
        description:
            'Drei lokale Bands, Getränke vor Ort. Bei Regen fällt die Veranstaltung aus.',
        category: 'kunst',
        locationName: 'Bugasee',
        availableLanguages: [],
        targetAudience: [],
        inTage: 10,
        stunde: 18,
    },
    {
        externalId: 'DEMO-E06',
        title: 'Info-Abend: Arbeiten in Deutschland',
        description:
            'Anerkennung von Abschlüssen, Bewerbung und Arbeitsvertrag. Mit Dolmetschung.',
        category: 'bildung',
        locationName: 'Volkshochschule Kassel',
        availableLanguages: ['de', 'ar', 'uk', 'ru'],
        targetAudience: ['gefluechtete'],
        inTage: 11,
        stunde: 18,
    },
    {
        externalId: 'DEMO-E07',
        title: 'Lauf-Treff für Einsteigerinnen',
        description:
            'Fünf Kilometer in ruhigem Tempo, danach Dehnen im Park. Nur für Frauen.',
        category: 'sport',
        locationName: 'Fuldaaue',
        availableLanguages: ['de'],
        targetAudience: ['frauen'],
        inTage: 13,
        stunde: 18,
    },
    {
        externalId: 'DEMO-E08',
        title: 'Jugendtreff: Bandworkshop',
        description:
            'Instrumente stehen bereit, Vorkenntnisse nicht nötig. Für alle zwischen 13 und 20.',
        category: 'kunst',
        locationName: 'Jugendzentrum Süd',
        availableLanguages: ['de', 'en'],
        targetAudience: ['jugendliche'],
        inTage: 15,
        stunde: 16,
    },
    {
        externalId: 'DEMO-E09',
        title: 'Wochenmarkt-Rundgang mit Kostproben',
        description:
            'Vom Stand zum Stand, mit kurzen Gesprächen und kleinen Proben unterwegs.',
        category: 'markt',
        locationName: 'Friedrichsplatz',
        availableLanguages: ['de'],
        targetAudience: [],
        inTage: 17,
        stunde: 10,
    },
    {
        externalId: 'DEMO-E10',
        title: 'Barrierefreier Museumsrundgang',
        description:
            'Führung in Leichter Sprache, stufenlos zugänglich, mit Induktionsschleife.',
        category: 'kunst',
        locationName: 'Hessisches Landesmuseum',
        availableLanguages: ['de'],
        targetAudience: ['menschen-mit-behinderung'],
        inTage: 19,
        stunde: 14,
    },
    {
        externalId: 'DEMO-E11',
        title: 'Elterncafé mit Kinderbetreuung',
        description:
            'Austausch bei Kaffee, während nebenan betreut wird. Auch für Alleinerziehende.',
        category: 'familie',
        locationName: 'Familienzentrum Nord',
        availableLanguages: ['de', 'pl'],
        targetAudience: ['familien', 'alleinerziehende'],
        inTage: 22,
        stunde: 9,
    },
    {
        externalId: 'DEMO-E12',
        title: 'Repair-Day im Werkhof',
        description:
            'Werkzeug, Ersatzteile und Leute, die sich auskennen. Bring mit, was klemmt.',
        category: 'bildung',
        locationName: 'Werkhof Kassel',
        availableLanguages: [],
        targetAudience: [],
        inTage: 26,
        stunde: 13,
    },
];

const dateIn = (tage: number, stunde: number) => {
    const d = new Date();
    d.setDate(d.getDate() + tage);
    d.setHours(stunde, 0, 0, 0);
    return d;
};

const run = async () => {
    const ids = DEMO.map((e) => e.externalId);

    if (process.argv.includes('--delete')) {
        const { deletedCount } = await ScrapedEvent.deleteMany({
            externalId: { $in: ids },
        });
        return { geloescht: deletedCount };
    }

    // Termine relativ zu heute, wie bei den Demo-Angeboten: ein fester
    // Datumsblock waere nach zwei Wochen aus der Liste gelaufen. Ein erneuter
    // Lauf schiebt sie wieder nach vorn.
    const result = await ScrapedEvent.bulkWrite(
        DEMO.map(({ inTage, stunde, ...e }) => ({
            updateOne: {
                filter: { externalId: e.externalId },
                update: {
                    $set: {
                        ...e,
                        startDate: dateIn(inTage, stunde),
                        municipality: 'Kassel',
                        source: 'demo',
                        // Kein echter Link — die Demo-Daten sind erfunden und
                        // sollen nirgendwohin zeigen, wo nichts steht.
                        sourceUrl: 'https://www.kassel.de/',
                    },
                },
                upsert: true,
            },
        })),
        { ordered: false },
    );

    return {
        neu: result.upsertedCount,
        aktualisiert: result.modifiedCount,
        gesamt: await ScrapedEvent.countDocuments(),
    };
};

connectDB()
    .then(() => run())
    .then((result) => {
        console.log('Demo-Veranstaltungen:', result);
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Fehlgeschlagen:', err.message);
        process.exit(1);
    });
