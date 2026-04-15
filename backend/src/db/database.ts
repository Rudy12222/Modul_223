import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../../data");
const dbPath = path.join(dataDir, "minitwitter.db");

const schemaPathCandidates = [
    path.resolve(__dirname, "schema.sql"),
    path.resolve(__dirname, "../../src/db/schema.sql"),
    path.resolve(process.cwd(), "src/db/schema.sql"),
    path.resolve(process.cwd(), "backend/src/db/schema.sql")
];

const schemaPath = schemaPathCandidates.find((candidate) => fs.existsSync(candidate));

if (!schemaPath) {
    throw new Error("schema.sql wurde nicht gefunden.");
}

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);

export default db;
