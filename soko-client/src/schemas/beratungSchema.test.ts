import test from 'node:test';
import assert from 'node:assert';
import {
    WEEKDAYS,
    emptyOpeningHours,
    fromMinutes,
    toBusinessHours,
} from './beratungSchema.ts';

test('fromMinutes formatiert Minuten seit Mitternacht', () => {
    assert.equal(fromMinutes(540), '09:00');
    assert.equal(fromMinutes(0), '00:00');
    assert.equal(fromMinutes(1439), '23:59');
});

test('Roundtrip toBusinessHours -> fromMinutes ist stabil', () => {
    const hours = {
        ...emptyOpeningHours,
        monday: { open: '09:00', close: '18:00' },
    };
    const business = toBusinessHours(hours);

    assert.equal(fromMinutes(business.monday[0].open), '09:00');
    assert.equal(fromMinutes(business.monday[0].close), '18:00');
    // leerer Tag = geschlossen, kein Slot
    for (const { key } of WEEKDAYS.filter((d) => d.key !== 'monday')) {
        assert.deepEqual(business[key], []);
    }
});
