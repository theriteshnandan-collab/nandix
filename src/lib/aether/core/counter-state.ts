/**
 * AETHER Sovereign State Engine
 * CounterState: A minimalist CRDT (LWW-Register) for P2P counter sync.
 */

export type CounterUpdate = {
    value: number;
    timestamp: number;
    origin: string;
};

export class CounterState {
    private value: number = 0;
    private lastUpdate: number = 0;
    private origin: string = "";

    constructor(initialValue = 0) {
        this.value = initialValue;
    }

    /**
     * Updates the local counter and returns the delta for broadcasting.
     */
    increment(originId: string): CounterUpdate {
        this.value += 1;
        this.lastUpdate = Date.now();
        this.origin = originId;

        return {
            value: this.value,
            timestamp: this.lastUpdate,
            origin: this.origin,
        };
    }

    /**
     * Merges a remote update into the local state using Last-Write-Wins (LWW) logic.
     * Returns true if the state changed.
     */
    merge(update: CounterUpdate): boolean {
        if (update.timestamp > this.lastUpdate) {
            this.value = update.value;
            this.lastUpdate = update.timestamp;
            this.origin = update.origin;
            return true;
        }
        // Tie-breaking with origin ID if timestamps are equal
        if (update.timestamp === this.lastUpdate && update.origin > this.origin) {
            this.value = update.value;
            this.origin = update.origin;
            return true;
        }
        return false;
    }

    get current(): number {
        return this.value;
    }
}
