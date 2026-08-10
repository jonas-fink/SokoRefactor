import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAudiences, assertLanguages } from './filterVocabulary.ts';
import { preferencesSchema } from '../schemas/auth.ts';

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
