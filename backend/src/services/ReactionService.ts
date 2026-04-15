import db from "../db/database";
import { Reaction } from "../models/Reaction";
import { ReactionType } from "../types/ReactionType";

type ReactionRow = {
    id: number;
    type: ReactionType;
    user_id: number;
    post_id: number;
};

type PostLookupRow = {
    id: number;
};

type ReactionCountRow = {
    likes: number | null;
    dislikes: number | null;
};

export class ReactionService {
    private readonly upsertReactionStatement = db.prepare(`
        INSERT INTO reactions (type, user_id, post_id)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, post_id)
        DO UPDATE SET type = excluded.type
    `);

    private readonly findReactionByUserAndPostStatement = db.prepare(`
        SELECT id, type, user_id, post_id
        FROM reactions
        WHERE user_id = ? AND post_id = ?
    `);

    private readonly countReactionsForPostStatement = db.prepare(`
        SELECT
            SUM(CASE WHEN type = 'LIKE' THEN 1 ELSE 0 END) AS likes,
            SUM(CASE WHEN type = 'DISLIKE' THEN 1 ELSE 0 END) AS dislikes
        FROM reactions
        WHERE post_id = ?
    `);

    private readonly findPostByIdStatement = db.prepare(`
        SELECT id
        FROM posts
        WHERE id = ?
    `);

    public setReaction(type: ReactionType, userId: number, postId: number): Reaction {
        this.ensurePostExists(postId);

        const reaction = new Reaction({ type, userId, postId });

        this.upsertReactionStatement.run(reaction.type, reaction.userId, reaction.postId);

        const savedReaction = this.findReactionRowByUserAndPost(reaction.userId, reaction.postId);

        if (!savedReaction) {
            throw new Error("Die Reaktion konnte nicht gespeichert werden.");
        }

        return this.mapRowToReaction(savedReaction);
    }

    public getReactionCounts(postId: number): { likes: number; dislikes: number } {
        this.ensurePostExists(postId);

        const countRow = this.countReactionsForPostStatement.get(postId) as ReactionCountRow | undefined;

        return {
            likes: countRow?.likes ?? 0,
            dislikes: countRow?.dislikes ?? 0
        };
    }

    private findReactionRowByUserAndPost(userId: number, postId: number): ReactionRow | undefined {
        return this.findReactionByUserAndPostStatement.get(userId, postId) as ReactionRow | undefined;
    }

    private ensurePostExists(postId: number): void {
        if (!Number.isInteger(postId) || postId <= 0) {
            throw new Error("Die Beitrags-ID ist ungültig.");
        }

        const post = this.findPostByIdStatement.get(postId) as PostLookupRow | undefined;

        if (!post) {
            throw new Error("Der Beitrag wurde nicht gefunden.");
        }
    }

    private mapRowToReaction(reactionRow: ReactionRow): Reaction {
        return new Reaction({
            id: reactionRow.id,
            type: reactionRow.type,
            userId: reactionRow.user_id,
            postId: reactionRow.post_id
        });
    }
}
