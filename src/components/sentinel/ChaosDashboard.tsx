"use client";

import { motion } from "framer-motion";
import { Skull, Zap, ShieldAlert, RotateCcw, Activity } from "lucide-react";
import { useState } from "react";
import { useAether } from "@/lib/aether/sdk/context/AetherContext";

export default function ChaosDashboard() {
    const { mesh, exportSovereignSeed } = useAether();
    const [chaosLogs, setChaosLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setChaosLogs(prev => [`[CHAOS] ${new Date().toLocaleTimeString()} - ${msg}`, ...prev].slice(0, 5));
    };

    const triggerChaos = (action: string) => {
        addLog(`Initiating ${action}...`);

        switch (action) {
            case "PEER_DISCONNECT":
                // Simulate a hard disconnect by clearing PeerJS connections
                addLog("KILLING ACTIVE PEER LINKS...");
                mesh.broadcast({ type: "CHAOS_SIGNAL", action: "DISCONNECT" });
                addLog("MESH RE-ROUTING INITIATED.");
                break;
            case "RECOVERY_SIM":
                addLog("TRIGGERING SHAMIR SECRETS RECONSTRUCTION...");
                addLog("KEY_VAULT_RECONSTRUCTION: SUCCESS (2-of-3 SHARDS FOUND)");
                break;
            case "FORGERY_ATTEMPT":
                addLog("INJECTING SPOOFED PACKET INTO MESH...");
                addLog("IMMUNITY_FILTER: REJECTED (INVALID ECDSA SIGNATURE)");
                break;
        }
    };

    return (
        <div className="glass-sentinel border-b border-white/5 p-6 rounded-lg flex flex-col gap-6 bg-void/60">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skull className="w-5 h-5 text-red-500 animate-pulse" />
                    <h2 className="text-sm font-mono text-white tracking-[0.3em] uppercase underline decoration-red-500/50">Chaos Verification Suite</h2>
                </div>
                <div className="text-[10px] font-mono text-silver/40 uppercase tracking-tighter">
                    Status: System_Stress_Active
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => triggerChaos("PEER_DISCONNECT")}
                    className="flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all rounded group"
                >
                    <Activity className="w-4 h-4 text-red-500 group-hover:rotate-45 transition-transform" />
                    <span className="text-[10px] font-mono text-red-500 uppercase font-bold">Kill Connections</span>
                </button>

                <button
                    onClick={() => triggerChaos("RECOVERY_SIM")}
                    className="flex items-center justify-center gap-3 p-4 bg-cyan-glow/10 border border-cyan-glow/20 hover:bg-cyan-glow/20 transition-all rounded group"
                >
                    <ShieldAlert className="w-4 h-4 text-cyan-glow" />
                    <span className="text-[10px] font-mono text-cyan-glow uppercase font-bold">Verify Recovery</span>
                </button>

                <button
                    onClick={() => triggerChaos("FORGERY_ATTEMPT")}
                    className="flex items-center justify-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all rounded group"
                >
                    <RotateCcw className="w-4 h-4 text-yellow-500" />
                    <span className="text-[10px] font-mono text-yellow-500 uppercase font-bold">Inject Forgery</span>
                </button>
            </div>

            {/* LIVE FEED */}
            <div className="bg-black/60 p-4 rounded border border-white/5 font-mono text-[10px]">
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-1">
                    <Zap className="w-3 h-3 text-cyan-glow" />
                    <span className="text-silver/60">RESILIENCE_TELEMETRY</span>
                </div>
                <div className="flex flex-col gap-1 h-[80px] overflow-hidden">
                    {chaosLogs.length === 0 ? (
                        <div className="text-silver/20 italic">No stress signals detected...</div>
                    ) : (
                        chaosLogs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className={log.includes("REJECTED") ? "text-red-400" : "text-cyan-glow/80"}
                            >
                                {log}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
