"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CommitOutcomeCard, ResolvedByAiOutcomeCard, EscalateOutcomeCard } from "./OutcomeCard";
import { RULES } from "../lib/policyTypes";
import type { RunEvent, RunStage, RunStatus, RuleResultSummary } from "../lib/runPipelineTypes";
import demoSamplesData from "../data/demo-samples.json";

type DemoSampleId = "clean" | "recoverable" | "blocked";

const SAMPLES: { id: DemoSampleId; label: string }[] = demoSamplesData.samples.map((s) => ({
  id: s.id as DemoSampleId,
  label: s.label,
}));

interface ActOutcome {
  commitStatus: "committed" | "escalated";
  clicks: number;
  recordId?: string;
  emailSubject?: string;
  emailBody?: string;
  escalateTo?: string;
  actionAt: string;
  policyVersion: number;
}

interface DemoRunPanelProps {
  onStageStatusChange?: (status: Partial<Record<RunStage, RunStatus>>) => void;
  onBranchChange?: (branch: "commit" | "escalate" | null) => void;
  onFirstEvalFailedChange?: (failed: boolean | null) => void;
  onRunComplete?: (outcome: ActOutcome) => void;
}

function ruleLabel(id: RuleResultSummary["rule"]): string {
  return RULES.find((r) => r.id === id)?.label ?? id;
}

