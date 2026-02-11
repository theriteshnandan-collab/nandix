export type SovereignNote = {
    id: string;
    title: string;
    content: string;
    timestamp: number;
    lastEditedBy: string;
    version: number; // Lamport Timestamp
};

export type NotesEvent =
    | { type: "NOTE_CREATED"; note: SovereignNote }
    | { type: "NOTE_UPDATED"; note: SovereignNote }
    | { type: "NOTE_DELETED"; noteId: string };
