import type { RequestHandler } from 'express';
import { AUDIENCES, LANGUAGES } from '#utils';

/**
 * Die geschlossenen Filterlisten fuer den Client — damit Labels an genau einer
 * Stelle stehen und nicht in `src/categoryMeta.tsx` nachgepflegt werden muessen.
 * Konstanten, also kein DB-Zugriff und kein `async`.
 */
export const getVocabulary: RequestHandler = (_req, res) => {
    res.json({ data: { languages: LANGUAGES, audiences: AUDIENCES } });
};
