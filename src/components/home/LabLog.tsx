import styles from "./LabLog.module.css";

// Copy from docs/motion-reference.html.
const ROWS = [
  ["BUILDING", "Gen UI engine, open source. Agent → component library → UI."],
  // TODO(sadie): book title placeholder. Confirm it; the displayed line stays as is until then.
  ["READING", "AI evals, Hamel Husain. How to measure an LLM failing before users do."],
  ["STUDYING", "World models and JEPA. What comes after next-token prediction."],
  ["SHIPPING", "Clinical AI at Knowtex."],
];

export default function LabLog() {
  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <span className={styles.kicker}>/ lab log</span>
        <h2 className={styles.heading}>What I&apos;m reading, building, and breaking.</h2>
      </div>
      <dl className={styles.rows}>
        {ROWS.map(([label, text]) => (
          <div key={label} className={styles.row}>
            <dt>{label}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
