import "server-only";
import type { Policy } from "./policyTypes";

export interface PolicyCounts {
  committed: number;
  resolvedByAi: number;
  escalated: number;
}

export type RunOutcome = "committed" | "resolved_by_ai" | "escalated";

// In-memory only, per the batch scope - resets on server restart, no DB yet.
let activePolicy: Policy | null = null;
let policyVersion = 0;
const counts: PolicyCounts = { committed: 0, resolvedByAi: 0, escalated: 0 };

export function setActivePolicy(policy: Policy): void {
  activePolicy = policy;
  policyVersion += 1;
}

export function getActivePolicy(): Policy | null {
  return activePolicy;
}

export function getPolicyVersion(): number {
  return policyVersion;
}

export function getCounts(): PolicyCounts {
  return { ...counts };
}

export function recordOutcome(outcome: RunOutcome): void {
  if (outcome === "committed") counts.committed += 1;
  else if (outcome === "resolved_by_ai") counts.resolvedByAi += 1;
  else counts.escalated += 1;
}
