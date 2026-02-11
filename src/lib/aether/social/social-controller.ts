import { mesh, MeshController } from "../core/mesh-controller";
import { aetherStorage } from "../persistence/idb-adapter";
import { cortex } from "../ai/cortex-controller";
import { SocialPost, SocialProfile, SocialReaction, SocialEvent } from "./types";

export class SocialController {
    private mesh: MeshController = mesh;
    private handlers: ((event: SocialEvent) => void)[] = [];
    public profile: SocialProfile | null = null;

    constructor() {
        this.setupMeshListener();
    }

    private setupMeshListener() {
        this.mesh.onEvent(async (event) => {
            if (event.type === "DATA_RECEIVED") {
                const data = event.data;
                if (data && data._aether_namespace === "AETHER_NOIR" && data._noir_social) {
                    await this.handleSocialPacket(data.payload);
                }
            }
        });
    }

    private async handleSocialPacket(payload: SocialEvent) {
        // Persistence Logic
        switch (payload.type) {
            case "POST_CREATED":
                await aetherStorage.set(`NOIR_POST_${payload.post.id}`, payload.post);
                break;
            case "PROFILE_UPDATED":
                await aetherStorage.set(`NOIR_PROFILE_${payload.profile.id}`, payload.profile);
                break;
            case "REACTION_ADDED":
                await aetherStorage.set(`NOIR_REACTION_${payload.reaction.id}`, payload.reaction);
                break;
        }

        // Notify Listeners
        this.handlers.forEach(handler => handler(payload));
    }

    async createPost(content: string) {
        if (!this.mesh.peerId) return;

        // 1. AI Analysis (Cortex)
        const taskId = await cortex.dispatchTask("INFERENCE", content);
        // For this manifestation, we'll assume a quick return or simulate the sentiment
        // In reality, the visualizer would catch the result, but here we can tag it.

        const post: SocialPost = {
            id: Math.random().toString(36).substring(7).toUpperCase(),
            authorId: this.mesh.peerId,
            authorName: this.profile?.name || `Peer_${this.mesh.peerId.split("-").pop()}`,
            content,
            timestamp: Date.now(),
            type: "POST",
            sentiment: { label: "ANALYZING", score: 0 } // Placeholder
        };

        // 2. Broadcast to Mesh
        await this.mesh.broadcast({
            _noir_social: true,
            payload: { type: "POST_CREATED", post }
        }, "AETHER_NOIR");

        // 3. Local Save
        await aetherStorage.set(`NOIR_POST_${post.id}`, post);
        return post;
    }

    async updateProfile(name: string, bio: string) {
        if (!this.mesh.peerId) return;

        const profile: SocialProfile = {
            id: this.mesh.peerId,
            name,
            bio,
            timestamp: Date.now(),
            type: "PROFILE"
        };

        this.profile = profile;
        await aetherStorage.set(`NOIR_PROFILE_LOCAL`, profile);

        await this.mesh.broadcast({
            _noir_social: true,
            payload: { type: "PROFILE_UPDATED", profile }
        });
    }

    async getFeed(): Promise<SocialPost[]> {
        // Collect all posts from local memory
        const posts = await aetherStorage.scan<SocialPost>("NOIR_POST_");
        return posts.sort((a, b) => b.timestamp - a.timestamp);
    }

    onEvent(handler: (event: SocialEvent) => void) {
        this.handlers.push(handler);
    }
}

export const social = new SocialController();
