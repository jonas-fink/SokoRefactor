/**
 * Gegenstueck zu `beratungDocuments.ts`, nur fuer das eine Bild pro Eintrag:
 * der Bucket kennt keine Referenzen, wer den Key aus dem Dokument entfernt,
 * muss die Datei mitloeschen. Genau das hat bei Cloudinary nie jemand getan.
 *
 * Beide Funktionen geben eine Liste zurueck, weil `deleteFiles` eine erwartet
 * und auf `[]` von selbst nichts tut — so braucht keine Aufrufstelle ein `if`.
 */
type WithImage = { imageKey?: string | null } | null;

/** Der eigene Bild-Key, falls es einen gibt. */
export const imageKeys = (doc: WithImage) =>
    doc?.imageKey ? [doc.imageKey] : [];

/**
 * Key, der vorher referenziert war und jetzt durch einen neuen ersetzt wurde.
 * Gleicher Key heisst „Bild behalten" — dann darf nichts geloescht werden.
 */
export const replacedImageKey = (before: WithImage, after: WithImage) =>
    before?.imageKey && before.imageKey !== after?.imageKey
        ? [before.imageKey]
        : [];
