import mongoose from 'mongoose';
import { connectDB } from '#config';
import { Activity, User } from '#models';

/**
 * Demo-Angebote für Präsentationen. Erfundene Nachbarschaftsangebote in Kassel,
 * kein echter Anbieter.
 *
 * Die Termine liegen **relativ zu heute** (`inTage`), damit sie im
 * Sammlungs-Kalender immer im aktuellen oder nächsten Monat auftauchen — ein
 * fester Datumsblock wäre nach zwei Wochen wertlos. Ein erneuter Lauf schiebt
 * die Termine wieder nach vorn (Upsert auf `title`).
 *
 * Anlegen:  npm run seed:activities
 * Entfernen: npm run seed:activities -- --delete
 */
const DEMO = [
    {
        title: 'Nachbarschafts-Frühstück im Nordstadtpark',
        description:
            'Jeden Sonntag bringt jede und jeder etwas mit. Kaffee, Tee und Tische stehen bereit — komm einfach vorbei.',
        tags: ['familie'],
        price: 0,
        inTage: 2,
        stunde: 10,
        coordinates: [9.4941, 51.3268],
    },
    {
        title: 'Lauftreff an der Fulda',
        description:
            'Lockere fünf Kilometer am Flussufer, in zwei Tempogruppen. Auch für Anfängerinnen und Anfänger geeignet.',
        tags: ['sport'],
        price: 0,
        inTage: 4,
        stunde: 18,
        coordinates: [9.5081, 51.3162],
    },
    {
        title: 'Reparatur-Café Wesertor',
        description:
            'Toaster kaputt, Hose gerissen? Wir reparieren gemeinsam statt wegzuwerfen. Werkzeug ist da, Spende freiwillig.',
        tags: ['bildung'],
        price: 0,
        inTage: 6,
        stunde: 15,
        coordinates: [9.5044, 51.3241],
    },
    {
        title: 'Offenes Atelier für Kinder',
        description:
            'Malen, drucken, bauen — Material steht bereit, Eltern können dabeibleiben oder nebenan Kaffee trinken.',
        tags: ['kunst', 'familie'],
        price: 3,
        inTage: 9,
        stunde: 16,
        coordinates: [9.4802, 51.3095],
    },
    {
        title: 'Kräuterwanderung Habichtswald',
        description:
            'Zwei Stunden durch den Wald: welche Pflanzen essbar sind, welche nicht und was daraus wird.',
        tags: ['natur'],
        price: 5,
        inTage: 12,
        stunde: 14,
        coordinates: [9.4131, 51.3187],
    },
    {
        title: 'Sprachcafé Deutsch-Arabisch',
        description:
            'Einfach reden üben, ohne Prüfung und ohne Anmeldung. Muttersprachlerinnen und Lernende an einem Tisch.',
        tags: ['bildung'],
        price: 0,
        inTage: 15,
        stunde: 17,
        coordinates: [9.4918, 51.3151],
    },
    {
        title: 'Feierabendmarkt am Ständeplatz',
        description:
            'Regionale Stände, Musik und Essen zum Mitnehmen — der Markt für alle, die tagsüber arbeiten.',
        tags: ['markt'],
        price: 0,
        inTage: 18,
        stunde: 17,
        coordinates: [9.4883, 51.3134],
    },
    {
        title: 'Fahrrad-Werkstatt zum Mitmachen',
        description:
            'Bremsen einstellen, Schlauch flicken, Kette wechseln: wir zeigen es dir, machen tust du es selbst.',
        tags: ['sport', 'bildung'],
        price: 0,
        inTage: 21,
        stunde: 16,
        coordinates: [9.4746, 51.3079],
    },
    {
        title: 'Chorprobe für Neugierige',
        description:
            'Vier Wochen reinschnuppern, ohne Noten lesen zu können. Wir singen quer durch alles von Volkslied bis Pop.',
        tags: ['kunst'],
        price: 0,
        inTage: 25,
        stunde: 19,
        coordinates: [9.4661, 51.3121],
    },
    {
        title: 'Gemeinschaftsgarten: Pflanztag',
        description:
            'Beete vorbereiten und Setzlinge pflanzen. Handschuhe mitbringen, alles andere ist da.',
        tags: ['natur', 'familie'],
        price: 0,
        inTage: 28,
        stunde: 11,
        coordinates: [9.5163, 51.3298],
    },
];

const dateIn = (tage: number, stunde: number) => {
    const d = new Date();
    d.setDate(d.getDate() + tage);
    d.setHours(stunde, 0, 0, 0);
    return d;
};

const run = async () => {
    const titles = DEMO.map((a) => a.title);

    if (process.argv.includes('--delete')) {
        const { deletedCount } = await Activity.deleteMany({
            title: { $in: titles },
        });
        return { geloescht: deletedCount };
    }

    const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
    if (!admin) throw new Error('Kein Admin-Account in der Datenbank');

    const result = await Activity.bulkWrite(
        DEMO.map(({ inTage, stunde, coordinates, ...a }, i) => ({
            updateOne: {
                filter: { title: a.title },
                update: {
                    $set: {
                        ...a,
                        date: dateIn(inTage, stunde),
                        location: { type: 'Point', coordinates },
                        image: `https://picsum.photos/seed/soko-act-${i + 1}/800/500`,
                    },
                    $setOnInsert: { userId: admin._id },
                },
                upsert: true,
            },
        })),
        { ordered: false },
    );

    return {
        neu: result.upsertedCount,
        aktualisiert: result.modifiedCount,
        gesamt: await Activity.countDocuments(),
    };
};

connectDB()
    .then(() => run())
    .then((result) => {
        console.log('Demo-Angebote:', result);
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Fehlgeschlagen:', err.message);
        process.exit(1);
    });
