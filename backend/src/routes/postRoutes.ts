import { NextFunction, Request, Response, Router } from "express";
import { PostService } from "../services/PostService";
import { Role } from "../types/Role";

const router = Router();
const postService = new PostService();

router.get("/feed", (_req: Request, res: Response, next: NextFunction) => {
    try {
        const posts = postService.getFeed().map((post) => post.toObject());

        res.json({ posts });
    } catch (error) {
        next(error);
    }
});

router.post("/", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { content, userId } = req.body as {
            content?: string;
            userId?: number;
        };

        const post = postService.createPost(content ?? "", Number(userId));

        res.status(201).json({
            message: "Beitrag erfolgreich erstellt.",
            post: post.toObject()
        });
    } catch (error) {
        next(error);
    }
});

router.patch("/:postId", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { content, actorUserId, actorRole } = req.body as {
            content?: string;
            actorUserId?: number;
            actorRole?: string;
        };

        const post = postService.updatePost(
            Number(req.params.postId),
            content ?? "",
            Number(actorUserId),
            parseRole(actorRole)
        );

        res.json({
            message: "Beitrag erfolgreich aktualisiert.",
            post: post.toObject()
        });
    } catch (error) {
        next(error);
    }
});

router.delete("/:postId", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { actorUserId, actorRole } = req.body as {
            actorUserId?: number;
            actorRole?: string;
        };

        postService.deletePost(
            Number(req.params.postId),
            Number(actorUserId),
            parseRole(actorRole)
        );

        res.json({ message: "Beitrag erfolgreich gelöscht." });
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
