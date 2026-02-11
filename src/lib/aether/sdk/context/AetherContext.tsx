"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { mesh, MeshController } from "@/lib/aether/core/mesh-controller";
import { SovereignCrypto } from "@/lib/aether/security/sovereign-crypto";
import { aetherStorage } from "@/lib/aether/persistence/idb-adapter";
import { CreditController } from "@/lib/aether/economy/credit-controller";
import { witness } from "@/lib/aether/economy/witness-controller";
import { recovery, RecoveryController } from "@/lib/aether/security/recovery-controller";
import { versioning } from "@/lib/aether/core/version-manager";

interface AetherContextType {
    mesh: MeshController;
    peerId: string | null;
    status: "OFFLINE" | "CONNECTING" | "ONLINE";
    isEncrypted: boolean;
    meshKey: CryptoKey | null;
    setMeshKey: (key: CryptoKey | null) => void;
    isPioneer: boolean;
    setPioneerMode: (active: boolean) => void;
    identityPublicKey: string | null;
    credits: {
        balance: number;
        history: any[];
        award: (toPeerId: string, amount: number, reason: string) => Promise<void>;
    };
    recovery: RecoveryController;
    exportSovereignSeed: () => void;
}

const AetherContext = createContext<AetherContextType | undefined>(undefined);

