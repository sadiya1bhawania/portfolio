import "server-only";
import type { RunEvent } from "./runPipelineTypes";
import { extractFields, type ExtractedFields } from "./extractionService";
import { getDemoSample, renderDemoDocumentText, getDemoFallbackFields, type DemoSampleId } from "./demoService";
import { evaluateRule, decide, type RuleResult } from "./policyEngine";
import { getActivePolicy, getCounts, getPolicyVersion, recordOutcome } from "./serverPolicyState";
import { commitRecord } from "./recordStore";
import { composeEscalationEmail } from "./escalationService";
import { appendHistoryEntry, type RunHistoryEntry } from "./runHistory";
import { RULES, type Policy } from "./policyTypes";

const STAGE_DELAY_MS = 400;
export const RULE_DELAY_MS = 250;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RunInput {
  /** present when the user picked one of the three fixed samples */
  sampleId?: DemoSampleId;
  /** present when the user dropped/uploaded a file and its text was read client-side */
  documentText?: string;
  /** display name for the log - the uploaded file's name, or the sample's label */
  documentName?: string;
}

// extract - the one model-backed stage. AI infers field values + confidence;
// everything downstream treats those as data, not as instructions.
async function* runExtractStage(input: RunInput, out: { fields?: ExtractedFields }): AsyncGenerator<RunEvent> {
  const sample = input.sampleId ? getDemoSample(input.sampleId) : undefined;
  const documentText = input.documentText ?? (sample ? renderDemoDocumentText(sample) : "");
  const fallback = sample ? getDemoFallbackFields(sample) : {};

  let finalFields: ExtractedFields | undefined;
  let usedFallback = false;

  try {
    for await (const event of extractFields(documentText)) {
      if (event.type === "field") {
        yield { stage: "extract", status: "active", field: event.field, value: event.value, confidence: event.confidence };
      } else if (event.type === "complete") {
        finalFields = event.fields;
      } else if (event.type === "parseFailed") {
        finalFields = fallback;
        usedFallback = true;
      }
    }
  } catch {
    // Gemini call itself failed (missing key, network, etc.) - never break the pipeline.
    finalFields = fallback;
    usedFallback = true;
  }

  out.fields = finalFields ?? fallback;
  yield { stage: "extract", status: "done", fields: out.fields, usedFallback };
}

// load_policy - pure lookup + formatting, no inference. Reads whatever was
// last activated on /configure and reports it plus this session's tally.
// Exported: reused by the demo's richer pipeline (lib/demoPipelineService.ts).
export function* runLoadPolicyStage(out: { policy?: Policy }): Generator<RunEvent> {
  yield { stage: "load_policy", status: "active" };

  const policy = getActivePolicy();
  if (!policy) {
    yield { stage: "load_policy", status: "error", error: "No active policy - configure one first." };
    return;
  }

  out.policy = policy;
  const ruleLabels = policy.activeRules.map((id) => RULES.find((r) => r.id === id)?.label ?? id);
  const summary = `Policy: ${ruleLabels.join(" + ")}. Escalate to ${policy.escalateTo}.`;

  yield { stage: "load_policy", status: "done", policySummary: summary, counts: getCounts() };
}

// evaluate - deterministic rule engine. Runs only the two rules the active
// policy turned on, against the fields extract() produced.
async function* runEvaluateStage(policy: Policy, fields: ExtractedFields, out: { results?: RuleResult[] }): AsyncGenerator<RunEvent> {
  yield { stage: "evaluate", status: "active" };

  const results: RuleResult[] = [];
  for (const rule of policy.activeRules) {
    await delay(RULE_DELAY_MS);
    const result = evaluateRule(rule, fields, policy.ruleParams);
    results.push(result);
    yield {
      stage: "evaluate",
      status: "active",
      rule: result.rule,
      pass: result.pass,
      detail: result.detail,
      ruleFields: result.fields,
      ruleBadValues: result.badValues,
    };
  }

  out.results = results;
  yield { stage: "evaluate", status: "done", results };
}

