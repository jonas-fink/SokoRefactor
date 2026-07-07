import { createContext, useContext } from 'react';
import type { AuthUser } from '../types';

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
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth has to be used within <AuthProvider>');
    return ctx;
}
