import { mesh, MeshController } from "../core/mesh-controller";
import { aetherStorage } from "../persistence/idb-adapter";
import { SovereignNote, NotesEvent } from "./types";

export class NotesController {
    private mesh: MeshController = mesh;
    private handlers: ((event: NotesEvent) => void)[] = [];
    private namespace = "AETHER_NOTES";

    constructor() {
        this.setupMeshListener();
    }

    private setupMeshListener() {
        this.mesh.onEvent(async (event) => {
            if (event.type === "DATA_RECEIVED") {
                const data = event.data;
                // Strict isolation: only handle packets for this namespace
                if (data && data._aether_namespace === this.namespace && data._is_aether_notes) {
                    await this.handleNotesPacket(data.payload);
                }
            }
        });
    }

    private async handleNotesPacket(payload: NotesEvent) {
        switch (payload.type) {
            case "NOTE_CREATED":
            case "NOTE_UPDATED":
                await aetherStorage.set(`NOTE_${payload.note.id}`, payload.note);
                break;
            case "NOTE_DELETED":
                await aetherStorage.delete(`NOTE_${payload.noteId}`);
                break;
        }

        this.handlers.forEach(handler => handler(payload));
    }

    async saveNote(note: SovereignNote) {
        if (!this.mesh.peerId) return;

        // Broadcast with dynamic namespace isolation
        await this.mesh.broadcast({
            _is_aether_notes: true,
            payload: { type: "NOTE_UPDATED", note }
        }, this.namespace);

        await aetherStorage.set(`NOTE_${note.id}`, note);
    }

    onEvent(handler: (event: NotesEvent) => void) {
        this.handlers.push(handler);
    }
}

export const notes = new NotesController();