// decide - pure branch, no model call. All rules pass -> commit; any fail ->
// escalate, carrying the failed rules along for act() to act on.
// Exported: reused by the demo's richer pipeline (lib/demoPipelineService.ts).
export function* runDecideStage(
  results: RuleResult[],
  out: { branch?: "commit" | "escalate"; failedRules?: RuleResult[] }
): Generator<RunEvent> {
  yield { stage: "decide", status: "active" };

  const { branch, failedRules } = decide(results);
  out.branch = branch;
  out.failedRules = failedRules;

  yield { stage: "decide", status: "done", branch, failedRules };
}

// act - executes the branch decide() already fixed. Gemini is only ever
// consulted to word the escalation email; it cannot flip commit <-> escalate.
// Exported: reused by the demo's richer pipeline (lib/demoPipelineService.ts).
export async function* runActStage(
  branch: "commit" | "escalate",
  policy: Policy,
  fields: ExtractedFields,
  failedRules: RuleResult[],
  policyVersion: number,
  out: { actionAt?: string }
): AsyncGenerator<RunEvent> {
  yield { stage: "act", status: "active" };
  const actionAt = new Date().toISOString();
  out.actionAt = actionAt;

  if (branch === "commit") {
    const record = commitRecord(fields);
    yield {
      stage: "act",
      status: "done",
      commitStatus: "committed",
      clicks: 0,
      recordId: record.id,
      actionAt,
      policyVersion,
    };
    return;
  }

  const email = await composeEscalationEmail(failedRules, policy.escalateTo);
  yield {
    stage: "act",
    status: "done",
    commitStatus: "escalated",
    emailSubject: email.subject,
    emailBody: email.body,
    escalateTo: policy.escalateTo,
    actionAt,
    policyVersion,
  };
}

// log - appends this run to the in-memory session ledger that /log reads.
// Exported: reused by the demo's richer pipeline (lib/demoPipelineService.ts),
// which is the only caller that ever passes outcome "resolved_by_ai" or
// aiReviewFired: true - the standalone pipeline has no ai_review stage.
export function* runLogStage(
  policy: Policy,
  documentName: string,
  results: RuleResult[],
  outcome: RunHistoryEntry["outcome"],
  aiReviewFired: boolean,
  policyVersion: number,
  actionAt: string
): Generator<RunEvent> {
  yield { stage: "log", status: "active" };

  appendHistoryEntry({
    timestamp: actionAt,
    documentName,
    ruleResults: results.map((r) => ({ rule: r.rule, pass: r.pass })),
    outcome,
    aiReviewFired,
    policyVersion,
  });

  yield { stage: "log", status: "done" };
}

export async function* runPipeline(input: RunInput): AsyncGenerator<RunEvent> {
  const extracted: { fields?: ExtractedFields } = {};
  yield* runExtractStage(input, extracted);
  if (!extracted.fields) return;

  const loaded: { policy?: Policy } = {};
  yield* runLoadPolicyStage(loaded);
  if (!loaded.policy) return;

  const evaluated: { results?: RuleResult[] } = {};
  yield* runEvaluateStage(loaded.policy, extracted.fields, evaluated);
  if (!evaluated.results) return;

  const decided: { branch?: "commit" | "escalate"; failedRules?: RuleResult[] } = {};
  yield* runDecideStage(evaluated.results, decided);
  if (!decided.branch) return;

  recordOutcome(decided.branch === "commit" ? "committed" : "escalated");

  const policyVersion = getPolicyVersion();
  const acted: { actionAt?: string } = {};
  yield* runActStage(decided.branch, loaded.policy, extracted.fields, decided.failedRules ?? [], policyVersion, acted);

  const documentName = input.documentName ?? (input.sampleId ? getDemoSample(input.sampleId).label : "Document");
  await delay(STAGE_DELAY_MS);
  yield* runLogStage(
    loaded.policy,
    documentName,
    evaluated.results,
    decided.branch === "commit" ? "committed" : "escalated",
    false,
    policyVersion,
    acted.actionAt ?? new Date().toISOString()
  );
}
