import test from 'node:test';
import assert from 'node:assert';
import { daysInMonth, firstWeekdayOffset } from './calendar.ts';

test('firstWeekdayOffset zaehlt ab Montag', () => {
    // 1. Juni 2025 ist ein Sonntag -> letzte Spalte
    assert.equal(firstWeekdayOffset(2025, 5), 6);
    // 1. Dezember 2025 ist ein Montag -> kein Versatz
    assert.equal(firstWeekdayOffset(2025, 11), 0);
});

test('daysInMonth kennt Schaltjahre', () => {
    assert.equal(daysInMonth(2024, 1), 29);
    assert.equal(daysInMonth(2025, 1), 28);
    assert.equal(daysInMonth(2025, 3), 30);
});
