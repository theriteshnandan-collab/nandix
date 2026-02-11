"use client";

import { motion } from "framer-motion";
import { useMesh } from "@/lib/aether/sdk/hooks/useMesh";

export default function NodeMap() {
    const { peerId, peers } = useMesh();

    // Helper to calculate dynamic positions in a circle for satellite peers
    const getPeerPos = (index: number, total: number) => {
        if (total === 0) return { x: 50, y: 50 };
        const radius = 30; // 30% from center
        const angle = (index / total) * Math.PI * 2;
        return {
            x: 50 + radius * Math.cos(angle),
            y: 50 + radius * Math.sin(angle),
        };
    };

    return (
        <div className="glass-sentinel cyan-border-glow rounded-lg h-[400px] w-full relative overflow-hidden sentinel-grid flex items-center justify-center">
            <div className="absolute top-4 left-4 flex flex-col gap-1 z-10 font-mono text-[10px] text-silver uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse" />
                    <span>Sovereign Topology Active</span>
                </div>
                <div className="opacity-50">Local Node: {peerId?.split("-").pop()}</div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {peers.map((id, i) => {
                    const pos = getPeerPos(i, peers.length);
                    return (
                        <motion.line
                            key={`line-${id}`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.2 }}
                            x1="50%"
                            y1="50%"
                            x2={`${pos.x}%`}
                            y2={`${pos.y}%`}
                            stroke="#00FFFF"
                            strokeWidth="0.5"
                        />
                    );
                })}
            </svg>

            {/* Local Node */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                }}
                className="relative z-20"
            >
                <div className="w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 bg-cyan-glow/20 rounded-full animate-ping" />
                    <div className="w-4 h-4 bg-cyan-glow rounded-full shadow-[0_0_20px_#00FFFF] border border-white/50" />
                </div>
            </motion.div>

            {/* Peer Nodes */}
            {peers.map((id, i) => {
                const pos = getPeerPos(i, peers.length);
                return (
                    <motion.div
                        key={id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            position: "absolute",
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: "translate(-50%, -50%)",
                        }}
                        className="group"
                    >
                        <div className="w-8 h-8 flex items-center justify-center">
                            <div className="w-2 h-2 bg-cyan-glow rounded-full shadow-[0_0_10px_#00FFFF] opacity-60" />
                        </div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-[8px] font-mono text-cyan-glow border border-cyan-glow/20 whitespace-nowrap z-30">
                            PEER_{id.split("-").pop()}
                        </div>
                    </motion.div>
                );
            })}

            <div className="absolute bottom-4 right-4 text-[8px] font-mono text-silver opacity-30 text-right uppercase tracking-tighter">
                Active Peers: {peers.length}<br />
                Mesh Integrity: {peers.length > 0 ? "STABLE" : "SOLO_CLUSTER"}
            </div>
        </div>
    );
}
