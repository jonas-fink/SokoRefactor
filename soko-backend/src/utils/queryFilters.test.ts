import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFilter, searchFilter } from './queryFilters.ts';

test('leere Query ergibt ein leeres Fragment', () => {
    assert.deepEqual(buildFilter({}), {});
    assert.deepEqual(buildFilter({ q: '   ' }), {});
    assert.deepEqual(buildFilter({ lang: [] }), {});
});

test('lang filtert auf availableLanguages', () => {
    const { $and } = buildFilter({ lang: ['ar'] }) as { $and: unknown[] };
    assert.deepEqual($and, [
        {
            $or: [
                { availableLanguages: { $in: ['ar'] } },
                { availableLanguages: { $size: 0 } },
                { availableLanguages: { $exists: false } },
            ],
        },
    ]);
});

test('lang und for stehen nebeneinander, nicht uebereinander', () => {
    const { $and } = buildFilter({ lang: ['de', 'ar'], for: ['familien'] }) as {
        $and: Record<string, unknown>[];
    };
    assert.equal($and.length, 2);
    // Beide bringen ein eigenes $or mit — in einem flachen Objekt haette das
    // zweite das erste ueberschrieben.
    assert.ok($and.every((c) => '$or' in c));
});

test('free=1 wirkt nur, wo es ueberhaupt einen Preis gibt', () => {
    assert.deepEqual(buildFilter({ free: '1' }, true), {
        $and: [{ price: 0 }],
    });
    assert.deepEqual(buildFilter({ free: '1' }), {});
    assert.deepEqual(buildFilter({ free: '0' }, true), {});
});

test('unbekannte Keys werden verworfen, nicht durchgereicht', () => {
    assert.deepEqual(buildFilter({ lang: ['klingonisch'] }), {});
    assert.deepEqual(buildFilter({ for: ['marsmenschen'] }), {});

    // Aus einer gemischten Liste bleibt der gueltige Teil stehen.
    const { $and } = buildFilter({ lang: ['de', 'klingonisch'] }) as {
        $and: { $or: [{ availableLanguages: { $in: string[] } }, ...unknown[]] }[];
    };
    assert.deepEqual($and[0].$or[0], { availableLanguages: { $in: ['de'] } });
});

test('ein leeres UND ein fehlendes Feld matchen mit', () => {
    const { $and } = buildFilter({ for: ['senioren'] }) as {
        $and: { $or: Record<string, unknown>[] }[];
    };
    // Der Altbestand darf durch den ersten Filter nicht verschwinden — weder
    // mit leerem Array noch, und das ist der eigentliche Fall, ganz ohne Feld:
    // vor Phase 12 geschriebene Dokumente kennen `targetAudience` nicht.
    assert.deepEqual($and[0].$or.slice(1), [
        { targetAudience: { $size: 0 } },
        { targetAudience: { $exists: false } },
    ]);
});

test('q sucht als Substring ueber Titel, Beschreibung und Kategorie', () => {
    const { $and } = buildFilter({ q: 'kaff' }) as {
        $and: { $or: { title?: RegExp }[] }[];
    };
    const [{ title }] = $and[0].$or;
    assert.ok(title?.test('Offenes Kaffeetrinken'));
    assert.ok(!title?.test('Konzert'));
});

test('searchFilter escaped Regex-Sonderzeichen', () => {
    const [{ title }] = searchFilter('a.c').$or;
    assert.ok(title?.test('a.c'));
    // Ohne Escaping wuerde der Punkt auf jedes Zeichen passen.
    assert.ok(!title?.test('abc'));
});
