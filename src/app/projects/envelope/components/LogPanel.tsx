"use client";

// TODO(sadie): phase-two hook - this log is where a future layer would learn
// the human's fix actions (what got escalated, what a person actually changed)
// to propose new rule boundaries automatically instead of waiting to be configured.
// TODO(sadie): swap in-memory session state for real persistence before this
// is demo-stable across a server restart.

import { useEffect, useState } from "react";
import Link from "next/link";
import { LedgerRow, SessionSummary } from "./LedgerRow";
import type { RunHistoryEntry } from "../lib/runHistory";

interface HistoryResponse {
  history: RunHistoryEntry[];
  counts: { committed: number; resolvedByAi: number; escalated: number };
}

interface LogPanelProps {
  /** bump this to force a refetch, e.g. right after a run completes */
  refreshKey?: number;
  /** shown instead of the default "Configure a policy" link, for embedded contexts */
  onConfigure?: () => void;
}

export default function LogPanel({ refreshKey, onConfigure }: LogPanelProps) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/projects/envelope/api/history")
      .then((res) => res.json())
      .then((json: HistoryResponse) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (isLoading && !data) {
    return (
      <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
        Loading…
      </p>
    );
  }

  const history = data?.history ?? [];
  const counts = data?.counts ?? { committed: 0, resolvedByAi: 0, escalated: 0 };

  return (
    <div>
      <div className="mb-8">
        <SessionSummary counts={counts} />
      </div>

      {history.length === 0 ? (
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
          No runs yet. Activate a policy and process a document to see it here.{" "}
          {onConfigure ? (
            <button
              type="button"
              onClick={onConfigure}
              className="underline"
              style={{ color: "var(--copper-dark)", fontFamily: "inherit" }}
            >
              Configure a policy →
            </button>
          ) : (
            <Link href="/projects/envelope/configure" className="underline" style={{ color: "var(--copper-dark)" }}>
              Configure a policy →
            </Link>
          )}
        </p>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <LedgerRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
