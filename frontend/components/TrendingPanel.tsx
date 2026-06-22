'use client';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { TrendingItem } from '../lib/types';

export interface TrendingPanelProps {
    refreshMs?: number;
    onPick?: (q: string) => void;
}

export function TrendingPanel({ refreshMs = 5000, onPick }: TrendingPanelProps) {
    const [items, setItems] = useState<TrendingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const tick = () => {
            api.trending()
                .then((d) => {
                    if (!cancelled) setItems(d.items);
                })
                .catch(() => {})
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        };
        tick();
        const id = setInterval(tick, refreshMs);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [refreshMs]);

    return (
        <div className="border border-[var(--color-line-strong)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-line-strong)] px-6 py-3">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg)]">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <h2>trending</h2>
                </div>
            </div>
            <div className="flex flex-col">
                {loading ? (
                    <div className="px-6 py-5 font-mono text-sm text-[var(--color-muted)]">
                        loading...
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-6 py-5 font-mono text-sm text-[var(--color-muted)]">
                        no trending data
                    </div>
                ) : (
                    <ol className="divide-y divide-[var(--color-line)]">
                        {items.map((it, i) => (
                            <li
                                key={it.q}
                                onClick={() => onPick?.(it.q)}
                                className="flex cursor-pointer items-center gap-4 px-6 py-3 font-mono text-sm transition-colors hover:bg-[var(--color-bg)]"
                            >
                                <span className="shrink-0 w-4 text-[var(--color-muted)]">
                                    {String(i + 1)}
                                </span>
                                <span className="flex-1 truncate font-medium text-[var(--color-fg)]">
                                    {it.q}
                                </span>
                                <span className="shrink-0 tabular-nums text-[var(--color-muted)]">
                                    {it.count.toLocaleString()}
                                </span>
                                <span className="shrink-0 font-mono text-[10px] uppercase text-[var(--color-muted)]">
                                    score: {it.score.toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </div>
    );
}
