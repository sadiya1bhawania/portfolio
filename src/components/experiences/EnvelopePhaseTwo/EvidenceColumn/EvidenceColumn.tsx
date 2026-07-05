import { Icon } from "../Icon";
import { Tip } from "../Tip/Tip";
import { Proposal } from "../data/detect";
import { LogEntry } from "../data/log";
import styles from "./EvidenceColumn.module.css";

const TIP_EXCLUDED =
  "A misread - the model read $15,000, the human corrected it to $1,500. That fixed an extraction error, not a rule, so it's logged but never becomes a boundary. Only overrides of a correctly-firing rule teach.";

function scopeVendor(proposal: Proposal): string {
  const match = proposal.proposedRule.match(/exempt (.+)\)/i);
  return match ? match[1] : "";
}

function currentRuleAmount(proposal: Proposal): string {
  const match = proposal.currentRule.match(/\$[\d,]+/);
  return match ? match[0] : proposal.currentRule;
}

export default function EvidenceColumn({
  proposal,
  log,
}: {
  proposal: Proposal;
  log: LogEntry[];
}) {
  const evidenceRows = log.filter((entry) => proposal.evidenceRunIds.includes(entry.runId));
  const excluded = log.find((entry) => entry.correctionType === "extraction_fix");
  const vendor = scopeVendor(proposal);

  return (
    <div className={styles.column}>
      <span className={styles.label}>From your logs</span>

      <div className={styles.rows}>
        {evidenceRows.map((entry) => (
          <div key={entry.runId} className={styles.row}>
            <div className={styles.rowTop}>
              <span className={styles.runId}>{entry.runId}</span>
              <span className={styles.correctionType}>{entry.correctionType}</span>
            </div>
            <p className={styles.detail}>
              {entry.docFeatures.vendor} · ${entry.extractedValue.toLocaleString("en-US")}
            </p>
          </div>
        ))}

        {excluded && (
          <div className={styles.excludedRow}>
            <div className={styles.rowTop}>
              <span className={styles.runId}>{excluded.runId}</span>
              <span className={styles.excludedTagGroup}>
                <span className={styles.excludedTag}>
                  <Icon name="eye-off" size={12} />
                  excluded
                </span>
                <Tip text={TIP_EXCLUDED} label="Why this row is excluded" />
              </span>
            </div>
            <p className={styles.detail}>
              {/* TODO(sadie): corrected value isn't modeled on LogEntry yet - hardcoded to match this demo record */}
              {excluded.docFeatures.vendor} · ${excluded.extractedValue.toLocaleString("en-US")} →
              $1,500
            </p>
            <p className={styles.excludedSub}>misread, not a boundary signal</p>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {proposal.kind === "categorical" ? (
          <>
            <p className={styles.footerMain}>scope: vendor = {vendor}</p>
            <p className={styles.footerSub}>
              waived on {proposal.rate.n} of {proposal.rate.of} {vendor} invoices
            </p>
          </>
        ) : (
          <>
            <p className={styles.footerMain}>shared trait: above {currentRuleAmount(proposal)}</p>
            <p className={styles.footerSub}>no shared vendor</p>
          </>
        )}
      </div>
    </div>
  );
}
