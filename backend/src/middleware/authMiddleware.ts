import { NextFunction, Response } from "express";
import { UserService } from "../services/UserService";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";
import { Role } from "../types/Role";
import { verifyAuthToken } from "../utils/authToken";

const userService = new UserService();

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    try {
        const token = extractBearerToken(req.header("authorization"));
        const payload = verifyAuthToken(token);
        const user = userService.getUserById(payload.userId);

        if (user.blocked) {
            throw new Error("Dieser Benutzer ist gesperrt.");
        }

        if (user.id === undefined) {
            throw new Error("Der Benutzer wurde nicht gefunden.");
        }

        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            blocked: user.blocked
        };

        next();
    } catch (error) {
        next(error);
    }
}

export function requireRole(...allowedRoles: Role[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new Error("Anmeldung erforderlich.");
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new Error("Sie dürfen auf diese Route nicht zugreifen.");
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export function requireSameUserOrAdmin(paramName: string) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new Error("Anmeldung erforderlich.");
            }

            const targetUserId = Number(req.params[paramName]);

            if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
                throw new Error("Die Benutzer-ID ist ungültig.");
            }

            if (req.user.role === Role.ADMIN || req.user.id === targetUserId) {
                next();
                return;
            }

            throw new Error("Sie dürfen auf dieses Benutzerprofil nicht zugreifen.");
        } catch (error) {
            next(error);
        }
    };
}

function extractBearerToken(authorizationHeader: string | undefined): string {
    if (!authorizationHeader) {
        throw new Error("Anmeldung erforderlich.");
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        throw new Error("Das Token ist ungültig.");
    }

    return token;
}
