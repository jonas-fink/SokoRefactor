import { test } from 'node:test';
import assert from 'node:assert/strict';
import { s3Keys, orphanedKeys } from './beratungDocuments.ts';

const beratung = (...services: string[][]) => ({
    services: services.map((keys) => ({
        documents: keys.map((s3Key) => ({ s3Key })),
    })),
});

test('s3Keys sammelt ueber alle Services hinweg', () => {
    assert.deepEqual(s3Keys(beratung(['a', 'b'], ['c'])), ['a', 'b', 'c']);
});

test('s3Keys vertraegt fehlende Felder', () => {
    assert.deepEqual(s3Keys(null), []);
    assert.deepEqual(s3Keys({}), []);
    assert.deepEqual(s3Keys({ services: [{}] }), []);
});

test('entferntes Dokument gilt als verwaist', () => {
    assert.deepEqual(orphanedKeys(beratung(['a', 'b']), beratung(['a'])), ['b']);
});

test('geloeschte Beratung gibt alle Keys frei', () => {
    assert.deepEqual(orphanedKeys(beratung(['a'], ['b']), null), ['a', 'b']);
});

// Der teure Fehler: einen noch referenzierten Antrag loeschen.
test('noch referenzierte Keys werden nie geloescht', () => {
    assert.deepEqual(orphanedKeys(beratung(['a']), beratung(['a'])), []);
    // in einen anderen Service verschoben — Datei bleibt in Benutzung
    assert.deepEqual(orphanedKeys(beratung(['a'], []), beratung([], ['a'])), []);
    // neue Dokumente sind nie verwaist
    assert.deepEqual(orphanedKeys(beratung([]), beratung(['neu'])), []);
});
