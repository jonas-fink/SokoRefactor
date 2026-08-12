import test from 'node:test';
import assert from 'node:assert';
import { activityCreateBodySchema } from './activity.ts';

const formDataBody = {
    title: 'Yoga im Park',
    description: 'Offener Kurs für alle',
    date: new Date('2026-09-01T10:00:00.000Z').toISOString(),
    price: '12',
    location: { type: 'Point', coordinates: [9.5, 51.3] },
    tags: ['sport'],
    availableLanguages: [],
    targetAudience: [],
};

test('FormData-Body (Strings) wird korrekt gecoerct', () => {
    const parsed = activityCreateBodySchema.parse(formDataBody);

    assert.ok(parsed.date instanceof Date);
    assert.equal(parsed.date.toISOString(), '2026-09-01T10:00:00.000Z');
    assert.strictEqual(parsed.price, 12);
    assert.equal(parsed.image, 'https://placehold.net/600x600.png');
});

test('Ueberlanger Titel wird abgelehnt', () => {
    const result = activityCreateBodySchema.safeParse({
        ...formDataBody,
        title: 'x'.repeat(101),
    });

    assert.equal(result.success, false);
});

test('Fehlende Pflichtfelder werden abgelehnt', () => {
    const { description, ...ohneBeschreibung } = formDataBody;
    void description;

    assert.equal(
        activityCreateBodySchema.safeParse(ohneBeschreibung).success,
        false,
    );
});
