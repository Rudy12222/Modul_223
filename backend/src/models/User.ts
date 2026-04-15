import { IUser } from "../interfaces/IUser";
import { Role } from "../types/Role";

export class User implements IUser {
    private readonly _id?: number;
    private _username: string;
    private _passwordHash: string;
    private _role: Role;
    private _blocked: boolean;
    private _createdAt: string;

    public constructor(userData: IUser) {
        const username = userData.username.trim();

        if (!username) {
            throw new Error("Der Benutzername darf nicht leer sein.");
        }

        if (!userData.passwordHash) {
            throw new Error("Der Passwort-Hash darf nicht leer sein.");
        }

        this._id = userData.id;
        this._username = username;
        this._passwordHash = userData.passwordHash;
        this._role = userData.role ?? Role.USER;
        this._blocked = userData.blocked ?? false;
        this._createdAt = userData.createdAt ?? new Date().toISOString();
    }

    public get id(): number | undefined {
        return this._id;
    }

    public get username(): string {
        return this._username;
    }

    public get passwordHash(): string {
        return this._passwordHash;
    }

    public get role(): Role {
        return this._role;
    }

    public get blocked(): boolean {
        return this._blocked;
    }

    public get createdAt(): string {
        return this._createdAt;
    }

    public updateUsername(newUsername: string): void {
        const username = newUsername.trim();

        if (!username) {
            throw new Error("Der Benutzername darf nicht leer sein.");
        }

        this._username = username;
    }

    public updatePasswordHash(newPasswordHash: string): void {
        if (!newPasswordHash) {
            throw new Error("Der Passwort-Hash darf nicht leer sein.");
        }

        this._passwordHash = newPasswordHash;
    }

    public setRole(role: Role): void {
        this._role = role;
    }

    public block(): void {
        this._blocked = true;
    }

    public unblock(): void {
        this._blocked = false;
    }

    public toObject(): IUser {
        return {
            id: this._id,
            username: this._username,
            passwordHash: this._passwordHash,
            role: this._role,
            blocked: this._blocked,
            createdAt: this._createdAt
        };
    }
}
