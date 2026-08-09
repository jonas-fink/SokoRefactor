/**
 * Case-insensitiver Teilstring-Treffer über mehrere Felder.
 * Leere Suche matcht alles, fehlende Felder matchen nie.
 */
export const matchesQuery = (
    query: string,
    ...fields: (string | undefined)[]
) => {
    const q = query.toLowerCase();
    return fields.some((f) => f?.toLowerCase().includes(q));
};
