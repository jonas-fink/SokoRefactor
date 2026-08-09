import assert from 'node:assert/strict';
import test from 'node:test';
import { dayRange } from './events.ts';

test('dayRange umfasst genau den gewählten Tag in Ortszeit', () => {
    const { $gte, $lt } = dayRange('2026-08-08');
    assert.equal($gte.getDate(), 8);
    assert.equal($gte.getHours(), 0);
    assert.equal($lt.getDate(), 9);
    assert.equal($lt.getHours(), 0);

    // Ein Event am 8.8. um 23:30 liegt drin, eines am 9.8. um 00:00 nicht mehr.
    assert.ok(new Date(2026, 7, 8, 23, 30) >= $gte);
    assert.ok(new Date(2026, 7, 8, 23, 30) < $lt);
    assert.ok(!(new Date(2026, 7, 9, 0, 0) < $lt));
});

// `searchFilter` liegt seit Phase 12 in `utils/queryFilters.ts` und wird dort
// geprueft — es gilt fuer alle drei Listenrouten, nicht nur fuer Events.
