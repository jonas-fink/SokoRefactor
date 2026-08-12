import { Beratung, Category, ScrapedEvent, User } from '#models';
import type { UserPreferences } from '#models';
import { AUDIENCES, CATEGORY_KEYS, LANGUAGES, buildFilter } from '#utils';
import type { ChatTurn } from '#schemas';
import { askGemini, type Candidate } from './gemini.ts';

export type Hotline = { label: string; number: string; hint: string };

/** Beide Kandidaten-Pools des Chats. Bestimmt auch das Ziel des Links im Client. */
export type ChatItemType = 'Beratung' | 'ScrapedEvent';

/**
 * Antwort des Need-Finding-Chats.
 *
 * `handoff`, `disclaimer` und `urgent` sind Pflichtfelder, keine Optionen: die
 * UI kann den menschlichen Ausweg damit nicht versehentlich weglassen. `null`
 * bei unkritischen Themen, aber immer vorhanden.
 */
export type ChatReply = {
    text: string;
    matches: {
        id: string;
        title: string;
        category: string;
        itemType: ChatItemType;
    }[];
    handoff: { label: string; hint: string };
    disclaimer: string | null;
    urgent: Hotline[] | null;
};

/**
 * Stichworte → `Category.key`. Bewusst nur die Beratungs-Keys.
 *
 * der Keyword-Fallback deckt **nur Beratungen** ab, auch seit der Chat
 * Veranstaltungen kennt. Fällt Gemini aus, ist die Beratungsvermittlung die
 * Funktion, die zählt — Events kämen ohne Modell nur über eine zweite
 * Stichworttabelle.
 *
 * naives `includes`-Matching ohne Stemming/Fuzzy.
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

export const HANDOFF = {
    label: 'Mit einem Menschen sprechen',
    hint: 'Alle Beratungsstellen hier sind kostenlos und vertraulich — ein Anruf oder ein Besuch reicht.',
};

/** So viele Turns gehen als Kontext an `answer()` — dieselbe Grenze wie `chatBodySchema`. */
const HISTORY_TURNS = 10;

/**
 * Gespeicherte Turns → Kontext für `answer()`: die **letzten** zehn, ältere
 * fallen weg. Bei eingeloggten Nutzern ersetzt das den mitgeschickten Verlauf
 * komplett — ein manipuliertes `history` kann das Keyword-Matching damit nicht
 * mehr steuern.
 */
export const toHistory = (
    turns: { role: 'user' | 'bot'; text: string }[],
): ChatTurn[] =>
    turns.slice(-HISTORY_TURNS).map(({ role, text }) => ({ role, text }));

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
 * So viele Einträge je Pool gehen als Auswahlliste an das Modell — ein Call für
 * beide, statt Klassifizieren + Nachschlagen + Formulieren.
 *
 * Der Deckel ist seit den Präferenzen die zweite Verteidigungslinie: den
 * eigentlichen Zuschnitt macht `prefFilter`.
 */
const MAX_BERATUNGEN = 40;
const MAX_EVENTS = 30;

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Präferenzen → Mongo-Fragment je Pool. Sprache und Zielgruppe laufen über
 * dasselbe `buildFilter` wie die Listenrouten (leer = keine Angabe = matcht
 * immer), die Kategorien liegen in verschiedenen Feldern: `tags` bei Beratung,
 * `category` bei Events.
 *
 * `freeOnly` bleibt außen vor: Beratungen sind kostenlos und kassel.de liefert
 * keine Preise — der Filter hätte nichts zu filtern.
 */
export const prefFilters = (prefs?: UserPreferences) => {
    const base = buildFilter({ lang: prefs?.languages, for: prefs?.audiences });
    const cats = (prefs?.categories ?? []).filter((k) => CATEGORY_KEYS.has(k));
    return {
        beratung: cats.length ? { ...base, tags: { $in: cats } } : base,
        event: cats.length ? { ...base, category: { $in: cats } } : base,
    };
};

/**
 * Präferenzen → eine Zeile Kontext für den Prompt. Nichts Identifizierendes:
 * kein Name, keine Mail, keine ID — nur Sprache und Zielgruppe.
 */
export const preferenceLine = (prefs?: UserPreferences): string | undefined => {
    const labels = (
        list: readonly { key: string; label: string }[],
        keys: string[] = [],
    ) => list.filter((e) => keys.includes(e.key)).map((e) => e.label);

    const langs = labels(LANGUAGES, prefs?.languages);
    const auds = labels(AUDIENCES, prefs?.audiences);
    if (!langs.length && !auds.length) return undefined;

    return `Der Nutzer sucht Angebote${langs.length ? ` auf ${langs.join(', ')}` : ''}${auds.length ? ` für ${auds.join(', ')}` : ''}.`;
};

/**
 * Präferenzen des Nutzers — direkt aus dem Modell, kein interner Endpoint und
 * kein HTTP-Hop (`ARCHITEKTUR.md` § 2.9). `email`/`password` werden gar nicht
 * erst geladen.
 *
 * Fällt die Abfrage aus, läuft der Chat wie für einen Gast weiter: die
 * Präferenzen schärfen die Auswahl, sie tragen sie nicht.
 */
