import Database from "better-sqlite3";

const [, , dbPath, sql] = process.argv;

try {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  const statement = db.prepare(sql);
  const rows = statement.all();
  const columns = statement.columns().map((c) => c.name);
  db.close();
  process.stdout.write(JSON.stringify({ ok: true, rows, columns }));
} catch (err) {
  process.stdout.write(JSON.stringify({ ok: false, error: err.message }));
}
