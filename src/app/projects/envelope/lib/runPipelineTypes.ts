// "ai_review" only ever fires in the demo's richer pipeline (lib/demoPipelineService.ts) —
// the standalone /run pipeline never emits it, so RUN_STAGE_ORDER (used by the
// standalone page's RunStageRail) deliberately excludes it.
export type RunStage = "extract" | "load_policy" | "evaluate" | "ai_review" | "decide" | "act" | "log";
export type RunStatus = "active" | "done" | "error";

export const RUN_STAGE_ORDER: RunStage[] = [
  "extract",
  "load_policy",
  "evaluate",
  "decide",
  "act",
  "log",
];

export const RUN_STAGE_LABEL: Record<RunStage, string> = {
  extract: "Extract",
  load_policy: "Load policy",
  evaluate: "Evaluate",
  ai_review: "AI review",
  decide: "Decide",
  act: "Act",
  log: "Log",
};

// Shared by RunStageRail and the demo's PipelineFlowchart: the first
// not-done stage reads as "active" while a run is in flight.
export function computeDisplayStatus(
  stageStatus: Partial<Record<RunStage, RunStatus>>,
  isRunning: boolean
): Partial<Record<RunStage, RunStatus>> {
  const currentStageIndex = RUN_STAGE_ORDER.findIndex((s) => stageStatus[s] !== "done");
  const displayStatus: Partial<Record<RunStage, RunStatus>> = { ...stageStatus };
  if (isRunning && currentStageIndex !== -1) {
    displayStatus[RUN_STAGE_ORDER[currentStageIndex]] = "active";
  }
  return displayStatus;
}

import type { RuleId } from "./policyTypes";

export interface RuleResultSummary {
  rule: RuleId;
  pass: boolean;
  detail: string;
  fields: string[];
  badValues: string[];
}

export interface RunEvent {
  stage: RunStage;
  status: RunStatus;
  error?: string;
  /** extract stage: one field resolved from the streaming Gemini response */
  field?: string;
  value?: unknown;
  confidence?: number;
  /** extract stage: emitted once, on the final "done" event */
  fields?: Record<string, { value: unknown; confidence: number }>;
  usedFallback?: boolean;
  /** load_policy stage: emitted once, on the "done" event */
  policySummary?: string;
  counts?: { committed: number; resolvedByAi: number; escalated: number };
  /** evaluate stage: one rule result per "active" event, as each rule runs */
  rule?: RuleId;
  pass?: boolean;
  detail?: string;
  ruleFields?: string[];
  ruleBadValues?: string[];
  /** evaluate stage: emitted once, on the final "done" event */
  results?: RuleResultSummary[];
  /** decide stage: emitted once, on the "done" event */
  branch?: "commit" | "escalate";
  failedRules?: RuleResultSummary[];
  /** act stage, commit path */
  commitStatus?: "committed" | "escalated";
  clicks?: number;
  recordId?: string;
  /** act stage, escalate path — composed for preview, never sent */
  emailSubject?: string;
  emailBody?: string;
  escalateTo?: string;
  /** act stage: emitted on both paths, for the audit line */
  actionAt?: string;
  policyVersion?: number;
  /** ai_review stage (demo pipeline only): emitted once, on the "done" event */
  resolutionNote?: string;
  resolvedFields?: string[];
  resolvedFieldChanges?: { field: string; before: unknown; after: unknown }[];
}
