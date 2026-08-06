import test from 'node:test';
import assert from 'node:assert';
import { parseGermanDate } from './scrapeKassel.ts';

const iso = (d: Date | null) =>
    d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

test('abgekuerzte Monatsnamen — der Normalfall der Quelle', () => {
    assert.equal(iso(parseGermanDate('6. Aug. 2026', 'ab 10:00')), '2026-08-06 10:00');
    assert.equal(iso(parseGermanDate('1. Sept. 2026', 'ab 19:30')), '2026-09-01 19:30');
    assert.equal(iso(parseGermanDate('24. Dez. 2026', '')), '2026-12-24 00:00');
    assert.equal(iso(parseGermanDate('3. Jan. 2027', 'ab 09:15')), '2027-01-03 09:15');
});

test('ausgeschriebene Monatsnamen bleiben lesbar', () => {
    assert.equal(iso(parseGermanDate('9. Juli 2026', 'ab 00:00')), '2026-07-09 00:00');
    assert.equal(iso(parseGermanDate('1. März 2027', 'ab 14:00')), '2027-03-01 14:00');
    assert.equal(iso(parseGermanDate('5. Mai 2027', '')), '2027-05-05 00:00');
});

test('jeder Monat des Jahres wird erkannt', () => {
    const kurz = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
    kurz.forEach((monat, i) => {
        const d = parseGermanDate(`15. ${monat} 2027`, '');
        assert.ok(d, `${monat} nicht erkannt`);
        assert.equal(d.getMonth(), i, `${monat} → falscher Monat`);
    });
});

test('Unlesbares gibt null statt eines falschen Datums', () => {
    assert.equal(parseGermanDate('', ''), null);
    assert.equal(parseGermanDate('demnächst', 'ab 10:00'), null);
    assert.equal(parseGermanDate('6. Foo 2026', ''), null);
});
