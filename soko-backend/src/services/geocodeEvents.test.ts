import test from 'node:test';
import assert from 'node:assert';
import { groupByVenue, venueQuery } from './geocodeEvents.ts';

test('derselbe Ort wird nur einmal abgefragt', () => {
    const groups = groupByVenue([
        { _id: 1, locationName: 'Stadthalle', municipality: 'Kassel' },
        { _id: 2, locationName: 'Stadthalle', municipality: 'Kassel' },
        { _id: 3, locationName: 'Stadthalle', municipality: 'Kassel' },
        { _id: 4, locationName: 'Documenta-Halle', municipality: 'Kassel' },
    ]);

    assert.equal(groups.size, 2, 'vier Events, aber nur zwei Orte');
    assert.deepEqual(groups.get('Stadthalle, Kassel'), [1, 2, 3]);
    assert.deepEqual(groups.get('Documenta-Halle, Kassel'), [4]);
});

test('gleicher Ortsname in anderer Gemeinde bleibt getrennt', () => {
    const groups = groupByVenue([
        { _id: 1, locationName: 'Rathaus', municipality: 'Kassel' },
        { _id: 2, locationName: 'Rathaus', municipality: 'Baunatal' },
    ]);

    assert.equal(groups.size, 2);
});

test('fehlende Gemeinde faellt auf Kassel zurueck', () => {
    assert.equal(venueQuery({ _id: 1, locationName: 'Schlachthof' }), 'Schlachthof, Kassel');
    assert.equal(venueQuery({ _id: 1, locationName: 'Schlachthof', municipality: '' }), 'Schlachthof, Kassel');
});
