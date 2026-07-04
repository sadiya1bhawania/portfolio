import "server-only";
import { randomUUID } from "node:crypto";
import type { ExtractedFields } from "./extractionService";

export interface CommittedRecord {
  id: string;
  fields: ExtractedFields;
  committedAt: string;
  clicks: number;
}

// In-memory only, per the batch scope — resets on server restart, no DB yet.
const records: CommittedRecord[] = [];

export function commitRecord(fields: ExtractedFields): CommittedRecord {
  const record: CommittedRecord = {
    id: randomUUID(),
    fields,
    committedAt: new Date().toISOString(),
    clicks: 0,
  };
  records.push(record);
  return record;
}

export function getRecords(): CommittedRecord[] {
  return [...records];
}
