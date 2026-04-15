import "./db/database";
import path from "node:path";
import express, { NextFunction, Request, Response } from "express";
import authRoutes from "./routes/authRoutes";
import commentRoutes from "./routes/commentRoutes";
import postRoutes from "./routes/postRoutes";
import reactionRoutes from "./routes/reactionRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_PATH = path.resolve(__dirname, "../../frontend");

app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ message: "MiniTwitter API läuft." });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/users", userRoutes);
app.use(express.static(FRONTEND_PATH));

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Route wurde nicht gefunden." });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = getStatusCode(error.message);

    res.status(statusCode).json({
        error: error.message || "Interner Serverfehler."
    });
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}.`);
});

function getStatusCode(message: string): number {
    if (
        message.includes("Anmeldung erforderlich")
        || message.includes("Token")
    ) {
        return 401;
    }

    if (
        message.includes("nicht gefunden")
        || message.includes("wurde nicht gefunden")
    ) {
        return 404;
    }

    if (
        message.includes("dürfen")
        || message.includes("Nur Administratoren")
        || message.includes("gesperrt")
    ) {
        return 403;
    }

    if (message.includes("bereits vergeben")) {
        return 409;
    }

    return 400;
}
