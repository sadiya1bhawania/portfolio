"use client";

import { useMemo } from "react";
import Link from "next/link";
import styles from "./EnvelopePhaseTwo.module.css";
import ProposalCard from "./ProposalCard/ProposalCard";
import EvidenceColumn from "./EvidenceColumn/EvidenceColumn";
import QueueColumn from "./QueueColumn/QueueColumn";
import { AboutPanel } from "./AboutPanel/AboutPanel";
import { CompletionSummary } from "./CompletionSummary/CompletionSummary";
import { detectProposals } from "./data/detect";
import { log, totalInvoicesByVendor } from "./data/log";
import { usePhaseTwoState } from "./usePhaseTwoState";

const columns = [
  { key: "logs", label: "From your logs" },
  { key: "review", label: "Under review" },
  { key: "queue", label: "Queue & rhythm" },
] as const;

export default function EnvelopePhaseTwo() {
  const proposals = useMemo(() => detectProposals(log, totalInvoicesByVendor), []);
  const { state, activeProposal, gated, everGated, approve, narrow, ignore, reviewSample, reset } =
    usePhaseTwoState(proposals);

  const activeRecord = state.records[state.activeIndex];
  const allDecided = state.records.every(
    (r) => r.status === "approved" || r.status === "approved_narrowed" || r.status === "ignored"
  );

  return (
    <div className={styles.page}>
      <p className="sr-only">
        Envelope phase two: an interactive walkthrough of boundary proposals detected from your
        approval history. The left column shows the log evidence behind the proposal under
        review, the center column lets you approve, narrow, or dismiss it, and the right column
        tracks the review queue and your approval rhythm.
      </p>

      <div className={styles.header}>
        <h1 className={styles.title}>Envelope · phase two</h1>
        <div className={styles.headerRight}>
          <span className={styles.label}>boundary proposals</span>
          <Link href="/blog/envelope-phase-two" className={styles.writeupLink}>
            Read the engineering write-up →
          </Link>
          <button type="button" className={styles.resetButton} onClick={reset}>
            Reset demo
          </button>
        </div>
      </div>

      <hr className={styles.hairline} />

      <AboutPanel />

      {allDecided ? (
        <CompletionSummary everGated={everGated} onReset={reset} />
      ) : (
      <div className={styles.grid}>
        {columns.map((column) => {
          if (column.key === "logs" && activeProposal) {
            return (
              <div key={column.key} className={styles.column}>
                <EvidenceColumn proposal={activeProposal} log={log} />
              </div>
            );
          }

          if (column.key === "queue") {
            return (
              <div key={column.key} className={styles.column}>
                <QueueColumn
                  proposals={proposals}
                  records={state.records}
                  streak={state.streak}
                  gated={gated}
                  activeIndex={state.activeIndex}
                />
              </div>
            );
          }

          return (
            <div key={column.key} className={styles.column}>
              <span className={styles.columnLabel}>{column.label}</span>
              {column.key === "review" && activeProposal && activeRecord ? (
                <ProposalCard
                  proposal={activeProposal}
                  gated={gated}
                  narrowed={activeRecord.narrowed}
                  streak={state.streak}
                  onApprove={approve}
                  onNarrow={narrow}
                  onIgnore={ignore}
                  onReviewSample={reviewSample}
                />
              ) : (
                <div className={styles.placeholder} />
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
