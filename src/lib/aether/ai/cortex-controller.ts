"use client";

import { MeshController, mesh } from "../core/mesh-controller";

export type CortexTask = {
    id: string;
    type: "INFERENCE" | "PATTERN_MATCHING" | "DATA_COMPRESSION";
    payload: any;
    status: "PENDING" | "PROCESSING" | "COMPLETED";
    result?: any;
    nodeId: string;
};

export class CortexController {
    private activeTasks: Map<string, CortexTask> = new Map();
    private mesh: MeshController = mesh;
    private pipe: any = null;

    constructor() {
        this.setupListeners();
    }

    private setupListeners() {
        this.mesh.onEvent((event) => {
            if (event.type === "DATA_RECEIVED") {
                const { type, payload } = event.data;

                if (type === "CORTEX_JOB_POST") {
                    this.handleTaskRequest(payload, event.peerId!);
                }

                if (type === "CORTEX_JOB_RESULT") {
                    this.handleTaskResult(payload);
                }
            }
        });
    }

    /**
     * Initializes the AI pipeline if not already loaded.
     */
    private async initAI() {
        if (this.pipe) return;
        console.log("[CORTEX] Initializing WASM Intelligence (Transformers.js)...");
        try {
            // Use dynamic import for CDN to avoid local build issues
            // @ts-ignore
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');

            // Configuration for browser-only execution
            env.allowLocalModels = false;
            env.useBrowserCache = true;

            this.pipe = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            console.log("[CORTEX] WASM Neural Engine Ready.");
        } catch (err) {
            console.error("[CORTEX] Failed to initialize AI pipeline:", err);
        }
    }

    /**
     * Broadcasts a compute job to the mesh.
     */
    async dispatchTask(type: CortexTask["type"], payload: any): Promise<string> {
        const taskId = Math.random().toString(36).substring(7).toUpperCase();
        const task: CortexTask = {
            id: taskId,
            type,
            payload,
            status: "PENDING",
            nodeId: this.mesh.peerId || "UNKNOWN",
        };

        console.log(`[CORTEX] Dispatching Task: ${taskId}`);
        this.mesh.broadcast({
            type: "CORTEX_JOB_POST",
            payload: task,
        });

        return taskId;
    }

    /**
     * Called when a peer receives a task post.
     * Triggers real WASM inference using the local pipeline.
     */
    private async handleTaskRequest(task: CortexTask, fromNode: string) {
        if (task.nodeId === this.mesh.peerId) return;

        console.log(`[CORTEX] Processing Task: ${task.id} from ${fromNode}`);

        // Ensure AI is ready
        await this.initAI();

        if (!this.pipe) {
            console.error("[CORTEX] Pipeline not available. Skipping task.");
            return;
        }

        try {
            // Perform REAL inference
            const result = await this.pipe(task.payload);

            this.mesh.broadcast({
                type: "CORTEX_JOB_RESULT",
                payload: {
                    taskId: task.id,
                    result: result,
                    processedBy: this.mesh.peerId
                },
            });
            console.log(`[CORTEX] Task ${task.id} Complete. Result broadcast.`);

            // Economy: Award credits for AI compute
            this.mesh.emit({
                type: "MESH_SYNC",
                data: {
                    action: "BESTOW_AWARD",
                    to: this.mesh.peerId || "UNKNOWN",
                    amount: 0.10,
                    reason: `AI Inference: ${task.type}`
                }
            });
        } catch (err) {
            console.error(`[CORTEX] Inference failed for task ${task.id}:`, err);
        }
    }

    private handleTaskResult(payload: any) {
        console.log(`[CORTEX] Result for ${payload.taskId}:`, payload.result);
        // In a full implementation, we would update the visualizer via an event emitter
    }
}

export const cortex = new CortexController();
