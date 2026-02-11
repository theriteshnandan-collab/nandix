import { MeshController } from "../core/mesh-controller";
import { SovereignCrypto } from "../security/sovereign-crypto";
import { aetherStorage } from "../persistence/idb-adapter";
import { witness, WitnessAttestation } from "./witness-controller";

export interface CreditTransaction {
    id: string;
    from: string; // Public Key or Peer ID
    to: string;
    amount: number;
    reason: string;
    timestamp: number;
    signature?: ArrayBuffer;
    attestations?: WitnessAttestation[];
}

export class CreditController {
    private balance: number = 0;
    private history: CreditTransaction[] = [];
    private mesh: MeshController;
    private pendingAwards: Map<string, { tx: CreditTransaction, attestations: WitnessAttestation[], createdAt: number }> = new Map();
    private static readonly PENDING_TTL_MS = 60_000; // 60 second timeout
    private ttlTimer: ReturnType<typeof setInterval> | null = null;

    constructor(mesh: MeshController) {
        this.mesh = mesh;
    }

    async init() {
        // Load persisted balance
        const savedBalance = await aetherStorage.get<number>("aex_balance");
        const savedHistory = await aetherStorage.get<CreditTransaction[]>("aex_history");

        this.balance = savedBalance || 100.00; // Genesis Gift
        this.history = savedHistory || [];

        // Fix 3: Start TTL sweep for stale pending awards
        this.startTTLSweep();

        console.log(`[ECONOMY] Wallet Initialized: ${this.balance} AEX`);
    }

    /**
     * Periodically cleans up expired pending awards (Fix 3: TTL Cleanup).
     */
    private startTTLSweep() {
        if (this.ttlTimer) return;
        this.ttlTimer = setInterval(() => {
            const now = Date.now();
            let swept = 0;
            this.pendingAwards.forEach((pending, txId) => {
                if (now - pending.createdAt > CreditController.PENDING_TTL_MS) {
                    this.pendingAwards.delete(txId);
                    swept++;
                }
            });
            if (swept > 0) {
                console.log(`[ECONOMY] TTL Sweep: Cleaned ${swept} expired pending award(s).`);
            }
        }, 15_000); // Check every 15 seconds
    }

    /**
     * Computes the required quorum based on current mesh size (Fix 4: Dynamic Quorum).
     * Minimum 1 (solo node), Maximum 3 (production mesh).
     */
    private getRequiredQuorum(): number {
        const peerCount = this.mesh.getConnectedPeerCount();
        return Math.max(1, Math.min(3, peerCount));
    }

    getBalance(): number {
        return this.balance;
    }

    getHistory(): CreditTransaction[] {
        return this.history;
    }

    /**
     * Bestows credits upon a peer for contribution.
     * Starts the witnessing process.
     */
    async award(toPeerId: string, amount: number, reason: string) {
        if (!this.mesh.identityPublicKey) return;

        const tx: CreditTransaction = {
            id: Math.random().toString(36).substring(7),
            from: this.mesh.identityPublicKey,
            to: toPeerId,
            amount: amount,
            reason: reason,
            timestamp: Date.now()
        };

        // Store in pending and request witness
        this.pendingAwards.set(tx.id, { tx, attestations: [], createdAt: Date.now() });
        await witness.requestWitness(tx);

        const quorum = this.getRequiredQuorum();
        console.log(`[ECONOMY] Award Pending: Requesting ${quorum} witness(es) for ${amount} AEX to ${toPeerId}`);
    }

