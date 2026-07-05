import "server-only";
import { randomUUID } from "node:crypto";
import type { RuleId } from "./policyTypes";

export interface RunHistoryRuleResult {
  rule: RuleId;
  pass: boolean;
}

export interface RunHistoryEntry {
  id: string;
  timestamp: string;
  documentName: string;
  ruleResults: RunHistoryRuleResult[];
  outcome: "committed" | "resolved_by_ai" | "escalated";
  /** did ai_review fire on this run? only ever true from the demo pipeline */
  aiReviewFired: boolean;
  policyVersion: number;
}

// In-memory only, per the batch scope - resets on server restart, no DB yet.
const history: RunHistoryEntry[] = [];

export function appendHistoryEntry(entry: Omit<RunHistoryEntry, "id">): RunHistoryEntry {
  const full: RunHistoryEntry = { id: randomUUID(), ...entry };
  history.unshift(full);
  return full;
}

// Reverse-chronological - most recent run first.
export function getHistory(): RunHistoryEntry[] {
  return [...history];
}
