"use client";

import { Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useMesh } from "@/lib/aether/sdk/hooks/useMesh";
import { aetherStorage } from "@/lib/aether/persistence/idb-adapter";

export default function AetherTerminal() {
    const { peerId, onData } = useMesh();
    const [logs, setLogs] = useState<string[]>([]);

    // Initial load
    useEffect(() => {
        const loadLogs = async () => {
            const persistedLogs = await aetherStorage.get<string[]>("terminal_logs");
            if (persistedLogs) {
                setLogs(persistedLogs);
            } else {
                setLogs([
                    "> AETHER MESH INITIALIZED",
                    "> SOVEREIGN IDENTITY GENERATED",
                    "> READY FOR CLUSTER BRIDGING",
                ]);
            }
        };
        loadLogs();
    }, []);

    // Listen for mesh handshakes and data
    useEffect(() => {
        if (!peerId) return;

        // Log the join event
        const joinLog = `> NODE_ACTIVE: ${peerId.split("-").pop()}`;
        setLogs((prev) => {
            const next = [...prev.slice(-20), joinLog];
            aetherStorage.set("terminal_logs", next);
            return next;
        });

        onData((data, from) => {
            const log = `> RECEIVED_${data.type} FROM_${from.split("-").pop()}`;
            setLogs((prev) => {
                const next = [...prev.slice(-20), log];
                aetherStorage.set("terminal_logs", next);
                return next;
            });
        });
    }, [peerId, onData]);

    return (
        <div className="glass-sentinel cyan-border-glow rounded-lg h-[240px] w-full p-4 font-mono text-xs overflow-hidden relative">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2 opacity-60">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-cyan-glow" />
                    <span className="tracking-[0.2em] text-[10px] uppercase">Aether Console</span>
                </div>
                <span className="text-[8px] opacity-40">SDK_PROTO: v0.1.0</span>
            </div>
            <div className="flex flex-col gap-1.5 h-[170px] overflow-y-auto">
                {logs.map((log, i) => (
                    <motion.div
                        key={`${i}-${log}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`
              ${log.includes("ACTIVE") || log.includes("RECEIVED") ? "text-cyan-glow" : "text-silver"}
            `}
                    >
                        {log}
                    </motion.div>
                ))}
                <motion.div
                    animate={{ opacity: [0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2 h-4 bg-cyan-glow inline-block"
                />
            </div>
        </div>
    );
}
