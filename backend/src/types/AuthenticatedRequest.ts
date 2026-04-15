import { Request } from "express";
import { Role } from "./Role";

export type AuthenticatedUser = {
    id: number;
    username: string;
    role: Role;
    blocked: boolean;
};

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}