const loadPreferences = async (
    userId?: string,
): Promise<UserPreferences | undefined> => {
    if (!userId) return undefined;
    try {
        const user = await User.findById(userId).select('preferences').lean();
        return user?.preferences;
    } catch (err) {
        console.warn(
            'Präferenzen nicht ladbar, Chat läuft ungefiltert:',
            err instanceof Error ? err.message : err,
        );
        return undefined;
    }
};

/**
 * Behält nur IDs, die wir dem Modell selbst gegeben haben. Das ist die Stelle,
 * an der eine halluzinierte Beratungsstelle hängen bleibt — sie darf nie
 * stillschweigend durchrutschen.
 *
 * Unverändert seit dem zweiten Pool: der Schlüssel ist `poolKey()`, nicht die
 * blanke ID. Das Gate wird nicht aufgeweicht.
 */
export const knownOnly = <T>(ids: string[], byId: Map<string, T>): T[] =>
    ids.map((id) => byId.get(id)).filter((b) => b !== undefined);

/**
 * Schlüssel über beide Pools. Typ **vor** der ID: eine Beratung und ein Event
 * mit derselben ObjectId sind zwei verschiedene Einträge, und ein Modell, das
 * `type` rät, darf so nicht den falschen Treffer aufsammeln.
 */
export const poolKey = (itemType: string, id: string) => `${itemType}:${id}`;

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
 *
 * Zwei Pools in **einem** Call: Beratungsstellen und kommende Veranstaltungen.
 * `userId` (optional, Gäste haben keine) schneidet beide über die Präferenzen
 * zu und ergänzt eine Kontextzeile im Prompt — beides optional, ohne sie
 * antwortet der Chat wie vorher.
 */
export const answer = async (
    message: string,
    history: ChatTurn[] = [],
    userId?: string,
): Promise<ChatReply> => {
    // Vor allem anderen: kein Datenbank-Treffer, kein Modell-Call, keine
    // Latenz. Über das ganze Gespräch, wie die Disclaimer-Logik.
    const urgent = urgentHotlines(conversationText(history, message));
    if (urgent) return buildReply([], [], URGENT_TEXT, urgent);

    const prefs = await loadPreferences(userId);
    const prefFilter = prefFilters(prefs);

    const [beratungen, events, categories] = await Promise.all([
        Beratung.find(prefFilter.beratung)
            .select('title tags description')
            .limit(MAX_BERATUNGEN)
            .lean(),
        // Vergangenes hilft niemandem: der Chat schlägt nur vor, was noch kommt.
        ScrapedEvent.find({
            startDate: { $gte: startOfToday() },
            ...prefFilter.event,
        })
            .select('title category description startDate')
            .sort({ startDate: 1 })
            .limit(MAX_EVENTS)
            .lean(),
        Category.find().select('key label appliesTo').lean(),
    ]);

    // Ein Pool für das Modell: Events tragen genau eine Kategorie, Beratungen
    // mehrere Tags — beides sind `Category.key`s, also dasselbe Feld.
    const candidates: Candidate[] = [
        ...beratungen.map((b) => ({
            id: String(b._id),
            itemType: 'Beratung' as const,
            title: b.title,
            tags: b.tags ?? [],
            description: b.description ?? '',
        })),
        ...events.map((e) => ({
            id: String(e._id),
            itemType: 'ScrapedEvent' as const,
            title: e.title,
            tags: e.category ? [e.category] : [],
            description: e.description ?? '',
            when: e.startDate?.toLocaleDateString('de-DE'),
        })),
    ];

    const byId = new Map(candidates.map((c) => [poolKey(c.itemType, c.id), c]));
    const toMatch = (c: Candidate, keys: string[]) => ({
        id: c.id,
        title: c.title,
        category: c.tags.find((t) => keys.includes(t)) ?? c.tags[0] ?? '',
        itemType: c.itemType,
    });

    // Der Keyword-Treffer läuft immer mit: er ist Fallback *und* zweite Meinung
    // für den Disclaimer — erkennt eine der beiden Seiten ein sensibles Thema,
    // steht der Hinweis da.
    // Über das ganze Gespräch, nicht nur den letzten Satz — sonst verliert eine
    // Rückfrage den Disclaimer des eigentlichen Themas.
    const keywordKeys = matchCategoryKeys(conversationText(history, message));

    const ai = await askGemini(
        message,
        candidates,
        categories.map((c) => ({
            key: c.key,
            label: c.label,
            appliesTo: c.appliesTo,
        })),
        history,
        preferenceLine(prefs),
    );

    if (ai) {
        const keys = [
            ...new Set([
                ...ai.keys.filter((k) => CATEGORY_KEYS.has(k)),
                ...keywordKeys,
            ]),
        ];
        const matches = knownOnly(
            ai.ids.map((i) => poolKey(i.type, i.id)),
            byId,
        ).map((c) => toMatch(c, keys));

        return buildReply(keys, matches, ai.text);
    }

    // Ohne Modell nur Beratungen — siehe der ponytail-Hinweis an `KEYWORDS`.
    const matches = candidates
        .filter(
            (c) =>
                c.itemType === 'Beratung' &&
                c.tags.some((t) => keywordKeys.includes(t)),
        )
        .slice(0, 5)
        .map((c) => toMatch(c, keywordKeys));

    return buildReply(keywordKeys, matches);
};
