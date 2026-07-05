"use client";

import { Icon } from "@/src/components/experiences/EnvelopePhaseTwo/Icon";
import type { RetrievedChunk, StageEvent } from "../types";
import type { PipelineState } from "../lib/usePipeline";
import styles from "./PipelinePanel.module.css";

const STAGE_LABELS: Record<string, string> = {
  embedding_question: "Embedding the question",
  retrieving: "Retrieving chunks",
  retrieved: "Chunks retrieved",
  loading_bundle: "Loading concept bundle",
  selecting: "Choosing concepts",
  selected: "Concepts chosen",
  expanding_links: "Following links",
  answering: "Generating answer",
  done: "Done",
};

function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

function StageMarker({ status }: { status: StageEvent["status"] }) {
  if (status === "error") return <Icon name="info" size={14} className={styles.markerError} />;
  if (status === "done") return <Icon name="check" size={14} className={styles.markerDone} />;
  return <Icon name="clock" size={14} className={styles.markerActive} />;
}

/** RAG's one side-specific detail: the chunks the retriever pulled in, and their scores. */
function RagStageDetail({ event }: { event: StageEvent }) {
  if (event.stage !== "retrieved") return null;

  const retrieved = (event.data as { retrieved?: RetrievedChunk[] } | undefined)?.retrieved ?? [];
  if (retrieved.length === 0) return null;

  const sourceDocs = new Set(retrieved.map((r) => r.chunk.docId));

  return (
    <div className={styles.detail}>
      <p className={styles.detailNote}>
        Stitched together {retrieved.length} chunk{retrieved.length === 1 ? "" : "s"} from {sourceDocs.size} source
        document{sourceDocs.size === 1 ? "" : "s"}
      </p>
      <ul className={styles.detailList}>
        {retrieved.map((r) => (
          <li key={r.chunk.id} className={styles.detailItem}>
            <span className={styles.detailLabel}>{r.chunk.docId}</span>
            <span className={styles.detailScore}>score {r.score.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** OKF's two side-specific details: which files were chosen, and which came in via links. */
function OkfStageDetail({ event }: { event: StageEvent }) {
  if (event.stage === "selected") {
    const selectedFilenames = (event.data as { selectedFilenames?: string[] } | undefined)?.selectedFilenames ?? [];

    if (selectedFilenames.length === 0) {
      return (
        <div className={styles.detail}>
          <p className={styles.detailFail}>No concept files were chosen from the title list.</p>
        </div>
      );
    }

    return (
      <div className={styles.detail}>
        <p className={styles.detailNote}>
          Picked {selectedFilenames.length} file{selectedFilenames.length === 1 ? "" : "s"} from the title list:
        </p>
        <ul className={styles.detailList}>
          {selectedFilenames.map((filename) => (
            <li key={filename} className={styles.detailItem}>
              <span className={styles.detailLabel}>{filename}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (event.stage === "expanding_links") {
    const linked = (event.data as { linked?: { filename: string; linkedFrom?: string }[] } | undefined)?.linked ?? [];

    if (linked.length === 0) {
      return (
        <div className={styles.detail}>
          <p className={styles.detailNote}>No extra files were pulled in through links.</p>
        </div>
      );
    }

    return (
      <div className={styles.detail}>
        <p className={styles.detailNote}>Pulled in through links:</p>
        <ul className={styles.detailList}>
          {linked.map((link) => (
            <li key={link.filename} className={styles.detailItem}>
              <span className={styles.detailLabel}>{link.filename}</span>
              <span className={styles.detailMuted}>via {link.linkedFrom}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

function StageDetail({ kind, event }: { kind: "rag" | "okf"; event: StageEvent }) {
  return kind === "rag" ? <RagStageDetail event={event} /> : <OkfStageDetail event={event} />;
}

interface PipelinePanelProps {
  title: string;
  kind: "rag" | "okf";
  pipeline: PipelineState;
}

/** Renders one pipeline's live progress. RAG and OKF share this panel; only the stage details differ. */
export default function PipelinePanel({ title, kind, pipeline }: PipelinePanelProps) {
  const { stages, currentStage, status, answer, error } = pipeline;
  const isEmpty = status === "done" && !error && !answer?.trim();

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.statusLabel}>{status}</span>
      </div>

      {stages.length === 0 ? (
        <p className={styles.placeholder}>Ask a question to see this pipeline run.</p>
      ) : (
        <ul className={styles.stageList}>
          {stages.map((event, i) => (
            <li
              key={`${event.stage}-${i}`}
              className={event.stage === currentStage && event.status === "active" ? styles.stageItemCurrent : styles.stageItem}
            >
              <div className={styles.stageRow}>
                <StageMarker status={event.status} />
                <span className={styles.stageName}>{stageLabel(event.stage)}</span>
              </div>
              <StageDetail kind={kind} event={event} />
            </li>
          ))}
        </ul>
      )}

      {(error || isEmpty) && (
        <p className={styles.failText}>{error ?? "No answer came back from this pipeline."}</p>
      )}
    </div>
  );
}
