"use client";

import { motion } from "framer-motion";
import { Shield, HardDrive, Zap, Info } from "lucide-react";
import { useMesh } from "@/lib/aether/sdk/hooks/useMesh";
import { useState, useEffect } from "react";

export default function MeshHealth() {
    const { peers, isPioneer, setPioneerMode } = useMesh();
    const [healthScore, setHealthScore] = useState(0);

    // Calculate health based on peer count and pioneer status
    useEffect(() => {
        // Basic heuristic: 20 points per peer (max 60) + 40 for local seeder
        const peerPoints = Math.min(peers.length * 20, 60);
        const pioneerPoints = isPioneer ? 40 : 0;
        setHealthScore(peerPoints + pioneerPoints);
    }, [peers, isPioneer]);

    return (
        <div className="glass-sentinel cyan-border-glow p-6 rounded-lg flex flex-col gap-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-cyan-glow animate-pulse" />
                    <h3 className="font-mono text-xs uppercase tracking-widest text-silver">Protocol Health</h3>
                </div>
                <span className={`text-[10px] font-mono tracking-tighter uppercase ${healthScore > 50 ? 'text-cyan-glow' : 'text-yellow-500/50'}`}>
                    {healthScore > 80 ? "Indestructible" : healthScore > 50 ? "Stable" : "Critical"}
                </span>
            </div>

            <div className="flex flex-col gap-6">
                {/* Health Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[8px] font-mono text-silver/40 uppercase tracking-widest">Mesh Longevity</span>
                        <span className="text-[10px] font-mono text-cyan-glow">{healthScore}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-cyan-glow shadow-[0_0_10px_#00FFFF]"
                            initial={{ width: 0 }}
                            animate={{ width: `${healthScore}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Pioneer Mode Toggle */}
                <div className="bg-void/50 border border-white/5 p-4 rounded flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <HardDrive className={`w-4 h-4 ${isPioneer ? 'text-cyan-glow' : 'text-silver/20'}`} />
                                <span className="text-[10px] font-mono text-silver uppercase tracking-wider">Pioneer Seed Mode</span>
                            </div>
                            <p className="text-[8px] font-mono text-silver/40 leading-tight">
                                Pin all mesh data shards to local memory to ensure $0 cost persistence.
                            </p>
                        </div>

                        <button
                            onClick={() => setPioneerMode(!isPioneer)}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isPioneer ? 'bg-cyan-glow' : 'bg-white/10'}`}
                        >
                            <motion.div
                                className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full"
                                animate={{ x: isPioneer ? 20 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>

                    {isPioneer && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="pt-2 border-t border-white/5 flex items-center gap-2"
                        >
                            <Zap className="w-3 h-3 text-cyan-glow" />
                            <span className="text-[8px] font-mono text-cyan-glow uppercase animate-pulse">
                                Active Seeding: Shard_Redundancy_L3
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-silver/40 uppercase">Replication</span>
                        <span className="text-[10px] font-mono text-silver">x{peers.length + 1} Shards</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-silver/40 uppercase">Availability</span>
                        <span className="text-[10px] font-mono text-silver">99.98% Est.</span>
                    </div>
                </div>
            </div>

            <div className="absolute top-0 right-0 p-2 opacity-5">
                <Info className="w-20 h-20 text-white" />
            </div>
        </div>
    );
}
