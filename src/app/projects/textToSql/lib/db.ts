import "server-only";
import path from "node:path";
import Database from "better-sqlite3";

export const DB_PATH = path.join(process.cwd(), "src/app/projects/textToSql/data/chinook.db");

declare global {
  var __chinookDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  return new Database(DB_PATH, { readonly: true, fileMustExist: true });
}

export const db = globalThis.__chinookDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__chinookDb = db;
}
