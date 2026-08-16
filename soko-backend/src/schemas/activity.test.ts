import test from 'node:test';
import assert from 'node:assert';
import {
    activityCreateBodySchema,
    activityPatchBodySchema,
} from './activity.ts';

// Exakt das Shape, das ActivityForm.tsx per FormData schickt: `price` und
// `date` sind Strings. Ohne `z.coerce` scheitert hier jeder echte Request.
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

// --- Kontaktangaben ---------------------------------------------------------

test('Leere Kontaktfelder werden zu undefined, nicht zu ""', () => {
    // Genau das schickt ein Formular, in dem niemand etwas eingetragen hat.
    const parsed = activityCreateBodySchema.parse({
        ...formDataBody,
        email: '',
        phone: '',
        address: '',
    });

    assert.strictEqual(parsed.email, undefined);
    assert.strictEqual(parsed.phone, undefined);
    assert.strictEqual(parsed.address, undefined);
});

test('preferredContact ohne die zugehoerige Angabe wird abgelehnt', () => {
    const result = activityCreateBodySchema.safeParse({
        ...formDataBody,
        email: '',
        preferredContact: 'email',
    });

    assert.equal(result.success, false);
});

test('preferredContact mit zugehoeriger Angabe geht durch', () => {
    const parsed = activityCreateBodySchema.parse({
        ...formDataBody,
        email: 'kontakt@example.org',
        preferredContact: 'email',
    });

    assert.equal(parsed.preferredContact, 'email');
    assert.equal(parsed.email, 'kontakt@example.org');
});

test('Patch-Schema prueft den Kontaktweg nicht — das Feld kann im Dokument stehen', () => {
    const result = activityPatchBodySchema.safeParse({
        preferredContact: 'phone',
    });

    assert.equal(result.success, true);
});
