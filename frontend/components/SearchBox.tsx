'use client';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { Suggestion } from '../lib/types';
import { SuggestionsList } from './SuggestionsList';

export interface SearchBoxProps {
    placeholder?: string;
    trending?: boolean;
    onSearch?: (q: string) => void;
}

const DEBOUNCE_MS = 100;

export function SearchBox({
    placeholder = 'Search...',
    trending = false,
    onSearch,
}: SearchBoxProps) {
    const [q, setQ] = useState('');
    const [items, setItems] = useState<Suggestion[]>([]);
    const [source, setSource] = useState<'cache' | 'db' | null>(null);
    const [loading, setLoading] = useState(false);
    const [highlight, setHighlight] = useState(-1);
    const reqRef = useRef(0);

    useEffect(() => {
        const cur = ++reqRef.current;
        if (q.trim().length === 0) {
            setItems([]);
            setSource(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        const t = window.setTimeout(async () => {
            try {
                const r = await api.suggest(q, trending);
                if (cur !== reqRef.current) return;
                setItems(r.items);
                setSource(r.source);
                setLoading(false);
                setHighlight((h) => (h >= r.items.length ? -1 : h));
            } catch {
                if (cur !== reqRef.current) return;
                setItems([]);
                setLoading(false);
            }
        }, DEBOUNCE_MS);
        return () => window.clearTimeout(t);
    }, [q, trending]);

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(items.length - 1, h + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(-1, h - 1));
        } else if (e.key === 'Enter') {
            const target = highlight >= 0 ? items[highlight]?.q : q.trim();
            if (target) {
                e.preventDefault();
                commit(target);
            }
        } else if (e.key === 'Escape') {
            setQ('');
            setItems([]);
            setHighlight(-1);
        }
    }

    async function commit(value: string) {
        setQ(value);
        setHighlight(-1);
        onSearch?.(value);
        try {
            await api.search(value);
        } catch {}
    }

    return (
        <div className="relative w-full">
            <div className="flex w-full items-center border border-[var(--color-line-strong)] bg-[var(--color-surface)] transition-colors focus-within:border-[var(--color-fg)]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center text-[var(--color-muted)]">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <SearchIcon className="h-4 w-4" strokeWidth={1.5} />
                    )}
                </span>
                <input
                    type="text"
                    inputMode="search"
                    autoComplete="off"
                    spellCheck={false}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    className="h-12 flex-1 bg-transparent font-mono text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:outline-none"
                    aria-label="Search"
                    aria-autocomplete="list"
                    aria-expanded={items.length > 0}
                    aria-controls="suggestion-list"
                />
                {trending && (
                    <span className="flex h-12 shrink-0 items-center border-l border-[var(--color-line-strong)] px-4 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                        trending
                    </span>
                )}
                <span className="flex h-12 shrink-0 items-center border-l border-[var(--color-line-strong)] px-4 font-mono text-xs tabular-nums text-[var(--color-muted)]">
                    {loading ? '...' : `${items.length} results`}
                </span>
            </div>

            <SuggestionsList
                items={items}
                source={source}
                loading={loading && items.length === 0}
                highlight={highlight}
                query={q}
                onSelect={commit}
                onHover={setHighlight}
            />
        </div>
    );
}
