import type { RequestHandler } from 'express';
import { unlink } from 'node:fs/promises';
import { answer, toHistory, HANDOFF, transcribeAudio } from '#services';
import { Conversation, type StoredTurn } from '#models';
import type { ChatBody } from '#schemas';

/** So viele Turns bleiben im Dokument stehen, ältere schneidet Mongo beim Push weg. */
const TURN_CAP = 20;

/**
 * Gespeicherter Turn → das, was der Client rendert. Bot-Turns bekommen den
 * konstanten `handoff` hier wieder angehängt (gespeichert wird er nicht) und
 * `urgent: null`: Notfallnummern gehören in den Moment, nicht ins Archiv.
 */
const toClientTurn = (t: StoredTurn) =>
    t.role === 'user'
        ? { role: 'user' as const, text: t.text }
        : {
              role: 'bot' as const,
              reply: {
                  text: t.text,
                  matches: (t.matches ?? []).map((m) => ({
                      ...m,
                      itemType: m.itemType ?? 'Beratung',
                  })),
                  handoff: HANDOFF,
                  disclaimer: t.disclaimer ?? null,
                  urgent: null,
              },
          };

export const postChat: RequestHandler<unknown, unknown, ChatBody> = async (
    req,
    res,
    next,
) => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.json({
                data: await answer(
                    req.body.message,
                    req.body.history,
                    undefined,
                    req.body.lang,
                ),
            });
            return;
        }

        const stored = await Conversation.findOne({ userId })
            .select('turns')
            .lean();
        const reply = await answer(
            req.body.message,
            toHistory(stored?.turns ?? []),
            userId,
            req.body.lang,
        );

        await Conversation.updateOne(
            { userId },
            {
                $push: {
                    turns: {
                        $each: [
                            { role: 'user', text: req.body.message },
                            {
                                role: 'bot',
                                text: reply.text,
                                matches: reply.matches,
                                disclaimer: reply.disclaimer,
                            },
                        ],
                        $slice: -TURN_CAP,
                    },
                },
            },
            { upsert: true },
        );

        res.json({ data: reply });
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Sprachaufnahme → Transkript. Die Datei wird **nicht** gespeichert: sie liegt
 * im formidable-Tempdir, geht einmal an das Modell und ist danach weg.
 *
 * Schlägt die Transkription fehl, ist das ein 503 und kein 500 — der Chat
 * selbst funktioniert weiter, nur getippt.
 */
export const postTranscribe: RequestHandler = async (req, res, next) => {
    const upload = req.uploadedAudio;
    try {
        if (!upload) {
            res.status(400).json({ error: 'Keine Aufnahme empfangen' });
            return;
        }

        const result = await transcribeAudio(upload.filepath, upload.mimeType);
        if (!result) {
            res.status(503).json({
                message: 'Spracheingabe gerade nicht verfügbar',
            });
            return;
        }

        res.json({ data: result });
    } catch (error: unknown) {
        next(error);
    } finally {
        // formidable raeumt sein Tempdir nie selbst auf — und hier liegt eine
        // Sprachaufnahme, die niemand aufbewahren soll.
        if (upload) await unlink(upload.filepath).catch(() => {});
    }
};

export const getChatHistory: RequestHandler = async (req, res, next) => {
    try {
        const stored = await Conversation.findOne({ userId: req.userId })
            .select('turns')
            .lean();
        res.json({ data: (stored?.turns ?? []).map(toClientTurn) });
    } catch (error: unknown) {
        next(error);
    }
};

/** Pflicht, nicht Komfort: die Chat-Einwilligung ist widerrufbar (Art. 17 DSGVO). */
export const deleteChatHistory: RequestHandler = async (req, res, next) => {
    try {
        await Conversation.deleteOne({ userId: req.userId });
        res.json({ message: 'Verlauf gelöscht' });
    } catch (error: unknown) {
        next(error);
    }
};
