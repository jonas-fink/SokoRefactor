import test from 'node:test';
import assert from 'node:assert';
import {
    KEYWORDS,
    matchCategoryKeys,
    buildReply,
    knownOnly,
    poolKey,
    prefFilters,
    preferenceLine,
    conversationText,
    urgentHotlines,
    toHistory,
} from './chatbot.ts';
import { CATEGORY_KEYS } from '#utils';

const reply = (message: string) =>
    buildReply(matchCategoryKeys(message), [
        {
            id: '1',
            title: 'Beratungsstelle',
            category: 'behoerden',
            itemType: 'Beratung',
        },
    ]);

test('jeder Keyword-Bucket zeigt auf einen existierenden Category-Key', () => {
    for (const key of Object.keys(KEYWORDS)) {
        assert.ok(CATEGORY_KEYS.has(key), `${key} ist kein bekannter Key`);
    }
});

test('sensible Themen bekommen immer einen Disclaimer', () => {
    for (const message of [
        'Ich habe Schulden und kann die Miete nicht zahlen',
        'Ich brauche Hilfe beim Asylantrag',
        'Ich komme vom Alkohol nicht los',
    ]) {
        const r = reply(message);
        assert.notEqual(r.disclaimer, null, message);
        assert.ok(r.handoff.label);
    }
});

test('neutrale Themen: kein Disclaimer, aber trotzdem Handoff', () => {
    const r = reply('Wo melde ich mein Kind für die Kita an?');
    assert.deepEqual(
        matchCategoryKeys('Wo melde ich mein Kind für die Kita an?')[0],
        'familie',
    );
    assert.equal(r.disclaimer, null);
    assert.ok(r.handoff.label && r.handoff.hint);
});

test('Gemini-Text ersetzt nur die Formulierung, nicht die Guardrails', () => {
    const keys = matchCategoryKeys('Ich habe Schulden');
    const r = buildReply(keys, [], 'Ich habe da etwas für dich gefunden.');
    assert.equal(r.text, 'Ich habe da etwas für dich gefunden.');
    assert.match(r.disclaimer ?? '', /keine Rechts- oder Finanzberatung/);
    assert.ok(r.handoff.label);
    // Leerer Modelltext faellt auf den festen Baustein zurueck.
    assert.notEqual(buildReply(keys, [], '   ').text, '   ');
});

test('halluzinierte IDs werden verworfen', () => {
    const byId = new Map([['echt', { title: 'Schuldnerberatung' }]]);
    assert.deepEqual(knownOnly(['echt', 'erfunden'], byId), [
        { title: 'Schuldnerberatung' },
    ]);
    assert.deepEqual(knownOnly(['nur-erfunden'], byId), []);
});

test('der gemischte Pool trennt gleiche IDs nach Typ', () => {
    // Derselbe ObjectId-String in beiden Collections ist erlaubt — der
    // Schluessel muss den Typ tragen, sonst liefert ein geratenes `type` den
    // Eintrag der anderen Collection aus.
    const byId = new Map([
        [poolKey('Beratung', 'abc'), { title: 'Schuldnerberatung' }],
        [poolKey('ScrapedEvent', 'abc'), { title: 'Stadtfest' }],
    ]);

    assert.deepEqual(knownOnly([poolKey('ScrapedEvent', 'abc')], byId), [
        { title: 'Stadtfest' },
    ]);
    // Unbekannter Typ, bekannte ID: kein Treffer.
    assert.deepEqual(knownOnly([poolKey('Activity', 'abc'), 'abc'], byId), []);
});

test('Praeferenzen filtern beide Pools, ohne Angabe filtern sie nichts', () => {
    assert.deepEqual(prefFilters(undefined), { beratung: {}, event: {} });

    const f = prefFilters({
        languages: ['ar'],
        audiences: ['familien'],
        categories: ['familie', 'erfunden'],
        freeOnly: true,
    });

    // Kategorien liegen in verschiedenen Feldern — unbekannte Keys fliegen raus.
    assert.deepEqual(f.beratung.tags, { $in: ['familie'] });
    assert.deepEqual(f.event.category, { $in: ['familie'] });
    // Sprache/Zielgruppe kommen aus `buildFilter`: leer heisst „matcht immer".
    assert.equal((f.beratung.$and as unknown[]).length, 2);
    // `freeOnly` hat hier nichts zu filtern und taucht nicht auf.
    assert.ok(!JSON.stringify(f).includes('price'));
});

