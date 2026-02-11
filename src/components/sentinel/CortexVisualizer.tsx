"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Cpu, Zap, Activity, Network } from "lucide-react";
import { useState, useEffect } from "react";
import { useMesh } from "@/lib/aether/sdk/hooks/useMesh";
import { cortex, CortexTask } from "@/lib/aether/ai/cortex-controller";

export default function CortexVisualizer() {
    const { peers, peerId } = useMesh();
    const [activeJobs, setActiveJobs] = useState<CortexTask[]>([]);
    const [inputText, setInputText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<{ id: string, result: any }[]>([]);

    const startCompute = async () => {
        if (!inputText.trim()) return;
        setIsProcessing(true);
        const id = await cortex.dispatchTask("INFERENCE", inputText);

        // Local tracking
        const newTask: CortexTask = {
            id,
            type: "INFERENCE",
            payload: inputText,
            status: "PROCESSING",
            nodeId: peerId || "LOCAL"
        };

        setActiveJobs(prev => [...prev, newTask]);
        setInputText("");

        // Simulate cleanup/completion for the visualizer
        setTimeout(() => {
            setActiveJobs(prev => prev.filter(j => j.id !== id));
            setIsProcessing(false);
        }, 10000);
    };

    // Listen for logs if we were using a more advanced emitter,
    // but for the PoC we'll just check the console or extend the controller.
    // In a real build, CortexController would emit an event.

    return (
        <div className="glass-sentinel cyan-border-glow p-6 rounded-lg flex flex-col gap-6 relative overflow-hidden">
            {/* Neural Background Sweep */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-glow to-transparent" />
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-cyan-glow animate-pulse" />
                    <h3 className="font-mono text-xs uppercase tracking-widest text-silver">Global Cortex</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-cyan-glow/50" />
                    <span className="text-[10px] font-mono text-silver/50 tracking-tighter uppercase">WASM Neural Engine Active</span>
                </div>
            </div>

            <div className="flex flex-col gap-8 py-4 relative z-10">
                {/* Nodes Grid */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded bg-cyan-glow/10 border ${isProcessing ? 'border-cyan-glow animate-pulse' : 'border-white/10'} flex items-center justify-center transition-colors`}>
                            <Cpu className={`w-5 h-5 ${isProcessing ? 'text-cyan-glow' : 'text-silver/20'}`} />
                        </div>
                        <span className="text-[8px] font-mono text-silver/40 uppercase">Local Core</span>
                    </div>
                    {peers.slice(0, 3).map((id, i) => (
                        <div key={id} className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded bg-silver/5 border border-white/5 flex items-center justify-center">
                                <Network className="w-5 h-5 text-silver/10" />
                            </div>
                            <span className="text-[8px] font-mono text-silver/40 uppercase">Node_{id.split("-").pop()}</span>
                        </div>
                    ))}
                </div>

                {/* Compute Trigger */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-mono text-silver/40 uppercase tracking-widest">Natural Language Processing</span>
                        <p className="text-[10px] font-mono text-silver/60 leading-relaxed">
                            Broadcast strings to the mesh for sentiment analysis. Results are computed locally by peers using WASM.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="ENTER TEXT FOR SENTIMENT ANALYSIS..."
                            className="flex-1 bg-void border border-white/5 p-3 rounded text-[10px] font-mono text-silver outline-none focus:border-cyan-glow/30"
                        />
                        <button
                            onClick={startCompute}
                            disabled={isProcessing || !inputText.trim()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-glow/10 border border-cyan-glow/30 hover:bg-cyan-glow/20 transition-all rounded font-mono text-[10px] text-cyan-glow uppercase group disabled:opacity-30"
                        >
                            <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
                            Dispatch
                        </button>
                    </div>
                </div>

                {/* Active Task Monitor */}
                <div className="space-y-2">
                    <span className="text-[8px] font-mono text-silver/40 uppercase tracking-widest">Cortex Threads</span>
                    <div className="min-h-[60px] flex flex-col gap-2">
                        <AnimatePresence>
                            {activeJobs.map(job => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-void border border-cyan-glow/20 p-3 rounded flex items-center justify-between"
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-1 bg-cyan-glow rounded-full animate-ping" />
                                            <span className="text-[10px] font-mono text-cyan-glow uppercase tracking-tighter">
                                                SENTIMENT_SCAN: {job.id}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-mono text-silver/40 italic">"{job.payload}"</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[8px] font-mono text-silver/50 uppercase">Broadcasting...</span>
                                    </div>
                                </motion.div>
                            ))}
                            {activeJobs.length === 0 && (
                                <span className="text-[9px] font-mono text-silver/20 italic">Mesh Cortex idle. Awaiting dispatch...</span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 text-[8px] font-mono text-silver opacity-20 text-right uppercase tracking-tighter leading-normal">
                Edge_Model: DistilBERT-Base-SST2<br />
                Compute_Mode: WASM_MESH_ORCHESTRATION
            </div>
        </div>
    );
}
