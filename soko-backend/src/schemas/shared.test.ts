import test from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';
import { activityPatchBodySchema } from './activity.ts';
import { beratungPatchBodySchema } from './beratung.ts';

/**
 * Ein PATCH darf nur anfassen, was im Body steht. `.partial()` allein reicht
 * dafuer nicht: die Felder werden optional, die `default()`s bleiben — ein
 * PATCH nur mit `title` bekaeme `tags: []`, `services: []` und `price: 0` dazu
 * und wuerde sie im Dokument leeren. Bei `services` haengt daran mehr als ein
 * Feld: `orphanedKeys` loescht danach die nicht mehr referenzierten Dateien
 * aus S3.
 */
const PATCH_SCHEMAS = {
    activity: activityPatchBodySchema,
    beratung: beratungPatchBodySchema,
};

for (const [name, schema] of Object.entries(PATCH_SCHEMAS)) {
    test(`${name}: leerer PATCH-Body bleibt leer`, () => {
        assert.deepEqual(schema.parse({}), {});
    });

    test(`${name}: ein PATCH mit einem Feld traegt nichts anderes ein`, () => {
        assert.deepEqual(schema.parse({ title: 'Neuer Titel' }), {
            title: 'Neuer Titel',
        });
    });

    // Faengt jedes spaeter ergaenzte Feld mit `default()` ab, ohne dass jemand
    // daran denken muss — die Probe oben deckt nur die heutigen Felder.
    test(`${name}: kein Feld im Patch-Schema traegt einen Vorgabewert`, () => {
        for (const [key, field] of Object.entries(schema.shape)) {
            const inner =
                field instanceof z.ZodOptional ? field.unwrap() : field;
            assert.ok(
                !(inner instanceof z.ZodDefault),
                `${key} hat ein default() — ein PATCH ohne ${key} wuerde das Feld ueberschreiben`,
            );
        }
    });
}
