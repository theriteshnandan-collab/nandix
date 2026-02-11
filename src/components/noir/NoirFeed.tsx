"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Share2, Heart, MessageSquare, ShieldCheck, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { social } from "@/lib/aether/social/social-controller";
import { SocialPost } from "@/lib/aether/social/types";

export default function NoirFeed() {
    const [posts, setPosts] = useState<SocialPost[]>([]);

    useEffect(() => {
        // 1. Initial Load: Fetch from Mesh Memory
        const initFeed = async () => {
            const feed = await social.getFeed();
            if (feed.length > 0) {
                setPosts(feed);
            } else {
                // Simulate some initial vibe if empty
                setPosts([
                    {
                        id: "MOCK_1",
                        authorId: "SYSTEM",
                        authorName: "AETHER_SENTINEL",
                        content: "Welcome to AETHER NOIR. The mesh is active. Your social sovereignty is now absolute.",
                        timestamp: Date.now(),
                        type: "POST",
                        sentiment: { label: "POSITIVE", score: 0.99 }
                    }
                ]);
            }
        };

        initFeed();

        // 2. Real-time Listeners: Collect posts from the mesh as they arrive
        const handleEvent = (event: any) => {
            if (event.type === "POST_CREATED") {
                setPosts(prev => [event.post, ...prev].slice(0, 50));
            }
        };

        social.onEvent(handleEvent);

        return () => {
            // Listeners persist for the life of the component
        };
    }, []);

    return (
        <div className="flex flex-col gap-6 w-full h-full pb-20">
            <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="glass-sentinel border-white/5 p-6 rounded-lg flex flex-col gap-4 relative group hover:border-cyan-glow/20 transition-all bg-void/20"
                    >
                        {/* Post Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-silver/5 border border-white/10 flex items-center justify-center">
                                    <Share2 className="w-4 h-4 text-silver/20" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-cyan-glow uppercase tracking-wider">{post.authorName}</span>
                                    <span className="text-[8px] font-mono text-silver/40 uppercase">
                                        {new Date(post.timestamp).toLocaleTimeString()} // ID: {post.id.slice(0, 6)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {post.sentiment && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                        <Activity className="w-2.5 h-2.5 text-cyan-glow/50" />
                                        <span className="text-[8px] font-mono text-silver/60 uppercase tracking-tighter">
                                            {post.sentiment.label}
                                        </span>
                                    </div>
                                )}
                                <ShieldCheck className="w-3.5 h-3.5 text-cyan-glow opacity-30" />
                            </div>
                        </div>

                        {/* Post Content */}
                        <p className="text-xs font-mono text-silver/80 leading-relaxed font-light">
                            {post.content}
                        </p>

                        {/* Post Actions */}
                        <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                            <button className="flex items-center gap-2 group/btn">
                                <Heart className="w-3.5 h-3.5 text-silver/20 group-hover/btn:text-rose-500 transition-colors" />
                                <span className="text-[9px] font-mono text-silver/20 group-hover/btn:text-silver/40">VIBE</span>
                            </button>
                            <button className="flex items-center gap-2 group/btn">
                                <MessageSquare className="w-3.5 h-3.5 text-silver/20 group-hover/btn:text-cyan-glow transition-colors" />
                                <span className="text-[9px] font-mono text-silver/20 group-hover/btn:text-silver/40">SYNC</span>
                            </button>
                            <div className="flex-1" />
                            <span className="text-[8px] font-mono text-silver/10 uppercase tracking-widest">Zero-Knowledge Verification Stable</span>
                        </div>

                        {/* Ambient Scanline */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-glow/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
