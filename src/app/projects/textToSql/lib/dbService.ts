import "server-only";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { DB_PATH } from "./db";

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export class UnsafeSqlError extends Error {}
export class QueryTimeoutError extends Error {}

const QUERY_TIMEOUT_MS = 5000;
const DEFAULT_LIMIT = 100;
const WORKER_PATH = path.join(process.cwd(), "src/app/projects/textToSql/lib/queryWorker.mjs");

const BANNED_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|ATTACH|DETACH|PRAGMA|CREATE|REPLACE|VACUUM|REINDEX|TRUNCATE|GRANT|REVOKE|BEGIN|COMMIT|ROLLBACK)\b/i;

function assertSingleReadOnlySelect(sql: string): string {
  const trimmed = sql.trim().replace(/;+\s*$/, "");

  if (trimmed.length === 0) {
    throw new UnsafeSqlError("Query is empty.");
  }
  if (trimmed.includes(";")) {
    throw new UnsafeSqlError("Only a single statement is allowed.");
  }
  if (!/^select\b/i.test(trimmed)) {
    throw new UnsafeSqlError("Only SELECT statements are allowed.");
  }
  if (BANNED_KEYWORDS.test(trimmed)) {
    throw new UnsafeSqlError("Query contains a disallowed keyword.");
  }

  return trimmed;
}

function ensureLimit(sql: string): string {
  if (/\blimit\s+\d+/i.test(sql)) {
    return sql;
  }
  return `${sql} LIMIT ${DEFAULT_LIMIT}`;
}

export function runQuery(sql: string): QueryResult {
  const safeSql = ensureLimit(assertSingleReadOnlySelect(sql));

  let stdout: string;
  try {
    stdout = execFileSync(process.execPath, [WORKER_PATH, DB_PATH, safeSql], {
      timeout: QUERY_TIMEOUT_MS,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException & { signal?: string };
    if (nodeErr.signal === "SIGTERM" || nodeErr.code === "ETIMEDOUT") {
      throw new QueryTimeoutError(`Query exceeded ${QUERY_TIMEOUT_MS}ms timeout.`);
    }
    throw err;
  }

  const result = JSON.parse(stdout) as
    | { ok: true; rows: Record<string, unknown>[]; columns: string[] }
    | { ok: false; error: string };

  if (!result.ok) {
    throw new Error(result.error);
  }

  return { rows: result.rows, columns: result.columns };
}
