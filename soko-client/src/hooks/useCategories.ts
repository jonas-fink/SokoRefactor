import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { Category } from '../types';

/** `GET /categories` — gespeichert wird der Key, angezeigt das Label.
 *  Ohne `appliesTo` kommt die ganze Taxonomie (Praeferenzen gelten fuer beides). */
export const useCategories = (appliesTo?: 'activity' | 'beratung') => {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        api.get<Category[]>(
            appliesTo ? `/categories?appliesTo=${appliesTo}` : '/categories',
        )
            .then(setCategories)
            .catch(() => setCategories([]));
    }, [appliesTo]);

    const labelOf = (key?: string) =>
        categories.find((c) => c.key === key)?.label ?? key;

    return { categories, labelOf };
};
