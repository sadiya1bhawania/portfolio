import "server-only";
import type { RunEvent } from "./runPipelineTypes";
import { extractFields, type ExtractedFields } from "./extractionService";
import { evaluateRule, type RuleResult } from "./policyEngine";
import {
  getDemoSample,
  renderDemoDocumentText,
  getDemoFallbackFields,
  applyCarefulRead,
  type DemoSampleId,
} from "./demoService";
import { composeResolutionNote } from "./demoAiReviewService";
import { runLoadPolicyStage, runDecideStage, runActStage, runLogStage, RULE_DELAY_MS, delay } from "./runPipelineService";
import { recordOutcome, getPolicyVersion } from "./serverPolicyState";
import type { Policy } from "./policyTypes";

// extract — same model-backed extraction as the standalone pipeline, just
// sourced from the demo sample's firstRead layer instead of an upload.
async function* runDemoExtractStage(sample: ReturnType<typeof getDemoSample>, out: { fields?: ExtractedFields }): AsyncGenerator<RunEvent> {
  const documentText = renderDemoDocumentText(sample);
  const fallback = getDemoFallbackFields(sample);

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
    finalFields = fallback;
    usedFallback = true;
  }

  out.fields = finalFields ?? fallback;
  yield { stage: "extract", status: "done", fields: out.fields, usedFallback };
}

// evaluate — deterministic, the policy's two active rules only. Reused for
// both the first pass and the post-ai_review re-check: it's the exact same
// function either time, which is the point — code re-checks, not the model.
async function* runDemoEvaluateStage(
  policy: Policy,
  fields: ExtractedFields,
  out: { results?: RuleResult[] }
): AsyncGenerator<RunEvent> {
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

// ai_review — capped at exactly one attempt. Swaps only the fields the
// failed rules named over to the sample's carefulRead layer; the model is
// consulted only to word what happened, never to judge whether it worked.
async function* runAiReviewStage(
  sample: ReturnType<typeof getDemoSample>,
  fields: ExtractedFields,
  failedResults: RuleResult[],
  out: { fields?: ExtractedFields }
): AsyncGenerator<RunEvent> {
  yield { stage: "ai_review", status: "active" };

  const resolvedFields = [...new Set(failedResults.flatMap((r) => r.fields))];
  const before = fields;
  const after = applyCarefulRead(sample, fields, resolvedFields);
  out.fields = after;
  const note = await composeResolutionNote(failedResults, resolvedFields);

  yield {
    stage: "ai_review",
    status: "done",
    resolutionNote: `AI attempted resolution: ${note}`,
    resolvedFields,
    resolvedFieldChanges: resolvedFields.map((field) => ({
      field,
      before: before[field]?.value,
      after: after[field]?.value,
    })),
  };
}

export async function* runDemoPipeline(sampleId: DemoSampleId): AsyncGenerator<RunEvent> {
  const sample = getDemoSample(sampleId);

  const extracted: { fields?: ExtractedFields } = {};
  yield* runDemoExtractStage(sample, extracted);
  if (!extracted.fields) return;

  const loaded: { policy?: Policy } = {};
  yield* runLoadPolicyStage(loaded);
  if (!loaded.policy) return;

  const policy = loaded.policy;
  let fields = extracted.fields;
  const firstPass: { results?: RuleResult[] } = {};
  yield* runDemoEvaluateStage(policy, fields, firstPass);
  if (!firstPass.results) return;

  let finalResults = firstPass.results;
  const aiReviewFired = firstPass.results.some((r) => !r.pass);

  if (aiReviewFired) {
    const failed = firstPass.results.filter((r) => !r.pass);
    const reviewed: { fields?: ExtractedFields } = {};
    yield* runAiReviewStage(sample, fields, failed, reviewed);
    fields = reviewed.fields ?? fields;

    const secondPass: { results?: RuleResult[] } = {};
    yield* runDemoEvaluateStage(policy, fields, secondPass);
    if (!secondPass.results) return;
    finalResults = secondPass.results;
  }

  const decided: { branch?: "commit" | "escalate"; failedRules?: RuleResult[] } = {};
  yield* runDecideStage(finalResults, decided);
  if (!decided.branch) return;

  const outcome = decided.branch === "escalate" ? "escalated" : aiReviewFired ? "resolved_by_ai" : "committed";
  recordOutcome(outcome);

  const policyVersion = getPolicyVersion();
  const acted: { actionAt?: string } = {};
  yield* runActStage(decided.branch, policy, fields, decided.failedRules ?? [], policyVersion, acted);

  yield* runLogStage(
    policy,
    sample.label,
    finalResults,
    outcome,
    aiReviewFired,
    policyVersion,
    acted.actionAt ?? new Date().toISOString()
  );
}