function ResultList({ results }: { results: RuleResultSummary[] }) {
  return (
    <div className="space-y-1.5">
      {results.map((r, i) => (
        <div key={`${r.rule}-${i}`} className="flex items-start gap-2 text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: r.pass ? "var(--copper)" : "var(--brick)" }}>{r.pass ? "✓" : "✗"}</span>
          <span>
            <span style={{ color: "var(--ink)" }}>{ruleLabel(r.rule)}</span>
            <span style={{ color: "var(--muted)" }}> - {r.detail}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DemoRunPanel({
  onStageStatusChange,
  onBranchChange,
  onFirstEvalFailedChange,
  onRunComplete,
}: DemoRunPanelProps) {
  const [sampleId, setSampleId] = useState<DemoSampleId | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [liveResults, setLiveResults] = useState<RuleResultSummary[]>([]);
  const [firstPassResults, setFirstPassResults] = useState<RuleResultSummary[]>([]);
  const [secondPassResults, setSecondPassResults] = useState<RuleResultSummary[] | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string | null>(null);
  const [resolvedFieldChanges, setResolvedFieldChanges] = useState<
    { field: string; before: unknown; after: unknown }[]
  >([]);
  const [branch, setBranch] = useState<"commit" | "escalate" | null>(null);
  const [actOutcome, setActOutcome] = useState<ActOutcome | null>(null);
  const passCountRef = useRef(0);

  function resetRunState() {
    setError(null);
    setLiveResults([]);
    setFirstPassResults([]);
    setSecondPassResults(null);
    setResolutionNote(null);
    setResolvedFieldChanges([]);
    setBranch(null);
    setActOutcome(null);
    passCountRef.current = 0;
    onStageStatusChange?.({});
    onBranchChange?.(null);
    onFirstEvalFailedChange?.(null);
  }

  async function submitRun() {
    if (!sampleId || isRunning) return;
    setIsRunning(true);
    setIsConnecting(true);
    resetRunState();

    try {
      const res = await fetch("/projects/envelope/api/demo-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId }),
      });
      if (!res.body) throw new Error("No response body from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const stageStatus: Partial<Record<RunStage, RunStatus>> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setIsConnecting(false);
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          const event: RunEvent = JSON.parse(json);

          if (event.status === "error") {
            setError(event.error ?? "Pipeline failed.");
          }

          if (event.stage === "evaluate" && event.status === "active" && !event.rule) {
            setLiveResults([]);
          }
          if (event.stage === "evaluate" && event.rule) {
            setLiveResults((prev) => [
              ...prev,
              {
                rule: event.rule!,
                pass: event.pass ?? false,
                detail: event.detail ?? "",
                fields: event.ruleFields ?? [],
                badValues: event.ruleBadValues ?? [],
              },
            ]);
          }
          if (event.stage === "evaluate" && event.status === "done" && event.results) {
            const results = event.results as RuleResultSummary[];
            if (passCountRef.current === 0) {
              setFirstPassResults(results);
              const failed = results.some((r) => !r.pass);
              onFirstEvalFailedChange?.(failed);
            } else {
              setSecondPassResults(results);
            }
            passCountRef.current += 1;
          }
          if (event.stage === "ai_review" && event.status === "done") {
            setResolutionNote(event.resolutionNote ?? null);
            setResolvedFieldChanges(event.resolvedFieldChanges ?? []);
          }
          if (event.stage === "decide" && event.status === "done" && event.branch) {
            setBranch(event.branch);
            onBranchChange?.(event.branch);
          }
          if (event.stage === "act" && event.status === "done" && event.commitStatus) {
            const outcome: ActOutcome = {
              commitStatus: event.commitStatus,
              clicks: event.clicks ?? 0,
              recordId: event.recordId,
              emailSubject: event.emailSubject,
              emailBody: event.emailBody,
              escalateTo: event.escalateTo,
              actionAt: event.actionAt ?? new Date().toISOString(),
              policyVersion: event.policyVersion ?? 0,
            };
            setActOutcome(outcome);
            onRunComplete?.(outcome);
          }

          stageStatus[event.stage] = event.status;
          onStageStatusChange?.({ ...stageStatus });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
      setIsConnecting(false);
    }
  }

  const finalResults = secondPassResults ?? firstPassResults;
  const aiReviewFired = secondPassResults !== null;

  return (
    <div>
      <section className="mb-8">
        <h2
          className="text-[13px] uppercase tracking-wide mb-3"
          style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
        >
          Pick a document
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLES.map((sample) => {
            const active = sampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setSampleId(sample.id);
                  resetRunState();
                }}
                aria-pressed={active}
                className="rounded-lg border p-4 text-left transition-colors"
                style={{
                  borderColor: active ? "var(--copper)" : "var(--border)",
                  background: active ? "var(--copper-light)" : "#fff",
                }}
              >
                <p
                  className="text-base font-medium mb-1 capitalize"
                  style={{ fontFamily: "var(--font-head)", color: active ? "var(--copper-dark)" : "inherit" }}
                >
                  {sample.id}
                </p>
                <p className="text-[12px]" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
                  {sample.label.replace(/^\w+\s*-\s*/, "")}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        disabled={!sampleId || isRunning}
        onClick={submitRun}
        className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed mb-8"
        style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
      >
        {isRunning ? "Running…" : "Run pipeline"}
      </button>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
          {error.includes("No active policy") && (
            <>
              {" "}
              <Link href="/projects/envelope/configure" className="underline">
                Configure one →
              </Link>
            </>
          )}
        </div>
      )}

      {isConnecting && (
        <p className="mb-3 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          Connecting…
        </p>
      )}

      {!sampleId && !isRunning && (
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
          Pick Clean, Recoverable, or Blocked, then run it.
        </p>
      )}

      {liveResults.length > 0 && !secondPassResults && !actOutcome && (
        <div className="rounded-2xl border p-4 mb-6" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <p className="text-[11px] uppercase tracking-wide mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {firstPassResults.length > 0 ? "Re-evaluating" : "Evaluating"}
          </p>
          <ResultList results={liveResults} />
        </div>
      )}

      {firstPassResults.length > 0 && (
        <div className="rounded-2xl border p-4 mb-6" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <p className="text-[11px] uppercase tracking-wide mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            First read
          </p>
          <ResultList results={firstPassResults} />
        </div>
      )}

      {resolutionNote && (
        <div className="rounded-2xl border p-4 mb-6" style={{ borderColor: "var(--border)", background: "var(--copper-light)" }}>
          <p className="text-[13px]" style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}>
            {resolutionNote}
          </p>
        </div>
      )}

      {secondPassResults && (
        <div className="rounded-2xl border p-4 mb-6" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <p className="text-[11px] uppercase tracking-wide mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            After AI review
          </p>
          <ResultList results={secondPassResults} />
        </div>
      )}

      {branch && actOutcome && actOutcome.commitStatus === "committed" && !aiReviewFired && (
        <CommitOutcomeCard
          ruleResults={finalResults}
          clicks={actOutcome.clicks}
          actionAt={actOutcome.actionAt}
          policyVersion={actOutcome.policyVersion}
        />
      )}

      {branch && actOutcome && actOutcome.commitStatus === "committed" && aiReviewFired && (
        <ResolvedByAiOutcomeCard
          ruleResults={finalResults}
          resolvedFieldChanges={resolvedFieldChanges}
          actionAt={actOutcome.actionAt}
          policyVersion={actOutcome.policyVersion}
        />
      )}

      {branch && actOutcome && actOutcome.commitStatus === "escalated" && (
        <EscalateOutcomeCard
          ruleResults={finalResults}
          emailSubject={actOutcome.emailSubject ?? ""}
          emailBody={actOutcome.emailBody ?? ""}
          escalateTo={actOutcome.escalateTo ?? ""}
          actionAt={actOutcome.actionAt}
          policyVersion={actOutcome.policyVersion}
        />
      )}
    </div>
  );
}
