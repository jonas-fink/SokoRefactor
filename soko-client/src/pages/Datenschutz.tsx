/**
 * Datenschutzhinweise, Schwerpunkt Chat-Assistent.
 *
 * ACHTUNG, zwei Dinge sind noch offen und stehen absichtlich sichtbar im Text:
 * 1. Die Angaben zum Verantwortlichen sind Platzhalter.
 * 2. Der Abschnitt „Kostenloses Kontingent" gilt nur, solange der
 *    Gemini-API-Key ohne Abrechnung läuft. Mit aktivierter Abrechnung nutzt
 *    Google die Inhalte nicht mehr zur Produktverbesserung — dann muss dieser
 *    Abschnitt ersetzt werden.
 * Vor dem Live-Gang gehört der Text durch eine juristische Prüfung.
 */
const Datenschutz = () => (
    <div className="mx-auto flex w-full md:max-w-6xl flex-col gap-6 p-8">
        <h1 className="text-3xl sm:text-4xl">Datenschutz</h1>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Verantwortlich</h2>
            <p className="text-ink-soft">
                [Name des Betreibers], [Anschrift], [E-Mail-Adresse]. Bei Fragen
                zum Datenschutz oder zu deinen Rechten erreichst du uns unter
                dieser Adresse.
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Der Chat-Assistent</h2>
            <p className="text-ink-soft">
                Wenn du den Chat nutzt, schickt deine App den Text, den du
                eingibst, an unseren Server. Von dort geht er zusammen mit einer
                Liste unserer Beratungsangebote an{' '}
                <strong>Google Gemini</strong>, damit daraus ein Vorschlag
                entsteht, welche Stelle zu deinem Anliegen passt. Die Antwort
                bekommst du zurück — bei uns wird deine Nachricht{' '}
                <strong>nicht gespeichert</strong>. Du brauchst dafür kein
                Konto.
            </p>
            <p className="text-ink-soft">
                Statt zu tippen kannst du deine Nachricht auch{' '}
                <strong>sprechen</strong>. Die Aufnahme geht dann an unseren
                Server und von dort an Google Gemini, das daraus Text macht —
                wortgetreu und in der Sprache, die du sprichst. Die Audiodatei
                wird bei uns <strong>nicht gespeichert</strong>: sie liegt nur
                für die Dauer der Umwandlung auf dem Server und wird danach
                sofort gelöscht. Den erkannten Text siehst du im Eingabefeld und
                kannst ihn korrigieren, bevor du ihn abschickst.
            </p>
            <p className="text-ink-soft">
                Deine IP-Adresse verarbeiten wir kurzzeitig, um die Zahl der
                Anfragen pro Person zu begrenzen (Schutz vor Missbrauch). Dieser
                Zähler liegt nur im Arbeitsspeicher und ist nach 15 Minuten weg.
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Was das für sensible Themen bedeutet</h2>
            <p className="text-ink-soft">
                Google verarbeitet die Inhalte auch außerhalb der EU, unter
                anderem in den USA. Wir nutzen die Gemini-Schnittstelle derzeit
                im <strong>kostenlosen Kontingent</strong>. Dabei darf Google
                die gesendeten Inhalte zur Verbesserung eigener Produkte
                verwenden, und Mitarbeitende von Google können Inhalte einsehen.
            </p>
            <p className="text-ink-soft">
                Deshalb ganz deutlich:{' '}
                <strong>
                    schreib in den Chat keine Namen, Adressen, Geburtsdaten,
                    Aktenzeichen oder Angaben zu Gesundheit, Herkunft oder
                    Finanzen, die dich identifizierbar machen.
                </strong>{' '}
                Beschreib dein Anliegen allgemein — für einen passenden
                Vorschlag reicht „Ich habe Mietschulden" völlig aus.
            </p>
            <p className="text-ink-soft">
                Du kannst alle Beratungsangebote auch{' '}
                <strong>ohne den Chat</strong> finden: über die Themenübersicht
                unter „Beratung &amp; Hilfe". Dabei verlässt keine Angabe von
                dir unseren Server.
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Rechtsgrundlage und Widerruf</h2>
            <p className="text-ink-soft">
                Die Übermittlung an Google erfolgt auf Grundlage deiner
                Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du vor der ersten
                Chat-Nachricht bestätigst. Du kannst sie jederzeit widerrufen,
                indem du den Chat nicht weiter nutzt — auf die Rechtmäßigkeit
                der bis dahin erfolgten Verarbeitung hat das keinen Einfluss.
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Übrige Funktionen</h2>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-ink-soft">
                <li>
                    <strong>Konto:</strong> Name, E-Mail-Adresse und ein
                    verschlüsseltes Passwort, um dich anzumelden und deine
                    Sammlung zu speichern. Nur nötig, wenn du dir etwas merken
                    willst.
                </li>
                <li>
                    <strong>Sammlung:</strong> welche Angebote du dir gemerkt
                    hast — sichtbar nur für dich.
                </li>
                <li>
                    <strong>Karte:</strong> Kartenausschnitte und die Suche nach
                    Adressen laufen über OpenStreetMap; dabei wird deine
                    IP-Adresse an deren Server übertragen.
                </li>
                <li>
                    <strong>Bilder und Dokumente</strong> liegen bei Cloudinary
                    bzw. Amazon S3. Anträge und Merkblätter rufst du über einen
                    zeitlich begrenzten Link ab.
                </li>
                <li>
                    <strong>Besucherzahlen:</strong> wir zählen mit Umami, wie
                    oft welche Seite aufgerufen wird — auf unserem eigenen
                    Server, <strong>ohne Cookies</strong>, ohne dass etwas auf
                    deinem Gerät gespeichert wird und ohne dass deine IP-Adresse
                    gespeichert wird (sie wird nur kurz zu einer Prüfsumme
                    verrechnet). Deshalb fragen wir dich auch nicht um
                    Erlaubnis: es gibt nichts zu erlauben. Die Zahlen sagen uns,
                    welche Seite gefunden wird, nicht wer sie aufruft.
                </li>
                <li>
                    <strong>Nutzung des Chats:</strong> wir zählen pro Tag, wie
                    oft der Chat geantwortet hat und wie oft nichts Passendes im
                    Bestand stand — nur ein Datum, ein Stichwort und eine Zahl.
                    <strong>
                        {' '}
                        Kein Text deiner Nachricht, keine Konto-Angabe, keine
                        IP-Adresse.
                    </strong>{' '}
                    Wir wollen damit wissen, welche Angebote in Kassel fehlen.
                </li>
            </ul>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Welche Daten wir speichern</h2>
            {/* Aus den Modellen hergeleitet, nicht geraten. Aendert sich ein
                Modell oder ein TTL-Index, aendert sich diese Tabelle mit. */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-md text-left text-ink-soft">
                    <thead>
                        <tr className="border-b border-line">
                            <th className="py-2 pr-4 font-medium">Was</th>
                            <th className="py-2 font-medium">Wie lange</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-line">
                            <td className="py-2 pr-4">
                                Konto: Name, E-Mail, Passwort-Hash
                            </td>
                            <td className="py-2">bis du es löschst</td>
                        </tr>
                        <tr className="border-b border-line">
                            <td className="py-2 pr-4">
                                Präferenzen: Sprachen, Zielgruppen, Themen
                            </td>
                            <td className="py-2">bis du sie löschst</td>
                        </tr>
                        <tr className="border-b border-line">
                            <td className="py-2 pr-4">Gemerkte Angebote</td>
                            <td className="py-2">bis du sie löschst</td>
                        </tr>
                        <tr className="border-b border-line">
                            <td className="py-2 pr-4">
                                Chat-Verlauf — nur wenn du eingeloggt bist
                            </td>
                            <td className="py-2">
                                90 Tage ab dem letzten Beitrag, danach
                                automatisch weg
                            </td>
                        </tr>
                        <tr className="border-b border-line">
                            <td className="py-2 pr-4">
                                Anmelde-Tokens — nur als Prüfsumme, nie im
                                Klartext
                            </td>
                            <td className="py-2">
                                7 Tage, danach automatisch weg
                            </td>
                        </tr>
                        <tr className="border-b border-line">
                            <td className="py-2 pr-4">
                                Rückmeldungen über „Kontakt“: dein Text, die
                                Seite, von der du geschrieben hast, und deine
                                E-Mail — die nur, wenn du sie freiwillig angibst
                            </td>
                            <td className="py-2">
                                bis das Anliegen erledigt ist
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 pr-4">
                                Kennzahlen: Datum, Stichwort, Anzahl — nicht dir
                                zuzuordnen
                            </td>
                            <td className="py-2">unbefristet</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="text-ink-soft">
                Nicht gespeichert werden: Chats ohne Konto, die Notfallnummern
                aus einem Verlauf, dein Passwort im Klartext und der
                Anmelde-Token im Klartext.
            </p>
        </section>

        <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Deine Rechte</h2>
            <p className="text-ink-soft">
                Du hast das Recht auf Auskunft, Berichtigung, Löschung,
                Einschränkung der Verarbeitung, Datenübertragbarkeit und
                Widerspruch sowie das Recht, dich bei einer Aufsichtsbehörde zu
                beschweren. Für Hessen ist das der Hessische Beauftragte für
                Datenschutz und Informationsfreiheit.
            </p>
        </section>
    </div>
);

export default Datenschutz;
