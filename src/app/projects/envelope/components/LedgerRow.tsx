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
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "#fff" }}>
      <p className="text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>
        <span style={{ color: "var(--copper-dark)", fontWeight: 600 }}>{counts.committed} committed</span>
        <span style={{ color: "var(--muted)" }}> · </span>
        <span style={{ color: "var(--copper-dark)", fontWeight: 600 }}>{counts.resolvedByAi} resolved by AI</span>
        <span style={{ color: "var(--muted)" }}> · </span>
        <span style={{ color: "var(--brick-dark)", fontWeight: 600 }}>{counts.escalated} escalated</span>
      </p>
    </div>
  );
}

export function LedgerRow({ entry }: { entry: RunHistoryEntry }) {
  const isEscalated = entry.outcome === "escalated";
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "#fff" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {formatTimestamp(entry.timestamp)}
          </p>
          <p className="text-[15px] font-medium" style={{ fontFamily: "var(--font-head)" }}>
            {entry.documentName}
          </p>
        </div>
        <span
          className="shrink-0 text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full text-white"
          style={{ fontFamily: "var(--font-mono)", background: isEscalated ? "var(--brick)" : "var(--copper)" }}
        >
          {outcomeLabel(entry.outcome)}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {entry.ruleResults.map((r, i) => (
          <div key={`${r.rule}-${i}`} className="flex items-center gap-2 text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>
            <span style={{ color: r.pass ? "var(--copper)" : "var(--brick)" }}>{r.pass ? "✓" : "✗"}</span>
            <span style={{ color: "var(--ink)" }}>{ruleLabel(r.rule)}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
        AI review: {entry.aiReviewFired ? "fired" : "not triggered"}
      </p>

      <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
        {outcomeLabel(entry.outcome)} on behalf of Sadie · {formatTimestamp(entry.timestamp)} · policy v{entry.policyVersion}
      </p>
    </div>
  );
}
