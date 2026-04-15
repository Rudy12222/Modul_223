import { NextFunction, Request, Response, Router } from "express";
import { ReactionService } from "../services/ReactionService";
import { ReactionType } from "../types/ReactionType";

const router = Router();
const reactionService = new ReactionService();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, userId, postId } = req.body as {
            type?: string;
            userId?: number;
            postId?: number;
        };

        const reaction = reactionService.setReaction(
            parseReactionType(type),
            Number(userId),
            Number(postId)
        );

        res.status(201).json({
            message: "Reaktion erfolgreich gespeichert.",
            reaction: reaction.toObject()
        });
    } catch (error) {
        next(error);
    }
});

router.get("/post/:postId/counts", (req: Request, res: Response, next: NextFunction) => {
    try {
        const counts = reactionService.getReactionCounts(Number(req.params.postId));

        res.json(counts);
    } catch (error) {
        next(error);
    }
});

function parseReactionType(typeValue: string | undefined): ReactionType {
    if (!typeValue || !Object.values(ReactionType).includes(typeValue as ReactionType)) {
        throw new Error("Der Reaktionstyp ist ungültig.");
    }

    return typeValue as ReactionType;
}

export default router;
