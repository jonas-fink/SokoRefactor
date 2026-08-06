import { Beratung, Category } from '#models';
import { CATEGORY_KEYS } from '#utils';
import { askGemini } from './gemini.ts';

/**
 * Antwort des Need-Finding-Chats.
 *
 * `handoff` und `disclaimer` sind Pflichtfelder, keine Optionen: die UI kann den
 * menschlichen Ausweg damit nicht versehentlich weglassen. `disclaimer` ist bei
 * unkritischen Themen `null`, aber immer vorhanden.
 */
export type ChatReply = {
    text: string;
    matches: { id: string; title: string; category: string }[];
    handoff: { label: string; hint: string };
    disclaimer: string | null;
};

/**
 * Stichworte → `Category.key`. Bewusst nur die Beratungs-Keys: der Chat findet
 * Hilfsangebote, keine Freizeitevents.
 *
 * ponytail: naives `includes`-Matching ohne Stemming/Fuzzy. Diese Tabelle ist
 * der Platzhalter, den ein LLM-Call später ersetzt — die Naht ist `answer()`,
 * Controller und Client bleiben unverändert.
 */
export const KEYWORDS: Record<string, string[]> = {
    behoerden: [
        'amt',
        'ämter',
        'behörde',
        'antrag',
        'formular',
        'bürgeramt',
        'jobcenter',
        'arbeitsagentur',
        'ausweis',
        'anmeldung',
        'wohngeld',
        'bürgergeld',
    ],
    asyl: [
        'asyl',
        'flucht',
        'geflüchtet',
        'aufenthalt',
        'visum',
        'migration',
        'einbürgerung',
        'ausländerbehörde',
        'deutschkurs',
        'sprachkurs',
        'dolmetscher',
    ],
    familie: [
        'familie',
        'kind',
        'kinder',
        'kita',
        'schule',
        'erziehung',
        'schwanger',
        'alleinerziehend',
        'elterngeld',
        'unterhalt',
        'trennung',
    ],
    gesundheit: [
        'gesundheit',
        'sucht',
        'alkohol',
        'drogen',
        'therapie',
        'psych',
        'depression',
        'krise',
        'arzt',
        'krankenkasse',
        'einsam',
    ],
    finanzen: [
        'geld',
        'schulden',
        'miete',
        'strom',
        'pfändung',
        'insolvenz',
        'inkasso',
        'rechnung',
        'kredit',
        'finanz',
        'armut',
    ],
};

/** Themen, bei denen wir keine Rechts-, Finanz- oder Medizinberatung geben. */
const DISCLAIMERS: Record<string, string> = {
    finanzen:
        'Das ist keine Rechts- oder Finanzberatung. Verbindliche Auskünfte geben nur die Beratungsstellen selbst.',
    asyl: 'Das ist keine Rechtsberatung. Zu aufenthaltsrechtlichen Fragen berät nur eine anerkannte Stelle verbindlich.',
    gesundheit:
        'Das ist keine medizinische Beratung. In einer akuten Notlage: Notruf 112, Telefonseelsorge 0800 1110111 (kostenlos, rund um die Uhr).',
};

const HANDOFF = {
    label: 'Mit einem Menschen sprechen',
    hint: 'Alle Beratungsstellen hier sind kostenlos und vertraulich — ein Anruf oder ein Besuch reicht.',
};

/** Keys der Kategorien, die zur Nachricht passen — die stärkste Übereinstimmung zuerst. */
export const matchCategoryKeys = (message: string): string[] => {
    const text = message.toLowerCase();
    return Object.entries(KEYWORDS)
        .map(([key, words]) => ({
            key,
            hits: words.filter((w) => text.includes(w)).length,
        }))
        .filter((c) => c.hits > 0)
        .sort((a, b) => b.hits - a.hits)
        .map((c) => c.key);
};

/**
 * Reine Textbausteine — ohne Datenbank, damit der Check ohne Mongo läuft.
 *
 * `override` ist der von Gemini formulierte Text. `handoff` und `disclaimer`
 * entstehen **immer hier**, nie im Modell: ein Sprachmodell darf nicht darüber
 * entscheiden, ob ein Warnhinweis erscheint.
 */
