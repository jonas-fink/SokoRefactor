/**
 * Geschlossene Wertelisten fuer die Filterachsen `availableLanguages` und
 * `targetAudience`.
 *
 * Konstanten, keine Collection: anders als `Category` haben diese Listen keine
 * Farbe, kein `appliesTo`, keine eigene UI-Flaeche und wachsen nicht — eine
 * Collection waere ein Seed-Script und eine Migration fuer nichts.
 */

export const LANGUAGES = [
    { key: 'de', label: 'Deutsch' },
    { key: 'en', label: 'Englisch' },
    { key: 'ar', label: 'Arabisch' },
    { key: 'tr', label: 'Türkisch' },
    { key: 'uk', label: 'Ukrainisch' },
    { key: 'ru', label: 'Russisch' },
    { key: 'fa', label: 'Farsi' },
    { key: 'pl', label: 'Polnisch' },
    { key: 'ro', label: 'Rumänisch' },
    { key: 'fr', label: 'Französisch' },
] as const;

export const AUDIENCES = [
    { key: 'familien', label: 'Familien' },
    { key: 'alleinerziehende', label: 'Alleinerziehende' },
    { key: 'kinder', label: 'Kinder' },
    { key: 'jugendliche', label: 'Jugendliche' },
    { key: 'senioren', label: 'Senioren' },
    { key: 'gefluechtete', label: 'Geflüchtete' },
    { key: 'frauen', label: 'Frauen' },
    { key: 'menschen-mit-behinderung', label: 'Menschen mit Behinderung' },
] as const;

export type LanguageKey = (typeof LANGUAGES)[number]['key'];
export type AudienceKey = (typeof AUDIENCES)[number]['key'];

export const LANGUAGE_KEYS: ReadonlySet<string> = new Set(
    LANGUAGES.map((l) => l.key),
);
export const AUDIENCE_KEYS: ReadonlySet<string> = new Set(
    AUDIENCES.map((a) => a.key),
);

/** Wirft 400 mit Klartextgrund — dasselbe Muster wie `assertCategories`. */
const assertKnown = (
    known: ReadonlySet<string>,
    label: string,
    values: string[],
) => {
    const unknown = values.filter((v) => !known.has(v));
    if (unknown.length > 0) {
        const error = new Error(`Unbekannte ${label}: ${unknown.join(', ')}`);
        Object.assign(error, { status: 400 });
        throw error;
    }
};

export const assertLanguages = (values: string[]) =>
    assertKnown(LANGUAGE_KEYS, 'Sprache(n)', values);

export const assertAudiences = (values: string[]) =>
    assertKnown(AUDIENCE_KEYS, 'Zielgruppe(n)', values);
