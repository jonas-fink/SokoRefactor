import { createContext, useContext } from 'react';
import type { AuthUser, Preferences } from '../types';

interface LoginInput {
    email: string;
    password: string;
}

interface SignupInput {
    name?: string;
    email: string;
    password: string;
}

export interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (input: LoginInput) => Promise<void>;
    signup: (input: SignupInput) => Promise<void>;
    becomeCreator: () => Promise<void>;
    savePreferences: (preferences: Preferences) => Promise<void>;
    changeEmail: (email: string, currentPassword: string) => Promise<void>;
    changePassword: (
        currentPassword: string,
        newPassword: string,
    ) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// one predicate for "darf erstellen", admin zählt als creator.
export const canCreate = (user: AuthUser | null) =>
    user?.role === 'creator' || user?.role === 'admin';

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth has to be used within <AuthProvider>');
    return ctx;
}
