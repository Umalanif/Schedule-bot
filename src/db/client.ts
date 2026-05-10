import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const databaseFilePath = path.resolve(process.cwd(), "data", "tasks.sqlite");
fs.mkdirSync(path.dirname(databaseFilePath), { recursive: true });

const sqlite = new Database(databaseFilePath);

export function initDatabase(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      description TEXT NOT NULL,
      scheduled_for INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
}

export const db = drizzle(sqlite, { schema });
export { databaseFilePath };
