import { Icon } from "../Icon";
import { Tip } from "../Tip/Tip";
import { Proposal } from "../data/detect";
import { ProposalState, Status } from "../state";
import styles from "./QueueColumn.module.css";

const TIP_RHYTHM =
  "This watches how you approve, not just what. A run of fast, un-narrowed approvals on low-stakes items triggers a pause before a high-stakes one. Slow down or narrow once and it won't fire.";

function currentParam(proposal: Proposal): number {
  const match = proposal.currentRule.match(/\$([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
}

function shortUsd(value: number): string {
  if (value % 1000 === 0) return `$${value / 1000}k`;
  return `$${value.toLocaleString("en-US")}`;
}

function fullUsd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

function scopeVendor(proposal: Proposal): string {
  const match = proposal.proposedRule.match(/exempt (.+)\)/i);
  return match ? match[1] : "";
}

function shortStatement(proposal: Proposal): string {
  const param = currentParam(proposal);
  if (proposal.kind === "categorical") {
    return `Exempt ${scopeVendor(proposal)} from ${shortUsd(param)} cap`;
  }
  const cap = proposal.admittedBand?.[1] ?? 0;
  return `Raise ${shortUsd(param)} cap → ${fullUsd(cap)}`;
}

function StatusTag({ status }: { status: Status }) {
  switch (status) {
    case "reviewing":
      return (
        <span className={styles.statusReviewing}>
          <Icon name="play" size={11} />
          reviewing
        </span>
      );
    case "approved":
      return (
        <span className={styles.statusApproved}>
          <Icon name="check" size={11} />
          approved
        </span>
      );
    case "approved_narrowed":
      return (
        <span className={styles.statusApproved}>
          <Icon name="check" size={11} />
          approved · narrowed
        </span>
      );
    case "ignored":
      return <span className={styles.statusPending}>not now</span>;
    case "pending":
    default:
      return <span className={styles.statusPending}>pending</span>;
  }
}

export default function QueueColumn({
  proposals,
  records,
  streak,
  gated,
  activeIndex,
}: {
  proposals: Proposal[];
  records: ProposalState[];
  streak: number;
  gated: boolean;
  activeIndex: number;
}) {
  const approvals = records.filter(
    (r) => r.status === "approved" || r.status === "approved_narrowed"
  ).length;
  const narrowedCount = records.filter((r) => r.status === "approved_narrowed").length;

  const approvalsValue =
    approvals === 0
      ? "none yet"
      : `${approvals}${streak > 0 ? ` · fast streak ${streak}` : ""}`;
  const narrowedValue = narrowedCount === 0 ? "-" : `${narrowedCount} of ${approvals}`;

  return (
    <div className={styles.column}>
      <span className={styles.label}>Queue &amp; rhythm</span>

      <div className={styles.rows}>
        {proposals.map((proposal, index) => {
          const record = records[index];
          const isReviewing = record?.status === "reviewing";
          return (
            <div key={proposal.id} className={isReviewing ? styles.rowActive : styles.row}>
              <div className={styles.rowTop}>
                <span className={styles.rowMeta}>
                  {String(index).padStart(2, "0")} · {proposal.blastRadius}
                </span>
                <StatusTag status={record?.status ?? "pending"} />
              </div>
              <p className={styles.statement}>{shortStatement(proposal)}</p>
            </div>
          );
        })}
      </div>

      <div className={styles.rhythm}>
        <span className={styles.rhythmLabelRow}>
          <span className={styles.rhythmLabel}>
            <Icon name="clock" size={12} />
            approval rhythm
          </span>
          <Tip text={TIP_RHYTHM} label="How the speed bump works" />
        </span>

        <div className={styles.rhythmRow}>
          <span>approvals</span>
          <span>{approvalsValue}</span>
        </div>
        <div className={styles.rhythmRow}>
          <span>narrowed</span>
          <span>{narrowedValue}</span>
        </div>

        <hr className={styles.rhythmHairline} />

        <div aria-live="polite" className={styles.liveRegion}>
          {gated ? (
            <>
              <span className={styles.rhythmGated}>
                <Icon name="pause" size={13} />
                speed bump active on {String(activeIndex + 1).padStart(2, "0")}
              </span>
              <p className={styles.rhythmSub}>
                high blast radius meets a fast streak. it tells you whenever it slows you down.
              </p>
            </>
          ) : (
            <>
              <span className={styles.rhythmClear}>
                <Icon name="check" size={13} />
                clear - no speed bump
              </span>
              <p className={styles.rhythmSub}>
                {approvals === 0
                  ? "low stakes and a fresh start. approve when the evidence holds."
                  : "you paused or narrowed - nothing to slow down."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
