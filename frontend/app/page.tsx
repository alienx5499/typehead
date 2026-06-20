'use client';
import { useState } from 'react';
import { SearchBox } from '../components/SearchBox';
import { TrendingPanel } from '../components/TrendingPanel';
import { MetricsPanel } from '../components/MetricsPanel';
import { Switch } from '../components/ui/switch';

export default function HomePage() {
    const [trending, setTrending] = useState(false);
    const [picked, setPicked] = useState('');

    return (
        <main className="min-h-screen w-full bg-[var(--color-bg)] text-[var(--color-fg)]">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-20 sm:px-8">
                <header className="flex flex-col gap-6 border-b border-[var(--color-line-strong)] pb-10">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                        <span>Typeahead</span>
                        <span>v1.0.0</span>
                    </div>
                    <h1 className="font-display text-5xl font-medium tracking-tight text-[var(--color-fg)] sm:text-6xl">
                        Search.
                    </h1>
                    <p className="max-w-xl font-sans text-sm leading-relaxed text-[var(--color-muted)]">
                        Consistent hash ring, distributed LRU cache, time-blended trending, and
                        batched writes. Backend serves 100k queries via consistent hashing, trending
                        recomputes per request with exponential decay, writes are batched and
                        persisted via a write-ahead log.
                    </p>
                </header>

                <section className="flex flex-col gap-4">
                    <SearchBox
                        trending={trending}
                        onSearch={(q) => setPicked(q)}
                        placeholder="Search 100,000 queries..."
                    />
                    <div className="flex items-center justify-between font-mono text-xs text-[var(--color-muted)]">
                        <label className="flex cursor-pointer items-center gap-3">
                            <Switch checked={trending} onCheckedChange={setTrending} />
                            <span className="uppercase tracking-wider">
                                {trending ? 'trending sort on' : 'default sort'}
                            </span>
                        </label>
                        {picked && (
                            <span>
                                last: <span className="text-[var(--color-fg)]">{picked}</span>
                            </span>
                        )}
                    </div>
                </section>

                <section className="grid gap-12 sm:grid-cols-1">
                    <TrendingPanel onPick={(q) => setPicked(q)} />
                    <MetricsPanel />
                </section>

                <footer className="border-t border-[var(--color-line)] pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                    <div className="flex items-center justify-between">
                        <span>node-1 / port 4002</span>
                        <span>port 4001 / next.js 14</span>
                    </div>
                </footer>
            </div>
        </main>
    );
}
