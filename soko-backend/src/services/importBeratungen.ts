import { Beratung } from '#models';
import { beratungZodSchema, type BeratungInput } from '#schemas';
import { CATEGORY_KEYS } from '#utils';

/**
 * Strukturierter Partner-Import statt Scraping fremder Beratungsstellen-Seiten.
 * Das Spaltenformat, das an den Träger rausgeht, steht in `docs/PARTNER-IMPORT.md`.
 *
 * Upsert-Schlüssel ist `externalId`: derselbe Datensatz zweimal importiert
 * aktualisiert, statt zu duplizieren.
 */

/**
 * Minimaler RFC-4180-Parser: Anführungszeichen, verdoppelte `""`, Trennzeichen
 * und Zeilenumbrüche **im** Feld. Trennzeichen wird aus der Kopfzeile geraten,
 * weil deutsches Excel `;` exportiert.
 *
 * ponytail: keine CSV-Dependency, solange ein Träger ein Format liefert.
 */
export const parseCsv = (text: string): Record<string, string>[] => {
    const src = text.replace(/^﻿/, '');
    const header = src.split('\n', 1)[0];
    const delim = (header.match(/;/g) ?? []).length >
        (header.match(/,/g) ?? []).length
        ? ';'
        : ',';

    const rows: string[][] = [];
    let field = '';
    let row: string[] = [];
    let quoted = false;

    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (quoted) {
            if (c === '"' && src[i + 1] === '"') {
                field += '"';
                i++;
            } else if (c === '"') {
                quoted = false;
            } else {
                field += c;
            }
            continue;
        }
        if (c === '"') quoted = true;
        else if (c === delim) {
            row.push(field);
            field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && src[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            field = '';
            row = [];
        } else field += c;
    }
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    const [head, ...body] = rows;
    if (!head) return [];
    const keys = head.map((h) => h.trim());
    return body
        .filter((r) => r.some((v) => v.trim() !== '')) // Leerzeilen raus
        .map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
};

const DAYS: Record<string, string> = {
    mo: 'monday',
    di: 'tuesday',
    mi: 'wednesday',
    do: 'thursday',
    fr: 'friday',
    sa: 'saturday',
    so: 'sunday',
};

const EMPTY_HOURS = Object.fromEntries(
    Object.values(DAYS).map((d) => [d, [] as { open: number; close: number }[]]),
);

/** `"09:30"` → 570. `null` bei allem, was nicht wie eine Uhrzeit aussieht. */
const toMinutes = (hhmm: string): number | null => {
    const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const total = Number(m[1]) * 60 + Number(m[2]);
    return total >= 0 && total <= 1439 ? total : null;
};

/**
 * `"mo 09:00-12:00,13:00-17:00; di 09:00-17:00"` → `businessHours`.
 * Leere Eingabe → alle Tage geschlossen. Wirft bei kaputten Angaben, damit die
 * Zeile als ungültig gezählt wird statt still ohne Zeiten zu landen.
 */
export const parseOpeningHours = (input: string) => {
    const hours = structuredClone(EMPTY_HOURS);
    if (!input.trim()) return hours;

    for (const part of input.split(';')) {
        if (!part.trim()) continue;
        const m = part.trim().match(/^([A-Za-zäöü]{2})\s+(.+)$/);
        const day = m && DAYS[m[1].toLowerCase()];
        if (!day) throw new Error(`Öffnungszeit unlesbar: "${part.trim()}"`);

        for (const range of m[2].split(',')) {
            const [from, to] = range.split('-');
            const open = toMinutes(from ?? '');
            const close = toMinutes(to ?? '');
            if (open === null || close === null || close <= open) {
                throw new Error(`Zeitspanne unlesbar: "${range.trim()}"`);
            }
            hours[day].push({ open, close });
        }
    }
    return hours;
};

/** Eine CSV-Zeile → validierter Beratungs-Datensatz. Wirft mit Klartextgrund. */
export const toBeratung = (
    row: Record<string, string>,
    userId: string,
    source: string,
): BeratungInput => {
    const tags = row.kategorie
        ? row.kategorie
              .split('|')
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean)
        : [];
    const unknown = tags.filter((t) => !CATEGORY_KEYS.has(t));
    if (unknown.length) {
        throw new Error(`Unbekannte Kategorie: ${unknown.join(', ')}`);
    }

    // `Number('')` waere 0 — eine leere Spalte darf nicht als Nullmeridian
    // durchgehen und die Stelle vor Afrika auf die Karte setzen.
    const num = (v?: string) =>
        v?.trim() ? Number(v.replace(',', '.')) : NaN;
    const lat = num(row.lat);
    const lng = num(row.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('lat/lng fehlen oder sind keine Zahlen');
    }

    return beratungZodSchema.parse({
        externalId: row.externalId,
        source,
        title: row.name,
        description: row.beschreibung,
        image: row.bild || 'https://placehold.net/600x600.png',
        phone: row.telefon || undefined,
        address: row.adresse || undefined,
        openingHours: parseOpeningHours(row.oeffnungszeiten ?? ''),
        // Dokumente kommen nicht über die CSV — die Dateien laedt der Admin
        // danach über die Upload-Route zum jeweiligen Service hoch.
        services: (row.angebote ?? '')
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((name) => ({ name, documents: [] })),
        location: { type: 'Point', coordinates: [lng, lat] },
        tags,
        userId,
    });
};

export type ImportResult = {
    gelesen: number;
    neu: number;
    aktualisiert: number;
    uebersprungen: { zeile: number; externalId: string; grund: string }[];
};

export const importBeratungen = async (
    csv: string,
    userId: string,
    source: string,
): Promise<ImportResult> => {
    const rows = parseCsv(csv);
    const valid: BeratungInput[] = [];
    const uebersprungen: ImportResult['uebersprungen'] = [];

    rows.forEach((row, i) => {
        try {
            if (!row.externalId) throw new Error('externalId fehlt');
            valid.push(toBeratung(row, userId, source));
        } catch (err) {
            // Eine kaputte Zeile bricht den Import nicht ab — sie wird gezählt.
            uebersprungen.push({
                zeile: i + 2, // +1 Kopfzeile, +1 weil Menschen bei 1 zaehlen
                externalId: row.externalId ?? '',
                grund: err instanceof Error ? err.message : String(err),
            });
        }
    });

    if (valid.length === 0) {
        throw new Error(
            `Keine gültige Zeile in ${rows.length} Datensätzen — Format prüfen (docs/PARTNER-IMPORT.md).`,
        );
    }

    const ops = valid.map(({ userId: owner, ...fields }) => ({
        updateOne: {
            filter: { externalId: fields.externalId },
            // `userId` nur beim Anlegen: ein spaeterer Wechsel des
            // Import-Admins soll bestehende Eintraege nicht umschreiben.
            update: { $set: fields, $setOnInsert: { userId: owner } },
            upsert: true,
        },
    }));

    // Cast, weil Mongooses Bulk-Typen Subdocument-`_id`s als ObjectId erwarten,
    // die Zod-Eingabe sie aber als optionale Strings beschreibt. Die Werte sind
    // durch `beratungZodSchema` bereits geprüft.
    const result = await Beratung.bulkWrite(ops as never, { ordered: false });

    return {
        gelesen: rows.length,
        neu: result.upsertedCount,
        aktualisiert: result.modifiedCount,
        uebersprungen,
    };
};
