import "server-only";
import { db } from "./db";
import { fewShotExamples, type FewShotExample } from "./fewShotExamples";

interface SqliteMasterRow {
  sql: string;
}

function introspectSchema(): string {
  const rows = db
    .prepare<[], SqliteMasterRow>(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND sql IS NOT NULL ORDER BY name"
    )
    .all();

  return rows.map((row) => `${row.sql.trim()};`).join("\n\n");
}

export const schemaDDL = introspectSchema();

export { fewShotExamples, type FewShotExample };
