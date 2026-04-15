import { NextFunction, Response, Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { ReactionService } from "../services/ReactionService";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";
import { ReactionType } from "../types/ReactionType";

const router = Router();
const reactionService = new ReactionService();

router.use(requireAuth);

router.post("/", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { type, postId } = req.body as {
            type?: string;
            postId?: number;
        };

        const reaction = reactionService.setReaction(
            parseReactionType(type),
            req.user!.id,
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

router.get("/post/:postId/counts", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
