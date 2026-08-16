import type { BeratungService } from '../types';

/** Noch nicht gespeicherte Angebote haben keine `_id` — Dokumente auch nicht. */
export type ServiceDraft = Omit<BeratungService, '_id'> & { _id?: string };

/**
 * Angebote so, wie sie in den PUT-Body gehören.
 *
 * Der PUT **ersetzt** `services` komplett, und der Controller löscht danach
 * jeden `s3Key`, der nicht mehr referenziert ist (`orphanedKeys`). Was hier
 * verloren geht, ist damit nicht nur aus der Datenbank weg, sondern auch aus
 * S3. Deshalb wandert jedes Angebot unverändert durch — inklusive `_id` und
 * `documents`; herausgefiltert werden nur leere Zeilen, die das Formular
 * angelegt, aber niemand benannt hat.
 */
export const servicesPayload = (services: ServiceDraft[]) =>
    services
        .filter((s) => s.name.trim())
        .map((s) => ({ ...s, name: s.name.trim() }));
