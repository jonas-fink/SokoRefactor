/**
 * Kuratierte Zieltaxonomie. Einzige Quelle: `scripts/seedCategories.ts` schreibt
 * sie in die Datenbank, der Test prueft die Mapping-Tabelle dagegen.
 */
export const CATEGORIES = [
    {
        key: 'behoerden',
        label: 'Behörden & Ämter',
        appliesTo: ['beratung'],
        colorToken: 'cat-behoerden',
    },
    {
        key: 'asyl',
        label: 'Asyl & Migration',
        appliesTo: ['beratung'],
        colorToken: 'cat-asyl',
    },
    {
        key: 'familie',
        label: 'Familie & Kinder',
        appliesTo: ['beratung', 'activity'],
        colorToken: 'cat-familie',
    },
    {
        key: 'gesundheit',
        label: 'Sucht & Gesundheit',
        appliesTo: ['beratung'],
        colorToken: 'cat-gesundheit',
    },
    {
        key: 'finanzen',
        label: 'Finanzen & Schulden',
        appliesTo: ['beratung'],
        colorToken: 'cat-finanzen',
    },
    {
        key: 'sport',
        label: 'Sport & Bewegung',
        appliesTo: ['activity'],
        colorToken: 'cat-sport',
    },
    {
        key: 'natur',
        label: 'Natur & Draußen',
        appliesTo: ['activity'],
        colorToken: 'cat-natur',
    },
    {
        key: 'kunst',
        label: 'Kunst & Kultur',
        appliesTo: ['activity'],
        colorToken: 'cat-kunst',
    },
    {
        key: 'bildung',
        label: 'Bildung & Kurse',
        appliesTo: ['activity'],
        colorToken: 'cat-bildung',
    },
    {
        key: 'markt',
        label: 'Markt & Gastronomie',
        appliesTo: ['activity'],
        colorToken: 'cat-markt',
    },
    // Auffangbecken fuer Quell-Kategorien ohne Entsprechung (FALLBACK_CATEGORY).
    {
        key: 'sonstiges',
        label: 'Sonstiges',
        appliesTo: ['activity'],
        colorToken: 'cat-sonstiges',
    },
] as const;

export const CATEGORY_KEYS: ReadonlySet<string> = new Set(
    CATEGORIES.map((c) => c.key),
);

/**
 * Rohkategorien externer Quellen → kuratierte `Category.key`s.
 *
 * Eine Quelle für beide Seiten: `services/scrapeKassel.ts` normalisiert beim
 * Schreiben, `scripts/migrateTags.ts` zieht den Alt-Bestand nach. Ohne das
 * schreibt jeder Scrape-Lauf wieder Rohwerte in die Datenbank.
 */
export const CATEGORY_MAPPING: Record<string, string> = {
    // --- Alt-Bestand aus der ersten Activity-Version (freie Tags) ---
    Familie: 'familie',
    Sport: 'sport',
    Natur: 'natur',
    Kultur: 'kunst',
    Musik: 'kunst',
    Soziales: 'familie',
    Essen: 'markt',
    Gaming: 'sonstiges',
    Workshop: 'bildung',

    // --- Kasseler Veranstaltungskalender (kassel.de) ---
    Ausstellung: 'kunst',
    'Besichtigung / Führung': 'kunst',
    'Bildung / Weiterbildung': 'bildung',
    'Brauchtum / Feste': 'kunst',
    'Comedy / Kabarett': 'kunst',
    'Feste/Bälle/Tanz': 'kunst',
    'Filme / Medien': 'kunst',
    Gastronomie: 'markt',
    'Geselligkeit / Spiele': 'familie',
    'Gesundheit / Wellness': 'gesundheit',
    Jazz: 'kunst',
    Kinderprogramm: 'familie',
    Klassik: 'kunst',
    Konzert: 'kunst',
    'Kurse / Seminare': 'bildung',
    Markt: 'markt',
    'Markt / Flohmarkt / Messe': 'markt',
    'Party / Event': 'kunst',
    Performance: 'kunst',
    'Rock / Pop': 'kunst',
    Schauspiel: 'kunst',
    Sonstige: 'sonstiges',
    'Sport / Freizeit': 'sport',
    Staatstheater: 'kunst',
    'Tanz / Ballet': 'kunst',
    'Theater / Bühne': 'kunst',
    'Treffpunkt Bewegung': 'sport',
    'VHS Angebote': 'bildung',
    Vortrag: 'bildung',
    'Vortrag / Lesung': 'bildung',
    Wanderung: 'natur',
    Weitere: 'sonstiges',
};

/** Auffangbecken für Werte ohne Mapping-Zeile. */
export const FALLBACK_CATEGORY = 'sonstiges';

/**
 * Liefert den Category-Key zu einem Rohwert. Bereits normalisierte Keys gehen
 * unverändert durch (idempotent), Unbekanntes landet in `sonstiges`.
 *
 * Der Rohwert geht dabei nicht verloren: der Scraper upsertet bei jedem Lauf
 * über `externalId`, eine später ergänzte Mapping-Zeile korrigiert die
 * Zuordnung also von selbst.
 */
export const toCategoryKey = (
    raw: string | undefined | null,
    knownKeys?: ReadonlySet<string>,
): string => {
    const value = raw?.trim();
    if (!value) return FALLBACK_CATEGORY;
    if (knownKeys?.has(value)) return value;
    return CATEGORY_MAPPING[value] ?? FALLBACK_CATEGORY;
};

/** Rohwerte ohne eigene Mapping-Zeile — für Warnungen im Scraper/Migration. */
export const unmappedCategories = (
    raws: Iterable<string>,
    knownKeys?: ReadonlySet<string>,
): string[] => {
    const missing = new Set<string>();
    for (const raw of raws) {
        const value = raw?.trim();
        if (!value || knownKeys?.has(value)) continue;
        if (!CATEGORY_MAPPING[value]) missing.add(value);
    }
    return [...missing].sort();
};
