import mongoose from 'mongoose';
import { connectDB } from '#config';
import { Beratung } from '#models';
import { AUDIENCE_KEYS } from '#utils';

/**
 * Einmaliger Backfill: rät `targetAudience` für Bestands-Beratungen aus Titel
 * und Beschreibung. Leer bleibt gültig („keine Angabe", matcht immer) — das
 * hier ist Komfort, keine Pflicht.
 *
 * Läuft **per Default trocken** und schreibt erst mit `--apply`. Ein geratener
 * Wert ist eine Behauptung über eine Beratungsstelle; die Liste gehört vorher
 * angesehen. Angefasst werden nur Datensätze, bei denen das Feld noch leer ist —
 * eine gepflegte Angabe überschreibt der Rateautomat nicht.
 *
 * ponytail: naives `includes` ohne Stemming, dieselbe Klasse wie die
 * Keyword-Tabelle im Chat. Für einen einmaligen Lauf mit Sichtprüfung reicht das.
 */
const HINTS: Record<string, string[]> = {
    familien: ['familie', 'eltern', 'mutter', 'vater'],
    alleinerziehende: ['alleinerziehend'],
    kinder: ['kind', 'kita', 'grundschule'],
    jugendliche: ['jugend', 'azubi', 'ausbildung', 'schüler'],
    senioren: ['senior', 'rente', 'pflege', 'ältere'],
    gefluechtete: ['geflüchtet', 'flucht', 'asyl', 'migration', 'zuwander'],
    frauen: ['frau'],
    'menschen-mit-behinderung': ['behinderung', 'inklusion', 'teilhabe'],
};

export const audiencesFor = (text: string): string[] => {
    const haystack = text.toLowerCase();
    return Object.entries(HINTS)
        .filter(([, words]) => words.some((w) => haystack.includes(w)))
        .map(([key]) => key);
};

const backfill = async (apply: boolean) => {
    // Nur Leerstellen: `$exists: false` deckt den Bestand von vor Phase 12 ab.
    const offen = await Beratung.find({
        $or: [
            { targetAudience: { $size: 0 } },
            { targetAudience: { $exists: false } },
        ],
    })
        .select('title description targetAudience')
        .lean();

    let geschrieben = 0;
    for (const b of offen) {
        const keys = audiencesFor(`${b.title} ${b.description ?? ''}`);
        if (keys.length === 0) continue;

        console.log(
            `${apply ? 'setze' : 'würde setzen'}: ${b.title} → ${keys.join(', ')}`,
        );
        if (apply) {
            await Beratung.updateOne(
                { _id: b._id },
                { $set: { targetAudience: keys } },
            );
            geschrieben++;
        }
    }
    return { geprueft: offen.length, geschrieben };
};

// Sanity: eine Tippfehler-Zeile in HINTS wuerde sonst still einen ungueltigen
// Key in die Datenbank schreiben, den kein Filter je findet.
const unknown = Object.keys(HINTS).filter((k) => !AUDIENCE_KEYS.has(k));
if (unknown.length) {
    console.error(
        `Unbekannte Zielgruppen-Keys in HINTS: ${unknown.join(', ')}`,
    );
    process.exit(1);
}

const apply = process.argv.includes('--apply');

connectDB()
    .then(() => backfill(apply))
    .then(({ geprueft, geschrieben }) => {
        console.log(
            apply
                ? `Backfill: ${geschrieben} von ${geprueft} Beratungen gesetzt.`
                : `Trockenlauf über ${geprueft} Beratungen — mit \`-- --apply\` schreiben.`,
        );
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Backfill fehlgeschlagen:', err);
        process.exit(1);
    });
