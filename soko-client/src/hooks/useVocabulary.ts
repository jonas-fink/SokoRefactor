import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { FilterVocabulary } from '../types';

const EMPTY: FilterVocabulary = { languages: [], audiences: [] };

/**
 * `GET /vocabulary` — die geschlossenen Listen fuer Sprache und Zielgruppe.
 * Faellt der Abruf aus, bleiben die Listen leer und `labelOf` gibt `undefined`:
 * lieber kein Block als ein roher Datenbank-Key (`gefluechtete`) in der UI.
 */
export const useVocabulary = () => {
    const [vocabulary, setVocabulary] = useState(EMPTY);

    useEffect(() => {
        api.get<FilterVocabulary>('/vocabulary')
            .then(setVocabulary)
            .catch(() => setVocabulary(EMPTY));
    }, []);

    const labelOf = (key: string) =>
        [...vocabulary.languages, ...vocabulary.audiences].find(
            (o) => o.key === key,
        )?.label;

    return { ...vocabulary, labelOf };
};
