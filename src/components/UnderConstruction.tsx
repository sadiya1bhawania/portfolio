import styles from "./UnderConstruction.module.css";

export default function UnderConstruction({ section }: { section: string }) {
  return (
    <section className={styles.wrap} role="status" aria-live="polite">
      <p className={styles.kicker}>/ {section.toUpperCase()}</p>
      <h1 className={styles.heading}>Under construction</h1>

      <div className={styles.rig} aria-hidden="true">
        <div className={styles.ring} />
        <div className={styles.core} />
      </div>

      <p className={styles.terminal}>
        building this page<span className={styles.cursor}>_</span>
      </p>
      <p className={styles.paragraph}>
        This section is still being built. Check back soon, or explore the
        rest of the site in the meantime.
      </p>
    </section>
  );
}
