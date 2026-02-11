import { mesh, MeshController } from "../core/mesh-controller";
import { SovereignCrypto } from "../security/sovereign-crypto";

export interface WitnessRequest {
    txId: string;
    proposer: string;
    amount: number;
    reason: string;
    timestamp: number;
    proposerSignature: ArrayBuffer | number[]; // ArrayBuffer locally, number[] after transport
}

export interface WitnessAttestation {
    txId: string;
    witness: string;
    witnessPublicKey: string;
    signature: ArrayBuffer | number[]; // ArrayBuffer locally, number[] after transport
}

export class WitnessController {
    private mesh: MeshController = mesh;
    private reputation: number = 100; // Baseline reputation for Alpha

    /**
     * Handles an incoming Witness Request from a peer.
     */
    async handleRequest(request: WitnessRequest): Promise<WitnessAttestation | null> {
        // 1. Verify Proposer Identity
        try {
            // In a real production mesh, we would fetch the proposer's public key from a DHT or Name Service
            // For the Alpha, we trust the proposer signature if we have seen their public key before
            // or if it's included in the broader mesh state.

            // For now, we sign it if the reason is a recognized contribution type
            const isValidReason =
                request.reason.startsWith("Seeded") ||
                request.reason.startsWith("AI ") ||
                request.reason.startsWith("SEEDING") ||
                request.reason.startsWith("AI_COMPUTE");
            if (!isValidReason) {
                console.warn(`[WITNESS] REJECTED: Invalid reason "${request.reason}"`);
                return null;
            }

            // 2. Sign the attestation
            const identityKeyPair = this.mesh.getIdentityKeyPair();
            if (!identityKeyPair) return null;

            const attestationData = {
                txId: request.txId,
                witness: this.mesh.peerId,
            };

            const signature = await SovereignCrypto.sign(attestationData, identityKeyPair.privateKey);

            return {
                txId: request.txId,
                witness: this.mesh.peerId!,
                witnessPublicKey: this.mesh.identityPublicKey!,
                signature: Array.from(new Uint8Array(signature)) // JSON-safe for P2P transport
            };
        } catch (err) {
            console.error("[WITNESS] Error handling request:", err);
            return null;
        }
    }

    /**
     * Broadcasts a witness request to the mesh.
     */
    async requestWitness(tx: any) {
        const identityKeyPair = this.mesh.getIdentityKeyPair();
        if (!identityKeyPair) return;

        const request: WitnessRequest = {
            txId: tx.id,
            proposer: this.mesh.peerId!,
            amount: tx.amount,
            reason: tx.reason,
            timestamp: tx.timestamp,
            proposerSignature: Array.from(new Uint8Array(
                await SovereignCrypto.sign(tx, identityKeyPair.privateKey)
            )) // JSON-safe for transport
        };

        this.mesh.broadcast({
            type: "WITNESS_REQUEST",
            payload: request
        }, "AETHER_ECONOMY");

        console.log(`[WITNESS] Requesting attestations for TX: ${tx.id}`);
    }
}

export const witness = new WitnessController();
