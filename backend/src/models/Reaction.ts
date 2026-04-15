import { IReaction } from "../interfaces/IReaction";
import { ReactionType } from "../types/ReactionType";

export class Reaction implements IReaction {
    private readonly _id?: number;
    private _type: ReactionType;
    private readonly _userId: number;
    private readonly _postId: number;

    public constructor(reactionData: IReaction) {
        if (!Object.values(ReactionType).includes(reactionData.type)) {
            throw new Error("Der Reaktionstyp ist ungültig.");
        }

        if (!reactionData.userId || reactionData.userId <= 0) {
            throw new Error("Die Reaktion braucht eine gültige Benutzer-ID.");
        }

        if (!reactionData.postId || reactionData.postId <= 0) {
            throw new Error("Die Reaktion braucht eine gültige Beitrags-ID.");
        }

        this._id = reactionData.id;
        this._type = reactionData.type;
        this._userId = reactionData.userId;
        this._postId = reactionData.postId;
    }

    public get id(): number | undefined {
        return this._id;
    }

    public get type(): ReactionType {
        return this._type;
    }

    public get userId(): number {
        return this._userId;
    }

    public get postId(): number {
        return this._postId;
    }

    public updateType(newType: ReactionType): void {
        if (!Object.values(ReactionType).includes(newType)) {
            throw new Error("Der Reaktionstyp ist ungültig.");
        }

        this._type = newType;
    }

    public toObject(): IReaction {
        return {
            id: this._id,
            type: this._type,
            userId: this._userId,
            postId: this._postId
        };
    }
}
