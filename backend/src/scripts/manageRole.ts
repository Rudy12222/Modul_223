import Database from "better-sqlite3";
import path from "node:path";
import { Role } from "../types/Role";

type UserRow = {
    id: number;
    username: string;
    role: Role;
    blocked: number;
};

const dbPath = path.resolve(__dirname, "../../data/minitwitter.db");
const db = new Database(dbPath);

try {
    const [firstArg, secondArg] = process.argv.slice(2);

    if (!firstArg || firstArg === "help" || firstArg === "--help") {
        printHelp();
        process.exit(0);
    }

    if (firstArg === "list") {
        listUsers();
        process.exit(0);
    }

    const username = firstArg.trim();
    const role = parseRole(secondArg);

    updateUserRole(username, role);
} finally {
    db.close();
}

function listUsers(): void {
    const users = db.prepare(`
        SELECT id, username, role, blocked
        FROM users
        ORDER BY id ASC
    `).all() as UserRow[];

    if (users.length === 0) {
        console.log("Es sind noch keine Benutzer vorhanden.");
        return;
    }

    console.log("Benutzerübersicht:");

    for (const user of users) {
        const blockedText = user.blocked === 1 ? "gesperrt" : "aktiv";
        console.log(`- ID ${user.id}: ${user.username} | Rolle: ${user.role} | Status: ${blockedText}`);
    }
}

function updateUserRole(username: string, role: Role): void {
    if (!username) {
        throw new Error("Der Benutzername darf nicht leer sein.");
    }

    const user = db.prepare(`
        SELECT id, username, role
        FROM users
        WHERE username = ?
    `).get(username) as UserRow | undefined;

    if (!user) {
        throw new Error(`Benutzer "${username}" wurde nicht gefunden.`);
    }

    db.prepare(`
        UPDATE users
        SET role = ?
        WHERE username = ?
    `).run(role, username);

    console.log(`Rolle von ${username} wurde auf ${role} gesetzt.`);

    if (role === Role.USER) {
        console.log("Damit wurden Admin-/Moderator-Rechte entfernt.");
    }
}

function parseRole(roleValue: string | undefined): Role {
    if (!roleValue) {
        throw new Error("Bitte gib eine Rolle an: USER, MODERATOR oder ADMIN.");
    }

    if (!Object.values(Role).includes(roleValue as Role)) {
        throw new Error("Ungültige Rolle. Erlaubt sind: USER, MODERATOR, ADMIN.");
    }

    return roleValue as Role;
}

function printHelp(): void {
    console.log("Rollen-Script für MiniTwitter");
    console.log("");
    console.log("Verwendung:");
    console.log("  npm run manage-role -- list");
    console.log("  npm run manage-role -- <username> <role>");
    console.log("");
    console.log("Beispiele:");
    console.log("  npm run manage-role -- anwar ADMIN");
    console.log("  npm run manage-role -- anwar MODERATOR");
    console.log("  npm run manage-role -- anwar USER");
    console.log("");
    console.log("Hinweis:");
    console.log("  USER entfernt Admin-/Moderator-Rechte wieder.");
}
