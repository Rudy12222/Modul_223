import { NextFunction, Request, Response, Router } from "express";
import { CommentService } from "../services/CommentService";
import { Role } from "../types/Role";

const router = Router();
const commentService = new CommentService();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { content, userId, postId } = req.body as {
            content?: string;
            userId?: number;
            postId?: number;
        };

        const comment = commentService.createComment(
            content ?? "",
            Number(userId),
            Number(postId)
        );

        res.status(201).json({
            message: "Kommentar erfolgreich erstellt.",
            comment: comment.toObject()
        });
    } catch (error) {
        next(error);
    }
});

router.patch("/:commentId", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { content, actorUserId, actorRole } = req.body as {
            content?: string;
            actorUserId?: number;
            actorRole?: string;
        };

        const comment = commentService.updateComment(
            Number(req.params.commentId),
            content ?? "",
            Number(actorUserId),
            parseRole(actorRole)
        );

        res.json({
            message: "Kommentar erfolgreich aktualisiert.",
            comment: comment.toObject()
        });
    } catch (error) {
        next(error);
    }
});

router.delete("/:commentId", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { actorUserId, actorRole } = req.body as {
            actorUserId?: number;
            actorRole?: string;
        };

        commentService.deleteComment(
            Number(req.params.commentId),
            Number(actorUserId),
            parseRole(actorRole)
        );

        res.json({ message: "Kommentar erfolgreich gelöscht." });
    } catch (error) {
        next(error);
    }
});

function parseRole(roleValue: string | undefined): Role {
    if (!roleValue || !Object.values(Role).includes(roleValue as Role)) {
        throw new Error("Die Rolle ist ungültig.");
    }

    return roleValue as Role;
}

export default router;
