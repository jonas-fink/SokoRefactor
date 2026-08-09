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
    title: string;
    tags: string[];
    description: string;
};

export type GeminiAnswer = { ids: string[]; keys: string[]; text: string };

// Free-Tier-tauglich und schnell. Modell-IDs wandern — deshalb überschreibbar,
// ohne dass jemand Code anfassen muss.
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

const SYSTEM = `Du hilfst Menschen in Kassel, die passende Beratungsstelle zu finden.
Du bist KEINE Beratung: du gibst keine rechtliche, medizinische oder finanzielle Auskunft,
stellst keine Diagnose und triffst keine Entscheidung für die Person.

Regeln:
- Antworte auf Deutsch, in einfacher Sprache, maximal drei Sätze, ohne Aufzählung.
- Sprich die Person mit "du" an, ruhig und ohne Bewertung ihrer Lage.
- Nenne im Text KEINE Telefonnummern, Adressen oder Öffnungszeiten — die stehen daneben.
- Wähle ausschließlich Stellen aus der übergebenen Liste aus, höchstens drei.
  Passt nichts, gib eine leere Liste zurück und sag das ehrlich.
- Erfinde nichts: keine Stellen, keine Zuständigkeiten, keine Fristen.
- Steht ein Gespräch davor, ist die neue Nachricht eine Rückfrage dazu: grenze
  die vorherige Auswahl weiter ein, statt von vorn anzufangen. Frag nach, wenn
  eine Angabe fehlt, die die Auswahl schärfen würde.`;

const SCHEMA = {
    type: 'object',
    properties: {
        ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs der passenden Stellen aus der Liste, höchstens drei',
        },
        keys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Passende Themen-Keys aus der übergebenen Liste',
        },
        text: { type: 'string', description: 'Antworttext, maximal drei Sätze' },
    },
    required: ['ids', 'keys', 'text'],
};

let client: GoogleGenAI | null = null;

/** Ob eine echte GenAI-Anbindung konfiguriert ist. */
export const geminiEnabled = () => Boolean(process.env.GEMINI_API_KEY);

export const askGemini = async (
    message: string,
    candidates: Candidate[],
    categories: { key: string; label: string }[],
    history: ChatTurn[] = [],
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
                '',
                `Themen: ${categories.map((c) => `${c.key} (${c.label})`).join(', ')}`,
                '',
                'Verfügbare Stellen:',
                ...candidates.map(
                    (c) =>
                        `- id=${c.id} | ${c.title} | Themen: ${c.tags.join(', ')} | ${c.description.slice(0, 200)}`,
                ),
            ].join('\n'),
            // Klassifizieren und formulieren braucht kein langes Nachdenken —
            // niedrige Latenz ist hier mehr wert.
            generation_config: { thinking_level: 'low' },
            response_format: {
                type: 'text',
                mime_type: 'application/json',
                schema: SCHEMA,
            },
        });

        const parsed = JSON.parse(interaction.output_text ?? '');
        if (typeof parsed?.text !== 'string' || !parsed.text.trim()) return null;

        return {
            ids: Array.isArray(parsed.ids) ? parsed.ids.map(String) : [],
            keys: Array.isArray(parsed.keys) ? parsed.keys.map(String) : [],
            text: parsed.text.trim(),
        };
    } catch (err) {
        // Laut genug fürs Log, still genug für den Nutzer: der Fallback greift.
        console.warn(
            'Gemini nicht verfügbar, nutze Keyword-Fallback:',
            err instanceof Error ? err.message : err,
        );
        return null;
    }
};
