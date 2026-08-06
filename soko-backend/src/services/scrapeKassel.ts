import * as cheerio from 'cheerio';
import { ScrapedEvent } from '#models';
import { scrapedEventSchema, type ScrapedEventInput } from '#schemas';
import { toCategoryKey, unmappedCategories } from '#utils';

const BASE_URL = 'https://www.kassel.de/veranstaltungskalender.php';
const PAGE_PARAM = 'sp:page[kassel-event-search.form][0]';

// Schluessel sind die ersten drei Buchstaben: die Quelle schreibt lange
// Monatsnamen ab ("6. Aug. 2026"), kurze aber aus ("9. Juli 2026"). Die
// Abkuerzung hat frueher jeden Termin in Jan/Feb/Apr/Aug/Sep/Okt/Nov/Dez
// verschluckt — die Events landeten still ohne Datum in der Datenbank.
const MONTHS: Record<string, number> = {
    jan: 0,
    feb: 1,
    mär: 2,
    apr: 3,
    mai: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    okt: 9,
    nov: 10,
    dez: 11,
};

// "9. Juli 2026" / "6. Aug. 2026" + "ab 00:00" -> Date. Local time, no tz lib.
// ponytail: naive parse; add date-fns/tz only if DST correctness bites.
export function parseGermanDate(
    dateStr: string,
    timeStr: string,
): Date | null {
    const m = dateStr.match(/(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)\.?\s*(\d{4})/);
    if (!m) return null;
    const month = MONTHS[m[2].toLowerCase().slice(0, 3)];
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
    rawCategories: string[];
} {
    const $ = cheerio.load(html);

    // pageCount lives in a JSON blob on the result section
    let pageCount = 1;
    const resultAttr = $('[data-sp-search-result]')
        .first()
        .attr('data-sp-search-result');
    if (resultAttr) {
        const pc = resultAttr.match(/"pageCount":(\d+)/);
        if (pc) pageCount = Number(pc[1]);
    }

    const events: ScrapedEventInput[] = [];
    const rawCategories: string[] = [];
    let skipped = 0;

    $('.SP-Teaser--event').each((_, el) => {
        const $el = $(el);
        const $link = $el.find('a.SP-Teaser__link').first();
        const href = $link.attr('href') ?? '';
        const externalId = new URL(href, BASE_URL).searchParams.get('id') ?? '';
        const title =
            txt($el.find('.SP-Teaser__headline__text')) ||
            ($link.attr('title') ?? '');

        // Rohkategorie sofort auf einen Category.key normalisieren — sonst
        // schreibt jeder Lauf wieder das Vokabular der Stadt in die Datenbank.
        const rawCategory = txt($el.find('.SP-Kicker__category'));
        rawCategories.push(rawCategory);

        const raw = {
            externalId,
            title,
            description: txt($el.find('.SP-Teaser__abstract')),
            startDate: parseGermanDate(
                txt($el.find('.SP-Scheduling__date')),
                txt($el.find('.SP-Scheduling__time')),
            ),
            category: toCategoryKey(rawCategory),
            locationName: txt($el.find('.SP-Teaser__subheadline__venue')),
            municipality: txt(
                $el.find('.SP-Teaser__subheadline__municipality'),
            ),
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

    return { events, skipped, pageCount, rawCategories };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function scrapeKasselEvents() {
    const first = parsePage(await fetchPage(1));
    let all = [...first.events];
    let skipped = first.skipped;
    let rawCategories = [...first.rawCategories];

    for (let page = 2; page <= first.pageCount; page++) {
        await sleep(500); // be polite to the source
        const {
            events,
            skipped: s,
            rawCategories: raws,
        } = parsePage(await fetchPage(page));
        all = all.concat(events);
        skipped += s;
        rawCategories = rawCategories.concat(raws);
    }

    // Neue Quell-Kategorien fallen in `sonstiges` — laut melden, damit sie eine
    // Mapping-Zeile bekommen. Ein spaeterer Lauf korrigiert die Zuordnung.
    const unmapped = unmappedCategories(rawCategories);
    if (unmapped.length > 0) {
        console.warn(
            `Ohne Mapping (→ sonstiges): ${unmapped.join(', ')}\n` +
                'Bitte in src/utils/categoryMapping.ts ergaenzen.',
        );
    }

    if (all.length === 0) {
        // Selectors likely changed upstream — fail loudly rather than wiping nothing.
        throw new Error(
            'Scrape produced 0 events; check page structure/selectors.',
        );
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
        unmapped,
        upserted: result.upsertedCount,
        matched: result.matchedCount,
        skipped,
    };
}
