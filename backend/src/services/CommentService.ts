import db from "../db/database";
import { Comment } from "../models/Comment";
import { Role } from "../types/Role";

type CommentRow = {
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: number;
    post_id: number;
};

type PostLookupRow = {
    id: number;
};

export class CommentService {
    private readonly createCommentStatement = db.prepare(`
        INSERT INTO comments (content, user_id, post_id)
        VALUES (?, ?, ?)
    `);

    private readonly findCommentByIdStatement = db.prepare(`
        SELECT id, content, created_at, updated_at, user_id, post_id
        FROM comments
        WHERE id = ?
    `);

    private readonly updateCommentStatement = db.prepare(`
        UPDATE comments
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    private readonly deleteCommentStatement = db.prepare(`
        DELETE FROM comments
        WHERE id = ?
    `);

    private readonly findPostByIdStatement = db.prepare(`
        SELECT id
        FROM posts
        WHERE id = ?
    `);

    private readonly findCommentsByPostIdStatement = db.prepare(`
        SELECT id, content, created_at, updated_at, user_id, post_id
        FROM comments
        WHERE post_id = ?
        ORDER BY created_at ASC, id ASC
    `);

    public createComment(content: string, userId: number, postId: number): Comment {
        this.ensurePostExists(postId);

        const comment = new Comment({ content, userId, postId });
        const result = this.createCommentStatement.run(comment.content, comment.userId, comment.postId);
        const createdComment = this.findCommentRowById(Number(result.lastInsertRowid));

        if (!createdComment) {
            throw new Error("Der Kommentar konnte nicht erstellt werden.");
        }

        return this.mapRowToComment(createdComment);
    }

    public updateComment(commentId: number, newContent: string, actorUserId: number, actorRole: Role): Comment {
        const commentRow = this.findExistingComment(commentId);

        if (!this.canManageComment(commentRow, actorUserId, actorRole)) {
            throw new Error("Sie dürfen diesen Kommentar nicht bearbeiten.");
        }

        const comment = this.mapRowToComment(commentRow);
        comment.updateContent(newContent);

        this.updateCommentStatement.run(comment.content, commentId);

        const updatedComment = this.findCommentRowById(commentId);

        if (!updatedComment) {
            throw new Error("Der Kommentar konnte nicht aktualisiert werden.");
        }

        return this.mapRowToComment(updatedComment);
    }

    public deleteComment(commentId: number, actorUserId: number, actorRole: Role): void {
        const commentRow = this.findExistingComment(commentId);

        if (!this.canManageComment(commentRow, actorUserId, actorRole)) {
            throw new Error("Sie dürfen diesen Kommentar nicht löschen.");
        }

        this.deleteCommentStatement.run(commentId);
    }

    public getCommentsByPost(postId: number): Comment[] {
        this.ensurePostExists(postId);

        const commentRows = this.findCommentsByPostIdStatement.all(postId) as CommentRow[];

        return commentRows.map((commentRow) => this.mapRowToComment(commentRow));
    }

    private findCommentRowById(commentId: number): CommentRow | undefined {
        return this.findCommentByIdStatement.get(commentId) as CommentRow | undefined;
    }

    private findExistingComment(commentId: number): CommentRow {
        if (!Number.isInteger(commentId) || commentId <= 0) {
            throw new Error("Die Kommentar-ID ist ungültig.");
        }

        const commentRow = this.findCommentRowById(commentId);

        if (!commentRow) {
            throw new Error("Der Kommentar wurde nicht gefunden.");
        }

        return commentRow;
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

    private canManageComment(commentRow: CommentRow, actorUserId: number, actorRole: Role): boolean {
        if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
            throw new Error("Die Benutzer-ID ist ungültig.");
        }

        return (
            commentRow.user_id === actorUserId ||
            actorRole === Role.MODERATOR ||
            actorRole === Role.ADMIN
        );
    }

    private mapRowToComment(commentRow: CommentRow): Comment {
        return new Comment({
            id: commentRow.id,
            content: commentRow.content,
            userId: commentRow.user_id,
            postId: commentRow.post_id,
            createdAt: commentRow.created_at,
            updatedAt: commentRow.updated_at
        });
    }
}
