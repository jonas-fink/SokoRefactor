import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { Category } from '../types';

/** `GET /categories` — gespeichert wird der Key, angezeigt das Label. */
export const useCategories = (appliesTo: 'activity' | 'beratung') => {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        api.get<Category[]>(`/categories?appliesTo=${appliesTo}`)
            .then(setCategories)
            .catch(() => setCategories([]));
    }, [appliesTo]);

    const labelOf = (key?: string) =>
        categories.find((c) => c.key === key)?.label ?? key;

    return { categories, labelOf };
};
