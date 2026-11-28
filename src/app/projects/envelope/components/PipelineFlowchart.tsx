import type { RunStage, RunStatus } from "../lib/runPipelineTypes";

type NodeState = "pending" | "active" | "done" | "fail-done";

function nodeClasses(state: NodeState): string {
  switch (state) {
    case "done":
      return "border-[var(--copper)] bg-[var(--copper)] text-[var(--on-accent)]";
    case "fail-done":
      return "border-[var(--brick)] bg-[var(--brick)] text-[var(--on-accent)]";
    case "active":
      return "border-[var(--copper-hi)] bg-[var(--copper-light)] text-[var(--copper-dark)] ring-2 ring-[var(--copper-hi)] animate-pulse";
    default:
      return "border-[var(--border)] bg-[var(--paper)] text-[var(--muted)]";
  }
}

function realNodeState(status?: RunStatus): NodeState {
  if (status === "done") return "done";
  if (status === "active") return "active";
  return "pending";
}

// decide/act/log land on the final commit/escalate branch once done, so -
// unlike the earlier stages - their "done" color reflects the outcome.
function outcomeNodeState(status: RunStatus | undefined, branch: "commit" | "escalate" | null): NodeState {
  if (status === "done") return branch === "escalate" ? "fail-done" : "done";
  if (status === "active") return "active";
  return "pending";
}

function Node({ label, state }: { label: string; state: NodeState }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 type-fine weight-medium text-center ${nodeClasses(state)}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {label}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center py-1" aria-hidden="true">
      <span className="text-[var(--muted)] type-fine">↓</span>
    </div>
  );
}

interface PipelineFlowchartProps {
  stageStatus: Partial<Record<RunStage, RunStatus>>;
  branch: "commit" | "escalate" | null;
  /** did the first evaluate() pass fail? null = not determined yet this run */
  firstEvalFailed?: boolean | null;
}

export default function PipelineFlowchart({ stageStatus, branch, firstEvalFailed = null }: PipelineFlowchartProps) {
  const failState: NodeState = firstEvalFailed === null ? "pending" : firstEvalFailed ? "fail-done" : "done";
  const aiReviewFired = stageStatus.ai_review !== undefined;

  return (
    <div className="sticky top-6">
      <p
        className="type-label uppercase track-fine mb-3"
        style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
      >
        Pipeline
      </p>

      <div>
        <Node label="Extract" state={realNodeState(stageStatus.extract)} />
        <Arrow />
        <Node label="Load policy" state={realNodeState(stageStatus.load_policy)} />
        <Arrow />
        <Node label="Evaluate" state={realNodeState(stageStatus.evaluate)} />
        <Arrow />
        <Node label="[ fail? ]" state={failState} />
        <Arrow />
        <Node label="AI review" state={realNodeState(stageStatus.ai_review)} />
        {aiReviewFired && (
          <p
            className="type-label text-center mt-1 mb-1"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            ⟲ looped back to Evaluate
          </p>
        )}
        <Arrow />
        <Node label="Decide" state={outcomeNodeState(stageStatus.decide, branch)} />
        <Arrow />
        <Node label="Act" state={outcomeNodeState(stageStatus.act, branch)} />
        <Arrow />
        <Node label="Log" state={outcomeNodeState(stageStatus.log, branch)} />
      </div>

      <p className="type-label mt-4" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
        <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: "var(--copper)" }} />
        commit ·{" "}
        <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: "var(--brick)" }} />
        escalate
      </p>
    </div>
  );
}
