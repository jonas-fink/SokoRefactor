import test from 'node:test';
import assert from 'node:assert';
import app from './app.ts';

/**
 * `trust proxy` ist eine Sicherheitseinstellung, die still versagt: nimmt sie
 * jemand heraus, laeuft alles weiter — nur limitieren `authRateLimiter` und
 * `chatRateLimiter` dann wieder alle Nutzer gemeinsam statt einzeln. Genau
 * deshalb steht hier ein Test und nicht nur ein Kommentar.
 */
test('der Proxy davor wird vertraut, aber nur einer', () => {
    // `strictEqual`, nicht `equal`: `1 == true` ist in JS wahr, und `true` waere
    // hier der gefaehrliche Fall — dann zaehlt jeder selbstgesetzte
    // `X-Forwarded-For` und der Limiter laesst sich pro Request umgehen.
    // Ein lockerer Vergleich wuerde genau diesen Fehler durchlassen.
    assert.strictEqual(app.get('trust proxy'), 1);
});
