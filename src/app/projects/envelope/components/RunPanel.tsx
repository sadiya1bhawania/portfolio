"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import RunStageRail from "./RunStageRail";
import { CommitOutcomeCard, EscalateOutcomeCard } from "./OutcomeCard";
import {
  computeDisplayStatus,
  type RunEvent,
  type RunStage,
  type RunStatus,
  type RuleResultSummary,
} from "../lib/runPipelineTypes";
import { RULES } from "../lib/policyTypes";
import { listDemoSamples, type DemoSampleId } from "../lib/demoService";

type SampleDoc = { kind: "sample"; id: DemoSampleId; label: string };
type UploadDoc = { kind: "upload"; name: string; text: string };
type DocSource = UploadDoc | SampleDoc;

const SAMPLE_DOCS: SampleDoc[] = listDemoSamples().map((s) => ({ kind: "sample", id: s.id, label: s.label }));

interface ExtractedField {
  value: unknown;
  confidence: number;
}

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

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

interface RunPanelProps {
  /** fires on every stage-status change, e.g. to drive an external flowchart */
  onStageStatusChange?: (status: Partial<Record<RunStage, RunStatus>>) => void;
  /** fires once decide() lands, e.g. to color an external branch node */
  onBranchChange?: (branch: "commit" | "escalate" | null) => void;
  /** fires once act() completes a run */
  onRunComplete?: (outcome: ActOutcome) => void;
}

