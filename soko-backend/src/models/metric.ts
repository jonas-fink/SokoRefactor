import { Schema, model } from 'mongoose';

/**
 * Ein Tag, ein Key, eine Zahl — mehr steht hier nicht.
 *
 * **Kein Nachrichtentext, keine User-ID, keine IP.** Sonst entstünde genau die
 * Personenzuordnung, die `ARCHITEKTUR.md` § 2.9 vermeidet; so ist die Sammlung
 * nicht personenbezogen und braucht keine eigene Rechtsgrundlage. Gelesen wird
 * in Metabase, es gibt keinen Lese-Endpoint und kein `/admin`-UI.
 */
export interface IMetric {
    /** `YYYY-MM-DD`, UTC. */
    day: string;
    key: string;
    count: number;
}

const metricSchema = new Schema<IMetric>({
    day: { type: String, required: true },
    key: { type: String, required: true },
    count: { type: Number, default: 0 },
});

// Der Unique-Index ist die eigentliche Zusage: derselbe Key am selben Tag ist
// **ein** Dokument mit hoehergezaehltem `count`, nie ein zweites.
metricSchema.index({ day: 1, key: 1 }, { unique: true });

export default model<IMetric>('Metric', metricSchema);
