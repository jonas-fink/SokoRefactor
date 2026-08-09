import { useEffect, useState } from 'react';

/** Verzoegert den Wert, damit nicht jeder Tastendruck eine Anfrage ausloest. */
export const useDebounced = <T>(value: T, delay = 300) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
};
