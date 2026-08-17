import { Metric } from '#models';

/**
 * Kennzahlen des Chats. Dieselbe Regel wie bei `services/gemini.ts`: **wirft
 * nie** und wird nicht abgewartet — eine kaputte Statistik darf keine kaputte
 * Antwort sein.
 *
 * Geschrieben wird nur `{ day, key, count }` (siehe `models/metric.ts`).
 */

/** Geschlossene Liste, damit ein Tippfehler keinen stillen neuen Key anlegt. */
export type MetricKey =
    /** Antwort mit mindestens einem Treffer. */
    | 'chat.reply'
    /** Antwort ohne Treffer — die handlungsleitende Zahl: wonach gefragt wird,
     *  ohne dass etwas Passendes im Bestand steht. */
    | 'chat.no_match'
    /** Gemini war nicht verfuegbar, die Keyword-Tabelle hat uebernommen. */
    | 'chat.fallback'
    /** Der Notfallpfad hat gegriffen. */
    | 'chat.urgent';

/**
 * Tages-Bucket und Update-Fragment — rein, damit der Check ohne Mongo laeuft.
 *
 * ponytail: UTC-Tag. Eine Anfrage um 01:00 Kasseler Zeit zaehlt auf den Vortag;
 * fuer Trends egal. Stoert es, konvertiert Metabase die Zeitzone beim Lesen.
 */
export const metricUpsert = (key: MetricKey, at = new Date()) => ({
    filter: { day: at.toISOString().slice(0, 10), key },
    // `$inc` mit `upsert`, nicht lesen-rechnen-schreiben: zwei gleichzeitige
    // Anfragen zaehlen sonst beide von derselben Zahl aus.
    update: { $inc: { count: 1 } },
});

export const bumpMetric = (key: MetricKey) => {
    const { filter, update } = metricUpsert(key);
    Metric.updateOne(filter, update, { upsert: true }).catch((err) =>
        console.warn(
            'Kennzahl nicht geschrieben:',
            err instanceof Error ? err.message : err,
        ),
    );
};
