import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div>
        <p className={styles.kicker}>/ HI, I&apos;M SADIYA</p>
        <h1 className={styles.heading}>
          I make AI do real work, <span className="hl">safely</span>.
        </h1>
        <p className={styles.paragraph}>
          Full-stack software engineer building production AI systems, from
          the React frontend to the cloud infrastructure to the validation
          layers most demos skip.
        </p>
        <div className={styles.actions}>
          <Link href="/projects" className={styles.btnFilled}>
            See the projects →
          </Link>
          <Link href="/experiences" className={styles.btnOutline}>
            About me
          </Link>
          <Link href="/experiences" className={styles.btnGhost}>
            Resume ↗
          </Link>
        </div>
      </div>

      <div className={styles.card} aria-label="Text-to-SQL demo preview">
        <p className={styles.cardLabel}>TEXT-TO-SQL</p>
        <p className={styles.prompt}>
          <span className={styles.bullet}>▸</span> top 5 customers by revenue
          last quarter
        </p>
        <pre className={styles.codeBlock}>
          <code>
            {`SELECT customer, SUM(revenue)
FROM orders
WHERE quarter='Q4'
GROUP BY customer
ORDER BY 2 DESC LIMIT 5`}
          </code>
        </pre>
        <div className={styles.statusRow}>
          <span className={styles.chip}>✓ validated</span>
          <span className={styles.streaming}>streaming answer…</span>
        </div>
      </div>
    </section>
  );
}
