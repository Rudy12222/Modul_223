import { IComment } from "../interfaces/IComment";

export class Comment implements IComment {
    private readonly _id?: number;
    private _content: string;
    private readonly _userId: number;
    private readonly _postId: number;
    private _createdAt: string;
    private _updatedAt: string;

    public constructor(commentData: IComment) {
        const content = commentData.content.trim();

        if (!content) {
            throw new Error("Der Kommentar darf nicht leer sein.");
        }

        if (!commentData.userId || commentData.userId <= 0) {
            throw new Error("Der Kommentar braucht eine gültige Benutzer-ID.");
        }

        if (!commentData.postId || commentData.postId <= 0) {
            throw new Error("Der Kommentar braucht eine gültige Beitrags-ID.");
        }

        this._id = commentData.id;
        this._content = content;
        this._userId = commentData.userId;
        this._postId = commentData.postId;
        this._createdAt = commentData.createdAt ?? new Date().toISOString();
        this._updatedAt = commentData.updatedAt ?? this._createdAt;
    }

    public get id(): number | undefined {
        return this._id;
    }

    public get content(): string {
        return this._content;
    }

    public get userId(): number {
        return this._userId;
    }

    public get postId(): number {
        return this._postId;
    }

    public get createdAt(): string {
        return this._createdAt;
    }

    public get updatedAt(): string {
        return this._updatedAt;
    }

    public updateContent(newContent: string): void {
        const content = newContent.trim();

        if (!content) {
            throw new Error("Der Kommentar darf nicht leer sein.");
        }

        this._content = content;
        this._updatedAt = new Date().toISOString();
    }

    public toObject(): IComment {
        return {
            id: this._id,
            content: this._content,
            userId: this._userId,
            postId: this._postId,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt
        };
    }
}
