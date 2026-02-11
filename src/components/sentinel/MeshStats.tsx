"use client";

import { motion } from "framer-motion";
import { Activity, Globe, Zap, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { aetherStorage } from "@/lib/aether/persistence/idb-adapter";
import { useAether } from "@/lib/aether/sdk/context/AetherContext";

export default function MeshStats() {
    const [costSaved, setCostSaved] = useState(0.00);
    const [init, setInit] = useState(false);
    const { identityPublicKey, credits, exportSovereignSeed, isPioneer, setPioneerMode } = useAether();

    // Load persisted cost
    useEffect(() => {
        const loadCost = async () => {
            const persistedCost = await aetherStorage.get<number>("mesh_cost_saved");
            if (persistedCost) {
                setCostSaved(persistedCost);
            }
            setInit(true);
        };
        loadCost();
    }, []);

    // Ticker: Simulate cost savings over time
    useEffect(() => {
        if (!init) return;

        const interval = setInterval(() => {
            setCostSaved((prev) => {
                const next = prev + 0.01;
                aetherStorage.set("mesh_cost_saved", next);
                return next;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [init]);

    const stats = [
        { label: "Active Nodes", value: "1", icon: <Globe className="w-4 h-4 text-cyan-glow" />, suffix: "ONLINE", prefix: "" },
        { label: "Hardening Level", value: "UNKILLABLE", icon: <ShieldCheck className="w-4 h-4 text-cyan-glow" />, suffix: "100%", prefix: "" },
        { label: "Mesh Economy", value: credits.balance.toFixed(2), icon: <Zap className="w-4 h-4 text-cyan-glow" />, suffix: "AEX", prefix: "" },
        { label: "Build Version", value: "1.0.0-ALPHA", icon: <Activity className="w-4 h-4 text-cyan-glow" />, suffix: "STABLE", prefix: "" },
        { label: "Mesh Scale", value: "INFINITE", icon: <Globe className="w-4 h-4 text-cyan-glow" />, suffix: "CHANNELS", prefix: "" },
        { label: "Sovereign ID", value: identityPublicKey ? identityPublicKey.slice(0, 8) : "GHOST", icon: <ShieldCheck className="w-4 h-4 text-cyan-glow opacity-50" />, suffix: "VERIFIED", prefix: "" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-sentinel cyan-border-glow p-4 rounded-lg flex flex-col justify-between h-[120px]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] tracking-[0.2em] font-mono text-silver uppercase opacity-80">
                            {stat.label}
                        </span>
                        {stat.icon}
                    </div>
                    <div className="flex items-baseline gap-2">
                        {stat.prefix && (
                            <span className="text-silver text-sm font-mono opacity-50">{stat.prefix}</span>
                        )}
                        <span className="text-2xl font-mono text-white tracking-tight text-glow-cyan">
                            {stat.value}
                        </span>
                        <span className="text-[10px] font-mono text-silver opacity-50">
                            {stat.suffix}
                        </span>
                    </div>
                    <div className="mt-auto h-[2px] w-full bg-graphite relative overflow-hidden">
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            transition={{ duration: 1.5, ease: "circOut", delay: index * 0.2 }}
                            className="absolute inset-0 bg-cyan-glow/30"
                        />
                    </div>
                </motion.div>
            ))}

            {/* MANIFEST ACTION */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={exportSovereignSeed}
                className="col-span-1 md:col-span-2 lg:col-span-4 glass-sentinel border border-cyan-glow/20 p-6 rounded-lg flex items-center justify-between cursor-pointer hover:bg-cyan-glow/5 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-glow/10 rounded-full group-hover:bg-cyan-glow/20 transition-all">
                        <Zap className="w-6 h-6 text-cyan-glow" />
                    </div>
                    <div>
                        <h3 className="text-sm font-mono text-white tracking-widest uppercase">Manifest Sovereign Seed</h3>
                        <p className="text-[10px] text-silver opacity-50 font-mono mt-1">
                            Export single-file HTML bundle for viral p2p manifestation.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-[10px] font-mono text-silver uppercase opacity-40">Status</span>
                        <span className="text-xs font-mono text-cyan-glow">READY_TO_REPLICATE</span>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-cyan-glow text-black font-mono text-xs font-bold rounded uppercase tracking-tighter"
                    >
                        Export Seed
                    </motion.div>
                </div>
            </motion.div>

            {/* PIONEER TOGGLE */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center justify-center gap-8 mt-4 border-t border-graphite pt-6"
            >
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-silver uppercase tracking-widest">Pioneer Status</span>
                    <button
                        onClick={() => setPioneerMode(!isPioneer)}
                        className={`px-4 py-1 rounded-full text-[10px] font-mono transition-all ${isPioneer ? 'bg-cyan-glow text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-graphite text-silver opacity-50 hover:opacity-100'}`}
                    >
                        {isPioneer ? "ACTIVE_SEEDING" : "STANDBY"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
