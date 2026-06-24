import type { PipelineEvent } from "../lib/pipelineTypes";

type NodeKey = "question" | "retrieve" | "generate" | "execute" | "selfCorrect" | "summarize" | "respond";
type NodeStatus = "pending" | "active" | "complete" | "error";

interface DiagramState {
  question: NodeStatus;
  retrieve: NodeStatus;
  generate: NodeStatus;
  execute: NodeStatus;
  selfCorrect: NodeStatus;
  summarize: NodeStatus;
  respond: NodeStatus;
}

const NODE_META: Record<NodeKey, { label: string; kind: "llm" | "deterministic" }> = {
  question: { label: "User question", kind: "deterministic" },
  retrieve: { label: "Retrieve context", kind: "deterministic" },
  generate: { label: "Generate SQL", kind: "llm" },
  execute: { label: "Execute", kind: "deterministic" },
  selfCorrect: { label: "Self-correct", kind: "llm" },
  summarize: { label: "Summarize", kind: "llm" },
  respond: { label: "Respond", kind: "deterministic" },
};

const MAIN_FLOW: NodeKey[] = ["question", "retrieve", "generate", "execute", "summarize", "respond"];

function computeDiagramState(events: PipelineEvent[]): DiagramState {
  const state: DiagramState = {
    question: events.length > 0 ? "complete" : "pending",
    retrieve: "pending",
    generate: "pending",
    execute: "pending",
    selfCorrect: "pending",
    summarize: "pending",
    respond: "pending",
  };

  let generateActivations = 0;

  for (const event of events) {
    switch (event.stage) {
      case "retrieve":
        state.retrieve = event.status;
        break;
      case "generate":
        if (event.status === "active") {
          generateActivations += 1;
          if (generateActivations > 1) {
            state.selfCorrect = "active";
            state.execute = "pending";
          }
        }
        state.generate = event.status;
        if (event.status === "complete" && generateActivations > 1) {
          state.selfCorrect = "complete";
        }
        if (event.status === "error") {
          state.selfCorrect = "error";
        }
        break;
      case "execute":
        state.execute = event.status;
        if (event.status === "error") {
          state.selfCorrect = "active";
        }
        break;
      case "summarize":
        state.summarize = event.status;
        break;
      case "done":
        state.respond = event.status === "error" ? "error" : "complete";
        break;
    }
  }

  return state;
}

function nodeClasses(status: NodeStatus, kind: "llm" | "deterministic"): string {
  if (status === "error") {
    return "border-red-400 bg-red-50 text-red-700";
  }
  if (status === "active") {
    return "border-[var(--tts-amber)] bg-amber-50 text-[var(--tts-amber-dark)] ring-2 ring-[var(--tts-amber)] animate-pulse";
  }
  if (status === "complete") {
    return kind === "llm"
      ? "border-[var(--tts-indigo)] bg-[var(--tts-indigo)] text-white"
      : "border-gray-400 bg-gray-200 text-gray-700";
  }
  // pending
  return kind === "llm"
    ? "border-indigo-200 bg-indigo-50 text-indigo-400"
    : "border-gray-200 bg-gray-50 text-gray-400";
}

function Node({ nodeKey, status }: { nodeKey: NodeKey; status: NodeStatus }) {
  const meta = NODE_META[nodeKey];
  return (
    <div
      className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap text-center ${nodeClasses(status, meta.kind)}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {meta.label}
    </div>
  );
}

export default function PipelineStages({ events }: { events: PipelineEvent[] }) {
  const state = computeDiagramState(events);

  return (
    <div className="rounded-2xl border border-[var(--tts-border)] bg-white p-4">
      <p
        className="text-[11px] uppercase tracking-wide text-[var(--tts-muted)] mb-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Pipeline
      </p>

      {/* Main flow */}
      <div className="grid grid-cols-6 gap-x-1 items-center">
        {MAIN_FLOW.map((key, i) => (
          <div key={key} className="relative flex items-center justify-center">
            <Node nodeKey={key} status={state[key]} />
            {i < MAIN_FLOW.length - 1 && (
              <span
                className="absolute -right-1 translate-x-full text-[var(--tts-muted)] text-xs select-none"
                aria-hidden="true"
              >
                →
              </span>
            )}
          </div>
        ))}

        {/* Vertical drop connectors under Generate SQL (col 3) and Execute (col 4) */}
        <div className="col-start-3 flex justify-center">
          <div className="w-px h-3 border-l border-dashed border-[var(--tts-muted)]" />
        </div>
        <div className="col-start-4 flex justify-center">
          <div className="w-px h-3 border-l border-dashed border-[var(--tts-muted)]" />
        </div>

        {/* Self-correct branch, spanning Generate SQL + Execute columns */}
        <div className="col-start-3 col-end-5 flex justify-center pt-1">
          <div className="border-t border-dashed border-[var(--tts-muted)] w-full relative flex justify-center">
            <div className="absolute -top-2.5">
              <Node nodeKey="selfCorrect" status={state.selfCorrect} />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[11px] text-[var(--tts-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="inline-block w-2 h-2 rounded-full bg-[var(--tts-indigo)] mr-1 align-middle" />
        Indigo = calls Claude ·{" "}
        <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1 align-middle" />
        Gray = deterministic (no LLM) · pulsing = active now
      </p>
    </div>
  );
}
