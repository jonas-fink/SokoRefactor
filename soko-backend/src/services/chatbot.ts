import { Beratung, Category } from '#models';
import { CATEGORY_KEYS } from '#utils';
import type { ChatTurn } from '#schemas';
import { askGemini } from './gemini.ts';

export type Hotline = { label: string; number: string; hint: string };

/**
 * Antwort des Need-Finding-Chats.
 *
 * `handoff`, `disclaimer` und `urgent` sind Pflichtfelder, keine Optionen: die
 * UI kann den menschlichen Ausweg damit nicht versehentlich weglassen. `null`
 * bei unkritischen Themen, aber immer vorhanden.
 */
export type ChatReply = {
    text: string;
    matches: { id: string; title: string; category: string }[];
    handoff: { label: string; hint: string };
    disclaimer: string | null;
    urgent: Hotline[] | null;
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

/**
 * `112` und `116117` sind **nicht** dasselbe und werden nie zusammengefasst:
 * `112` gilt bei Unfall und Lebensgefahr, `116117` ist der ärztliche
 * Bereitschaftsdienst für akut Kranke außerhalb der Sprechzeiten.
 */
const HOTLINES = {
    notruf: {
        label: 'Notruf',
        number: '112',
        hint: 'Unfall, Feuer, Lebensgefahr — rund um die Uhr, kostenlos.',
    },
    bereitschaft: {
        label: 'Ärztlicher Bereitschaftsdienst',
        number: '116117',
        hint: 'Akut krank außerhalb der Sprechzeiten, aber kein Notfall.',
    },
    seelsorge: {
        label: 'Telefonseelsorge',
        number: '0800 1110111',
        hint: 'Anonym, rund um die Uhr, kostenlos.',
    },
    gewalt: {
        label: 'Hilfetelefon Gewalt gegen Frauen',
        number: '116016',
        hint: 'Rund um die Uhr, 18 Sprachen, kostenlos.',
    },
    kummer: {
        label: 'Nummer gegen Kummer',
        number: '116111',
        hint: 'Für Kinder und Jugendliche.',
    },
    gift: {
        label: 'Giftnotruf',
        number: '0551 19240',
        hint: 'Vergiftungen, rund um die Uhr.',
    },
} satisfies Record<string, Hotline>;

/**
 * Wortgrenzen statt blankem `includes`: „Gewaltschutzberatung" oder
 * „Feuerwehrfest" dürfen keinen Notruf auslösen. Der falsch-positive Fall ist
 * hier der teurere — wer nach einem Antrag fragt, soll keine 112 sehen.
 */
const URGENT: { pattern: RegExp; keys: (keyof typeof HOTLINES)[] }[] = [
    {
        pattern: /\b(unfall|verletzt|blutet|bewusstlos|feuer)\b/,
        keys: ['notruf', 'bereitschaft'],
    },
    {
        pattern: /\b(suizid|selbstmord)\b|umbringen|nicht mehr leben/,
        keys: ['seelsorge', 'notruf', 'kummer'],
    },
    {
        pattern: /schlägt mich|\b(gewalt|missbrauch)\b/,
        keys: ['gewalt', 'notruf'],
    },
    {
        pattern: /vergiftet|tabletten geschluckt/,
        keys: ['gift', 'notruf'],
    },
];

/**
 * Notlage im Text? Dann die passenden Nummern, sonst `null`.
 *
 * Läuft **vor** dem Gemini-Call und ohne ihn: wer „Unfall" schreibt, braucht
 * eine Nummer, keinen Modell-Timeout. Deterministisch, damit der Pfad nicht von
 * fremder Verfügbarkeit abhängt.
 */
export const urgentHotlines = (text: string): Hotline[] | null => {
    const haystack = text.toLowerCase();
    const keys = URGENT.filter((u) => u.pattern.test(haystack)).flatMap(
        (u) => u.keys,
    );
    // Mehrere Treffer teilen sich `notruf` — Reihenfolge bleibt, Dubletten raus.
    return keys.length ? [...new Set(keys)].map((k) => HOTLINES[k]) : null;
};

const URGENT_TEXT =
    'Das klingt nach einer Notlage. Bitte ruf zuerst hier an — das geht sofort, ist kostenlos und rund um die Uhr erreichbar.';

/**
 * Alle **User**-Turns plus die aktuelle Nachricht als ein Text.
 *
 * Grundlage fürs Keyword-Matching, und das ist Sicherheit, nicht Kosmetik: bei
 * „und was ist mit der Miete?" als Rückfrage steckt das sensible Thema im
 * vorigen Turn — ohne den Verlauf fiele der Disclaimer weg. Bot-Turns bleiben
 * bewusst draußen: der Verlauf kommt vom Client, ein manipuliertes „Assistent:"
 * darf die Keys nicht steuern.
 */
export const conversationText = (history: ChatTurn[], message: string) =>
    [
        ...history.filter((h) => h.role === 'user').map((h) => h.text),
        message,
    ].join(' ');

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
    urgent: Hotline[] | null = null,
): ChatReply => {
    const disclaimer = keys.map((k) => DISCLAIMERS[k]).find(Boolean) ?? null;

    let text: string;
    if (override?.trim()) {
        text = override.trim();
    } else if (keys.length === 0) {
        text =
            'Ich habe dazu noch keine passende Stelle gefunden. Beschreib gern mit anderen Worten, worum es geht — oder sprich direkt mit jemandem.';
    } else if (matches.length === 0) {
        text =
            'Ich habe dein Thema erkannt, aber aktuell ist keine passende Stelle eingetragen. Melde dich gern direkt bei einer Beratungsstelle.';
    } else {
        text =
            matches.length === 1
                ? 'Das klingt nach einem Thema, bei dem dir diese Stelle weiterhelfen kann:'
                : 'Das klingt nach einem Thema, bei dem dir diese Stellen weiterhelfen können:';
    }

    return { text, matches, handoff: HANDOFF, disclaimer, urgent };
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
 *
 * `history` macht Rückfragen möglich: der Server bleibt zustandslos, den
 * Verlauf schickt der Client mit (validiert und begrenzt in `chatBodySchema`).
 */
export const answer = async (
    message: string,
    history: ChatTurn[] = [],
): Promise<ChatReply> => {
    // Vor allem anderen: kein Datenbank-Treffer, kein Modell-Call, keine
    // Latenz. Über das ganze Gespräch, wie die Disclaimer-Logik.
    const urgent = urgentHotlines(conversationText(history, message));
    if (urgent) return buildReply([], [], URGENT_TEXT, urgent);

    const [candidates, categories] = await Promise.all([
        Beratung.find()
            .select('title tags description')
            .limit(MAX_CANDIDATES)
            .lean(),
        Category.find({ appliesTo: 'beratung' }).select('key label').lean(),
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
    // Über das ganze Gespräch, nicht nur den letzten Satz — sonst verliert eine
    // Rückfrage den Disclaimer des eigentlichen Themas.
    const keywordKeys = matchCategoryKeys(conversationText(history, message));

    const ai = await askGemini(
        message,
        candidates.map((b) => ({
            id: String(b._id),
            title: b.title,
            tags: b.tags ?? [],
            description: b.description ?? '',
        })),
        categories.map((c) => ({ key: c.key, label: c.label })),
        history,
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
