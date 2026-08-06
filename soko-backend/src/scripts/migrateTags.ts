import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB } from '#config';
import { Activity, Beratung, Category, ScrapedEvent } from '#models';
import { CATEGORY_MAPPING, unmappedCategories } from '#utils';

/**
 * Zieht den Alt-Bestand auf die kuratierten `Category.key`s nach. Die
 * Mapping-Tabelle liegt in `#utils` und wird vom Scraper mitbenutzt — dort
 * werden neue Events schon beim Schreiben normalisiert.
 */
const migrate = async () => {
    const known = new Set(await Category.distinct('key'));
    assert.ok(
        known.size > 0,
        'Keine Kategorien — erst `npm run seed:categories`',
    );

    const allValues = async () =>
        [
            ...(await Activity.distinct('tags')),
            ...(await Beratung.distinct('tags')),
            ...(await ScrapedEvent.distinct('category')),
        ].filter((v): v is string => typeof v === 'string' && v.trim() !== '');

    const unmapped = unmappedCategories(await allValues(), known);

    let touched = 0;
    for (const [from, to] of Object.entries(CATEGORY_MAPPING)) {
        // Array-Felder: nur das getroffene Element ersetzen, Rest bleibt stehen.
        const replaceTag = { $set: { 'tags.$[el]': to } };
        const onlyMatch = { arrayFilters: [{ el: from }] };
        touched += (
            await Activity.updateMany({ tags: from }, replaceTag, onlyMatch)
        ).modifiedCount;
        touched += (
            await Beratung.updateMany({ tags: from }, replaceTag, onlyMatch)
        ).modifiedCount;
        touched += (
            await ScrapedEvent.updateMany(
                { category: from },
                { $set: { category: to } },
            )
        ).modifiedCount;
    }

    // Werte ohne Mapping-Zeile ins Auffangbecken, damit nichts Rohes stehen bleibt.
    if (unmapped.length > 0) {
        touched += (
            await ScrapedEvent.updateMany(
                { category: { $in: unmapped } },
                { $set: { category: 'sonstiges' } },
            )
        ).modifiedCount;
    }

    const stillUnknown = (await allValues()).filter((t) => !known.has(t));
    assert.deepEqual(
        stillUnknown,
        [],
        `Unbekannte Kategorien nach Migration: ${stillUnknown.join(', ')}`,
    );

    return { touched, unmapped };
};

connectDB()
    .then(() => migrate())
    .then(({ touched, unmapped }) => {
        console.log(`Tags migriert: ${touched} Dokumente`);
        if (unmapped.length > 0) {
            console.warn(
                `Ohne Mapping-Zeile (${unmapped.length}) → \`sonstiges\`; ` +
                    `bitte in src/utils/categoryMapping.ts ergaenzen:\n  ${unmapped.join('\n  ')}`,
            );
        }
        return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Tag-Migration fehlgeschlagen:', err);
        process.exit(1);
    });
