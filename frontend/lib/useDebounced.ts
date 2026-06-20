'use client';
import { useEffect, useRef, useState } from 'react';

export function useDebounced<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    const t = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (t.current) clearTimeout(t.current);
        t.current = setTimeout(() => setDebounced(value), delayMs);
        return () => {
            if (t.current) clearTimeout(t.current);
        };
    }, [value, delayMs]);
    return debounced;
}
