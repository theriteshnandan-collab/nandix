"use client";

import { useState } from "react";
import { useAether } from "@/lib/aether/sdk/context/AetherContext";
import { sharding, FileManifest, FileShard } from "@/lib/aether/core/sharding-manager";
import ShardedImage from "@/components/sentinel/ShardedImage";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ShieldCheck, Zap, Layers, HardDrive } from "lucide-react";

export default function MediaDashboard() {
    const { mesh } = useAether();
    const [manifests, setManifests] = useState<FileManifest[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            console.log(`[MEDIA] Shredding file: ${file.name}...`);
            const { manifest, shards } = await sharding.shred(file);

            // Broadcast the sharded reality to the mesh
            await sharding.scatter(manifest, shards);

            setManifests(prev => [manifest, ...prev]);
            console.log("[MEDIA] Sovereign Scattering Complete.");
        } catch (err) {
            console.error("[MEDIA] Upload failed:", err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
            {/* Header / Intro */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-glow/10 rounded border border-cyan-glow/20">
                        <Layers className="w-5 h-5 text-cyan-glow" />
                    </div>
                    <h1 className="text-3xl font-mono text-white tracking-widest uppercase">
                        Media Sovereignty
                    </h1>
                </div>
                <p className="text-silver/50 font-mono text-sm max-w-2xl">
                    Welcome to the Efficiency Epoch. Files uploaded here are instantly shredded into encrypted shards and scattered across the NANDIX mesh. No central server. Parallel P2P retrieval.
                </p>
            </div>

            {/* Upload Zone */}
            <motion.label
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-sentinel cyan-border-glow p-12 rounded-xl flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/5 transition-all group border-dashed"
            >
                <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />

                <div className="relative">
                    <motion.div
                        animate={isUploading ? { scale: [1, 1.2, 1], rotate: [0, 180, 360] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Upload className={`w-12 h-12 ${isUploading ? 'text-cyan-glow' : 'text-silver/30 group-hover:text-cyan-glow/50'}`} />
                    </motion.div>
                </div>

                <div className="text-center">
                    <p className="text-silver font-mono text-sm tracking-widest uppercase mb-1">
                        {isUploading ? "Shredding Content..." : "Initialize Transmission"}
                    </p>
                    <p className="text-silver/40 font-mono text-[10px]">
                        Support for Sharded AES-GCM Binary Fragments
                    </p>
                </div>

                {isUploading && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="w-48 h-[2px] bg-cyan-glow mt-2 shadow-[0_0_10px_cyan]"
                    />
                )}
            </motion.label>

            {/* Assembly Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {manifests.map((manifest) => (
                        <motion.div
                            key={manifest.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col gap-4"
                        >
                            <ShardedImage manifest={manifest} />

                            <div className="flex flex-col gap-1 p-2 bg-black/40 rounded border border-white/5">
                                <span className="text-white font-mono text-[10px] truncate">{manifest.name}</span>
                                <div className="flex justify-between items-center">
                                    <span className="text-silver/40 font-mono text-[8px] uppercase tracking-tighter">
                                        {manifest.shardCount} SHARDS • {(manifest.size / 1024).toFixed(0)} KB
                                    </span>
                                    <ShieldCheck className="w-3 h-3 text-cyan-glow/40" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {manifests.length === 0 && !isUploading && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20 border border-white/5 rounded-xl border-dashed">
                        <HardDrive className="w-12 h-12 mb-4" />
                        <span className="text-silver font-mono text-xs tracking-[0.2em] uppercase text-center">
                            No Active Mesh Artifacts Detected<br />
                            <span className="text-[10px] opacity-50 mt-1 block">Awaiting First Scattering</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Technical Overlay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-sentinel p-4 rounded-lg flex items-center gap-4">
                    <Zap className="w-5 h-5 text-cyan-glow" />
                    <div>
                        <h4 className="text-silver font-mono text-[10px] uppercase tracking-widest">Protocol Delta</h4>
                        <p className="text-white font-mono text-xl tracking-tighter">Parallel Retrieval</p>
                    </div>
                </div>
                <div className="glass-sentinel p-4 rounded-lg flex items-center gap-4 opacity-50">
                    <ShieldCheck className="w-5 h-5 text-silver" />
                    <div>
                        <h4 className="text-silver font-mono text-[10px] uppercase tracking-widest">Integrity Check</h4>
                        <p className="text-white font-mono text-xl tracking-tighter">SHA-256 Verfied</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

