import Database from "better-sqlite3";

import { databaseFilePath, initDatabase } from "./client";

initDatabase();

const sqlite = new Database(databaseFilePath, { readonly: true });
const table = sqlite
  .prepare(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
    `,
  )
  .get("tasks");

if (!table) {
  throw new Error("Database initialization did not create the tasks table.");
}

console.log(`Database initialized at ${databaseFilePath}`);
