"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SUGGESTED_QUESTIONS } from "./lib/suggestedQuestions";
import PipelineStages from "./components/PipelineStages";
import type { Stage, Status, PipelineEvent } from "./lib/pipelineTypes";

interface ChatEntry {
  id: string;
  question: string;
  stageStatus: Partial<Record<Stage, Status>>;
  events: PipelineEvent[];
  sql?: string;
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  summary?: string;
  error?: string;
  showSql: boolean;
  showRows: boolean;
  isStreaming: boolean;
}

const STAGE_ORDER: Stage[] = ["retrieve", "generate", "execute", "summarize"];
const STAGE_LABEL: Record<Stage, string> = {
  retrieve: "Retrieve schema",
  generate: "Generate SQL",
  execute: "Run query",
  summarize: "Summarize",
  done: "Done",
};

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function StagePill({ stage, status }: { stage: Stage; status?: Status }) {
  const base = "px-2 py-0.5 rounded-full type-label uppercase track-fine weight-medium";
  if (status === "complete") {
    return (
      <span className={`${base} bg-[var(--tts-indigo)] text-[var(--tts-on-indigo)]`} style={{ fontFamily: "var(--font-mono)" }}>
        {STAGE_LABEL[stage]}
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        className={`${base} bg-[var(--tts-amber)] text-[var(--tts-on-amber)] animate-pulse`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {STAGE_LABEL[stage]}…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className={`${base} bg-[var(--brick-light)] text-[var(--brick-dark)]`} style={{ fontFamily: "var(--font-mono)" }}>
        {STAGE_LABEL[stage]} failed
      </span>
    );
  }
  return (
    <span className={`${base} bg-[var(--tts-paper)] text-[var(--tts-muted)]`} style={{ fontFamily: "var(--font-mono)" }}>
      {STAGE_LABEL[stage]}
    </span>
  );
}

function AnswerCard({
  entry,
  onToggleSql,
  onToggleRows,
}: {
  entry: ChatEntry;
  onToggleSql: () => void;
  onToggleRows: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--tts-border)] bg-[var(--surface)] p-4 shadow-sm max-w-[42rem]">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {STAGE_ORDER.map((stage) => (
          <StagePill key={stage} stage={stage} status={entry.stageStatus[stage]} />
        ))}
      </div>

      {entry.error && (
        <div className="mb-3 rounded-lg bg-[var(--brick-light)] border border-[var(--brick)] px-3 py-2 type-small text-[var(--brick-dark)]">
          {entry.error}
        </div>
      )}

      {entry.summary && (
        <p className="type-small lead-body text-[var(--tts-ink)]" style={{ fontFamily: "var(--font-body)" }}>
          {entry.summary}
        </p>
      )}

      {!entry.summary && !entry.error && entry.isStreaming && (
        <p className="type-small text-[var(--tts-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
          Working…
        </p>
      )}

      {(entry.sql || (entry.rows && entry.rows.length > 0)) && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {entry.sql && (
            <button
              type="button"
              onClick={onToggleSql}
              className="type-label uppercase track-fine weight-medium px-2.5 py-1 rounded-full border border-[var(--tts-indigo)] text-[var(--tts-indigo)] hover:bg-[var(--tts-indigo)] hover:text-[var(--tts-on-indigo)] transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {entry.showSql ? "Hide SQL" : "Show SQL"}
            </button>
          )}
          {entry.rows && entry.rows.length > 0 && (
            <button
              type="button"
              onClick={onToggleRows}
              className="type-label uppercase track-fine weight-medium px-2.5 py-1 rounded-full border border-[var(--tts-amber)] text-[var(--tts-amber-dark)] hover:bg-[var(--tts-amber)] hover:text-[var(--tts-on-amber)] transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {entry.showRows ? "Hide rows" : `Show rows${entry.rowCount ? ` (${entry.rowCount})` : ""}`}
            </button>
          )}
        </div>
      )}

      {entry.showSql && entry.sql && (
        <pre
          className="mt-3 rounded-lg bg-[var(--code-bg)] text-[var(--code-accent)] type-fine p-3 overflow-x-auto"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <code>{entry.sql}</code>
        </pre>
      )}

      {entry.showRows && entry.rows && entry.rows.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--tts-border)]">
          <table className="w-full type-fine" style={{ fontFamily: "var(--font-mono)" }}>
            <thead>
              <tr className="bg-[var(--tts-indigo-50)]">
                {(entry.columns ?? Object.keys(entry.rows[0])).map((col) => (
                  <th key={col} className="text-left px-3 py-2 weight-medium text-[var(--tts-indigo)] whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.rows.map((row, i) => (
                <tr key={i} className="border-t border-[var(--tts-border)]">
                  {(entry.columns ?? Object.keys(row)).map((col) => (
                    <td key={col} className="px-3 py-2 whitespace-nowrap text-[var(--tts-ink)]">
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {entry.rowCount !== undefined && entry.rowCount > entry.rows.length && (
            <div className="px-3 py-1.5 type-label text-[var(--tts-muted)] bg-[var(--tts-paper)]">
              Showing {entry.rows.length} of {entry.rowCount} rows
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TextToSqlPage() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const entryNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  const updateEntry = useCallback((id: string, patch: Partial<ChatEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const applyEvent = useCallback((id: string, event: PipelineEvent) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next: ChatEntry = {
          ...e,
          stageStatus: { ...e.stageStatus, [event.stage]: event.status },
          events: [...e.events, event],
        };
        if (event.sql !== undefined) next.sql = event.sql;
        if (event.columns !== undefined) next.columns = event.columns;
        if (event.rows !== undefined) next.rows = event.rows;
        if (event.rowCount !== undefined) next.rowCount = event.rowCount;
        if (event.summary !== undefined) next.summary = event.summary;
        if (event.status === "error" && event.error) next.error = event.error;
        return next;
      })
    );
  }, []);

  const submitQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isBusy) return;

      const id = makeId();
      setEntries((prev) => [
        ...prev,
        {
          id,
          question: trimmed,
          stageStatus: {},
          events: [],
          showSql: false,
          showRows: false,
          isStreaming: true,
        },
      ]);
      setInput("");
      setIsBusy(true);

      try {
        const res = await fetch("/projects/textToSql/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed }),
        });

        if (!res.body) throw new Error("No response body from server.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json) continue;
            const event: PipelineEvent = JSON.parse(json);
            applyEvent(id, event);
          }
        }
      } catch (err) {
        applyEvent(id, {
          stage: "done",
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        updateEntry(id, { isStreaming: false });
        setIsBusy(false);
      }
    },
    [isBusy, applyEvent, updateEntry]
  );

  function scrollToEntry(id: string) {
    entryNodeRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className="flex flex-col md:flex-row"
      style={{
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-[var(--tts-border)] bg-[var(--tts-indigo-50)]/60 flex flex-col">
        <div className="px-4 py-4 border-b border-[var(--tts-border)]">
          <h1 className="type-small weight-medium text-[var(--tts-ink)]" style={{ fontFamily: "var(--font-head)" }}>
            Text-to-SQL
          </h1>
          <p className="type-label text-[var(--tts-muted)] mb-2" style={{ fontFamily: "var(--font-mono)" }}>
            Chinook demo · session history
          </p>
          <Link
            href="/blog"
            className="type-label text-[var(--tts-indigo)] hover:underline block mb-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Engineering notes →
          </Link>
          <Link
            href="/projects/cisco-agent-tracking"
            className="type-label text-[var(--tts-muted)] hover:underline block"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Related: agent tracking @ Cisco →
          </Link>
        </div>
        <div className="hidden md:block flex-1 overflow-y-auto py-2">
          {entries.length === 0 ? (
            <p className="px-4 py-3 type-fine text-[var(--tts-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
              No questions yet.
            </p>
          ) : (
            <ul className="px-2 space-y-1">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => scrollToEntry(entry.id)}
                    className="w-full text-left rounded-lg px-3 py-2 type-fine lead-small text-[var(--tts-ink)] hover:bg-[var(--surface)] border-l-2 border-transparent hover:border-[var(--tts-amber)] transition-colors truncate"
                    style={{ fontFamily: "var(--font-body)" }}
                    title={entry.question}
                  >
                    {entry.question}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main chat pane */}
      <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[var(--tts-paper)]">
        <div className="px-6 pt-6">
          <PipelineStages events={entries[entries.length - 1]?.events ?? []} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {entries.length === 0 && (
            <div className="max-w-2xl">
              <h2
                className="type-h2 weight-medium text-[var(--tts-ink)] mb-2"
                style={{ fontFamily: "var(--font-head)" }}
              >
                Ask the Chinook database a question
              </h2>
              <p className="type-small text-[var(--tts-muted)] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                LLM turns your question into SQL, runs it read-only, and explains the result.
                Every answer shows its work, toggle to see the generated SQL and raw rows.
              </p>
            </div>
          )}

          {entries.map((entry) => (
            <div
              key={entry.id}
              ref={(node) => {
                if (node) entryNodeRefs.current.set(entry.id, node);
                else entryNodeRefs.current.delete(entry.id);
              }}
              className="space-y-2"
            >
              <div className="flex justify-end">
                <div
                  className="max-w-[36rem] rounded-2xl bg-[var(--tts-indigo)] text-[var(--tts-on-indigo)] px-4 py-2.5 type-small"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {entry.question}
                </div>
              </div>
              <AnswerCard
                entry={entry}
                onToggleSql={() => updateEntry(entry.id, { showSql: !entry.showSql })}
                onToggleRows={() => updateEntry(entry.id, { showRows: !entry.showRows })}
              />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions + input */}
        <div className="border-t border-[var(--tts-border)] bg-[var(--surface)] px-6 py-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={isBusy}
                onClick={() => submitQuestion(q)}
                className="type-fine px-3 py-1.5 rounded-full border border-[var(--tts-amber)] text-[var(--tts-amber-dark)] bg-[var(--tts-amber-50)] hover:bg-[var(--tts-amber)] hover:text-[var(--tts-on-amber)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitQuestion(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the Chinook music store…"
              disabled={isBusy}
              className="flex-1 rounded-xl border border-[var(--tts-border)] px-4 py-2.5 type-small text-[var(--tts-ink)] focus:outline-none focus:border-[var(--tts-indigo)] disabled:opacity-60"
              style={{ fontFamily: "var(--font-body)" }}
            />
            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              className="rounded-xl bg-[var(--tts-indigo)] text-[var(--tts-on-indigo)] px-5 py-2.5 type-small weight-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--tts-indigo-strong)] transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {isBusy ? "…" : "Ask"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
