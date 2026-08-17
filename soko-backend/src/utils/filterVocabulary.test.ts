import test from 'node:test';
import assert from 'node:assert/strict';
import {
    assertAudiences,
    assertLanguages,
    LANGUAGES,
    LANGUAGE_KEYS,
} from './filterVocabulary.ts';
import { preferencesSchema } from '../schemas/auth.ts';

test('jede Sprache hat ein Endonym — ausser Deutsch, bewusst', () => {
    for (const l of LANGUAGES) {
        const endonym = 'endonym' in l ? l.endonym : undefined;
        if (l.key === 'de') assert.equal(endonym, undefined);
        else assert.ok(endonym, `Endonym fehlt: ${l.key}`);
    }
});

test('LANGUAGE_KEYS bleibt deckungsgleich mit LANGUAGES', () => {
    assert.equal(LANGUAGE_KEYS.size, LANGUAGES.length);
    for (const l of LANGUAGES) assert.ok(LANGUAGE_KEYS.has(l.key));
});

test('bekannte Keys passieren', () => {
    assert.doesNotThrow(() => assertLanguages(['de', 'ar']));
    assert.doesNotThrow(() => assertAudiences(['familien']));
});

test('unbekannter Key wirft 400 mit Klartext', () => {
    assert.throws(() => assertLanguages(['de', 'klingonisch']), {
        status: 400,
        message: /klingonisch/,
    });
});

test('Praeferenzen mit unbekanntem Sprach-Key werden nicht gespeichert', () => {
    const bad = preferencesSchema.safeParse({ languages: ['klingonisch'] });
    assert.equal(bad.success, false);

    const ok = preferencesSchema.safeParse({ languages: ['ar'] });
    assert.equal(ok.success, true);
    // Der Rest kommt aus den Defaults — der Wizard schickt nur, was ausgewaehlt
    // wurde, und „Überspringen" schickt gar nichts.
    assert.deepEqual(ok.data, {
        languages: ['ar'],
        audiences: [],
        categories: [],
        freeOnly: false,
    });
});
