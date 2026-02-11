import { mesh, MeshController } from "../core/mesh-controller";
import { SovereignCrypto } from "../security/sovereign-crypto";
import { aetherStorage } from "../persistence/idb-adapter";

export interface RecoveryShard {
    ownerId: string;
    shardIndex: number;
    shardData: string; // Base64 fragment
    encryptedIdentity: string; // Base64 encrypted full identity
}

export class RecoveryController {
    private mesh: MeshController = mesh;

    /**
     * Shreds the current identity and scatters it to 3 guardians.
     */
    async setupRecovery(guardianIds: string[]) {
        if (guardianIds.length < 3) throw new Error("Need 3 Guardians for Social Recovery");

        const identity = await aetherStorage.get<any>("sovereign_identity");
        if (!identity) throw new Error("No Identity to protect");

        // 1. Generate a Recovery Master Key
        const recoveryKey = await SovereignCrypto.generateKey();
        const exportableRecoveryKey = await SovereignCrypto.exportKey(recoveryKey);

        // 2. Encrypt the Identity with the Recovery Key
        const { cipher, iv } = await SovereignCrypto.encrypt(identity, recoveryKey);
        const encryptedIdentityPkg = {
            cipher: Array.from(new Uint8Array(cipher)),
            iv: Array.from(iv)
        };
        const encryptedIdentityStr = JSON.stringify(encryptedIdentityPkg);

        // 3. Shred the Recovery Password (Simple split for Alpha)
        // In Prod we use Shamir's Secret Sharing. For Alpha, we'll split the base64 string.
        const shards = this.splitRecoveryKey(exportableRecoveryKey, 3);

        // 4. Scatter to Guardians
        for (let i = 0; i < 3; i++) {
            const shard: RecoveryShard = {
                ownerId: this.mesh.peerId!,
                shardIndex: i,
                shardData: shards[i],
                encryptedIdentity: encryptedIdentityStr
            };

            this.mesh.broadcast({
                type: "RECOVERY_SHARD_OFFER",
                payload: shard,
                targetPeerId: guardianIds[i]
            }, "AETHER_RECOVERY");
        }

        console.log(`[RECOVERY] Identity soul shredded and scattered to ${guardianIds.join(", ")}`);
    }

    /**
     * Handles an incoming shard from another peer (Acting as a Guardian).
     */
    async handleIncomingShard(shard: RecoveryShard) {
        // Store the shard in our vault
        const vault = await aetherStorage.get<RecoveryShard[]>("guardian_vault") || [];
        // Prevent duplicates
        if (vault.some(s => s.ownerId === shard.ownerId)) return;

        vault.push(shard);
        await aetherStorage.set("guardian_vault", vault);
        console.log(`[RECOVERY] Acting as Guardian for peer: ${shard.ownerId}`);
    }

    /**
     * Initiates a recovery request to Guardians.
     */
    async initiateResurrection(ownerId: string) {
        this.mesh.broadcast({
            type: "RESURRECTION_REQUEST",
            ownerId: ownerId
        }, "AETHER_RECOVERY");
        console.log(`[RECOVERY] Crying out for resurrection for ${ownerId}...`);
    }

    /**
     * Responds to a resurrection request if we have a shard for the peer.
     */
    async handleResurrectionRequest(ownerId: string) {
        const vault = await aetherStorage.get<RecoveryShard[]>("guardian_vault") || [];
        const shard = vault.find(s => s.ownerId === ownerId);

        if (shard) {
            console.log(`[RECOVERY] RESURRECTING peer ${ownerId}. Sending shard...`);
            this.mesh.broadcast({
                type: "RESURRECTION_SHARD_RESPONSE",
                payload: shard
            }, "AETHER_RECOVERY");
        }
    }

    // --- SHAMIR'S SECRET SHARING (GF(256)) ---
    // Finite field arithmetic over GF(2^8) using irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11B)

    private gfMul(a: number, b: number): number {
        let result = 0;
        let aa = a;
        let bb = b;
        while (bb > 0) {
            if (bb & 1) result ^= aa;
            aa <<= 1;
            if (aa & 0x100) aa ^= 0x11B; // Reduce by irreducible polynomial
            bb >>= 1;
        }
        return result;
    }

    private gfInv(a: number): number {
        if (a === 0) throw new Error("Cannot invert zero in GF(256)");
        // Fermat's little theorem: a^(254) = a^(-1) in GF(2^8)
        let result = a;
        for (let i = 0; i < 6; i++) {
            result = this.gfMul(result, result);
            result = this.gfMul(result, a);
        }
        // One final square
        result = this.gfMul(result, result);
        return result;
    }

    /**
     * Splits a secret into `n` shares requiring `k` to reconstruct (k-of-n threshold).
     * Each byte of the secret is independently split using a random polynomial of degree k-1.
     */
    private splitRecoveryKey(key: string, n: number, k: number = 2): string[] {
        const secretBytes = new TextEncoder().encode(key);
        // Each share is: [x-coordinate (1 byte)] + [evaluated bytes]
        const shares: Uint8Array[] = Array.from({ length: n }, () => new Uint8Array(1 + secretBytes.length));

        for (let shareIdx = 0; shareIdx < n; shareIdx++) {
            shares[shareIdx][0] = shareIdx + 1; // x-coordinates: 1, 2, 3 (never 0)
        }

        for (let byteIdx = 0; byteIdx < secretBytes.length; byteIdx++) {
            // Generate random polynomial coefficients: a0 = secret byte, a1..a(k-1) = random
            const coeffs = new Uint8Array(k);
            coeffs[0] = secretBytes[byteIdx];
            crypto.getRandomValues(coeffs.subarray(1));

            for (let shareIdx = 0; shareIdx < n; shareIdx++) {
                const x = shareIdx + 1;
                let y = 0;
                for (let c = 0; c < k; c++) {
                    // y += coeffs[c] * x^c  (in GF(256))
                    let xPow = 1;
                    for (let p = 0; p < c; p++) xPow = this.gfMul(xPow, x);
                    y ^= this.gfMul(coeffs[c], xPow);
                }
                shares[shareIdx][1 + byteIdx] = y;
            }
        }

        // Encode each share as base64
        return shares.map(s => btoa(String.fromCharCode(...s)));
    }

    /**
     * Reconstructs the secret from k-of-n shares using Lagrange interpolation in GF(256).
     */
    reconstructRecoveryKey(shareStrings: string[]): string {
        const shares = shareStrings.map(s => Uint8Array.from(atob(s), c => c.charCodeAt(0)));
        const k = shares.length;
        const secretLength = shares[0].length - 1; // First byte is x-coordinate
        const result = new Uint8Array(secretLength);

        const xs = shares.map(s => s[0]);

        for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
            const ys = shares.map(s => s[1 + byteIdx]);

            // Lagrange interpolation at x = 0
            let secret = 0;
            for (let i = 0; i < k; i++) {
                let basis = ys[i];
                for (let j = 0; j < k; j++) {
                    if (i === j) continue;
                    // basis *= (0 - xs[j]) / (xs[i] - xs[j])  in GF(256)
                    // In GF(256), subtraction = XOR, so 0 - xs[j] = xs[j]
                    basis = this.gfMul(basis, this.gfMul(xs[j], this.gfInv(xs[i] ^ xs[j])));
                }
                secret ^= basis;
            }
            result[byteIdx] = secret;
        }

        return new TextDecoder().decode(result);
    }
}

export const recovery = new RecoveryController();
