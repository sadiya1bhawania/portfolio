import { Icon } from "../Icon";
import { Tip } from "../Tip/Tip";
import { Proposal, phraseProposal } from "../data/detect";
import styles from "./ProposalCard.module.css";

const TIP_RATE =
  "The count alone can mislead - 3 of 4 is a pattern, 3 of 300 is noise. The denominator lets you judge the base rate, not just the number.";
const TIP_RULE_DIFF =
  "Every proposal is a change to a rule you already set, never a rule from nowhere. You review one delta against a boundary you recognize.";
const TIP_ADMITS_CATEGORICAL =
  "A vendor exemption is bounded - only Acme documents are ever affected. Nothing you haven't seen can slip through.";
const TIP_ADMITS_NUMERIC =
  "Raising a cap admits an open range, including amounts you've never seen. That's why this carries more friction than a bounded exemption.";
const TIP_BLAST_RADIUS =
  "Blast radius is how much a change could let through unseen. Low = a bounded set. High = an open range. Friction scales with it.";
const TIP_NARROW =
  "Narrowing shrinks the proposal to just the slice your evidence covered - you can't do it without reading the evidence, which is the point. It also signals you're paying attention.";
const TIP_FOOTER =
  "Doing nothing is safe - an unapproved proposal stays off and the original rule keeps firing. Neglect means more escalations to a human, never something auto-passed.";

function reasoningLine(proposal: Proposal): string {
  if (proposal.kind === "categorical") {
    const vendorMatch = proposal.proposedRule.match(/exempt (.+)\)/i);
    const vendor = vendorMatch ? vendorMatch[1] : "these";
    return `You waived this cap on ${proposal.rate.n} of ${proposal.rate.of} ${vendor} invoices.`;
  }
  return `You waived this cap on ${proposal.rate.n} of ${proposal.rate.of} invoices.`;
}

function admitsMessage(proposal: Proposal): string {
  if (proposal.kind === "categorical") {
    const vendorMatch = proposal.proposedRule.match(/exempt (.+)\)/i);
    const vendor = vendorMatch ? vendorMatch[1] : "these";
    return `Only ${vendor} documents. Nothing you haven't already seen gets through.`;
  }

  const [low, high] = proposal.admittedBand ?? [0, 0];
  return `The $${low.toLocaleString("en-US")}–$${high.toLocaleString(
    "en-US"
  )} band, including amounts you've never seen. ${proposal.admittedDocsLastQuarter} docs last quarter would have auto-passed.`;
}

export default function ProposalCard({
  proposal,
  gated,
  narrowed,
  streak,
  onApprove,
  onNarrow,
  onIgnore,
  onReviewSample,
}: {
  proposal: Proposal;
  gated: boolean;
  narrowed: boolean;
  streak: number;
  onApprove: () => void;
  onNarrow: () => void;
  onIgnore: () => void;
  onReviewSample: () => void;
}) {
  const approveLabel = proposal.kind === "categorical" ? "Approve exemption" : "Approve change";
  const blastPillClass = proposal.blastRadius === "low" ? styles.blastLow : styles.blastHigh;

  return (
    <div className={styles.card}>
      <div className={styles.badgeRow}>
        <span className={styles.kindPill}>{proposal.kind}</span>
        <span className={styles.pillGroup}>
          <span className={blastPillClass}>{proposal.blastRadius} blast radius</span>
          <Tip text={TIP_BLAST_RADIUS} label="What blast radius means" />
        </span>
        {narrowed && <span className={styles.narrowedPill}>scope narrowed</span>}
      </div>

      <h3 className={styles.statement}>{phraseProposal(proposal)}</h3>

      <p className={styles.reasoning}>
        {reasoningLine(proposal)} <Tip text={TIP_RATE} label="Why the denominator matters" />
      </p>

      <div className={styles.ruleDiff}>
        <span className={styles.monoLabelRow}>
          <span className={styles.monoLabel}>current rule</span>
          <Tip text={TIP_RULE_DIFF} label="Why this is a delta, not a new rule" />
        </span>
        <p className={styles.currentRuleText}>{proposal.currentRule}</p>
        <p className={styles.setByYou}>set by you</p>

        <div className={styles.arrowWrap} aria-hidden="true">
          <Icon name="arrow-down" size={15} />
        </div>

        <span className={styles.monoLabel}>proposed change</span>
        <p className={styles.proposedRuleText}>{proposal.proposedRule}</p>
      </div>

      <div className={styles.admits}>
        <span className={styles.monoLabelRow}>
          <span className={styles.monoLabel}>what this admits</span>
          <Tip
            text={proposal.kind === "categorical" ? TIP_ADMITS_CATEGORICAL : TIP_ADMITS_NUMERIC}
            label="What this admits, explained"
          />
        </span>
        <p className={styles.admitsMessage}>{admitsMessage(proposal)}</p>
        {proposal.kind === "numeric" && proposal.admittedBand && (
          <p className={styles.admitsSub}>
            ${proposal.admittedBand[1].toLocaleString("en-US")} is the largest amount you waived.
            No buffer added.
          </p>
        )}
      </div>

      {gated ? (
        <div className={styles.pausedPanel}>
          <span className={styles.pausedLabel}>
            <Icon name="pause" size={12} />
            review paused
          </span>
          <p className={styles.pausedMessage}>
            You approved {streak} proposals quickly without narrowing. This one raises a cap -
            look at one document before approving.
          </p>

          <div className={styles.actions}>
            <button type="button" className={styles.reviewSample} onClick={onReviewSample}>
              <Icon name="eye" size={14} />
              Review a sample doc
            </button>
            <button type="button" className={styles.approveLocked} disabled aria-disabled="true">
              <Icon name="lock" size={14} />
              {approveLabel}
            </button>
            <span className={styles.actionWithTip}>
              <button type="button" className={styles.narrow} onClick={onNarrow}>
                <Icon name="narrow" size={14} />
                Narrow scope
              </button>
              <Tip text={TIP_NARROW} label="Why narrowing matters" />
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <button type="button" className={styles.approve} onClick={onApprove}>
            {approveLabel}
          </button>
          <span className={styles.actionWithTip}>
            <button
              type="button"
              className={narrowed ? styles.narrowInert : styles.narrow}
              onClick={narrowed ? undefined : onNarrow}
              disabled={narrowed}
              aria-disabled={narrowed}
            >
              <Icon name="narrow" size={14} />
              Narrow scope
            </button>
            <Tip text={TIP_NARROW} label="Why narrowing matters" />
          </span>
          <button type="button" className={styles.notNow} onClick={onIgnore}>
            Not now
          </button>
        </div>
      )}

      <p className={styles.footer}>
        Ignored, this stays off - the {proposal.currentRule} keeps firing and matching docs keep
        escalating. <Tip text={TIP_FOOTER} label="Why doing nothing is safe" />
      </p>
    </div>
  );
}
