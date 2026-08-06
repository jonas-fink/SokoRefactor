// Der Bucket kennt keine Referenzen: wer ein Dokument aus dem Subdokument
// entfernt, muss die Datei mitloeschen, sonst bleibt sie fuer immer liegen.
// Ein Fehler in die andere Richtung ist teurer — dann loeschen wir einen Antrag,
// auf den die Beratung noch zeigt. Deshalb hier ein Test daneben.
type WithServices = { services?: { documents?: { s3Key: string }[] }[] } | null;

export const s3Keys = (beratung: WithServices) =>
    beratung?.services?.flatMap(
        (s) => s.documents?.map((d) => d.s3Key) ?? [],
    ) ?? [];

/** Keys, die vorher referenziert waren und danach nicht mehr. */
export const orphanedKeys = (before: WithServices, after: WithServices) => {
    const kept = new Set(s3Keys(after));
    return s3Keys(before).filter((key) => !kept.has(key));
};
