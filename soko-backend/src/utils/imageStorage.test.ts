import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageKeys, replacedImageKey } from './imageStorage.ts';

test('imageKeys liefert den eigenen Key, sonst nichts', () => {
    assert.deepEqual(imageKeys({ imageKey: 'images/a' }), ['images/a']);
    // Externe Bilder (Partner-CSV, Platzhalter, Seeds) haben keinen Key —
    // da gehoert uns die Datei nicht und es gibt nichts zu loeschen.
    assert.deepEqual(imageKeys({}), []);
    assert.deepEqual(imageKeys({ imageKey: null }), []);
    assert.deepEqual(imageKeys(null), []);
});

test('neues Bild macht das alte Objekt verwaist', () => {
    assert.deepEqual(
        replacedImageKey(
            { imageKey: 'images/alt' },
            { imageKey: 'images/neu' },
        ),
        ['images/alt'],
    );
    // Geloeschter Eintrag: nichts zeigt mehr auf die Datei.
    assert.deepEqual(replacedImageKey({ imageKey: 'images/alt' }, null), [
        'images/alt',
    ]);
});

// Der teure Fehler: das Bild loeschen, auf das der Eintrag noch zeigt.
test('unveraenderter Key wird nie geloescht', () => {
    // „Bild behalten": der PUT bringt kein `imageKey` mit, der gespeicherte
    // bleibt stehen — vorher wie nachher derselbe Key.
    assert.deepEqual(
        replacedImageKey({ imageKey: 'images/a' }, { imageKey: 'images/a' }),
        [],
    );
    // Erstes Bild ueberhaupt: es gibt keinen Vorgaenger.
    assert.deepEqual(replacedImageKey({}, { imageKey: 'images/neu' }), []);
    assert.deepEqual(replacedImageKey(null, { imageKey: 'images/neu' }), []);
});
