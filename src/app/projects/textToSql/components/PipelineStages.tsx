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
    return "border-[var(--brick)] bg-[var(--brick-light)] text-[var(--brick-dark)]";
  }
  if (status === "active") {
    return "border-[var(--tts-amber)] bg-[var(--tts-amber-50)] text-[var(--tts-amber-dark)] ring-2 ring-[var(--tts-amber)] animate-pulse";
  }
  if (status === "complete") {
    return kind === "llm"
      ? "border-[var(--tts-indigo)] bg-[var(--tts-indigo)] text-[var(--tts-on-indigo)]"
      : "border-[var(--tts-step-line)] bg-[var(--tts-step)] text-[var(--tts-step-ink)]";
  }
  // pending
  return kind === "llm"
    ? "border-[var(--tts-indigo-line)] bg-[var(--tts-indigo-50)] text-[var(--tts-indigo)]"
    : "border-[var(--tts-border)] bg-[var(--tts-paper)] text-[var(--tts-muted)]";
}

function Node({ nodeKey, status }: { nodeKey: NodeKey; status: NodeStatus }) {
  const meta = NODE_META[nodeKey];
  return (
    <div
      className={`rounded-lg border px-3 py-1.5 type-label weight-medium whitespace-nowrap text-center ${nodeClasses(status, meta.kind)}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {meta.label}
    </div>
  );
}

export default function PipelineStages({ events }: { events: PipelineEvent[] }) {
  const state = computeDiagramState(events);

  return (
    <div className="rounded-2xl border border-[var(--tts-border)] bg-[var(--surface)] p-4">
      <p
        className="type-label uppercase track-fine text-[var(--tts-muted)] mb-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Pipeline
      </p>

      {/* Main flow: scrolls inside the card on narrow screens. */}
      <div className="overflow-x-auto pb-5 md:overflow-visible md:pb-0">
      <div className="grid grid-cols-6 gap-x-1 items-center min-w-[32rem] md:min-w-0">
        {MAIN_FLOW.map((key, i) => (
          <div key={key} className="relative flex items-center justify-center">
            <Node nodeKey={key} status={state[key]} />
            {i < MAIN_FLOW.length - 1 && (
              <span
                className="absolute -right-1 translate-x-full text-[var(--tts-muted)] type-fine select-none"
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
      </div>

      <p className="mt-6 type-label text-[var(--tts-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="inline-block w-2 h-2 rounded-full bg-[var(--tts-indigo)] mr-1 align-middle" />
        Indigo = calls LLM ·{" "}
        <span className="inline-block w-2 h-2 rounded-full bg-[var(--tts-step-line)] mr-1 align-middle" />
        Gray = deterministic (no LLM) · pulsing = active now
      </p>
    </div>
  );
}
