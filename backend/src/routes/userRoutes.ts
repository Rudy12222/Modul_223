import { NextFunction, Request, Response, Router } from "express";
import { User } from "../models/User";
import { UserService } from "../services/UserService";
import { Role } from "../types/Role";

const router = Router();
const userService = new UserService();

router.get("/check-username", (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = String(req.query.username ?? "");
        const excludeUserId = req.query.excludeUserId !== undefined
            ? Number(req.query.excludeUserId)
            : undefined;

        const exists = userService.usernameExists(username, excludeUserId);

        res.json({
            username,
            available: !exists
        });
    } catch (error) {
        next(error);
    }
});

router.get("/:userId", (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = userService.getUserById(Number(req.params.userId));

        res.json({ user: serializeUser(user) });
    } catch (error) {
        next(error);
    }
});

router.patch("/:userId/profile", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, newPassword } = req.body as {
            username?: string;
            newPassword?: string;
        };

        const user = userService.updateProfile(
            Number(req.params.userId),
            username ?? "",
            newPassword
        );

        res.json({
            message: "Profil erfolgreich aktualisiert.",
            user: serializeUser(user)
        });
    } catch (error) {
        next(error);
    }
});

router.get("/:userId/activity", (req: Request, res: Response, next: NextFunction) => {
    try {
        const activity = userService.getUserActivity(Number(req.params.userId));

        res.json({
            posts: activity.posts.map((post) => post.toObject()),
            comments: activity.comments.map((comment) => comment.toObject())
        });
    } catch (error) {
        next(error);
    }
});

router.patch("/:userId/block", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { actorRole } = req.body as {
            actorRole?: string;
        };

        const user = userService.blockUser(
            Number(req.params.userId),
            parseRole(actorRole)
        );

        res.json({
            message: "Benutzer erfolgreich gesperrt.",
            user: serializeUser(user)
        });
    } catch (error) {
        next(error);
    }
});

router.patch("/:userId/unblock", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { actorRole } = req.body as {
            actorRole?: string;
        };

        const user = userService.unblockUser(
            Number(req.params.userId),
            parseRole(actorRole)
        );

        res.json({
            message: "Benutzer erfolgreich entsperrt.",
            user: serializeUser(user)
        });
    } catch (error) {
        next(error);
    }
});

function serializeUser(user: User) {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        blocked: user.blocked,
        createdAt: user.createdAt
    };
}

function parseRole(roleValue: string | undefined): Role {
    if (!roleValue || !Object.values(Role).includes(roleValue as Role)) {
        throw new Error("Die Rolle ist ungültig.");
    }

    return roleValue as Role;
}

export default router;
