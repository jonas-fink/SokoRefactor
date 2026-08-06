import test from 'node:test';
import assert from 'node:assert';
import { KEYWORDS, matchCategoryKeys, buildReply } from './chatbot.ts';
import { CATEGORY_KEYS } from '#utils';

const reply = (message: string) =>
    buildReply(matchCategoryKeys(message), [
        { id: '1', title: 'Beratungsstelle', category: 'behoerden' },
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
    assert.deepEqual(matchCategoryKeys('Wo melde ich mein Kind für die Kita an?')[0], 'familie');
    assert.equal(r.disclaimer, null);
    assert.ok(r.handoff.label && r.handoff.hint);
});

test('ohne Treffer bleibt der menschliche Ausweg stehen', () => {
    const r = buildReply([], []);
    assert.deepEqual(r.matches, []);
    assert.ok(r.handoff.label);
    assert.equal(r.disclaimer, null);
});
