import test, { type TestContext } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import fileUploadHandler from './fileUploadHandler.ts';

const app = express();
app.use(express.json());
app.post('/echo', fileUploadHandler, (req, res) => {
    res.json({ data: req.body });
});

/** Server auf einem freien Port; schliesst auch, wenn der Test fehlschlaegt. */
const listen = async (t: TestContext) => {
    const server = await new Promise<ReturnType<typeof app.listen>>(
        (resolve) => {
            const s = app.listen(0, () => resolve(s));
        },
    );
    t.after(() => server.close());
    return (server.address() as { port: number }).port;
};

test('JSON-Request laeuft durch, statt auf formidable zu warten', async (t) => {
    const port = await listen(t);

    // Ohne den Nicht-Multipart-Zweig haengt dieser Request endlos:
    // express.json() hat den Body schon gelesen, formidable wartet auf den Rest.
    const res = await fetch(`http://localhost:${port}/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Ohne Datei' }),
        signal: AbortSignal.timeout(2000),
    });

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { data: { title: 'Ohne Datei' } });
});

test('Multipart-Request wird weiterhin von formidable geparst', async (t) => {
    const port = await listen(t);

    const form = new FormData();
    form.append('title', 'Mit Formular');
    form.append('tags', '["sport"]');

    const res = await fetch(`http://localhost:${port}/echo`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(2000),
    });

    assert.equal(res.status, 200);
    // JSON-Felder werden im Multipart-Zweig entpackt, im JSON-Zweig nicht noetig.
    assert.deepEqual(await res.json(), {
        data: { title: 'Mit Formular', tags: ['sport'] },
    });
});
