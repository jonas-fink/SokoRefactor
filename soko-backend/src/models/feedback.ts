import { Schema, model, type Types } from 'mongoose';

/**
 * Rückmeldungen aus `/kontakt`. Bewusst schreibend-only: kein `DELETE`, kein
 * Admin-Endpoint, keine Statusverwaltung — gelesen wird in Metabase (Phase 22),
 * bis dahin per `mongosh`.
 *
 * `email` ist optional, weil anonymes Feedback möglich bleiben muss. `userId`
 * kommt ausschließlich aus `optionalAuth` (`req.userId`), nie aus dem Body —
 * alles andere hieße, dem Client seine eigene Identität zu glauben.
 */
export interface IFeedback {
    message: string;
    email?: string;
    /** Seite, von der abgeschickt wurde. Nur zum Einordnen. */
    path?: string;
    userId?: Types.ObjectId;
}

const feedbackSchema = new Schema<IFeedback>(
    {
        message: { type: String, required: true },
        email: { type: String },
        path: { type: String },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
);

export default model<IFeedback>('Feedback', feedbackSchema);
