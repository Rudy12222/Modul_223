import db from "../db/database";
import { Comment } from "../models/Comment";
import { Post } from "../models/Post";
import { User } from "../models/User";
import { Role } from "../types/Role";
import { hashPassword } from "../utils/password";

type UserRow = {
    id: number;
    username: string;
    password_hash: string;
    role: Role;
    blocked: number;
    created_at: string;
};

type PostRow = {
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: number;
};

type CommentRow = {
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: number;
    post_id: number;
};

type UserActivity = {
    posts: Post[];
    comments: Comment[];
};

export class UserService {
    private readonly findUserByIdStatement = db.prepare(`
        SELECT id, username, password_hash, role, blocked, created_at
        FROM users
        WHERE id = ?
    `);

    private readonly findUserByUsernameStatement = db.prepare(`
        SELECT id, username, password_hash, role, blocked, created_at
        FROM users
        WHERE username = ?
    `);

    private readonly updateUsernameStatement = db.prepare(`
        UPDATE users
        SET username = ?
        WHERE id = ?
    `);

    private readonly updatePasswordStatement = db.prepare(`
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
    `);

    private readonly updateBlockedStatement = db.prepare(`
        UPDATE users
        SET blocked = ?
        WHERE id = ?
    `);

    private readonly getPostsByUserStatement = db.prepare(`
        SELECT id, content, created_at, updated_at, user_id
        FROM posts
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
    `);

    private readonly getCommentsByUserStatement = db.prepare(`
        SELECT id, content, created_at, updated_at, user_id, post_id
        FROM comments
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
    `);

    public getUserById(userId: number): User {
        const userRow = this.findExistingUserRow(userId);

        return this.mapRowToUser(userRow);
    }

    public updateProfile(userId: number, newUsername: string, newPassword?: string): User {
        let user = this.updateUsername(userId, newUsername);

        if (newPassword !== undefined) {
            user = this.updatePassword(userId, newPassword);
        }

        return user;
    }

    public updateUsername(userId: number, newUsername: string): User {
        const userRow = this.findExistingUserRow(userId);
        const normalizedUsername = this.validateUsername(newUsername);

        if (userRow.username === normalizedUsername) {
            return this.mapRowToUser(userRow);
        }

        if (this.usernameExists(normalizedUsername, userId)) {
            throw new Error("Der Benutzername ist bereits vergeben.");
        }

        this.updateUsernameStatement.run(normalizedUsername, userId);

        return this.getUserById(userId);
    }

    public updatePassword(userId: number, newPassword: string): User {
        this.findExistingUserRow(userId);
        this.validatePassword(newPassword);

        const passwordHash = hashPassword(newPassword);

        this.updatePasswordStatement.run(passwordHash, userId);

        return this.getUserById(userId);
    }

    public usernameExists(username: string, excludeUserId?: number): boolean {
        const normalizedUsername = this.validateUsername(username);
        const userRow = this.findUserRowByUsername(normalizedUsername);

        if (!userRow) {
            return false;
        }

        if (excludeUserId !== undefined && userRow.id === excludeUserId) {
            return false;
        }

        return true;
    }

    public getUserActivity(userId: number): UserActivity {
        this.findExistingUserRow(userId);

        const postRows = this.getPostsByUserStatement.all(userId) as PostRow[];
        const commentRows = this.getCommentsByUserStatement.all(userId) as CommentRow[];

        return {
            posts: postRows.map((postRow) => this.mapRowToPost(postRow)),
            comments: commentRows.map((commentRow) => this.mapRowToComment(commentRow))
        };
    }

    public blockUser(targetUserId: number, actorRole: Role): User {
        return this.setBlockedStatus(targetUserId, true, actorRole);
    }

    public unblockUser(targetUserId: number, actorRole: Role): User {
        return this.setBlockedStatus(targetUserId, false, actorRole);
    }

    private setBlockedStatus(targetUserId: number, blocked: boolean, actorRole: Role): User {
        this.ensureAdmin(actorRole);
        this.findExistingUserRow(targetUserId);

        this.updateBlockedStatement.run(blocked ? 1 : 0, targetUserId);

        return this.getUserById(targetUserId);
    }

    private ensureAdmin(actorRole: Role): void {
        if (actorRole !== Role.ADMIN) {
            throw new Error("Nur Administratoren dürfen Benutzer sperren oder entsperren.");
        }
    }

    private findUserRowByUsername(username: string): UserRow | undefined {
        return this.findUserByUsernameStatement.get(username) as UserRow | undefined;
    }

    private findExistingUserRow(userId: number): UserRow {
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error("Die Benutzer-ID ist ungültig.");
        }

        const userRow = this.findUserByIdStatement.get(userId) as UserRow | undefined;

        if (!userRow) {
            throw new Error("Der Benutzer wurde nicht gefunden.");
        }

        return userRow;
    }

    private mapRowToUser(userRow: UserRow): User {
        return new User({
            id: userRow.id,
            username: userRow.username,
            passwordHash: userRow.password_hash,
            role: userRow.role,
            blocked: Boolean(userRow.blocked),
            createdAt: userRow.created_at
        });
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

    private validateUsername(username: string): string {
        const normalizedUsername = username.trim();

        if (!normalizedUsername) {
            throw new Error("Der Benutzername darf nicht leer sein.");
        }

        return normalizedUsername;
    }

    private validatePassword(password: string): void {
        if (!password.trim()) {
            throw new Error("Das Passwort darf nicht leer sein.");
        }
    }
}
