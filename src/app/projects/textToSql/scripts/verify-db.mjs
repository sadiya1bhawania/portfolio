import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "src/app/projects/textToSql/data/chinook.db");

const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

console.log("Readonly:", db.readonly);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  .all()
  .map((row) => row.name);

console.log("Tables:", tables);

try {
  db.exec("CREATE TABLE should_fail (id INTEGER)");
  console.log("WARNING: write succeeded, connection is not readonly!");
} catch (err) {
  console.log("Write attempt correctly rejected:", err.message);
}

db.close();
