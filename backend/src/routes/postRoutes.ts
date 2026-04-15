import { NextFunction, Response, Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { PostService } from "../services/PostService";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

const router = Router();
const postService = new PostService();

router.use(requireAuth);

router.get("/feed", (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const posts = postService.getFeed().map((post) => post.toObject());

        res.json({ posts });
    } catch (error) {
        next(error);
    }
});

router.post("/", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { content } = req.body as {
            content?: string;
        };

        const post = postService.createPost(content ?? "", req.user!.id);

        res.status(201).json({
            message: "Beitrag erfolgreich erstellt.",
            post: post.toObject()
        });
    } catch (error) {
        next(error);
    }
});

router.patch("/:postId", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { content } = req.body as {
            content?: string;
        };

        const post = postService.updatePost(
            Number(req.params.postId),
            content ?? "",
            req.user!.id,
            req.user!.role
        );

        res.json({
            message: "Beitrag erfolgreich aktualisiert.",
            post: post.toObject()
        });
    } catch (error) {
        next(error);
    }
});

router.delete("/:postId", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        postService.deletePost(
            Number(req.params.postId),
            req.user!.id,
            req.user!.role
        );

        res.json({ message: "Beitrag erfolgreich gelöscht." });
    } catch (error) {
        next(error);
    }
});

export default router;
