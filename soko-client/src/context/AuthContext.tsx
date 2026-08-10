import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { api, setAccessToken, tryRefresh } from '../utils/api';
import type { AuthUser, Preferences } from '../types';
import { AuthContext } from './auth-context';

interface LoginInput {
    email: string;
    password: string;
}

interface SignupInput {
    name?: string;
    email: string;
    password: string;
}

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const logoutRef = useRef<() => Promise<void> | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        async function init() {
            try {
                const ok = await tryRefresh();
                if (!ok) throw new Error('Ungültige Session');
                const me = await api.get<AuthUser>('/auth/me');
                if (!cancelled) setUser(me);
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        init();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async ({ email, password }: LoginInput) => {
        const data = await api.post<{
            accessToken: string;
            user: AuthUser;
        }>('/auth/login', { email, password });
        setAccessToken(data.accessToken);
        setUser(data.user);
        // Wohin es danach geht, entscheidet die Seite: Login nach `/`,
        // Signup nach `/willkommen`. Zwei Navigationen auf denselben
        // Vorgang kollidieren sonst mit dem Onboarding.
    }, []);

    const signup = useCallback(
        async ({ name, email, password }: SignupInput) => {
            const data = await api.post<{
                accessToken: string;
                user: AuthUser;
            }>('/auth/register', { name, email, password });
            setAccessToken(data.accessToken);
            setUser(data.user);
        },
        [],
    );

    const becomeCreator = useCallback(async () => {
        const user = await api.patch<AuthUser>('/auth/become-creator');
        setUser(user);
    }, []);

    const changeEmail = useCallback(
        async (email: string, currentPassword: string) => {
            setUser(
                await api.patch<AuthUser>('/auth/email', {
                    email,
                    currentPassword,
                }),
            );
        },
        [],
    );

    const changePassword = useCallback(
        async (currentPassword: string, newPassword: string) => {
            // Der Server verwirft **alle** Refresh-Tokens und gibt neue aus.
            // Ohne das neue Access-Token hier fliegt der Nutzer beim naechsten
            // Request raus — direkt nachdem er sein Passwort geaendert hat.
            const data = await api.patch<{
                accessToken: string;
                user: AuthUser;
            }>('/auth/password', { currentPassword, newPassword });
            setAccessToken(data.accessToken);
            setUser(data.user);
        },
        [],
    );

    const savePreferences = useCallback(async (preferences: Preferences) => {
        const user = await api.patch<AuthUser>(
            '/auth/preferences',
            preferences,
        );
        setUser(user);
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setAccessToken(null);
            setUser(null);
            navigate('/login');
        }
    }, [navigate]);

    logoutRef.current = logout;

    useEffect(() => {
        const handler = () => logoutRef.current?.();
        window.addEventListener('auth:logout', handler);
        return () => window.removeEventListener('auth:logout', handler);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                signup,
                becomeCreator,
                savePreferences,
                changeEmail,
                changePassword,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
