"use client";

import { motion } from "framer-motion";
import { Plus, Share2, Wifi } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useMesh } from "@/lib/aether/sdk/hooks/useMesh";
import { CounterState } from "@/lib/aether/core/counter-state";
import { aetherStorage } from "@/lib/aether/persistence/idb-adapter";

export default function DistributedCounter() {
    const { peerId, status, peers, broadcast, connect, onData } = useMesh();
    const [count, setCount] = useState(0);
    const [targetPeer, setTargetPeer] = useState("");
    const counterRef = useRef(new CounterState());

    // Load persistence
    useEffect(() => {
        const loadState = async () => {
            const savedCount = await aetherStorage.get<number>("mesh_counter_value");
            if (savedCount) {
                setCount(savedCount);
                counterRef.current = new CounterState(savedCount);
            }
        };
        loadState();
    }, []);

    // Listen for mesh data via SDK hook helper
    useEffect(() => {
        onData((data: any) => {
            if (data?.type === "COUNTER_UPDATE") {
                const changed = counterRef.current.merge(data.payload);
                if (changed) {
                    const nextCount = counterRef.current.current;
                    setCount(nextCount);
                    aetherStorage.set("mesh_counter_value", nextCount);
                }
            }
        });
    }, [onData]);

    const handleIncrement = () => {
        if (!peerId) return;
        const update = counterRef.current.increment(peerId);
        setCount(counterRef.current.current);
        aetherStorage.set("mesh_counter_value", counterRef.current.current);

        // Broadcast via SDK helper
        broadcast("COUNTER_UPDATE", update);
    };

    const handleConnect = (e: React.FormEvent) => {
        e.preventDefault();
        if (targetPeer) {
            connect(targetPeer);
            setTargetPeer("");
        }
    };

    return (
        <div className="glass-sentinel cyan-border-glow p-6 rounded-lg flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-cyan-glow" />
                    <h3 className="font-mono text-xs uppercase tracking-widest text-silver">Mesh Counter SDK</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Wifi className={`w-3 h-3 ${status === "ONLINE" ? "text-cyan-glow" : "text-silver opacity-30"}`} />
                    <span className="text-[10px] font-mono text-silver/50 tracking-tighter uppercase">{status}</span>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-8 gap-4">
                <motion.div
                    key={count}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-mono text-white tracking-tighter text-glow-cyan"
                >
                    {count.toString().padStart(3, "0")}
                </motion.div>

                <button
                    onClick={handleIncrement}
                    disabled={status !== "ONLINE"}
                    className="group relative w-16 h-16 rounded-full glass-sentinel border border-cyan-glow/20 flex items-center justify-center hover:border-cyan-glow transition-all duration-500 overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="absolute inset-0 bg-cyan-glow/0 group-hover:bg-cyan-glow/10 transition-colors" />
                    <Plus className="w-6 h-6 text-cyan-glow group-hover:scale-125 transition-transform" />
                </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex flex-col gap-2">
                    <span className="text-[8px] font-mono text-silver/40 uppercase tracking-widest">Sovereign Node ID</span>
                    <div className="bg-void border border-white/5 p-2 rounded text-[10px] font-mono text-cyan-glow select-all">
                        {peerId || "JOINING CLUSTER..."}
                    </div>
                </div>

                <form onSubmit={handleConnect} className="flex gap-2">
                    <input
                        type="text"
                        value={targetPeer}
                        onChange={(e) => setTargetPeer(e.target.value)}
                        placeholder="ENTER PEER ID TO BRIDGE..."
                        className="flex-1 bg-void border border-white/5 p-2 rounded text-[10px] font-mono text-silver outline-none focus:border-cyan-glow/30 transition-colors"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-silver/5 border border-white/10 rounded font-mono text-[8px] text-silver uppercase hover:bg-silver/10 transition-colors"
                    >
                        Bridge
                    </button>
                </form>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono text-silver/40 uppercase tracking-widest flex items-center gap-2">
                            Connected Peers
                        </span>
                        <span className="text-[8px] font-mono text-cyan-glow">{peers.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                        {peers.length === 0 ? (
                            <span className="text-[9px] font-mono text-silver/20 italic">No peers detected in local cluster.</span>
                        ) : (
                            peers.map((id) => (
                                <div key={id} className="text-[8px] font-mono px-2 py-1 bg-cyan-glow/5 border border-cyan-glow/10 text-cyan-glow rounded">
                                    {id.split("-").pop()}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
