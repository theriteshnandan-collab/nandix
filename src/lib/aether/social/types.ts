export type SocialPost = {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    timestamp: number;
    type: "POST";
    sentiment?: {
        label: string;
        score: number;
    };
    media?: string;
};

export type SocialProfile = {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
    timestamp: number;
    type: "PROFILE";
};

export type SocialReaction = {
    id: string;
    postId: string;
    type: "REACTION";
    reactionType: "LIKE" | "VIBE";
    authorId: string;
    timestamp: number;
};

export type SocialEvent =
    | { type: "POST_CREATED"; post: SocialPost }
    | { type: "PROFILE_UPDATED"; profile: SocialProfile }
    | { type: "REACTION_ADDED"; reaction: SocialReaction };
