import { ReactionType } from "../types/ReactionType";

export interface IReaction {
    id?: number;
    type: ReactionType;
    userId: number;
    postId: number;
}
