import { createHmac, timingSafeEqual } from "node:crypto";

type AuthTokenPayload = {
    userId: number;
    exp: number;
};

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET ?? "minitwitter-schulprojekt-secret";
const TOKEN_VALIDITY_IN_SECONDS = 60 * 60 * 8;

export function createAuthToken(userId: number): string {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error("Die Benutzer-ID ist ungültig.");
    }

    const payload: AuthTokenPayload = {
        userId,
        exp: getCurrentUnixTime() + TOKEN_VALIDITY_IN_SECONDS
    };

    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signature = sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload {
    if (!token.trim()) {
        throw new Error("Anmeldung erforderlich.");
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
        throw new Error("Das Token ist ungültig.");
    }

    const [encodedPayload, signature] = parts;
    const expectedSignature = sign(encodedPayload);

    if (!signaturesMatch(signature, expectedSignature)) {
        throw new Error("Das Token ist ungültig.");
    }

    const payload = parsePayload(encodedPayload);

    if (!Number.isInteger(payload.userId) || payload.userId <= 0) {
        throw new Error("Das Token ist ungültig.");
    }

    if (!Number.isInteger(payload.exp) || payload.exp < getCurrentUnixTime()) {
        throw new Error("Das Token ist abgelaufen.");
    }

    return payload;
}

function sign(value: string): string {
    return createHmac("sha256", TOKEN_SECRET)
        .update(value)
        .digest("base64url");
}

function signaturesMatch(signature: string, expectedSignature: string): boolean {
    const signatureBuffer = Buffer.from(signature, "utf-8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

    if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
}

function parsePayload(encodedPayload: string): AuthTokenPayload {
    try {
        const payloadText = decodeBase64Url(encodedPayload);

        return JSON.parse(payloadText) as AuthTokenPayload;
    } catch {
        throw new Error("Das Token ist ungültig.");
    }
}

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf-8").toString("base64url");
}

function decodeBase64Url(value: string): string {
    return Buffer.from(value, "base64url").toString("utf-8");
}

function getCurrentUnixTime(): number {
    return Math.floor(Date.now() / 1000);
}