export default function RunPanel({ onStageStatusChange, onBranchChange, onRunComplete }: RunPanelProps) {
  const [doc, setDoc] = useState<DocSource | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [stageStatus, setStageStatus] = useState<Partial<Record<RunStage, RunStatus>>>({});
  const [extractedFields, setExtractedFields] = useState<Record<string, ExtractedField>>({});
  const [usedFallback, setUsedFallback] = useState(false);
  const [policySummary, setPolicySummary] = useState<string | null>(null);
  const [sessionCounts, setSessionCounts] = useState<{ committed: number; resolvedByAi: number; escalated: number } | null>(
    null
  );
  const [ruleResults, setRuleResults] = useState<RuleResultSummary[]>([]);
  const [branch, setBranch] = useState<"commit" | "escalate" | null>(null);
  const [actOutcome, setActOutcome] = useState<ActOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayStatus = computeDisplayStatus(stageStatus, isRunning);

  useEffect(() => {
    onStageStatusChange?.(displayStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageStatus, isRunning]);

  useEffect(() => {
    onBranchChange?.(branch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch]);

  function resetRunState() {
    setStageStatus({});
    setExtractedFields({});
    setUsedFallback(false);
    setPolicySummary(null);
    setRuleResults([]);
    setBranch(null);
    setActOutcome(null);
    setError(null);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setDoc({ kind: "upload", name: file.name, text: String(reader.result ?? "") });
    };
    reader.readAsText(file);
    resetRunState();
  }

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function submitRun() {
    if (!doc || isRunning) return;
    setIsRunning(true);
    setIsConnecting(true);
    resetRunState();

    const body =
      doc.kind === "sample"
        ? { sampleId: doc.id, documentName: doc.label }
        : { documentText: doc.text, documentName: doc.name };

    try {
      const res = await fetch("/projects/envelope/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.body) throw new Error("No response body from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
          if (event.stage === "extract" && event.field) {
            setExtractedFields((prev) => ({
              ...prev,
              [event.field as string]: { value: event.value, confidence: event.confidence ?? 0 },
            }));
          }
          if (event.stage === "extract" && event.status === "done" && event.fields) {
            setExtractedFields(event.fields as Record<string, ExtractedField>);
            setUsedFallback(Boolean(event.usedFallback));
          }
          if (event.stage === "load_policy" && event.status === "done" && event.policySummary) {
            setPolicySummary(event.policySummary);
            if (event.counts) setSessionCounts(event.counts);
          }
          if (event.stage === "evaluate" && event.rule) {
            setRuleResults((prev) => [
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
          if (event.stage === "decide" && event.status === "done" && event.branch) {
            setBranch(event.branch);
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
          setStageStatus((prev) => ({ ...prev, [event.stage]: event.status }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
      setIsConnecting(false);
    }
  }

  return (
    <div>
      {/* Upload */}
      <section className="mb-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
          style={{
            borderColor: isDragging ? "var(--copper)" : "var(--border)",
            background: isDragging ? "var(--copper-light)" : "#fff",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="text/*,.txt,.json,.csv"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
            {doc?.kind === "upload" ? (
              <>
                Selected: <strong style={{ color: "var(--copper-dark)" }}>{doc.name}</strong>
              </>
            ) : (
              "Drag & drop a text document here, or click to browse"
            )}
          </p>
        </div>
      </section>

      {/* Sample docs */}
      <section className="mb-10">
        <h2
          className="text-[13px] uppercase tracking-wide mb-3"
          style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
        >
          Or use a sample
        </h2>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_DOCS.map((sample) => {
            const active = doc !== null && doc.kind === "sample" && doc.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setDoc(sample);
                  resetRunState();
                }}
                className="text-[12px] px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  borderColor: active ? "var(--copper)" : "var(--border)",
                  background: active ? "var(--copper-light)" : "#fff",
                  color: active ? "var(--copper-dark)" : "var(--muted)",
                }}
              >
                {sample.label}
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        disabled={!doc || isRunning}
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

      <RunStageRail stageStatus={displayStatus} />

      {!doc && !isRunning && (
        <p className="mt-6 text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
          Upload a document, or try a sample.
        </p>
      )}

      {policySummary && (
        <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <p className="text-[11px] uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            Policy
          </p>
          <p className="text-[13px] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}>
            {policySummary}
          </p>
          {sessionCounts && (
            <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              This session so far: {sessionCounts.committed} committed, {sessionCounts.escalated} escalated.
            </p>
          )}
        </div>
      )}

      {ruleResults.length > 0 && !actOutcome && (
        <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <p className="text-[11px] uppercase tracking-wide mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            Rule evaluation
          </p>
          <div className="space-y-2">
            {ruleResults.map((r, i) => (
              <div key={`${r.rule}-${i}`} className="flex items-start gap-2 text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>
                <span style={{ color: r.pass ? "var(--copper)" : "var(--brick)" }}>{r.pass ? "✓" : "✗"}</span>
                <span>
                  <span style={{ color: "var(--ink)" }}>{RULES.find((rule) => rule.id === r.rule)?.label ?? r.rule}</span>
                  <span style={{ color: "var(--muted)" }}> — {r.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final outcome, once act() has run — reuses the two-path card pattern. */}
      {branch && actOutcome && actOutcome.commitStatus === "committed" && (
        <div className="mt-6">
          <CommitOutcomeCard
            ruleResults={ruleResults}
            clicks={actOutcome.clicks}
            actionAt={actOutcome.actionAt}
            policyVersion={actOutcome.policyVersion}
          />
        </div>
      )}

      {branch && actOutcome && actOutcome.commitStatus === "escalated" && (
        <div className="mt-6">
          <EscalateOutcomeCard
            ruleResults={ruleResults}
            emailSubject={actOutcome.emailSubject ?? ""}
            emailBody={actOutcome.emailBody ?? ""}
            escalateTo={actOutcome.escalateTo ?? ""}
            actionAt={actOutcome.actionAt}
            policyVersion={actOutcome.policyVersion}
          />
        </div>
      )}

      {Object.keys(extractedFields).length > 0 && (
        <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-wide" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              Extracted fields
            </p>
            {usedFallback && (
              <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}>
                Gemini output couldn&apos;t be parsed — showing the sample&apos;s known values.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            {Object.entries(extractedFields).map(([field, data]) => (
              <div key={field} className="flex items-center justify-between text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--muted)" }}>{field}</span>
                <span className="flex items-center gap-3">
                  <span style={{ color: "var(--copper-dark)" }}>{formatFieldValue(data.value)}</span>
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded"
                    style={{
                      background: data.confidence >= 0.75 ? "var(--copper-light)" : "#fee2e2",
                      color: data.confidence >= 0.75 ? "var(--copper-dark)" : "#b91c1c",
                    }}
                  >
                    {(data.confidence * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
