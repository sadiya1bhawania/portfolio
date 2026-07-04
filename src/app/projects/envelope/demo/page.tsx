"use client";

import { useState } from "react";
import Link from "next/link";
import ConfigurePanel from "../components/ConfigurePanel";
import DemoRunPanel from "../components/DemoRunPanel";
import LogPanel from "../components/LogPanel";
import PipelineFlowchart from "../components/PipelineFlowchart";
import type { RunStage, RunStatus } from "../lib/runPipelineTypes";

type Tab = "configure" | "run" | "log";

const TABS: { id: Tab; label: string; blurb: string }[] = [
  {
    id: "configure",
    label: "Configure",
    blurb: "Pick the two rules that matter for this document. The agent enforces them so you don't have to review every result.",
  },
  {
    id: "run",
    label: "Run",
    blurb: "Pick a document. Watch the agent extract, check it against your rules, and fix or escalate — you only step in if it can't.",
  },
  {
    id: "log",
    label: "Log",
    blurb: "Every run this session, so you can see how rarely a human actually had to step in.",
  },
];

function StepCircle({ index, state }: { index: number; state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <span
        className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] text-white shrink-0"
        style={{ fontFamily: "var(--font-mono)", background: "var(--copper)" }}
      >
        ✓
      </span>
    );
  }
  return (
    <span
      className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] shrink-0"
      style={{
        fontFamily: "var(--font-mono)",
        background: state === "active" ? "var(--copper)" : "var(--border)",
        color: state === "active" ? "#fff" : "var(--muted)",
      }}
    >
      {index}
    </span>
  );
}

export default function EnvelopeDemoPage() {
  const [tab, setTab] = useState<Tab>("configure");
  const [configureDone, setConfigureDone] = useState(false);
  const [runDone, setRunDone] = useState(false);
  const [stageStatus, setStageStatus] = useState<Partial<Record<RunStage, RunStatus>>>({});
  const [branch, setBranch] = useState<"commit" | "escalate" | null>(null);
  const [firstEvalFailed, setFirstEvalFailed] = useState<boolean | null>(null);
  const [logRefreshKey, setLogRefreshKey] = useState(0);

  const activeBlurb = TABS.find((t) => t.id === tab)?.blurb ?? "";

  // Before any run has streamed real stage events, the flowchart should still
  // reflect which step of the walkthrough the user is on: Configure maps to
  // load_policy (the stage that reads the policy this step produces).
  const flowchartStageStatus: Partial<Record<RunStage, RunStatus>> =
    tab === "configure" ? { load_policy: "active" } : stageStatus;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--paper)" }}>
      {/* Top bar: exit + tab-stepper */}
      <header className="border-b" style={{ borderColor: "var(--border)", background: "#fff" }}>
        <div className="max-w-[1100px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/projects/envelope"
              className="text-[12px]"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
            >
              ← Exit demo
            </Link>
            <p
              className="text-[13px] font-medium"
              style={{ fontFamily: "var(--font-head)" }}
            >
              Envelope
            </p>
          </div>

          <div className="flex items-center gap-3">
            {TABS.map((t, i) => {
              const isDone = t.id === "configure" ? configureDone : t.id === "run" ? runDone : false;
              const state: "active" | "done" | "pending" = t.id === tab ? "active" : isDone ? "done" : "pending";
              return (
                <div key={t.id} className="flex items-center gap-3">
                  {i > 0 && (
                    <span className="w-8 h-px" style={{ background: "var(--border)" }} aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    onClick={() => setTab(t.id)}
                    className="flex items-center gap-2"
                  >
                    <StepCircle index={i + 1} state={state} />
                    <span
                      className="text-[13px]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: t.id === tab ? "var(--copper-dark)" : "var(--muted)",
                        fontWeight: t.id === tab ? 600 : 400,
                      }}
                    >
                      {t.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-sm mt-3" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
            {activeBlurb}
          </p>
        </div>
      </header>

      {/* Two-panel split */}
      <div className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-8 grid gap-8" style={{ gridTemplateColumns: "1fr 240px" }}>
        <main>
          {tab === "configure" && (
            <ConfigurePanel
              onActivated={() => {
                setConfigureDone(true);
                setTab("run");
              }}
            />
          )}
          {tab === "run" && (
            <DemoRunPanel
              onStageStatusChange={setStageStatus}
              onBranchChange={setBranch}
              onFirstEvalFailedChange={setFirstEvalFailed}
              onRunComplete={() => {
                setRunDone(true);
                setLogRefreshKey((k) => k + 1);
              }}
            />
          )}
          {tab === "log" && <LogPanel refreshKey={logRefreshKey} onConfigure={() => setTab("configure")} />}
        </main>

        <aside>
          <PipelineFlowchart stageStatus={flowchartStageStatus} branch={branch} firstEvalFailed={firstEvalFailed} />
        </aside>
      </div>
    </div>
  );
}
