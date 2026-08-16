import test from 'node:test';
import assert from 'node:assert';
import { servicesPayload, type ServiceDraft } from './services.ts';

const doc = (id: string) => ({
    _id: id,
    title: `Antrag ${id}`,
    s3Key: `beratung/x/${id}`,
    mimeType: 'application/pdf',
});

// Der teure Fehler: ein PUT ohne die bestehenden Dokumente laesst
// `orphanedKeys` jeden Antrag fuer verwaist halten — weg aus DB *und* S3.
test('Dokumente und _id ueberleben den Weg in den PUT-Body', () => {
    const services: ServiceDraft[] = [
        {
            _id: 'srv1',
            name: 'Grundsicherung',
            documents: [doc('a'), doc('b')],
        },
    ];

    const payload = servicesPayload(services);

    assert.equal(payload.length, 1);
    assert.equal(payload[0]._id, 'srv1');
    assert.deepEqual(
        payload[0].documents.map((d) => d.s3Key),
        ['beratung/x/a', 'beratung/x/b'],
    );
});

test('Nur unbenannte Zeilen fallen raus', () => {
    const services: ServiceDraft[] = [
        { name: '  ', documents: [] },
        { name: '  Wohngeld  ', documents: [] },
    ];

    const payload = servicesPayload(services);

    assert.equal(payload.length, 1);
    assert.equal(payload[0].name, 'Wohngeld');
});
