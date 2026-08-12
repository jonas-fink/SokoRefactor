import { GoogleGenAI } from '@google/genai';
import type { ChatTurn } from '#schemas';

/**
 * Dünner Wrapper um die Gemini-API. Zwei Regeln, die hier nicht verhandelbar sind:
 *
 * 1. **Wirft nie.** Kein Key, Quota erschöpft, Timeout, kaputtes JSON → `null`,
 *    und der Chat fällt auf die Keyword-Tabelle zurück. Ein Ausfall bei Google
 *    darf kein Ausfall der Beratungssuche sein.
 * 2. **Erfindet keine Beratungsstellen.** Das Modell darf nur aus den
 *    übergebenen Kandidaten auswählen; der Aufrufer prüft die IDs gegen die
 *    eigene Liste.
 */

export type Candidate = {
    id: string;
    /** Zwei Pools in einem Call — die ID allein ist nicht eindeutig. */
    itemType: 'Beratung' | 'ScrapedEvent';
    title: string;
    tags: string[];
    description: string;
    /** Nur Veranstaltungen: Datum als Klartext. */
    when?: string;
};

export type GeminiAnswer = {
    ids: { id: string; type: string }[];
    keys: string[];
    text: string;
};

// Free-Tier-tauglich und schnell. Modell-IDs wandern — deshalb überschreibbar,
// ohne dass jemand Code anfassen muss.
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

const SYSTEM = `Du hilfst Menschen in Kassel, passende Beratungsstellen und Veranstaltungen zu finden.
Du bist KEINE Beratung: du gibst keine rechtliche, medizinische oder finanzielle Auskunft,
stellst keine Diagnose und triffst keine Entscheidung für die Person.

Regeln:
- Antworte auf Deutsch, in einfacher Sprache, maximal drei Sätze, ohne Aufzählung.
- Sprich die Person mit "du" an, ruhig und ohne Bewertung ihrer Lage.
- Nenne im Text KEINE Telefonnummern, Adressen oder Öffnungszeiten — die stehen daneben.
- Geht es um eine Belastung (Schulden, Sucht, Gewalt, Behörden, Aufenthalt, Krise),
  nenne zuerst Beratungsstellen. Veranstaltungen nur, wenn jemand Freizeit,
  Treffpunkte oder Angebote zum Mitmachen sucht.
- Wähle ausschließlich Einträge aus der übergebenen Liste aus, höchstens drei, jeweils
  mit id UND type. Passt nichts, gib eine leere Liste zurück und sag das ehrlich.
- Erfinde nichts: keine Stellen, keine Veranstaltungen, keine Zuständigkeiten, keine Fristen.
- Steht ein Gespräch davor, ist die neue Nachricht eine Rückfrage dazu: grenze
  die vorherige Auswahl weiter ein, statt von vorn anzufangen. Frag nach, wenn
  eine Angabe fehlt, die die Auswahl schärfen würde.`;

const SCHEMA = {
    type: 'object',
    properties: {
        ids: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    type: {
                        type: 'string',
                        enum: ['Beratung', 'ScrapedEvent'],
                    },
                },
                required: ['id', 'type'],
            },
            description:
                'Passende Einträge aus der Liste, höchstens drei, je mit id und type',
        },
        keys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Passende Themen-Keys aus der übergebenen Liste',
        },
        text: {
            type: 'string',
            description: 'Antworttext, maximal drei Sätze',
        },
    },
    required: ['ids', 'keys', 'text'],
};

let client: GoogleGenAI | null = null;

/** Check GenAI true connection */
export const geminiEnabled = () => Boolean(process.env.GEMINI_API_KEY);

/**
 * `context` ist die Präferenzzeile des Nutzers („sucht Angebote auf Arabisch,
 * für Familien")
 */
export const askGemini = async (
    message: string,
    candidates: Candidate[],
    categories: { key: string; label: string; appliesTo?: string[] }[],
    history: ChatTurn[] = [],
    context?: string,
): Promise<GeminiAnswer | null> => {
    if (!geminiEnabled()) return null;

    try {
        // Der Key kommt aus `GEMINI_API_KEY` — die Konstruktion erst hier, damit
        // ein fehlender Key den Serverstart nicht beeinflusst.
        client ??= new GoogleGenAI({});

        const interaction = await client.interactions.create({
            model: MODEL,
            system_instruction: SYSTEM,
            input: [
                // Verlauf zuerst, damit `Anliegen` als die aktuelle Nachricht
                // stehen bleibt und nicht im Transkript untergeht.
                ...(history.length
                    ? [
                          'Bisheriges Gespräch:',
                          ...history.map(
                              (h) =>
                                  `${h.role === 'user' ? 'Du' : 'Assistent'}: ${h.text}`,
                          ),
                          '',
                      ]
                    : []),
                `Anliegen: ${message}`,
                ...(context ? ['', context] : []),
                '',
                `Themen: ${categories
                    .map(
                        (c) =>
                            `${c.key} (${c.label}${c.appliesTo?.length ? `, ${c.appliesTo.join('/')}` : ''})`,
                    )
                    .join(', ')}`,
                '',
                'Verfügbare Einträge:',
                ...candidates.map(
                    (c) =>
                        `- id=${c.id} type=${c.itemType} | ${c.title}${c.when ? ` | ${c.when}` : ''} | Themen: ${c.tags.join(', ')} | ${c.description.slice(0, 200)}`,
                ),
            ].join('\n'),
            // Klassifizieren und formulieren braucht kein langes Nachdenken —
            // --> low thinking_level
            generation_config: { thinking_level: 'low' },
            response_format: {
                type: 'text',
                mime_type: 'application/json',
                schema: SCHEMA,
            },
        });

        const parsed = JSON.parse(interaction.output_text ?? '');
        if (typeof parsed?.text !== 'string' || !parsed.text.trim())
            return null;

        return {
            ids: Array.isArray(parsed.ids)
                ? parsed.ids
                      .filter((i: unknown) => i && typeof i === 'object')
                      .map((i: { id?: unknown; type?: unknown }) => ({
                          id: String(i.id ?? ''),
                          type: String(i.type ?? ''),
                      }))
                : [],
            keys: Array.isArray(parsed.keys) ? parsed.keys.map(String) : [],
            text: parsed.text.trim(),
        };
    } catch (err) {
        console.warn(
            'Gemini nicht verfügbar, nutze Keyword-Fallback:',
            err instanceof Error ? err.message : err,
        );
        return null;
    }
};
