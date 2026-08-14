/**
 * Impressum nach § 5 DDG.
 *
 * ACHTUNG, noch offen: saemtliche Angaben zum Anbieter sind Platzhalter und
 * stehen absichtlich sichtbar im Text. Erfundene Daten waeren schlimmer als ein
 * sichtbares Loch. Vor dem Live-Gang ausfuellen und juristisch pruefen lassen —
 * ein unvollstaendiges Impressum ist abmahnfaehig.
 */
const Impressum = () => (
    <div className="mx-auto flex w-full md:max-w-6xl flex-col gap-6 p-8">
        <h1 className="text-3xl sm:text-4xl">Impressum</h1>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Angaben gemäß § 5 DDG</h2>
            <p className="text-ink-soft">
                [Name des Anbieters bzw. der Gesellschaft]
                <br />
                [Straße und Hausnummer]
                <br />
                [PLZ und Ort]
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Vertreten durch</h2>
            <p className="text-ink-soft">
                [Vertretungsberechtigte Person — nur bei juristischen Personen,
                z. B. Geschäftsführung oder Vorstand]
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Kontakt</h2>
            <p className="text-ink-soft">
                E-Mail: [E-Mail-Adresse]
                <br />
                Telefon: [Telefonnummer — § 5 DDG verlangt neben der E-Mail
                einen zweiten Weg für schnelle Kontaktaufnahme]
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Register</h2>
            <p className="text-ink-soft">
                [Registergericht und Registernummer, falls vorhanden — sonst
                entfällt dieser Abschnitt]
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Umsatzsteuer</h2>
            <p className="text-ink-soft">
                [USt-IdNr. nach § 27 a UStG, falls vorhanden — sonst entfällt
                dieser Abschnitt]
            </p>
        </section>
    </div>
);

export default Impressum;
