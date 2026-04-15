import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const HASH_SEPARATOR = ":";

export function hashPassword(password: string): string {
    validatePassword(password);

    const salt = randomBytes(SALT_LENGTH).toString("hex");
    const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");

    return `${salt}${HASH_SEPARATOR}${hash}`;
}

export function verifyPassword(password: string, storedPasswordHash: string): boolean {
    validatePassword(password);

    const [salt, savedHash] = storedPasswordHash.split(HASH_SEPARATOR);

    if (!salt || !savedHash) {
        return false;
    }

    const calculatedHash = scryptSync(password, salt, KEY_LENGTH);
    const savedHashBuffer = Buffer.from(savedHash, "hex");

    if (calculatedHash.length !== savedHashBuffer.length) {
        return false;
    }

    return timingSafeEqual(calculatedHash, savedHashBuffer);
}

function validatePassword(password: string): void {
    if (!password.trim()) {
        throw new Error("Das Passwort darf nicht leer sein.");
    }
}
