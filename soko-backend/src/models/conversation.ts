import { Schema, model, type Types } from 'mongoose';

/**
 * Der Chat-Verlauf eines eingeloggten Nutzers — **ein** Dokument pro User,
 * kein Threading. Gäste haben hier nichts stehen: ein anonymes Session-Cookie
 * würde Texte über Schulden, Sucht oder Flucht gegen eine pseudonyme ID legen,
 * also genau die Personenzuordnung, die der Chat vermeidet
 * (`ARCHITEKTUR.md` § 2.9).
 *
 * `handoff` und `urgent` werden nicht gespeichert: das eine ist eine Konstante,
 * das andere gehört in den Moment der Notlage und nicht in ein Archiv.
 */
export interface IConversation {
    userId: Types.ObjectId;
    turns: {
        role: 'user' | 'bot';
        text: string;
        /** Leer bei User-Turns. `itemType` erst ab Phase 16b gesetzt. */
        matches: {
            id: string;
            title: string;
            category: string;
            itemType?: string;
        }[];
        disclaimer: string | null;
        at: Date;
    }[];
}

export type StoredTurn = IConversation['turns'][number];

const conversationSchema = new Schema<IConversation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        turns: [
            {
                _id: false,
                role: { type: String, required: true, enum: ['user', 'bot'] },
                text: { type: String, required: true },
                matches: [
                    {
                        _id: false,
                        id: String,
                        title: String,
                        category: String,
                        itemType: String,
                    },
                ],
                disclaimer: { type: String, default: null },
                at: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true },
);

// Datenschutz, kein Aufräumen: nach 90 Tagen ohne neuen Beitrag ist der Verlauf
// weg, ohne dass jemand daran denken muss. Nicht wegoptimieren.
conversationSchema.index(
    { updatedAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export default model<IConversation>('Conversation', conversationSchema);
