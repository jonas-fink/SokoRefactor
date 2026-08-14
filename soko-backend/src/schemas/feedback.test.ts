import test from 'node:test';
import assert from 'node:assert';
import { feedbackBodySchema } from './feedback.ts';

test('Leere Nachricht wird abgelehnt', () => {
    assert.equal(
        feedbackBodySchema.safeParse({ message: '   ' }).success,
        false,
    );
});

test('Zu lange Nachricht wird abgelehnt', () => {
    const result = feedbackBodySchema.safeParse({ message: 'x'.repeat(2001) });
    assert.equal(result.success, false);
});

test('Kaputte Mail wird abgelehnt', () => {
    const result = feedbackBodySchema.safeParse({
        message: 'Passt soweit',
        email: 'keine-mail',
    });
    assert.equal(result.success, false);
});

// Der Grund fuer die union: ein Formular schickt das leere Feld trotzdem mit.
test('Anonym: leere und fehlende Mail werden zu undefined', () => {
    const leer = feedbackBodySchema.parse({ message: 'Danke!', email: '' });
    const fehlt = feedbackBodySchema.parse({ message: 'Danke!' });

    assert.strictEqual(leer.email, undefined);
    assert.strictEqual(fehlt.email, undefined);
});

// `userId` setzt allein `optionalAuth`. Steht es im Body, muss es rausfliegen,
// sonst schreibt sich ein Gast eine fremde Identitaet ins Dokument.
test('userId aus dem Body wird verworfen', () => {
    const parsed = feedbackBodySchema.parse({
        message: 'Hallo',
        userId: '507f1f77bcf86cd799439011',
    });

    assert.ok(!('userId' in parsed));
});
