import { NextFunction, Request, Response, Router } from "express";
import { User } from "../models/User";
import { AuthService } from "../services/AuthService";
import { createAuthToken } from "../utils/authToken";

const router = Router();
const authService = new AuthService();

router.post("/register", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body as {
            username?: string;
            password?: string;
        };

        const user = authService.register(username ?? "", password ?? "");

        res.status(201).json({
            message: "Benutzer erfolgreich registriert.",
            user: serializeUser(user)
        });
    } catch (error) {
        next(error);
    }
});

router.post("/login", (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body as {
            username?: string;
            password?: string;
        };

        const user = authService.login(username ?? "", password ?? "");

        if (user.id === undefined) {
            throw new Error("Der Benutzer wurde nicht gefunden.");
        }

        const token = createAuthToken(user.id);

        res.json({
            message: "Login erfolgreich.",
            token,
            user: serializeUser(user)
        });
    } catch (error) {
        next(error);
    }
});

router.get("/check-username", (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = String(req.query.username ?? "");
        const exists = authService.usernameExists(username);

        res.json({
            username,
            available: !exists
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

export default router;
