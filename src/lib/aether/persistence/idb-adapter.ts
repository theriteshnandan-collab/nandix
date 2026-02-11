/**
 * AETHER Sovereign Persistence Layer
 * IDBAdapter: A lightweight wrapper around IndexedDB for Local-First state.
 */

export class IDBAdapter {
    private dbName: string;
    private storeName: string;
    private version: number;
    private db: IDBDatabase | null = null;

    constructor(dbName = "AETHER_MESH_MEMORY", storeName = "protocol_cache", version = 1) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.version = version;
    }

    /**
     * Initializes the database connection.
     */
    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject("Failed to open AETHER Mesh Memory");
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    /**
     * Sets a value in the store.
     */
    async set(key: string, value: any): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);

            request.onerror = () => reject(`Failed to save key: ${key}`);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Gets a value from the store.
     */
    async get<T>(key: string): Promise<T | null> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onerror = () => reject(`Failed to retrieve key: ${key}`);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    /**
     * Retrieves all values in the store.
     */
    async getAll<T>(): Promise<T[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => reject("Failed to retrieve all keys");
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    /**
     * Scans for keys matching a prefix.
     */
    async scan<T>(prefix: string): Promise<T[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const range = IDBKeyRange.bound(prefix, prefix + "\uffff");
            const request = store.getAll(range);

            request.onerror = () => reject(`Failed to scan keys with prefix: ${prefix}`);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    /**
     * Deletes a value from the store.
     */
    async delete(key: string): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onerror = () => reject(`Failed to delete key: ${key}`);
            request.onsuccess = () => resolve();
        });
    }
}

// Singleton instance for the protocol
export const aetherStorage = new IDBAdapter();
