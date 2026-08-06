import test from 'node:test';
import assert from 'node:assert';
import { Types } from 'mongoose';
import {
    parseCsv,
    parseOpeningHours,
    toBeratung,
} from './importBeratungen.ts';

const USER = String(new Types.ObjectId());

const CSV = [
    'externalId,name,beschreibung,kategorie,adresse,telefon,lat,lng,oeffnungszeiten,angebote',
    'CAR-001,"Schuldnerberatung, Caritas","Hilft bei Miete, Strom und ""Inkasso""",finanzen,Marktgasse 1,0561 123456,51.3127,9.4797,mo 09:00-12:00;di 09:00-12:00,Schuldnerberatung|Insolvenzberatung',
    '',
    'CAR-002,Migrationsberatung,Beratung zu Aufenthalt,asyl,Bahnhofstr. 2,,51.3200,9.4900,,Aufenthalt',
].join('\n');

test('CSV: Anfuehrungszeichen, Kommas im Feld und Leerzeilen', () => {
    const rows = parseCsv(CSV);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, 'Schuldnerberatung, Caritas');
    assert.equal(rows[0].beschreibung, 'Hilft bei Miete, Strom und "Inkasso"');
    assert.equal(rows[1].externalId, 'CAR-002');
});

test('CSV: deutsches Excel-Semikolon wird erkannt', () => {
    const rows = parseCsv('externalId;name;lat\nCAR-9;Stelle;51.3');
    assert.deepEqual(rows, [{ externalId: 'CAR-9', name: 'Stelle', lat: '51.3' }]);
});

test('Oeffnungszeiten werden zu Minuten seit Mitternacht', () => {
    const hours = parseOpeningHours('mo 09:00-12:00,13:00-17:00; di 09:00-17:00');
    assert.deepEqual(hours.monday, [
        { open: 540, close: 720 },
        { open: 780, close: 1020 },
    ]);
    assert.deepEqual(hours.tuesday, [{ open: 540, close: 1020 }]);
    assert.deepEqual(hours.sunday, []);
    assert.deepEqual(parseOpeningHours('').monday, []);
    assert.throws(() => parseOpeningHours('xx 09:00-12:00'));
    assert.throws(() => parseOpeningHours('mo 17:00-09:00')); // Ende vor Anfang
});

test('Zeile → Beratung: Koordinaten als [lng, lat], Angebote gesplittet', () => {
    const b = toBeratung(parseCsv(CSV)[0], USER, 'caritas');
    assert.deepEqual(b.location.coordinates, [9.4797, 51.3127]);
    assert.deepEqual(
        b.services.map((s) => s.name),
        ['Schuldnerberatung', 'Insolvenzberatung'],
    );
    assert.deepEqual(b.tags, ['finanzen']);
    assert.equal(b.externalId, 'CAR-001');
    assert.equal(b.source, 'caritas');
});

test('ungueltige Zeilen werfen mit Klartextgrund', () => {
    const [row] = parseCsv(CSV);
    assert.throws(
        () => toBeratung({ ...row, kategorie: 'schulden' }, USER, 'x'),
        /Unbekannte Kategorie/,
    );
    assert.throws(
        () => toBeratung({ ...row, lat: '' }, USER, 'x'),
        /lat\/lng/,
    );
});

test('derselbe Datensatz ergibt zweimal dasselbe — Upsert auf externalId ist idempotent', () => {
    const rows = parseCsv(CSV);
    const once = rows.map((r) => toBeratung(r, USER, 'caritas'));
    const twice = rows.map((r) => toBeratung(r, USER, 'caritas'));
    assert.deepEqual(once, twice);
    // Der Upsert-Schluessel ist pro Zeile eindeutig — sonst wuerde ein zweiter
    // Lauf Dubletten anlegen statt zu aktualisieren.
    assert.equal(new Set(once.map((b) => b.externalId)).size, once.length);
});
