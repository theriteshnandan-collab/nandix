import { mesh, MeshController } from "./mesh-controller";
import { SovereignCrypto } from "@/lib/aether/security/sovereign-crypto";

export interface FileShard {
    index: number;
    cipher: ArrayBuffer;
    iv: Uint8Array;
}

export interface FileManifest {
    id: string; // File hash or random ID
    name: string;
    type: string;
    size: number;
    shardCount: number;
    encryptionKey?: string; // Base64 exported key
}

export class ShardingManager {
    private mesh: MeshController = mesh;
    private SHARD_SIZE = 256 * 1024; // 256KB

    /**
     * Shreds a file into encrypted shards.
     */
    async shred(file: File): Promise<{ manifest: FileManifest; shards: FileShard[] }> {
        const key = await SovereignCrypto.generateKey();
        const buffer = await file.arrayBuffer();
        const shardCount = Math.ceil(buffer.byteLength / this.SHARD_SIZE);
        const shards: FileShard[] = [];
        const fileId = Math.random().toString(36).substring(7).toUpperCase();

        for (let i = 0; i < shardCount; i++) {
            const start = i * this.SHARD_SIZE;
            const end = Math.min(start + this.SHARD_SIZE, buffer.byteLength);
            const chunk = buffer.slice(start, end);
            const { cipher, iv } = await SovereignCrypto.encryptBuffer(chunk, key);

            shards.push({
                index: i,
                cipher,
                iv: new Uint8Array(iv)
            });
        }

        const manifest: FileManifest = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            shardCount,
            encryptionKey: await SovereignCrypto.exportKey(key)
        };

        return { manifest, shards };
    }

    /**
     * Reassembles a file from shards.
     */
    async assemble(manifest: FileManifest, shards: Map<number, FileShard>): Promise<Blob> {
        if (!manifest.encryptionKey) throw new Error("Manifest is missing encryption key");

        const key = await SovereignCrypto.importKey(manifest.encryptionKey);
        const decryptedChunks: ArrayBuffer[] = new Array(manifest.shardCount);

        for (let i = 0; i < manifest.shardCount; i++) {
            const shard = shards.get(i);
            if (!shard) throw new Error(`Missing shard ${i} for file ${manifest.id}`);

            // Resurrect binary from serializable transport array if necessary
            const cipher = shard.cipher instanceof ArrayBuffer ? shard.cipher : new Uint8Array(shard.cipher as any).buffer;
            const iv = shard.iv instanceof Uint8Array ? shard.iv : new Uint8Array(shard.iv as any);

            decryptedChunks[i] = await SovereignCrypto.decryptBuffer(cipher, key, iv);
        }

        return new Blob(decryptedChunks, { type: manifest.type });
    }

    /**
     * Broadcasts shards to the mesh (Scattering).
     */
    async scatter(manifest: FileManifest, shards: FileShard[]) {
        // First broadcast the manifest so peers know what to expect
        this.mesh.broadcast({
            type: "FILE_MANIFEST",
            payload: manifest
        }, "AETHER_MEDIA");

        // Scatter shards across the mesh
        for (const shard of shards) {
            // Convert to Array for JSON-safe transport (PeerJS handles this, 
            // but our signing logic needs serializable objects)
            const transportShard = {
                ...shard,
                cipher: Array.from(new Uint8Array(shard.cipher)),
                iv: Array.from(shard.iv)
            };

            this.mesh.broadcast({
                type: "FILE_SHARD",
                fileId: manifest.id,
                payload: transportShard
            }, "AETHER_MEDIA");
        }

        console.log(`[SHARDING] File scattered across mesh: ${manifest.name} (${manifest.shardCount} shards)`);
    }
}

export const sharding = new ShardingManager();
