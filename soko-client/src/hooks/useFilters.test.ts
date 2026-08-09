import test from 'node:test';
import assert from 'node:assert/strict';
import { countActive, parseFilters, toQuery } from './useFilters.ts';

// Geprueft werden die reinen Funktionen — ohne Router-Mock. `useFilters`
// selbst ist nur die Klammer aus `useSearchParams` drumherum.

const parse = (search: string) => parseFilters(new URLSearchParams(search));

test('leere URL ergibt leere Filter', () => {
    assert.deepEqual(parse(''), {
        q: '',
        date: '',
        category: '',
        lang: [],
        for: [],
        free: false,
        page: 1,
    });
    // Und zurueck: leere Filter schreiben nichts in die URL.
    assert.equal(toQuery(parse('')).toString(), '');
});

test('CSV-Roundtrip ueber lang und for', () => {
    const filters = parse('lang=de,ar&for=familien,senioren');
    assert.deepEqual(filters.lang, ['de', 'ar']);
    assert.deepEqual(filters.for, ['familien', 'senioren']);
    assert.equal(
        decodeURIComponent(toQuery(filters).toString()),
        'lang=de,ar&for=familien,senioren',
    );
});

test('kaputte Werte lassen die Seite nicht scheitern', () => {
    // Leere CSV-Segmente fliegen raus, statt als '' ans Backend zu gehen.
    assert.deepEqual(parse('lang=de,,%20,ar').lang, ['de', 'ar']);
    assert.equal(parse('page=abc').page, 1);
    assert.equal(parse('page=0').page, 1);
    assert.equal(parse('page=-3').page, 1);
    // `free` ist genau '1', nichts anderes.
    assert.equal(parse('free=ja').free, false);
    assert.equal(parse('free=1').free, true);
});

test('Seite 1 steht nicht in der URL', () => {
    assert.equal(toQuery(parse('page=1')).toString(), '');
    assert.equal(toQuery(parse('page=3')).get('page'), '3');
});

test('jede Aenderung ausser page setzt page zurueck', () => {
    // Dieselbe Regel wie in `setFilter`, hier an den reinen Funktionen.
    const onPage4 = parse('lang=de&page=4');
    const next = { ...onPage4, for: ['kinder'], page: 1 };
    assert.equal(toQuery(next).get('page'), null);
    // Nur `page` selbst darf die Seite behalten.
    assert.equal(toQuery({ ...onPage4, page: 5 }).get('page'), '5');
});

test('das Badge zaehlt Auswahlen, nicht das Suchfeld', () => {
    assert.equal(countActive(parse('')), 0);
    assert.equal(countActive(parse('q=kaffee')), 0);
    assert.equal(countActive(parse('q=kaffee&date=2026-08-09&free=1')), 2);
    assert.equal(countActive(parse('lang=de,ar&for=kinder&category=sport')), 4);
});
