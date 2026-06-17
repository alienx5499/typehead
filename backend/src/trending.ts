export function trendingScore(count: number, lastSeen: number): number {
    const now = Date.now();
    return Math.log10(count + 1) + (now - lastSeen) / 1000 / 45000;
}

export function normalizeQuery(q: string): string {
    return q.trim().toLowerCase();
}
