"use client";

import { useId, useState } from "react";
import { Icon } from "../Icon";
import styles from "./AboutPanel.module.css";

export function AboutPanel() {
  const [open, setOpen] = useState(true);
  const contentId = useId();

  return (
    <section className={styles.panel}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.chevron} data-open={open} aria-hidden="true">
            <Icon name="arrow-down" size={13} />
          </span>
          About this demo
        </button>
        <span className={styles.badge}>sample data · design piece</span>
      </div>

      {open && (
        <div id={contentId} className={styles.content}>
          <h2 className={styles.heading}>What you&apos;re looking at</h2>
          <p className={styles.body}>
            An interactive design piece - in-build prototype, sample data, not a shipped system.
            Envelope notices how a human fixes escalated documents and proposes new boundaries
            from what it sees them repeatedly doing, so over time the human writes fewer rules by
            hand. The hard part is not quietly recreating rubber-stamp approval.
          </p>
          <p className={styles.tryIt}>
            <strong>Try it two ways:</strong> Approve the first two quickly without narrowing,
            then watch the high-stakes third one. Or pause on one - narrow it, or just take your
            time - and watch the speed bump stay silent.
          </p>
        </div>
      )}
    </section>
  );
}
