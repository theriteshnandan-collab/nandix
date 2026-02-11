"use client";

import { motion } from "framer-motion";
import { Send, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { social } from "@/lib/aether/social/social-controller";

export default function NoirCompose() {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handlePost = async () => {
        if (!content.trim()) return;
        setIsSending(true);
        try {
            await social.createPost(content);
            setContent("");
        } catch (err) {
            console.error("Failed to broadcast social vibe:", err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="glass-sentinel cyan-border-glow p-6 rounded-lg flex flex-col gap-4 relative overflow-hidden bg-void/40">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-glow" />
                    <span className="text-[10px] font-mono text-silver uppercase tracking-widest">Vibe Composer</span>
                </div>
                <div className="flex items-center gap-1 opacity-20">
                    <div className="w-1 h-1 bg-cyan-glow rounded-full" />
                    <span className="text-[8px] font-mono text-silver uppercase">Broadcasting enabled</span>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-glow/10 border border-cyan-glow/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-cyan-glow/40" />
                </div>
                <div className="flex-1 flex flex-col gap-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="WHAT'S THE VIBE ON THE MESH?..."
                        className="w-full bg-transparent border-none outline-none text-xs font-mono text-silver placeholder:text-silver/20 resize-none min-h-[80px]"
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex gap-2">
                            <div className="p-2 hover:bg-white/5 rounded cursor-pointer transition-colors group">
                                <div className="w-3 h-3 border border-silver/20 group-hover:border-cyan-glow transition-colors" />
                            </div>
                        </div>

                        <button
                            onClick={handlePost}
                            disabled={isSending || !content.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-glow/10 border border-cyan-glow/30 hover:bg-cyan-glow/20 disabled:opacity-30 transition-all rounded font-mono text-[10px] text-cyan-glow uppercase group"
                        >
                            <span>Broadcast</span>
                            <Send className={`w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ${isSending ? 'animate-pulse' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Background ambient pulse */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="w-12 h-12 text-white" />
            </div>
        </div>
    );
}
