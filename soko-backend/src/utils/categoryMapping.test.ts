import test from 'node:test';
import assert from 'node:assert';
import {
    CATEGORY_KEYS,
    CATEGORY_MAPPING,
    FALLBACK_CATEGORY,
    toCategoryKey,
    unmappedCategories,
} from './categoryMapping.ts';

const KEYS = CATEGORY_KEYS;

test('jedes Mapping zeigt auf einen existierenden Category-Key', () => {
    for (const [from, to] of Object.entries(CATEGORY_MAPPING)) {
        assert.ok(KEYS.has(to), `${from} → ${to} ist kein bekannter Key`);
    }
    assert.ok(KEYS.has(FALLBACK_CATEGORY));
});

test('toCategoryKey normalisiert Rohwerte der Stadt', () => {
    assert.equal(toCategoryKey('Sport / Freizeit'), 'sport');
    assert.equal(toCategoryKey('Kurse / Seminare'), 'bildung');
    assert.equal(toCategoryKey('  Wanderung  '), 'natur');
});

test('Unbekanntes und Leeres landen im Auffangbecken', () => {
    assert.equal(toCategoryKey('Voll neue Rubrik'), FALLBACK_CATEGORY);
    assert.equal(toCategoryKey(''), FALLBACK_CATEGORY);
    assert.equal(toCategoryKey(undefined), FALLBACK_CATEGORY);
});

test('bereits normalisierte Keys bleiben unveraendert (idempotent)', () => {
    for (const key of KEYS) {
        assert.equal(toCategoryKey(key, KEYS), key);
    }
    // Zweiter Lauf über das eigene Ergebnis ändert nichts mehr.
    const once = toCategoryKey('Party / Event');
    assert.equal(toCategoryKey(once, KEYS), once);
});

test('unmappedCategories meldet nur echte Luecken', () => {
    assert.deepEqual(
        unmappedCategories(['Sport / Freizeit', 'Neu A', 'Neu B', ''], KEYS),
        ['Neu A', 'Neu B'],
    );
    // Ein bereits normalisierter Key ist keine Luecke.
    assert.deepEqual(unmappedCategories(['sport', 'kunst'], KEYS), []);
});
