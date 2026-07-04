import { RUN_STAGE_ORDER, RUN_STAGE_LABEL, type RunStage, type RunStatus } from "../lib/runPipelineTypes";

function stageClasses(status?: RunStatus): string {
  if (status === "error") {
    return "border-red-400 bg-red-50 text-red-700";
  }
  if (status === "done") {
    return "border-[var(--copper)] bg-[var(--copper)] text-white";
  }
  if (status === "active") {
    return "border-[var(--copper-hi)] bg-[var(--copper-light)] text-[var(--copper-dark)] ring-2 ring-[var(--copper-hi)] animate-pulse";
  }
  return "border-[var(--border)] bg-[#faf8f5] text-[var(--muted)]";
}

export default function RunStageRail({
  stageStatus,
}: {
  stageStatus: Partial<Record<RunStage, RunStatus>>;
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "#fff" }}>
      <p
        className="text-[11px] uppercase tracking-wide mb-3"
        style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
      >
        Pipeline
      </p>
      <div className="grid grid-cols-6 gap-x-1 items-center">
        {RUN_STAGE_ORDER.map((stage, i) => (
          <div key={stage} className="relative flex items-center justify-center">
            <div
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap text-center ${stageClasses(
                stageStatus[stage]
              )}`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {RUN_STAGE_LABEL[stage]}
            </div>
            {i < RUN_STAGE_ORDER.length - 1 && (
              <span
                className="absolute -right-1 translate-x-full text-[var(--muted)] text-xs select-none"
                aria-hidden="true"
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