export function AetherProvider({ children }: { children: React.ReactNode }) {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [status, setStatus] = useState<"OFFLINE" | "CONNECTING" | "ONLINE">("OFFLINE");
    const [meshKey, setMeshKeyInternal] = useState<CryptoKey | null>(null);
    const [isPioneer, setIsPioneerInternal] = useState(false);
    const [identityPublicKey, setIdentityPublicKey] = useState<string | null>(null);
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [economy] = useState(() => new CreditController(mesh));

    const setMeshKey = (key: CryptoKey | null) => {
        mesh.setKey(key);
        setMeshKeyInternal(key);
    };

    const setPioneerMode = (active: boolean) => {
        mesh.setPioneerMode(active);
        setIsPioneerInternal(active);
    };

    useEffect(() => {
        const initMesh = async () => {
            setStatus("CONNECTING");
            try {
                // Identity Sovereignty Check
                let identity = await aetherStorage.get<CryptoKeyPair>("sovereign_identity");
                if (!identity) {
                    console.log("[AETHER] Manifesting NEW Sovereign Identity...");
                    identity = await SovereignCrypto.generateIdentityKeyPair();
                    await aetherStorage.set("sovereign_identity", identity);
                }
                await mesh.setIdentity(identity);
                setIdentityPublicKey(mesh.identityPublicKey);

                // Economy Initialization
                await economy.init();
                setBalance(economy.getBalance());
                setHistory(economy.getHistory());

                const id = await mesh.join();
                setPeerId(id);
                setStatus("ONLINE");

                // Phase 9.3: Viral Seeding - Pioneers announce the build
                if (mesh.isPioneer) {
                    versioning.announceBuild();
                }
            } catch (err) {
                console.error("Failed to join Aether Mesh:", err);
                setStatus("OFFLINE");
            }
        };

        initMesh();

        // Listen for Economy Events
        const handleMeshEvent = (event: any) => {
            // AETHER_ECONOMY Namespace
            if (event.type === "DATA_RECEIVED" && event.data?._aether_namespace === "AETHER_ECONOMY") {
                const pkg = event.data;

                // 1. Witness Requests (Alpha Nodes automatically attest valid transactions)
                if (pkg.type === "WITNESS_REQUEST") {
                    witness.handleRequest(pkg.payload).then(attestation => {
                        if (attestation) {
                            mesh.broadcast({
                                type: "WITNESS_ATTESTATION",
                                payload: attestation
                            }, "AETHER_ECONOMY");
                        }
                    });
                }

                // 2. Incoming Attestations (Consensus gathering)
                if (pkg.type === "WITNESS_ATTESTATION") {
                    economy.handleIncomingAttestation(pkg.payload).then(() => {
                        setBalance(economy.getBalance());
                        setHistory(economy.getHistory());
                    });
                }

                // 3. Finalized Credit Awards (Total finality)
                if (pkg.type === "CREDIT_AWARD") {
                    economy.handleIncomingCredit(pkg).then(() => {
                        setBalance(economy.getBalance());
                        setHistory(economy.getHistory());
                    });
                }
            }

            // AETHER_RECOVERY Namespace
            if (event.type === "DATA_RECEIVED" && event.data?._aether_namespace === "AETHER_RECOVERY") {
                const pkg = event.data;

                // 1. Recovery Shard Offer (Someone wants us to be a Guardian)
                if (pkg.type === "RECOVERY_SHARD_OFFER" && pkg.targetPeerId === mesh.peerId) {
                    recovery.handleIncomingShard(pkg.payload);
                }

                // 2. Resurrection Request (Someone lost their soul)
                if (pkg.type === "RESURRECTION_REQUEST") {
                    recovery.handleResurrectionRequest(pkg.ownerId);
                }

                // 3. Resurrection Shard Response (A Guardian is returning a soul fragment)
                if (pkg.type === "RESURRECTION_SHARD_RESPONSE") {
                    console.log("[RECOVERY] Received Soul Fragment response.");
                    // emit to local UI
                    mesh.emit({ type: "RECOVERY_FRAGMENT_RECEIVED", data: pkg.payload });
                }
            }

            // AETHER_CORE Namespace
            if (event.type === "DATA_RECEIVED" && event.data?._aether_namespace === "AETHER_CORE") {
                const pkg = event.data;

                // 1. Version Announcements (Viral Seeding)
                if (pkg.type === "MESH_VERSION_ANNOUNCE") {
                    versioning.handleAnnouncement(pkg.payload);
                }
            }

            // Local Automatic Contribution Signals
            if (event.type === "MESH_SYNC" && event.data?.action === "BESTOW_AWARD") {
                const { to, amount, reason } = event.data;
                console.log(`[AETHER] Contribution Detected: ${reason}`);
                economy.award(to, amount, reason).then(() => {
                    setBalance(economy.getBalance());
                    setHistory(economy.getHistory());
                });
            }
        };

        mesh.onEvent(handleMeshEvent);

        return () => {
            mesh.destroy();
        };
    }, [economy]);

    const exportSovereignSeed = () => {
        if (!peerId) {
            console.error("[AETHER] Cannot export seed without active PeerID.");
            return;
        }

        const seedContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AETHER Sovereign Seed</title>
    <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
    <style>
        body { background: #000; color: #00ffff; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden; }
        .loader { text-align: center; max-width: 400px; padding: 2rem; border: 1px solid rgba(0, 255, 255, 0.2); background: rgba(0, 20, 20, 0.8); backdrop-filter: blur(10px); }
        .bar { height: 2px; width: 0%; background: #00f0ff; margin: 1rem 0; box-shadow: 0 0 10px #00ffff; transition: width 0.3s; }
        .glitch { animation: glitch 1s infinite alternate; }
        @keyframes glitch { 0% { opacity: 0.8; transform: translate(0); } 100% { opacity: 1; transform: translate(1px, -1px); } }
    </style>
</head>
<body>
    <div class="loader">
        <h2 class="glitch">AETHER_SEED_v1.0</h2>
        <p id="status">Connecting to Pioneer: ${peerId}</p>
        <div class="bar" id="progress"></div>
        <p id="details">Synchronizing with Mesh...</p>
    </div>

    <script>
        const PIONEER_ID = "${peerId}";
        const peer = new Peer();
        const statusEl = document.getElementById('status');
        const progressEl = document.getElementById('progress');
        const detailsEl = document.getElementById('details');

        peer.on('open', () => {
            statusEl.innerText = "Sovereign Link Established.";
            const conn = peer.connect(PIONEER_ID);

            conn.on('open', () => {
                statusEl.innerText = "Synchronizing Assets...";
                progressEl.style.width = "30%";

                // Request bootstrap manifest
                conn.send({ type: "ASSET_REQUEST", path: "sw.js" });

                conn.on('data', async (pkg) => {
                    if (pkg.type === "ASSET_RESPONSE") {
                        const cache = await window.caches.open('aether-cache-v1');
                        await cache.put(pkg.path, new Response(pkg.data, {
                            headers: { 'Content-Type': pkg.contentType || 'application/javascript' }
                        }));
                        
                        detailsEl.innerText = "Synced: " + pkg.path;
                        
                        let currentProgress = parseInt(progressEl.style.width);
                        progressEl.style.width = (currentProgress + 15) + "%";

                        if (pkg.path === "sw.js") {
                            navigator.serviceWorker.register('sw.js');
                            conn.send({ type: "ASSET_REQUEST", path: "index.html" });
                        }

                        if (pkg.path === "index.html") {
                            progressEl.style.width = "100%";
                            statusEl.innerText = "Actualization Complete.";
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }
                    }
                });
            });
        });

        peer.on('error', (err) => {
            statusEl.innerText = "Handshake Failed.";
            detailsEl.innerText = "Pioneer may be offline. Retrying...";
        });
    </script>
</body>
</html>`;

        const blob = new Blob([seedContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "nandix_seed.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("[AETHER] Sovereign Seed Exported. 🏁");
    };

    return (
        <AetherContext.Provider value={{
            mesh,
            peerId,
            status,
            isEncrypted: !!meshKey,
            meshKey,
            setMeshKey,
            isPioneer,
            setPioneerMode,
            identityPublicKey,
            credits: {
                balance,
                history,
                award: (to, amt, res) => economy.award(to, amt, res).then(() => {
                    setBalance(economy.getBalance());
                    setHistory(economy.getHistory());
                })
            },
            recovery,
            exportSovereignSeed
        }}>
            {children}
        </AetherContext.Provider>
    );
}

export function useAether() {
    const context = useContext(AetherContext);
    if (context === undefined) {
        throw new Error("useAether must be used within an AetherProvider");
    }
    return context;
}
