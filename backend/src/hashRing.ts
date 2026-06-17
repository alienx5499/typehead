import crypto from 'node:crypto';

export interface VNode {
    hash: number;
    node: string;
}

export class HashRing {
    private vnodes: VNode[] = [];
    private readonly vnodeCount: number;

    constructor(nodes: string[] = [], vnodeCount = 100) {
        this.vnodeCount = vnodeCount;
        this.add(nodes);
    }

    add(nodes: string[]): void {
        for (const n of nodes) {
            for (let i = 0; i < this.vnodeCount; i++) {
                const h = this.md5(`${n}#${i}`);
                this.vnodes.push({ hash: h, node: n });
            }
        }
        this.vnodes.sort((a, b) => a.hash - b.hash);
    }

    remove(node: string): void {
        this.vnodes = this.vnodes.filter((v) => v.node !== node);
    }

    getNode(key: string): string {
        if (this.vnodes.length === 0) {
            throw new Error('HashRing: no nodes');
        }
        const h = this.md5(key);
        let lo = 0;
        let hi = this.vnodes.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (this.vnodes[mid].hash < h) lo = mid + 1;
            else hi = mid;
        }
        return this.vnodes[lo].node;
    }

    private md5(input: string): number {
        const d = crypto.createHash('md5').update(input).digest();
        return d.readUInt32BE(0);
    }
}
