import { Peer, DataConnection } from "peerjs";
import { SovereignCrypto } from "../security/sovereign-crypto";

export type MeshEvent = {
    type: "PEER_CONNECTED" | "PEER_DISCONNECTED" | "DATA_RECEIVED" | "MESH_SYNC" | "SECURITY_ALERT" | "RECOVERY_FRAGMENT_RECEIVED";
    peerId?: string;
    data?: any;
};

export class MeshController {
    private peer: Peer | null = null;
    private connections: Map<string, DataConnection> = new Map();
    private eventHandlers: ((event: MeshEvent) => void)[] = [];
    public peerId: string | null = null;
    private encryptionKey: CryptoKey | null = null;
    private identityKeyPair: CryptoKeyPair | null = null;
    public identityPublicKey: string | null = null;
    public isPioneer: boolean = false;
    private logicalClock: number = 0;
    private interests: Set<string> = new Set(["GLOBAL", "AETHER_CORE"]);
    private peerInterests: Map<string, Set<string>> = new Map();

    constructor(public appID: string = "AETHER_SOVEREIGN_MESH") { }

    /**
     * Updates the current node's interests.
     */
    setInterests(channels: string[]) {
        this.interests = new Set([...channels, "GLOBAL", "AETHER_CORE"]);
        console.log(`[MESH] Interests Updated:`, Array.from(this.interests));
        // Re-announce to all connected peers
        this.connections.forEach(conn => {
            conn.send({
                type: "PROTOCOL_HANDSHAKE",
                interests: Array.from(this.interests)
            });
        });
    }

    /**
     * Sets the active encryption key for the mesh.
     */
    setKey(key: CryptoKey | null) {
        this.encryptionKey = key;
        console.log(`[MESH] Security Layer: ${key ? "ENCRYPTED" : "PLAINTEXT"}`);
    }

    async setIdentity(keyPair: CryptoKeyPair | null) {
        this.identityKeyPair = keyPair;
        if (keyPair) {
            this.identityPublicKey = await SovereignCrypto.exportPublicKey(keyPair.publicKey);
            console.log("[MESH] Identity Active:", this.identityPublicKey.slice(0, 12) + "...");
        } else {
            this.identityPublicKey = null;
        }
    }

    getIdentityKeyPair(): CryptoKeyPair | null {
        return this.identityKeyPair;
    }

    /**
     * Toggles Pioneer Mode for the current node.
     */
    setPioneerMode(active: boolean) {
        this.isPioneer = active;
        console.log(`[MESH] Pioneer Mode: ${active ? "ACTIVE (SEEDING)" : "INACTIVE"}`);
        this.emit({ type: "MESH_SYNC", data: { pioneerMode: active } });
    }

    /**
     * Returns the number of currently connected peers.
     */
    getConnectedPeerCount(): number {
        return this.connections.size;
    }

    /**
     * Initializes the node and joins the mesh.
     */
    async join(): Promise<string> {
        return new Promise((resolve, reject) => {
            const randomId = Math.random().toString(36).substring(7).toUpperCase();
            this.peerId = `${this.appID}-${randomId}`;

            this.peer = new Peer(this.peerId, {
                debug: 1,
            });

            this.peer.on("open", (id: string) => {
                console.log(`[MESH] Node active as: ${id}`);
                this.emit({ type: "PEER_CONNECTED", peerId: id });
                resolve(id);
            });

            this.peer.on("connection", (conn: DataConnection) => {
                this.handleConnection(conn);
            });

            this.peer.on("error", (err: Error) => {
                console.error(`[MESH] Peer Error:`, err);
                reject(err);
            });
        });
    }

    /**
     * Connects to a specific peer in the mesh.
     */
    connect(targetPeerId: string) {
        if (!this.peer || targetPeerId === this.peerId) return;
        const conn = this.peer.connect(targetPeerId);
        this.handleConnection(conn);
    }

    /**
     * Handles incoming and outgoing connections.
     */
    private handleConnection(conn: DataConnection) {
        conn.on("open", () => {
            if (conn.peer) {
                console.log(`[MESH] Connected to peer: ${conn.peer}`);
                this.connections.set(conn.peer, conn);
                this.emit({ type: "PEER_CONNECTED", peerId: conn.peer });

                // Exchange Interests (Handshake)
                conn.send({
                    type: "PROTOCOL_HANDSHAKE",
                    interests: Array.from(this.interests)
                });
            }
        });

        conn.on("data", async (data: any) => {
            // Handle Interest Handshakes
            if (data && data.type === "PROTOCOL_HANDSHAKE") {
                if (data.interests) {
                    this.peerInterests.set(conn.peer!, new Set(data.interests));
                    console.log(`[MESH] Channel Map updated for ${conn.peer}:`, data.interests);
                }
                return;
            }

            // Synchronize Logical Clock
            if (data && data._aether_timestamp) {
                this.logicalClock = Math.max(this.logicalClock, data._aether_timestamp) + 1;
            }

            let finalData = data;

            // Handle Asset Requests (The Recursive Deployment Layer)
            if (data && data.type === "ASSET_REQUEST") {
                this.handleAssetRequest(conn, data.path);
                return;
            }

            // Handle Encrypted Payloads
            if (data && data._aether_encrypted && this.encryptionKey) {
                try {
                    finalData = await SovereignCrypto.decrypt(
                        data.cipher,
                        this.encryptionKey,
                        new Uint8Array(data.iv)
                    );
                } catch (err) {
                    console.error("[MESH] Decryption Failed. Check mesh keys.");
                    this.emit({ type: "SECURITY_ALERT", peerId: conn.peer!, data: "DECRYPTION_FAILED" });
                    return;
                }
            }

            // Verify Identity Signature (Immunity Layer)
            const signedData = finalData as any;
            if (signedData && signedData._aether_signature) {
                try {
                    const senderPubKey = await SovereignCrypto.importPublicKey(signedData._aether_pubkey);
                    const isValid = await SovereignCrypto.verify(
                        signedData.payload,
                        new Uint8Array(signedData._aether_signature),
                        senderPubKey
                    );
                    if (!isValid) {
                        console.warn(`[MESH] REJECTED: Invalid signature from ${conn.peer}`);
                        this.emit({ type: "SECURITY_ALERT", peerId: conn.peer!, data: "INVALID_SIGNATURE" });
                        return;
                    }
                    // Unleash the payload
                    finalData = signedData.payload;
                } catch (err) {
                    console.error("[MESH] Signature Verification Error:", err);
                    return;
                }
            }

            // Emit unified data event
            this.emit({ type: "DATA_RECEIVED", peerId: conn.peer!, data: finalData });

            // Pioneer Seeding Logic: If this is a seeder node, pin the data to local memory
            if (this.isPioneer && finalData && finalData.type !== "PROTOCOL_HANDSHAKE") {
                this.performPioneerSeed(finalData);
            }
        });

        conn.on("close", () => {
            if (conn.peer) {
                console.log(`[MESH] Disconnected from: ${conn.peer}`);
                this.connections.delete(conn.peer);
                this.emit({ type: "PEER_DISCONNECTED", peerId: conn.peer });
            }
        });
    }