    /**
     * Handles an incoming attestation for a pending award.
     */
    async handleIncomingAttestation(attestation: WitnessAttestation) {
        const pending = this.pendingAwards.get(attestation.txId);
        if (!pending) return;

        // Prevent duplicate attestations from the same witness
        if (pending.attestations.some(a => a.witness === attestation.witness)) return;

        // Verify Attestation Signature
        try {
            const witnessPubKey = await SovereignCrypto.importPublicKey(attestation.witnessPublicKey);
            const attestationData = {
                txId: attestation.txId,
                witness: attestation.witness
            };
            // Resurrect signature from JSON transport (number[] -> Uint8Array)
            const sig = attestation.signature instanceof ArrayBuffer
                ? attestation.signature
                : new Uint8Array(attestation.signature as number[]);
            const isValid = await SovereignCrypto.verify(attestationData, sig, witnessPubKey);

            if (!isValid) {
                console.warn(`[ECONOMY] REJECTED: Invalid attestation signature from ${attestation.witness}`);
                return;
            }

            pending.attestations.push(attestation);
            const quorum = this.getRequiredQuorum();
            console.log(`[ECONOMY] Witness Attestation Received (${pending.attestations.length}/${quorum}) for ${attestation.txId}`);

            if (pending.attestations.length >= quorum) {
                // We have consensus. Finalize and broadcast.
                const finalTx = pending.tx;
                finalTx.attestations = pending.attestations;

                // Sign the final bundle as the proposer
                const identityKeyPair = this.mesh.getIdentityKeyPair();
                if (identityKeyPair) {
                    finalTx.signature = await SovereignCrypto.sign(finalTx, identityKeyPair.privateKey);
                }

                this.mesh.broadcast({
                    type: "CREDIT_AWARD",
                    payload: finalTx
                }, "AETHER_ECONOMY");

                this.pendingAwards.delete(attestation.txId);

                // If we awarded ourselves (AI or Seeding), update balance
                if (finalTx.to === this.mesh.peerId) {
                    await this.finalizeAward(finalTx);
                }
            }
        } catch (err) {
            console.error("[ECONOMY] Attestation verification error:", err);
        }
    }

    /**
     * Handles incoming credit bestows (finalized awards).
     * Fix 5: Full independent witness signature re-verification.
     */
    async handleIncomingCredit(data: any) {
        if (data && data.type === "CREDIT_AWARD") {
            const tx = data.payload as CreditTransaction;

            // Dynamic quorum check
            const requiredQuorum = this.getRequiredQuorum();
            if (!tx.attestations || tx.attestations.length < requiredQuorum) {
                console.warn(`[ECONOMY] REJECTED: Award ${tx.id} has ${tx.attestations?.length || 0} witnesses, need ${requiredQuorum}.`);
                return;
            }

            // Fix 5: Independently verify EVERY witness signature
            try {
                for (const att of tx.attestations) {
                    const witnessPubKey = await SovereignCrypto.importPublicKey(att.witnessPublicKey);
                    const attestationData = {
                        txId: att.txId,
                        witness: att.witness
                    };
                    // Resurrect signature from transport
                    const sig = att.signature instanceof ArrayBuffer
                        ? att.signature
                        : new Uint8Array(att.signature as number[]);
                    const isValid = await SovereignCrypto.verify(attestationData, sig, witnessPubKey);

                    if (!isValid) {
                        console.warn(`[ECONOMY] REJECTED: Award ${tx.id} contains invalid witness signature from ${att.witness}`);
                        return; // Reject the entire award if ANY signature is invalid
                    }
                }
            } catch (err) {
                console.error(`[ECONOMY] REJECTED: Award ${tx.id} signature re-verification failed:`, err);
                return;
            }

            console.log(`[ECONOMY] VERIFIED: Award ${tx.id} passed ${tx.attestations.length}-witness re-verification.`);

            // If it's for us or we are a pioneer, track it
            if (tx.to === this.mesh.peerId || this.mesh.isPioneer) {
                await this.finalizeAward(tx);
            }
        }
    }

    private async finalizeAward(tx: CreditTransaction) {
        // Prevent duplicate processing
        if (this.history.some(h => h.id === tx.id)) return;

        this.history.push(tx);
        if (tx.to === this.mesh.peerId) {
            this.balance += tx.amount;
            await aetherStorage.set("aex_balance", this.balance);
        }
        await aetherStorage.set("aex_history", this.history);
        console.log(`[ECONOMY] FINALIZED: Received ${tx.amount} AEX for ${tx.reason}`);
    }
}
