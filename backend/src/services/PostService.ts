import db from "../db/database";
import { IPost } from "../interfaces/IPost";
import { Post } from "../models/Post";
import { Role } from "../types/Role";

type PostRow = {
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: number;
};

export class PostService {
    private readonly createPostStatement = db.prepare(`
        INSERT INTO posts (content, user_id)
        VALUES (?, ?)
    `);

    private readonly findPostByIdStatement = db.prepare(`
        SELECT id, content, created_at, updated_at, user_id
        FROM posts
        WHERE id = ?
    `);

    private readonly updatePostStatement = db.prepare(`
        UPDATE posts
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    private readonly deletePostStatement = db.prepare(`
        DELETE FROM posts
        WHERE id = ?
    `);

    private readonly getFeedStatement = db.prepare(`
        SELECT id, content, created_at, updated_at, user_id
        FROM posts
        ORDER BY created_at DESC, id DESC
    `);

    public createPost(content: string, userId: number): Post {
        const post = new Post({ content, userId });
        const result = this.createPostStatement.run(post.content, post.userId);
        const createdPost = this.findPostRowById(Number(result.lastInsertRowid));

        if (!createdPost) {
            throw new Error("Der Beitrag konnte nicht erstellt werden.");
        }

        return this.mapRowToPost(createdPost);
    }

    public updatePost(postId: number, newContent: string, actorUserId: number, actorRole: Role): Post {
        const postRow = this.findExistingPost(postId);

        if (!this.canManagePost(postRow, actorUserId, actorRole)) {
            throw new Error("Sie dürfen diesen Beitrag nicht bearbeiten.");
        }

        const post = this.mapRowToPost(postRow);
        post.updateContent(newContent);

        this.updatePostStatement.run(post.content, postId);

        const updatedPost = this.findPostRowById(postId);

        if (!updatedPost) {
            throw new Error("Der Beitrag konnte nicht aktualisiert werden.");
        }

        return this.mapRowToPost(updatedPost);
    }

    public deletePost(postId: number, actorUserId: number, actorRole: Role): void {
        const postRow = this.findExistingPost(postId);

        if (!this.canManagePost(postRow, actorUserId, actorRole)) {
            throw new Error("Sie dürfen diesen Beitrag nicht löschen.");
        }

        this.deletePostStatement.run(postId);
    }

    public getFeed(): Post[] {
        const postRows = this.getFeedStatement.all() as PostRow[];

        return postRows.map((postRow) => this.mapRowToPost(postRow));
    }

    private findPostRowById(postId: number): PostRow | undefined {
        return this.findPostByIdStatement.get(postId) as PostRow | undefined;
    }

    private findExistingPost(postId: number): PostRow {
        if (!Number.isInteger(postId) || postId <= 0) {
            throw new Error("Die Beitrags-ID ist ungültig.");
        }

        const postRow = this.findPostRowById(postId);

        if (!postRow) {
            throw new Error("Der Beitrag wurde nicht gefunden.");
        }

        return postRow;
    }

    private canManagePost(postRow: PostRow, actorUserId: number, actorRole: Role): boolean {
        if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
            throw new Error("Die Benutzer-ID ist ungültig.");
        }

        return (
            postRow.user_id === actorUserId ||
            actorRole === Role.MODERATOR ||
            actorRole === Role.ADMIN
        );
    }

    private mapRowToPost(postRow: PostRow): Post {
        return new Post({
            id: postRow.id,
            content: postRow.content,
            userId: postRow.user_id,
            createdAt: postRow.created_at,
            updatedAt: postRow.updated_at
        });
    }
}
