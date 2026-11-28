"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { useReducedMotion } from "../motion/useReducedMotion";
import styles from "./AgentLog.module.css";

type Line = {
  text: string;
  status?: "pass" | "fail";
  /** The text is greyed out. */
  dim?: boolean;
  pill?: string;
};

// A scripted example of one request through the pipeline.
const LINES: Line[] = [
  { text: "parse question", status: "pass" },
  { text: "retrieve docs · RAG", status: "pass" },
  { text: "model call", status: "pass", dim: true, pill: "the easy part" },
  { text: "generate SQL", status: "pass" },
  { text: "safety gate · read-only", status: "fail", pill: "DELETE blocked" },
  { text: "regenerate SQL", status: "pass" },
  { text: "safety gate · read-only", status: "pass" },
  { text: "evals · 3 / 3 passed", status: "pass" },
  { text: "render UI…" },
];

function subscribeClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 250);
  return () => window.clearInterval(timer);
}

// Whole seconds, so the snapshot only changes once a second.
const clockSecond = () => Math.floor(Date.now() / 1000);

const clockTime = (second: number) => new Date(second * 1000).toLocaleTimeString("en-GB", { hour12: false });

type AgentLogProps = {
  /** True once the lines should appear. Remount (change the key) to run them again. */
  running: boolean;
};

export default function AgentLog({ running }: AgentLogProps) {
  // The visitor's clock. Unknown on the server.
  const now = useSyncExternalStore(subscribeClock, clockSecond, () => null);
  const reduced = useReducedMotion();
  // The moment the earlier lines are timed against: when the run starts, or on arrival if it never animates.
  const [base, setBase] = useState<{ second: number; running: boolean } | null>(null);
  if (now !== null && (base === null || (running && !base.running))) setBase({ second: now, running });

  const timeFor = (index: number) => {
    if (now === null || base === null) return "--:--:--";
    // The last line ticks live; the ones before it are a few seconds old.
    return clockTime(index === LINES.length - 1 ? now : base.second - (LINES.length - 1 - index));
  };

  return (
    <div
      className={`${styles.card} ${running && !reduced ? styles.running : ""}`}
      role="log"
      aria-live="off"
      aria-label="Example agent pipeline: question, retrieval, model call, SQL, safety gate, evals, render"
    >
      <div className={styles.header}>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.file}>agent.log</span>
        <span className={styles.question}>
          <span className="sr-only">Example question: </span>
          &quot;which invoices are still unpaid?&quot;
        </span>
      </div>

      <ol className={styles.lines}>
        {LINES.map((line, i) => (
          <li key={i} className={`${styles.line} ${line.status === "fail" ? styles.fail : ""}`} style={{ "--line": i } as CSSProperties}>
            <span className={styles.time}>{timeFor(i)}</span>
            <span className={styles.arrow} aria-hidden="true">
              ›
            </span>
            <span className={styles.body}>
              <span className={line.dim ? styles.dim : undefined}>
                {line.text}
                {!line.status && <span className={styles.cursor} aria-hidden="true">▍</span>}
              </span>
              {line.pill && <span className={styles.pill}>{line.pill}</span>}
            </span>
            {line.status && (
              <span className={styles.mark} role="img" aria-label={line.status === "fail" ? "failed" : "passed"}>
                {line.status === "fail" ? "✗" : "✓"}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
