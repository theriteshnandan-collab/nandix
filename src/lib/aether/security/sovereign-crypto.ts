/**
 * AETHER Sovereign Security Layer
 * Crypto-Sovereignty Engine: Implementing E2EE via Web Crypto API.
 */

export class SovereignCrypto {
    /**
     * Generates a random AES-GCM key for session encryption.
     */
    static async generateKey(): Promise<CryptoKey> {
        return window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypts a string/object using AES-GCM.
     */
    static async encrypt(data: any, key: CryptoKey): Promise<{ cipher: ArrayBuffer; iv: Uint8Array }> {
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        return this.encryptBuffer(encoded, key);
    }

    /**
     * Encrypts raw binary data (BufferSource) using AES-GCM.
     */
    static async encryptBuffer(data: BufferSource, key: CryptoKey): Promise<{ cipher: ArrayBuffer; iv: Uint8Array }> {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const cipher = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            data
        );

        return { cipher, iv };
    }

    /**
     * Decrypts AES-GCM data.
     */
    static async decrypt(cipher: BufferSource, key: CryptoKey, iv: BufferSource): Promise<any> {
        const decrypted = await this.decryptBuffer(cipher, key, iv);
        return JSON.parse(new TextDecoder().decode(decrypted));
    }

    /**
     * Decrypts raw binary data (BufferSource) using AES-GCM.
     */
    static async decryptBuffer(cipher: BufferSource, key: CryptoKey, iv: BufferSource): Promise<ArrayBuffer> {
        return window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            cipher
        );
    }

    /**
     * Exports a key to a base64 string for P2P sharing (Out-of-band).
     */
    static async exportKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey("raw", key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    /**
     * Imports a key from a base64 string.
     */
    static async importKey(base64: string): Promise<CryptoKey> {
        const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        return window.crypto.subtle.importKey(
            "raw",
            raw,
            "AES-GCM",
            true,
            ["encrypt", "decrypt"]
        );
    }

    // --- IDENTITY SOVEREIGNTY (ECDSA) ---

    /**
     * Generates an ECDSA Identity Keypair for signing/verification.
     */
    static async generateIdentityKeyPair(): Promise<CryptoKeyPair> {
        return window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256",
            },
            true,
            ["sign", "verify"]
        );
    }

    /**
     * Signs data using the private identity key.
     */
    static async sign(data: any, privateKey: CryptoKey): Promise<ArrayBuffer> {
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        return window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            privateKey,
            encoded
        );
    }

    /**
     * Verifies data signature using the public identity key.
     */
    static async verify(data: any, signature: BufferSource, publicKey: CryptoKey): Promise<boolean> {
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        return window.crypto.subtle.verify(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            publicKey,
            signature,
            encoded
        );
    }

    static async exportPublicKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey("spki", key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    static async importPublicKey(base64: string): Promise<CryptoKey> {
        const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        return window.crypto.subtle.importKey(
            "spki",
            raw,
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["verify"]
        );
    }
}
