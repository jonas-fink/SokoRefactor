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
        lng: undefined,
        lat: undefined,
        distance: undefined,
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
    // Ort zaehlt als ein Filter, der Radius allein als keiner.
    assert.equal(countActive(parse('lng=9.5&lat=51.3&distance=5')), 1);
    assert.equal(countActive(parse('distance=5')), 0);
});

test('Umkreis: Roundtrip, und ein Radius ohne Ort verschwindet', () => {
    const filters = parse('lng=9.51667&lat=51.3166&distance=5');
    assert.equal(filters.lng, 9.51667);
    assert.equal(filters.lat, 51.3166);
    assert.equal(filters.distance, 5);
    assert.equal(
        toQuery(filters).toString(),
        'lng=9.51667&lat=51.3166&distance=5',
    );

    // Ohne Mittelpunkt filtert der Radius nichts — er steht dann auch nicht
    // in der URL, sonst sieht die Seite gefiltert aus, ohne es zu sein.
    assert.equal(toQuery(parse('distance=5')).toString(), '');
    assert.equal(toQuery(parse('lng=9.5')).toString(), '');
});

test('kaputte Koordinaten werden undefined, nicht NaN', () => {
    assert.equal(parse('lng=abc').lng, undefined);
    assert.equal(parse('lng=').lng, undefined);
    assert.equal(parse('').lng, undefined);
    // 0 ist eine gueltige Koordinate (Nullmeridian) und darf nicht wegfallen.
    assert.equal(parse('lng=0&lat=0').lng, 0);
    assert.equal(toQuery(parse('lng=0&lat=0')).get('lng'), '0');
});
