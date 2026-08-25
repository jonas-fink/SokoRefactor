import test from 'node:test';
import assert from 'node:assert';
import { directionsUrl } from './directions.ts';

test('destination steht als lat,lng in der URL', () => {
    assert.strictEqual(
        directionsUrl(51.3166, 9.51667),
        'https://www.google.com/maps/dir/?api=1&destination=51.3166,9.51667',
    );
});
