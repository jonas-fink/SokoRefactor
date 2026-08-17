import test from 'node:test';
import assert from 'node:assert/strict';
import { metricUpsert } from './metrics.ts';
import { Metric } from '#models';

test('derselbe Key am selben Tag trifft dasselbe Dokument und zaehlt hoch', () => {
    const morgens = metricUpsert(
        'chat.no_match',
        new Date('2026-08-17T08:00:00Z'),
    );
    const abends = metricUpsert(
        'chat.no_match',
        new Date('2026-08-17T21:30:00Z'),
    );

    // Gleicher Filter → ein Dokument, nicht zwei.
    assert.deepEqual(morgens.filter, abends.filter);
    assert.deepEqual(morgens.filter, {
        day: '2026-08-17',
        key: 'chat.no_match',
    });
    // `$inc`, nicht `$set`: aus zweimal 1 wird 2.
    assert.deepEqual(morgens.update, { $inc: { count: 1 } });
});

test('anderer Tag und anderer Key trennen die Buckets', () => {
    const a = metricUpsert('chat.no_match', new Date('2026-08-17T08:00:00Z'));
    const b = metricUpsert('chat.no_match', new Date('2026-08-18T08:00:00Z'));
    const c = metricUpsert('chat.reply', new Date('2026-08-17T08:00:00Z'));

    assert.notDeepEqual(a.filter, b.filter);
    assert.notDeepEqual(a.filter, c.filter);
});

test('der Unique-Index auf (day, key) steht', () => {
    // Ohne ihn koennte ein Upsert-Rennen doch zwei Dokumente anlegen.
    const [[fields, options]] = Metric.schema.indexes();
    assert.deepEqual(fields, { day: 1, key: 1 });
    assert.equal(options?.unique, true);
});

test('Kennzahlen tragen nichts Personenbezogenes', () => {
    // Der Schutz ist das Schema selbst: was nicht drinsteht, kann nicht
    // versehentlich mitgeschrieben werden.
    assert.deepEqual(Object.keys(Metric.schema.obj), ['day', 'key', 'count']);
});
