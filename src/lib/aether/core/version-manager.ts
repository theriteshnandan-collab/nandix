import { mesh, MeshController } from "./mesh-controller";
import { aetherStorage } from "../persistence/idb-adapter";

export interface MeshManifest {
    version: string;
    buildHash: string;
    timestamp: number;
    assets: string[];
}

export class MeshVersionManager {
    private mesh: MeshController = mesh;
    private currentVersion: string = "1.0.0-alpha.hardening";

    /**
     * Computes a SHA-256 hash of the cached asset URLs to create a deterministic build fingerprint.
     */
    private async computeBuildHash(): Promise<string> {
        try {
            if (!window.caches) throw new Error("No Cache API");
            const cache = await window.caches.open('aether-cache-v1');
            const keys = await cache.keys();
            const urls = keys.map(r => r.url).sort().join("|");
            const encoded = new TextEncoder().encode(urls);
            const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return "AETHER_" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16).toUpperCase();
        } catch {
            // Fallback: timestamp-based hash (only on first boot before cache is populated)
            return "AETHER_BOOT_" + Date.now().toString(36).toUpperCase();
        }
    }

    /**
     * Announces the current build signature to the mesh.
     * Only used by Alpha / Pioneer nodes.
     */
    async announceBuild() {
        const buildHash = await this.computeBuildHash();

        const manifest: MeshManifest = {
            version: this.currentVersion,
            buildHash,
            timestamp: Date.now(),
            assets: [
                "/_next/static/chunks/main.js",
                "/_next/static/chunks/pages/_app.js",
                "/index.html"
            ]
        };

        this.mesh.broadcast({
            type: "MESH_VERSION_ANNOUNCE",
            payload: manifest
        }, "AETHER_CORE");

        console.log(`[VERSION] Seeding Build: ${manifest.buildHash}`);
    }

    /**
     * Handles incoming version announcements.
     */
    async handleAnnouncement(manifest: MeshManifest) {
        const localVersion = await aetherStorage.get<string>("mesh_local_version");

        if (localVersion !== manifest.buildHash) {
            console.log(`[VERSION] New build detected on mesh: ${manifest.buildHash}. Propagating...`);

            // Sync assets via Mesh
            for (const asset of manifest.assets) {
                this.mesh.requestAsset(asset).then(async (buffer) => {
                    if (buffer && window.caches) {
                        const cache = await window.caches.open('aether-cache-v1');
                        await cache.put(asset, new Response(buffer));
                        console.log(`[VERSION] Asset Synced from Peer: ${asset}`);
                    }
                });
            }

            await aetherStorage.set("mesh_local_version", manifest.buildHash);

            // Notify the UI/Service Worker
            this.mesh.emit({
                type: "MESH_SYNC",
                data: { action: "RELOAD_REQUIRED", version: manifest.version }
            });
        }
    }
}

export const versioning = new MeshVersionManager();
