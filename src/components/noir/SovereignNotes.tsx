"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Plus, Save, Trash2, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { notes } from "@/lib/aether/notes/notes-controller";
import { SovereignNote } from "@/lib/aether/notes/types";

export default function SovereignNotes() {
    const [noteList, setNoteList] = useState<SovereignNote[]>([]);
    const [currentNote, setCurrentNote] = useState<SovereignNote | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Mock initial load - in real scenario, we'd scan IDB
        setNoteList([
            {
                id: "INIT_NOTE",
                title: "AETHER VISION",
                content: "Replacing AWS / Vercel with a sovereign mesh of browsers. $0 cost. Infinite scale.",
                timestamp: Date.now(),
                lastEditedBy: "ARCHITECT",
                version: 1
            }
        ]);

        const handleEvent = (event: any) => {
            if (event.type === "NOTE_UPDATED") {
                setNoteList(prev => {
                    const exists = prev.find(n => n.id === event.note.id);
                    if (exists) {
                        return prev.map(n => n.id === event.note.id ? event.note : n);
                    }
                    return [event.note, ...prev];
                });
            }
        };

        notes.onEvent(handleEvent);
    }, []);

    const handleNewNote = () => {
        const newNote: SovereignNote = {
            id: Math.random().toString(36).substring(7).toUpperCase(),
            title: "UNTITLED NOTE",
            content: "",
            timestamp: Date.now(),
            lastEditedBy: "LOCAL_PEER",
            version: 1
        };
        setCurrentNote(newNote);
        setNoteList(prev => [newNote, ...prev]);
    };

    const handleSave = async () => {
        if (!currentNote) return;
        setIsSaving(true);
        try {
            await notes.saveNote(currentNote);
            setIsSaving(false);
        } catch (err) {
            console.error("Failed to save note to mesh:", err);
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-sentinel border-white/5 p-6 rounded-lg flex flex-col gap-6 bg-void/30 relative overflow-hidden group hover:border-cyan-glow/20 transition-all h-full min-h-[400px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-cyan-glow" />
                    <span className="text-[10px] font-mono text-silver uppercase tracking-widest">Sovereign Notes (App B)</span>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-2.5 h-2.5 text-cyan-glow/40" />
                    <span className="text-[8px] font-mono text-silver/40 uppercase tracking-tighter">Isolated Namespace: AETHER_NOTES</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Note List */}
                <div className="col-span-1 flex flex-col gap-2 overflow-y-auto no-scrollbar pr-2">
                    {noteList.map(note => (
                        <div
                            key={note.id}
                            onClick={() => setCurrentNote(note)}
                            className={`p-3 rounded border border-white/5 cursor-pointer hover:bg-white/5 transition-all ${currentNote?.id === note.id ? 'bg-white/5 border-cyan-glow/20' : ''}`}
                        >
                            <h4 className="text-[10px] font-mono text-cyan-glow truncate">{note.title}</h4>
                            <p className="text-[8px] font-mono text-silver/40 truncate uppercase">{new Date(note.timestamp).toLocaleDateString()}</p>
                        </div>
                    ))}
                    <button
                        onClick={handleNewNote}
                        className="mt-2 flex items-center justify-center gap-2 p-2 border border-white/5 hover:border-cyan-glow/20 rounded transition-all group/btn"
                    >
                        <Plus className="w-3 h-3 text-silver/40 group-hover/btn:text-cyan-glow" />
                        <span className="text-[8px] font-mono text-silver/40 uppercase tracking-widest">New Note</span>
                    </button>
                </div>

                {/* Editor */}
                <div className="col-span-2 flex flex-col gap-4">
                    {currentNote ? (
                        <div className="flex flex-col gap-3 h-full">
                            <input
                                value={currentNote.title}
                                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value.toUpperCase() })}
                                className="bg-transparent border-none outline-none text-xs font-mono text-white tracking-wider"
                                placeholder="NOTE TITLE..."
                            />
                            <textarea
                                value={currentNote.content}
                                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                                className="flex-1 bg-transparent border-none outline-none text-[11px] font-mono text-silver/60 resize-none no-scrollbar leading-relaxed"
                                placeholder="START WRITING ON THE MESH..."
                            />
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button className="p-2 hover:bg-rose-500/10 rounded group/del">
                                    <Trash2 className="w-3.5 h-3.5 text-silver/20 group-hover/del:text-rose-500 transition-colors" />
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-cyan-glow/10 border border-cyan-glow/30 hover:bg-cyan-glow/20 rounded transition-all group/save"
                                >
                                    <span className="text-[9px] font-mono text-cyan-glow uppercase">Sync to Mesh</span>
                                    <Save className={`w-3 h-3 text-cyan-glow ${isSaving ? 'animate-pulse' : 'group-hover/save:scale-110'} transition-transform`} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                            <StickyNote className="w-12 h-12 text-white mb-4" />
                            <p className="text-[10px] font-mono text-silver uppercase tracking-[0.3em]">Select or Create a Note</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Ambient Overlay */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <StickyNote className="w-16 h-16 text-white" />
            </div>
        </div>
    );
}
