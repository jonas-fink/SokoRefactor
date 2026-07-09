import * as cheerio from 'cheerio';
import { ScrapedEvent } from '#models';
import { scrapedEventSchema, type ScrapedEventInput } from '#schemas';

const BASE_URL = 'https://www.kassel.de/veranstaltungskalender.php';
const PAGE_PARAM = 'sp:page[kassel-event-search.form][0]';

const MONTHS: Record<string, number> = {
    januar: 0,
    februar: 1,
    'märz': 2,
    april: 3,
    mai: 4,
    juni: 5,
    juli: 6,
    august: 7,
    september: 8,
    oktober: 9,
    november: 10,
    dezember: 11,
};

// "9. Juli 2026" + "ab 00:00" -> Date. Local time, no tz/i18n lib.
// ponytail: naive parse; add date-fns/tz only if DST correctness bites.
function parseGermanDate(dateStr: string, timeStr: string): Date | null {
    const m = dateStr.match(/(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)\s*(\d{4})/);
    if (!m) return null;
    const month = MONTHS[m[2].toLowerCase()];
    if (month === undefined) return null;
    const day = Number(m[1]);
    const year = Number(m[3]);
    const t = timeStr.match(/(\d{1,2}):(\d{2})/);
    const hh = t ? Number(t[1]) : 0;
    const mm = t ? Number(t[2]) : 0;
    const d = new Date(year, month, day, hh, mm);
    return isNaN(d.getTime()) ? null : d;
}

function fetchPage(page: number): Promise<string> {
    const url = new URL(BASE_URL);
    if (page > 1) url.searchParams.set(PAGE_PARAM, String(page));
    return fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (soko-scraper)' },
    }).then((r) => {
        if (!r.ok) throw new Error(`Fetch page ${page} failed: ${r.status}`);
        return r.text();
    });
}

function txt($el: cheerio.Cheerio<any>): string {
    return $el.first().text().trim();
}

function parsePage(html: string): {
    events: ScrapedEventInput[];
    skipped: number;
    pageCount: number;
} {
    const $ = cheerio.load(html);

    // pageCount lives in a JSON blob on the result section
    let pageCount = 1;
    const resultAttr = $('[data-sp-search-result]').first().attr(
        'data-sp-search-result',
    );
    if (resultAttr) {
        const pc = resultAttr.match(/"pageCount":(\d+)/);
        if (pc) pageCount = Number(pc[1]);
    }

    const events: ScrapedEventInput[] = [];
    let skipped = 0;

    $('.SP-Teaser--event').each((_, el) => {
        const $el = $(el);
        const $link = $el.find('a.SP-Teaser__link').first();
        const href = $link.attr('href') ?? '';
        const externalId = new URL(href, BASE_URL).searchParams.get('id') ?? '';
        const title =
            txt($el.find('.SP-Teaser__headline__text')) ||
            ($link.attr('title') ?? '');

        const raw = {
            externalId,
            title,
            description: txt($el.find('.SP-Teaser__abstract')),
            startDate: parseGermanDate(
                txt($el.find('.SP-Scheduling__date')),
                txt($el.find('.SP-Scheduling__time')),
            ),
            category: txt($el.find('.SP-Kicker__category')),
            locationName: txt($el.find('.SP-Teaser__subheadline__venue')),
            municipality: txt($el.find('.SP-Teaser__subheadline__municipality')),
            sourceUrl: new URL(href, BASE_URL).toString(),
            source: 'kassel.de',
        };

        const parsed = scrapedEventSchema.safeParse(raw);
        if (parsed.success) {
            events.push(parsed.data);
        } else {
            skipped++;
            console.warn(
                `Skipped event (id=${externalId || '?'}):`,
                parsed.error.issues.map((i) => i.message).join(', '),
            );
        }
    });

    return { events, skipped, pageCount };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function scrapeKasselEvents() {
    const first = parsePage(await fetchPage(1));
    let all = [...first.events];
    let skipped = first.skipped;

    for (let page = 2; page <= first.pageCount; page++) {
        await sleep(500); // be polite to the source
        const { events, skipped: s } = parsePage(await fetchPage(page));
        all = all.concat(events);
        skipped += s;
    }

    if (all.length === 0) {
        // Selectors likely changed upstream — fail loudly rather than wiping nothing.
        throw new Error('Scrape produced 0 events; check page structure/selectors.');
    }

    const result = await ScrapedEvent.bulkWrite(
        all.map((e) => ({
            updateOne: {
                filter: { externalId: e.externalId },
                update: { $set: e },
                upsert: true,
            },
        })),
        { ordered: false },
    );

    return {
        pages: first.pageCount,
        scraped: all.length,
        upserted: result.upsertedCount,
        matched: result.matchedCount,
        skipped,
    };
}
