import { IPost } from "../interfaces/IPost";

export class Post implements IPost {
    private readonly _id?: number;
    private _content: string;
    private readonly _userId: number;
    private _createdAt: string;
    private _updatedAt: string;

    public constructor(postData: IPost) {
        const content = postData.content.trim();

        if (!content) {
            throw new Error("Der Beitrag darf nicht leer sein.");
        }

        if (!postData.userId || postData.userId <= 0) {
            throw new Error("Der Beitrag braucht eine gültige Benutzer-ID.");
        }

        this._id = postData.id;
        this._content = content;
        this._userId = postData.userId;
        this._createdAt = postData.createdAt ?? new Date().toISOString();
        this._updatedAt = postData.updatedAt ?? this._createdAt;
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

    public get createdAt(): string {
        return this._createdAt;
    }

    public get updatedAt(): string {
        return this._updatedAt;
    }

    public updateContent(newContent: string): void {
        const content = newContent.trim();

        if (!content) {
            throw new Error("Der Beitrag darf nicht leer sein.");
        }

        this._content = content;
        this._updatedAt = new Date().toISOString();
    }

    public setUpdatedAt(updatedAt: string): void {
        this._updatedAt = updatedAt;
    }

    public toObject(): IPost {
        return {
            id: this._id,
            content: this._content,
            userId: this._userId,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt
        };
    }
}
