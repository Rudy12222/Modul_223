import db from "../db/database";
import { User } from "../models/User";
import { Role } from "../types/Role";
import { hashPassword, verifyPassword } from "../utils/password";

type UserRow = {
    id: number;
    username: string;
    password_hash: string;
    role: Role;
    blocked: number;
    created_at: string;
};

export class AuthService {
    private readonly findUserByUsernameStatement = db.prepare(`
        SELECT id, username, password_hash, role, blocked, created_at
        FROM users
        WHERE username = ?
    `);

    private readonly findUserByIdStatement = db.prepare(`
        SELECT id, username, password_hash, role, blocked, created_at
        FROM users
        WHERE id = ?
    `);

    private readonly createUserStatement = db.prepare(`
        INSERT INTO users (username, password_hash, role, blocked)
        VALUES (?, ?, ?, ?)
    `);

    public register(username: string, password: string): User {
        const normalizedUsername = this.validateUsername(username);
        this.validatePassword(password);

        if (this.usernameExists(normalizedUsername)) {
            throw new Error("Der Benutzername ist bereits vergeben.");
        }

        const passwordHash = hashPassword(password);
        const result = this.createUserStatement.run(normalizedUsername, passwordHash, Role.USER, 0);
        const createdUser = this.findUserRowById(Number(result.lastInsertRowid));

        if (!createdUser) {
            throw new Error("Der Benutzer konnte nicht erstellt werden.");
        }

        return this.mapRowToUser(createdUser);
    }

    public login(username: string, password: string): User {
        const normalizedUsername = this.validateUsername(username);
        this.validatePassword(password);

        const userRow = this.findUserRowByUsername(normalizedUsername);

        if (!userRow) {
            throw new Error("Benutzername oder Passwort ist falsch.");
        }

        if (Boolean(userRow.blocked)) {
            throw new Error("Dieser Benutzer ist gesperrt.");
        }

        const passwordIsCorrect = verifyPassword(password, userRow.password_hash);

        if (!passwordIsCorrect) {
            throw new Error("Benutzername oder Passwort ist falsch.");
        }

        return this.mapRowToUser(userRow);
    }

    public usernameExists(username: string): boolean {
        const normalizedUsername = this.validateUsername(username);

        return this.findUserRowByUsername(normalizedUsername) !== undefined;
    }

    private findUserRowByUsername(username: string): UserRow | undefined {
        return this.findUserByUsernameStatement.get(username) as UserRow | undefined;
    }

    private findUserRowById(id: number): UserRow | undefined {
        return this.findUserByIdStatement.get(id) as UserRow | undefined;
    }

    private mapRowToUser(userRow: UserRow): User {
        return new User({
            id: userRow.id,
            username: userRow.username,
            passwordHash: userRow.password_hash,
            role: userRow.role,
            blocked: Boolean(userRow.blocked),
            createdAt: userRow.created_at
        });
    }

    private validateUsername(username: string): string {
        const normalizedUsername = username.trim();

        if (!normalizedUsername) {
            throw new Error("Der Benutzername darf nicht leer sein.");
        }

        return normalizedUsername;
    }

    private validatePassword(password: string): void {
        if (!password.trim()) {
            throw new Error("Das Passwort darf nicht leer sein.");
        }
    }
}
