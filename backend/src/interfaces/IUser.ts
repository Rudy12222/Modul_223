import { Role } from "../types/Role";

export interface IUser {
    id?: number;
    username: string;
    passwordHash: string;
    role?: Role;
    blocked?: boolean;
    createdAt?: string;
}
