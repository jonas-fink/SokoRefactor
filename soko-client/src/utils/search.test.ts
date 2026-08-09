import test from 'node:test';
import assert from 'node:assert';
import { matchesQuery } from './search.ts';

test('matchesQuery ignoriert Gross-/Kleinschreibung', () => {
    assert.equal(matchesQuery('KAFFEE', 'Offenes Kaffeetrinken'), true);
    assert.equal(matchesQuery('kaffee', 'Offenes Kaffeetrinken'), true);
});

test('matchesQuery prueft alle Felder und vertraegt fehlende', () => {
    assert.equal(matchesQuery('beratung', undefined, 'Beratung vor Ort'), true);
    assert.equal(matchesQuery('beratung', undefined), false);
});

test('leere Suche matcht alles, aber nicht das Nichts', () => {
    assert.equal(matchesQuery('', 'irgendwas'), true);
    assert.equal(matchesQuery('', undefined), false);
});