export const buildReply = (
    keys: string[],
    matches: ChatReply['matches'],
    override?: string,
): ChatReply => {
    const disclaimer =
        keys.map((k) => DISCLAIMERS[k]).find(Boolean) ?? null;

    let text: string;
    if (override?.trim()) {
        text = override.trim();
    } else if (keys.length === 0) {
        text = 'Ich habe dazu noch keine passende Stelle gefunden. Beschreib gern mit anderen Worten, worum es geht — oder sprich direkt mit jemandem.';
    } else if (matches.length === 0) {
        text = 'Ich habe dein Thema erkannt, aber aktuell ist keine passende Stelle eingetragen. Melde dich gern direkt bei einer Beratungsstelle.';
    } else {
        text =
            matches.length === 1
                ? 'Das klingt nach einem Thema, bei dem dir diese Stelle weiterhelfen kann:'
                : 'Das klingt nach einem Thema, bei dem dir diese Stellen weiterhelfen können:';
    }

    return { text, matches, handoff: HANDOFF, disclaimer };
};

/**
 * So viele Stellen gehen als Auswahlliste an das Modell. Der gesamte Bestand
 * passt bequem in einen Prompt, deshalb genügt **ein** API-Call statt
 * Klassifizieren + Nachschlagen + Formulieren.
 *
 * ponytail: ab ~200 Beratungsstellen vorher per Keyword vorfiltern
 * (`matchCategoryKeys` liegt direkt daneben), statt alles mitzuschicken.
 */
const MAX_CANDIDATES = 60;

/**
 * Behält nur IDs, die wir dem Modell selbst gegeben haben. Das ist die Stelle,
 * an der eine halluzinierte Beratungsstelle hängen bleibt — sie darf nie
 * stillschweigend durchrutschen.
 */
export const knownOnly = <T>(ids: string[], byId: Map<string, T>): T[] =>
    ids.map((id) => byId.get(id)).filter((b) => b !== undefined);

/**
 * Ein Anliegen → Antwort mit passenden Stellen.
 *
 * Gemini wählt aus den übergebenen Stellen aus und formuliert den Text; die
 * Treffer selbst kommen aus der Datenbank und werden gegen die Kandidatenliste
 * geprüft — eine erfundene Beratungsstelle kann so nicht durchrutschen.
 * Ohne Key, ohne Quota oder bei kaputter Antwort greift die Keyword-Tabelle.
 */
export const answer = async (message: string): Promise<ChatReply> => {
    const [candidates, categories] = await Promise.all([
        Beratung.find()
            .select('title tags description')
            .limit(MAX_CANDIDATES)
            .lean(),
        Category.find({ appliesTo: 'beratung' })
            .select('key label')
            .lean(),
    ]);

    const byId = new Map(candidates.map((b) => [String(b._id), b]));
    const toMatch = (b: (typeof candidates)[number], keys: string[]) => ({
        id: String(b._id),
        title: b.title,
        category: b.tags?.find((t) => keys.includes(t)) ?? b.tags?.[0] ?? '',
    });

    // Der Keyword-Treffer läuft immer mit: er ist Fallback *und* zweite Meinung
    // für den Disclaimer — erkennt eine der beiden Seiten ein sensibles Thema,
    // steht der Hinweis da.
    const keywordKeys = matchCategoryKeys(message);

    const ai = await askGemini(
        message,
        candidates.map((b) => ({
            id: String(b._id),
            title: b.title,
            tags: b.tags ?? [],
            description: b.description ?? '',
        })),
        categories.map((c) => ({ key: c.key, label: c.label })),
    );

    if (ai) {
        const keys = [
            ...new Set([
                ...ai.keys.filter((k) => CATEGORY_KEYS.has(k)),
                ...keywordKeys,
            ]),
        ];
        const matches = knownOnly(ai.ids, byId).map((b) => toMatch(b, keys));

        return buildReply(keys, matches, ai.text);
    }

    const matches = candidates
        .filter((b) => b.tags?.some((t) => keywordKeys.includes(t)))
        .slice(0, 5)
        .map((b) => toMatch(b, keywordKeys));

    return buildReply(keywordKeys, matches);
};
