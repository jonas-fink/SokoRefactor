import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin' | 'creator';

/** Spiegelt exakt das Query-Vokabular aus `utils/filterVocabulary.ts` und die
 *  `Category.key`s — aendert sich eins, aendert sich beides. */
export interface UserPreferences {
    languages: string[];
    audiences: string[];
    categories: string[];
    freeOnly: boolean;
}

export interface IUser extends Document {
    name?: string;
    email: string;
    password: string;
    role: UserRole;
    preferences: UserPreferences;
    /** Gesetzt = Onboarding erledigt, auch bei „Überspringen". */
    preferencesSetAt?: Date;
    comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ['user', 'admin', 'creator'],
            default: 'user',
            index: true,
        },
        // Eingebettet, kein eigenes Modell: Praeferenzen haben ohne ihren User
        // keine Bedeutung und werden nie ohne ihn geladen.
        preferences: {
            languages: { type: [String], default: [] },
            audiences: { type: [String], default: [] },
            categories: { type: [String], default: [] },
            freeOnly: { type: Boolean, default: false },
        },
        preferencesSetAt: Date,
    },
    { timestamps: true },
);

UserSchema.pre<IUser>('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function (candidate: string) {
    return bcrypt.compare(candidate, this.password);
};

UserSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        const { password, ...rest } = ret as IUser & { password?: string };
        return rest;
    },
});

UserSchema.set('toObject', { virtuals: true });

export default mongoose.model<IUser>('User', UserSchema);
