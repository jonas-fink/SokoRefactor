import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/auth-context';
import type { Favorite, ItemType } from '../types';

const favKey = (itemType: ItemType, id: string) => `${itemType}:${id}`;

/**
 * Lädt die Favoriten des eingeloggten Nutzers einmal und hält sie als Set.
 * ponytail: ein Set im State, kein Store — pro Seite wird der Hook einmal
 * verwendet und das Ergebnis an die Karten durchgereicht.
 */
export function useFavorites() {
    const { user } = useAuth();
    const [keys, setKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) {
            setKeys(new Set());
            return;
        }
        api.get<Favorite[]>('/favorites')
            .then((favs) =>
                setKeys(
                    new Set(favs.map((f) => favKey(f.itemType, f.itemId._id))),
                ),
            )
            .catch(() => setKeys(new Set()));
    }, [user]);

    const isFavorite = useCallback(
        (itemType: ItemType, id: string) => keys.has(favKey(itemType, id)),
        [keys],
    );

    const toggle = useCallback(
        async (itemType: ItemType, id: string) => {
            const key = favKey(itemType, id);
            const wasSet = keys.has(key);

            setKeys((prev) => {
                const next = new Set(prev);
                if (wasSet) next.delete(key);
                else next.add(key);
                return next;
            });

            try {
                const path = `/favorites/${itemType}/${id}`;
                if (wasSet) await api.delete(path);
                else await api.post(path);
            } catch {
                setKeys((prev) => {
                    const next = new Set(prev);
                    if (wasSet) next.add(key);
                    else next.delete(key);
                    return next;
                });
            }
        },
        [keys],
    );

    return { isFavorite, toggle, enabled: Boolean(user) };
}
