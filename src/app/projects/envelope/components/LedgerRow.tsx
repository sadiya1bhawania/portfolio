import type { RunHistoryEntry } from "../lib/runHistory";
import { RULES } from "../lib/policyTypes";
import { formatTimestamp } from "../lib/format";

function ruleLabel(id: RunHistoryEntry["ruleResults"][number]["rule"]): string {
  return RULES.find((r) => r.id === id)?.label ?? id;
}

function outcomeLabel(outcome: RunHistoryEntry["outcome"]): string {
  if (outcome === "resolved_by_ai") return "resolved by AI";
  return outcome;
}

export function SessionSummary({ counts }: { counts: { committed: number; resolvedByAi: number; escalated: number } }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <p className="type-mono" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="weight-medium" style={{ color: "var(--copper-dark)" }}>{counts.committed} committed</span>
        <span style={{ color: "var(--muted)" }}> · </span>
        <span className="weight-medium" style={{ color: "var(--copper-dark)" }}>{counts.resolvedByAi} resolved by AI</span>
        <span style={{ color: "var(--muted)" }}> · </span>
        <span className="weight-medium" style={{ color: "var(--brick-dark)" }}>{counts.escalated} escalated</span>
      </p>
    </div>
  );
}

export function LedgerRow({ entry }: { entry: RunHistoryEntry }) {
  const isEscalated = entry.outcome === "escalated";
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="type-label" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {formatTimestamp(entry.timestamp)}
          </p>
          <p className="type-small weight-medium" style={{ fontFamily: "var(--font-head)" }}>
            {entry.documentName}
          </p>
        </div>
        <span
          className="shrink-0 type-label uppercase track-fine weight-medium px-2 py-0.5 rounded-full text-[var(--on-accent)]"
          style={{ fontFamily: "var(--font-mono)", background: isEscalated ? "var(--brick)" : "var(--copper)" }}
        >
          {outcomeLabel(entry.outcome)}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {entry.ruleResults.map((r, i) => (
          <div key={`${r.rule}-${i}`} className="flex items-center gap-2 type-mono" style={{ fontFamily: "var(--font-mono)" }}>
            <span style={{ color: r.pass ? "var(--copper)" : "var(--brick)" }}>{r.pass ? "✓" : "✗"}</span>
            <span style={{ color: "var(--ink)" }}>{ruleLabel(r.rule)}</span>
          </div>
        ))}
      </div>

      <p className="type-label mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
        AI review: {entry.aiReviewFired ? "fired" : "not triggered"}
      </p>

      <p className="type-label" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
        {outcomeLabel(entry.outcome)} on behalf of Sadie · {formatTimestamp(entry.timestamp)} · policy v{entry.policyVersion}
      </p>
    </div>
  );
}
