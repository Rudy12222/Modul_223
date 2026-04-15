import { NextFunction, Response, Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { CommentService } from "../services/CommentService";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

const router = Router();
const commentService = new CommentService();

router.use(requireAuth);

router.post("/", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { content, postId } = req.body as {
            content?: string;
            postId?: number;
        };

        const comment = commentService.createComment(
            content ?? "",
            req.user!.id,
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

router.patch("/:commentId", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { content } = req.body as {
            content?: string;
        };

        const comment = commentService.updateComment(
            Number(req.params.commentId),
            content ?? "",
            req.user!.id,
            req.user!.role
        );

        res.json({
            message: "Kommentar erfolgreich aktualisiert.",
            comment: comment.toObject()
        });
    } catch (error) {
        next(error);
    }
});

router.delete("/:commentId", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        commentService.deleteComment(
            Number(req.params.commentId),
            req.user!.id,
            req.user!.role
        );

        res.json({ message: "Kommentar erfolgreich gelöscht." });
    } catch (error) {
        next(error);
    }
});

export default router;