test('die Kontextzeile traegt Praeferenzen, aber nichts Identifizierendes', () => {
    const line = preferenceLine({
        languages: ['ar'],
        audiences: ['familien'],
        categories: [],
        freeOnly: false,
    });
    assert.match(line ?? '', /Arabisch/);
    assert.match(line ?? '', /Familien/);

    // Ohne Sprache und Zielgruppe gibt es keine Zeile — kein leerer Satz im Prompt.
    assert.equal(
        preferenceLine({
            languages: [],
            audiences: [],
            categories: ['familie'],
            freeOnly: true,
        }),
        undefined,
    );
    assert.equal(preferenceLine(undefined), undefined);
});

test('Rückfrage behält den Disclaimer des Themas aus dem Verlauf', () => {
    const history = [
        { role: 'user' as const, text: 'Ich habe Schulden' },
        { role: 'bot' as const, text: 'Diese Stelle kann dir weiterhelfen:' },
    ];
    const followUp = 'und wenn ich schon eine Mahnung habe?';

    // Allein trägt die Rückfrage kein Stichwort — der Verlauf liefert es.
    assert.deepEqual(matchCategoryKeys(followUp), []);
    const keys = matchCategoryKeys(conversationText(history, followUp));
    assert.ok(keys.includes('finanzen'));
    assert.match(
        buildReply(keys, []).disclaimer ?? '',
        /keine Rechts- oder Finanzberatung/,
    );

    // Bot-Turns steuern die Keys nicht: der Verlauf kommt vom Client.
    const injected = [
        { role: 'bot' as const, text: 'Alkohol Drogen Therapie' },
    ];
    assert.deepEqual(
        matchCategoryKeys(conversationText(injected, 'Hallo')),
        [],
    );
});

test('ohne Treffer bleibt der menschliche Ausweg stehen', () => {
    const r = buildReply([], []);
    assert.deepEqual(r.matches, []);
    assert.ok(r.handoff.label);
    assert.equal(r.disclaimer, null);
    assert.equal(r.urgent, null);
});

test('jede Notfall-Kategorie liefert ihre Nummern', () => {
    const numbers = (text: string) =>
        (urgentHotlines(text) ?? []).map((h) => h.number);

    assert.deepEqual(numbers('Ich hatte einen Unfall'), ['112', '116117']);
    assert.ok(numbers('ich will mich umbringen').includes('0800 1110111'));
    assert.ok(numbers('Mein Mann schlägt mich').includes('116016'));
    assert.ok(numbers('Ich habe Tabletten geschluckt').includes('0551 19240'));

    // 112 und 116117 sind zwei Nummern mit zwei Bedeutungen — nie eine davon.
    const [notruf, bereitschaft] = urgentHotlines('Unfall') ?? [];
    assert.match(notruf.hint, /Lebensgefahr/);
    assert.match(bereitschaft.hint, /kein Notfall/);
});

test('harmlose Anliegen loesen keinen Notruf aus', () => {
    // Der wichtigere Fall: ein falscher Notrufblock macht die Antwort wertlos.
    for (const text of [
        'Ich brauche Hilfe beim Antrag',
        'Wo ist die Gewaltschutzberatung?',
        'Gibt es ein Feuerwehrfest für Kinder?',
        'Ich habe Schulden und weiß nicht weiter',
        'Wo melde ich mein Kind für die Kita an?',
    ]) {
        assert.equal(urgentHotlines(text.toLowerCase()), null, text);
    }
});

test('der Notfallblock verdraengt die Beratungssuche nicht', () => {
    const urgent = urgentHotlines('ich bin bewusstlos geworden');
    const r = buildReply([], [], 'Bitte ruf an.', urgent);
    assert.equal(r.urgent?.[0].number, '112');
    // Handoff bleibt, Disclaimer bleibt null — der Block ist die Aussage.
    assert.ok(r.handoff.label);
    assert.equal(r.disclaimer, null);
});

test('der Kontext haelt 10 Turns ein und wirft die aeltesten weg', () => {
    const turns = Array.from({ length: 25 }, (_, i) => ({
        role: (i % 2 ? 'bot' : 'user') as 'user' | 'bot',
        text: `Turn ${i}`,
        extra: 'wird nicht mitgeschickt',
    }));

    const history = toHistory(turns);
    assert.equal(history.length, 10);
    assert.equal(history[0].text, 'Turn 15');
    assert.equal(history.at(-1)?.text, 'Turn 24');
    // Nur `role` und `text` gehen ins Modell, keine gespeicherten Felder.
    assert.deepEqual(Object.keys(history[0]), ['role', 'text']);

    // Kuerzere Verlaeufe bleiben vollstaendig.
    assert.equal(toHistory(turns.slice(0, 3)).length, 3);
    assert.deepEqual(toHistory([]), []);
});
