"use client";

import { useCallback, useRef, useState } from "react";
import type { StageEvent } from "../types";

export type PipelineStatus = "idle" | "running" | "done" | "error";

export interface PipelineState {
  /** every StageEvent received so far, in arrival order */
  stages: StageEvent[];
  /** the stage name of the most recently received event, or null before anything arrives */
  currentStage: string | null;
  /** the final answer text, once the "done" event has arrived */
  answer: string | null;
  status: PipelineStatus;
  error: string | null;
  /** starts a new run, replacing any previous run's state */
  run: (question: string) => void;
}

/**
 * Opens an SSE connection to the given pipeline endpoint and collects the
 * StageEvents it streams back into React state. Reuses the same
 * fetch + ReadableStream reading approach used by the envelope demo's
 * RunPanel: read chunks, split on blank lines, parse each "data:" line as JSON.
 */
export function usePipeline(endpoint: string): PipelineState {
  const [stages, setStages] = useState<StageEvent[]>([]);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Bumped on every run() call so a stale in-flight stream can't overwrite
  // the state of a newer run.
  const runIdRef = useRef(0);

  const run = useCallback(
    (question: string) => {
      const runId = ++runIdRef.current;
      setStages([]);
      setCurrentStage(null);
      setAnswer(null);
      setError(null);
      setStatus("running");

      (async () => {
        let sawError = false;

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question }),
          });
          if (!res.body) throw new Error("No response body from server.");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (runIdRef.current !== runId) return;

            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split("\n\n");
            buffer = frames.pop() ?? "";

            for (const frame of frames) {
              const line = frame.trim();
              if (!line.startsWith("data:")) continue;
              const json = line.slice(5).trim();
              if (!json) continue;

              const event = JSON.parse(json) as StageEvent;
              setStages((prev) => [...prev, event]);
              setCurrentStage(event.stage);

              if (event.status === "error") {
                sawError = true;
                setError(event.error ?? "Pipeline failed.");
              }
              if (event.stage === "done" && event.status === "done") {
                const data = event.data as { answer?: string } | undefined;
                setAnswer(data?.answer ?? "");
              }
            }
          }
        } catch (err) {
          if (runIdRef.current !== runId) return;
          sawError = true;
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          if (runIdRef.current === runId) {
            setStatus(sawError ? "error" : "done");
          }
        }
      })();
    },
    [endpoint]
  );

  return { stages, currentStage, answer, status, error, run };
}
