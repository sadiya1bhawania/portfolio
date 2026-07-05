import { Icon } from "../Icon";
import styles from "./CompletionSummary.module.css";

export function CompletionSummary({
  everGated,
  onReset,
}: {
  everGated: boolean;
  onReset: () => void;
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.label}>
          <Icon name="check" size={13} />
          recap
        </span>
        <span className={styles.badge}>sample data · design piece</span>
      </div>

      <p className={styles.body}>
        That&apos;s the loop. Every proposal was a change to a rule you already had, surfaced only
        after the same override repeated, scoped no wider than the evidence supported. A human
        only ever sees what the rules couldn&apos;t clear.
      </p>

      <p className={styles.body}>
        {everGated
          ? "The cap change admits amounts you've never seen, so it asked you to slow down - the system watched not just what you approved but how."
          : "You paused or narrowed along the way, so the speed bump stayed silent - it only slows a fast, unbroken streak."}
      </p>

      <button type="button" className={styles.resetButton} onClick={onReset}>
        Reset demo
      </button>
    </div>
  );
}
