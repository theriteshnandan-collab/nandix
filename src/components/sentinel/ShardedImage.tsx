"use client";

import { useState, useEffect } from "react";
import { useAether } from "@/lib/aether/sdk/context/AetherContext";
import { sharding, FileManifest, FileShard } from "@/lib/aether/core/sharding-manager";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, HardDrive, Cpu } from "lucide-react";

export default function ShardedImage({ manifest }: { manifest: FileManifest }) {
    const { mesh } = useAether();
    const [receivedShards, setReceivedShards] = useState<Map<number, FileShard>>(new Map());
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handler = (event: any) => {
            if (event.type === "DATA_RECEIVED" && event.data?._aether_namespace === "AETHER_MEDIA") {
                const packet = event.data;
                // Check if it's a file shard for this manifest
                if (packet.type === "FILE_SHARD" && packet.fileId === manifest.id) {
                    const shard = packet.payload as FileShard;
                    setReceivedShards((prev) => {
                        if (prev.has(shard.index)) return prev;
                        const next = new Map(prev);
                        next.set(shard.index, shard);
                        return next;
                    });
                }
            }
        };

        mesh.onEvent(handler);

        return () => {
            // Note: In a production mesh, we'd want a more targeted unsubscription mechanism
        };
    }, [mesh, manifest.id]);

    useEffect(() => {
        const count = receivedShards.size;
        const currentProgress = (count / manifest.shardCount) * 100;
        setProgress(currentProgress);

        if (count === manifest.shardCount && !imageUrl) {
            console.log(`[SHARDED_IMAGE] All shards received for ${manifest.id}. Assembling...`);
            sharding.assemble(manifest, receivedShards).then((blob) => {
                setImageUrl(URL.createObjectURL(blob));
            }).catch(err => {
                console.error("[SHARDED_IMAGE] Assembly failed:", err);
            });
        }
    }, [receivedShards, manifest, imageUrl]);

    return (
        <div className="relative glass-sentinel cyan-border-glow rounded-lg overflow-hidden w-full h-full min-h-[200px] flex items-center justify-center bg-black/50">
            <AnimatePresence mode="wait">
                {imageUrl ? (
                    <motion.img
                        key="image"
                        src={imageUrl}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full object-cover"
                        alt={manifest.name}
                    />
                ) : (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4 p-8"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="relative z-10"
                            >
                                <ShieldCheck className="w-12 h-12 text-cyan-glow opacity-50" />
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-cyan-glow/10 blur-xl rounded-full"
                            />
                        </div>

                        <div className="text-center z-20">
                            <h3 className="text-silver font-mono text-[10px] tracking-[0.3em] uppercase mb-1 opacity-80">
                                Digital Manifestation
                            </h3>
                            <p className="text-[10px] text-cyan-glow font-mono font-bold tracking-widest">
                                {progress.toFixed(0)}% RECOVERED
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-48 h-[2px] bg-graphite rounded-full overflow-hidden border border-cyan-glow/5 relative">
                            <motion.div
                                className="absolute left-0 top-0 h-full bg-cyan-glow shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "easeOut" }}
                            />
                        </div>

                        {/* Shard Grid Visualization */}
                        <div className="grid grid-cols-10 gap-1 opacity-40">
                            {Array.from({ length: Math.min(manifest.shardCount, 100) }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0.2 }}
                                    animate={{
                                        opacity: receivedShards.has(i) ? 1 : 0.2,
                                        scale: receivedShards.has(i) ? 1.2 : 1,
                                        backgroundColor: receivedShards.has(i) ? "var(--cyan-glow)" : "rgba(255,255,255,0.1)"
                                    }}
                                    className="w-1.5 h-1.5 rounded-[1px] bg-silver/10"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metadata Badges */}
            <div className="absolute top-2 left-2 flex gap-2">
                <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-cyan-glow/20 text-[8px] font-mono text-silver uppercase tracking-wider">
                    <Cpu className="w-3 h-3 text-cyan-glow" />
                    <span>PARALLEL ASSEMBLY</span>
                </div>
            </div>

            <div className="absolute bottom-2 right-2">
                <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-cyan-glow/20 text-[8px] font-mono text-cyan-glow">
                    <HardDrive className="w-3 h-3" />
                    <span className="opacity-50">#</span>
                    <span>{manifest.id}</span>
                </div>
            </div>
        </div>
    );
}