    private async handleAssetRequest(conn: DataConnection, path: string) {
        if (!window.caches) return;
        try {
            const cache = await window.caches.open('aether-cache-v1');
            const response = await cache.match(path);
            if (response) {
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                conn.send({
                    type: "ASSET_RESPONSE",
                    path,
                    data: buffer,
                    contentType: response.headers.get("content-type")
                });
                console.log(`[MESH] Served asset: ${path} to ${conn.peer}`);

                // Economy: Bestow award for seeding
                this.emit({
                    type: "MESH_SYNC",
                    data: {
                        action: "BESTOW_AWARD",
                        to: this.peerId,
                        amount: 0.05,
                        reason: `Seeded Asset: ${path}`
                    }
                });
            }
        } catch (err) {
            console.error(`[MESH] Failed to serve asset ${path}:`, err);
        }
    }

    /**
     * Requests an asset from the mesh.
     */
    async requestAsset(path: string): Promise<ArrayBuffer | null> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
                resolve(null);
            }, 5000);

            const handler = (event: MeshEvent) => {
                if (event.type === "DATA_RECEIVED" && event.data?.type === "ASSET_RESPONSE" && event.data.path === path) {
                    clearTimeout(timeout);
                    this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
                    resolve(event.data.data);
                }
            };

            this.onEvent(handler);
            this.broadcast({ type: "ASSET_REQUEST", path });
        });
    }

    private async performPioneerSeed(data: any) {
        // In a real implementation, we'd use a more sophisticated sharding/pinning logic
        // For this manifestation, we simulate the "Permanent Anchor" by saving to IDB
        try {
            const { aetherStorage } = await import("../persistence/idb-adapter");
            const shardId = `SHARD_${Math.random().toString(36).substring(7).toUpperCase()}`;
            await aetherStorage.set(shardId, data);
            console.log(`[PIONEER] Data Shard Penned: ${shardId}`);
        } catch (err) {
            console.error("[PIONEER] Seeding failed:", err);
        }
    }

    /**
    * Broadcasts data to all connected peers in the mesh.
    */
    async broadcast(data: any, namespace?: string) {
        this.logicalClock++;
        let payload = {
            ...data,
            _aether_timestamp: this.logicalClock,
            _aether_namespace: namespace || this.appID
        };

        // Sign if Identity is present (Identity Sovereignty)
        if (this.identityKeyPair) {
            const signature = await SovereignCrypto.sign(payload, this.identityKeyPair.privateKey);
            payload = {
                payload: payload,
                _aether_signature: Array.from(new Uint8Array(signature)),
                _aether_pubkey: this.identityPublicKey
            } as any;
        }

        // Encrypt if key is present (Privacy Layer)
        if (this.encryptionKey) {
            const { cipher, iv } = await SovereignCrypto.encrypt(payload, this.encryptionKey);
            payload = {
                _aether_encrypted: true,
                cipher,
                iv: Array.from(iv), // Convert to array for transport
            } as any;
        }

        this.connections.forEach((conn: DataConnection) => {
            const peerInterests = this.peerInterests.get(conn.peer);

            // Mesh Segmentation: Only relay to peers who care about this channel.
            // If we don't know their interests yet, we send as GLOBAL.
            const channel = namespace || "GLOBAL";
            const isInterested = !peerInterests || peerInterests.has(channel) || peerInterests.has("GLOBAL");

            if (conn.open && isInterested) {
                conn.send(payload);
            }
        });
    }

    /**
     * Subscribes to mesh events.
     */
    onEvent(handler: (event: MeshEvent) => void) {
        this.eventHandlers.push(handler);
    }

    public emit(event: MeshEvent) {
        this.eventHandlers.forEach((handler: (event: MeshEvent) => void) => handler(event));
    }

    /**
     * Leaves the mesh and cleans up resources.
     */
    destroy() {
        this.connections.forEach((conn: DataConnection) => conn.close());
        this.peer?.destroy();
    }
}

export const mesh = new MeshController();
