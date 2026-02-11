"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Key, Lock, Unlock, Copy, AlertTriangle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useMesh } from "@/lib/aether/sdk/hooks/useMesh";
import { SovereignCrypto } from "@/lib/aether/security/sovereign-crypto";

export default function SecurityDashboard() {
    const { isEncrypted, setMeshKey } = useMesh();
    const [exportedKey, setExportedKey] = useState<string | null>(null);
    const [importString, setImportString] = useState("");
    const [showDangerZone, setShowDangerZone] = useState(false);

    const handleGenerateKey = async () => {
        const key = await SovereignCrypto.generateKey();
        setMeshKey(key);
        const base64 = await SovereignCrypto.exportKey(key);
        setExportedKey(base64);
    };

    const handleImportKey = async () => {
        try {
            const key = await SovereignCrypto.importKey(importString);
            setMeshKey(key);
            setExportedKey(importString);
            setImportString("");
        } catch (err) {
            alert("Invalid Sovereign Key Format");
        }
    };

    const handleClearKey = () => {
        setMeshKey(null);
        setExportedKey(null);
        setShowDangerZone(false);
    };

    return (
        <div className="glass-sentinel cyan-border-glow p-6 rounded-lg flex flex-col gap-6 ">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${isEncrypted ? "text-cyan-glow" : "text-amber-400"}`} />
                    <h3 className="font-mono text-xs uppercase tracking-widest text-silver">Security Layer</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isEncrypted ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-glow/10 border border-cyan-glow/20 rounded-full">
                            <Lock className="w-2 h-2 text-cyan-glow" />
                            <span className="text-[8px] font-mono text-cyan-glow uppercase">Zero-Knowledge Active</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded-full">
                            <Unlock className="w-2 h-2 text-amber-400" />
                            <span className="text-[8px] font-mono text-amber-400 uppercase">Unencrypted Mesh</span>
                        </div>
                    )}
                </div>
            </div>

            {!isEncrypted ? (
                <div className="flex flex-col gap-4 py-4 text-center items-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500/50 mb-2" />
                    <p className="text-[10px] font-mono text-silver/60 leading-relaxed max-w-[200px]">
                        Your data is currently traveling in plaintext. Initialize a Sovereign Key to secure your mesh connections.
                    </p>
                    <button
                        onClick={handleGenerateKey}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-glow/10 border border-cyan-glow/30 hover:bg-cyan-glow/20 transition-colors rounded font-mono text-[10px] text-cyan-glow uppercase"
                    >
                        <Key className="w-3 h-3" /> Manifest Sovereign Key
                    </button>

                    <div className="w-full flex items-center gap-2 py-2">
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <span className="text-[8px] font-mono text-silver/20 uppercase">or import</span>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    <div className="w-full flex gap-2">
                        <input
                            type="text"
                            value={importString}
                            onChange={(e) => setImportString(e.target.value)}
                            placeholder="PASTE SOVEREIGN KEY..."
                            className="flex-1 bg-void border border-white/5 p-2 rounded text-[10px] font-mono text-silver outline-none focus:border-cyan-glow/30"
                        />
                        <button
                            onClick={handleImportKey}
                            className="px-4 py-2 bg-silver/5 border border-white/10 rounded font-mono text-[10px] text-silver uppercase hover:bg-silver/10"
                        >
                            Import
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[8px] font-mono text-silver/40 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-2 h-2" /> Active Sovereign Key
                            </label>
                            <div className="group relative">
                                <div className="bg-void border border-cyan-glow/20 p-3 rounded text-[10px] font-mono text-cyan-glow/80 break-all select-all pr-10">
                                    {exportedKey}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(exportedKey || "")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded transition-colors"
                                >
                                    <Copy className="w-3 h-3 text-silver/40" />
                                </button>
                            </div>
                            <p className="text-[8px] font-mono text-silver/30 leading-tight">
                                Share this key with other peers out-of-band to allow them to join your secure mesh cluster.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => setShowDangerZone(!showDangerZone)}
                            className="w-full py-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded font-mono text-[8px] text-red-500/50 uppercase transition-colors"
                        >
                            {showDangerZone ? "Hide Danger Zone" : "Danger Zone"}
                        </button>

                        <AnimatePresence>
                            {showDangerZone && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <button
                                        onClick={handleClearKey}
                                        className="w-full mt-2 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 rounded font-mono text-[10px] text-red-500 uppercase transition-colors"
                                    >
                                        Terminate Sovereign Key
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
