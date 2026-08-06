import { Beratung } from '#models';

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

/** Reine Textbausteine — ohne Datenbank, damit der Check ohne Mongo läuft. */
export const buildReply = (
    keys: string[],
    matches: ChatReply['matches'],
): ChatReply => {
    const disclaimer =
        keys.map((k) => DISCLAIMERS[k]).find(Boolean) ?? null;

    let text: string;
    if (keys.length === 0) {
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
 * Naht für die spätere GenAI-Anbindung: hier wird der Keyword-Match durch einen
 * LLM-Call ersetzt, `ChatReply` bleibt gleich.
 */
export const answer = async (message: string): Promise<ChatReply> => {
    const keys = matchCategoryKeys(message);
    const found = keys.length
        ? await Beratung.find({ tags: { $in: keys } })
              .select('title tags')
              .limit(5)
              .lean()
        : [];

    return buildReply(
        keys,
        found.map((b) => ({
            id: String(b._id),
            title: b.title,
            category: b.tags?.find((t) => keys.includes(t)) ?? keys[0],
        })),
    );
};
