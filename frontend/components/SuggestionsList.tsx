'use client';
import type { Suggestion } from '../lib/types';

export interface SuggestionsListProps {
    items: Suggestion[];
    source: 'cache' | 'db' | null;
    loading: boolean;
    highlight: number;
    query: string;
    onSelect: (q: string) => void;
    onHover: (i: number) => void;
}

function renderMatch(text: string, q: string) {
    if (!q) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return (
        <>
            <span className="text-[var(--color-fg)]">{text.slice(0, idx)}</span>
            <span className="font-medium text-[var(--color-fg)] underline decoration-[var(--color-fg)] decoration-1 underline-offset-2">
                {text.slice(idx, idx + q.length)}
            </span>
            <span className="text-[var(--color-fg)]">{text.slice(idx + q.length)}</span>
        </>
    );
}

export function SuggestionsList({
    items,
    source,
    loading,
    highlight,
    query,
    onSelect,
    onHover,
}: SuggestionsListProps) {
    if (loading) {
        return (
            <div className="mt-2 border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-5 font-mono text-sm text-[var(--color-muted)]">
                loading...
            </div>
        );
    }
    if (items.length === 0 && query.trim()) {
        return (
            <div className="mt-2 border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-5 font-mono text-sm text-[var(--color-muted)]">
                no matches
            </div>
        );
    }
    if (items.length === 0) return null;

    return (
        <div className="mt-2 border border-[var(--color-line-strong)] bg-[var(--color-surface)]">
            <ol id="suggestion-list" role="listbox" className="divide-y divide-[var(--color-line)]">
                {items.map((it, i) => (
                    <li
                        key={it.q}
                        role="option"
                        aria-selected={i === highlight}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onSelect(it.q);
                        }}
                        onMouseEnter={() => onHover(i)}
                        className={
                            'flex cursor-pointer items-center gap-4 px-6 py-3 font-mono text-sm transition-colors ' +
                            (i === highlight ? 'bg-[var(--color-bg)]' : '')
                        }
                    >
                        <span className="flex-1 truncate font-normal">
                            {renderMatch(it.q, query)}
                        </span>
                        <span className="shrink-0 tabular-nums text-[var(--color-muted)]">
                            {it.count.toLocaleString()}
                        </span>
                    </li>
                ))}
            </ol>
            {source && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] px-6 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    <span>source: {source}</span>
                    <span>top {items.length}</span>
                </div>
            )}
        </div>
    );
}
