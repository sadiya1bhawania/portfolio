import Link from "next/link";
import styles from "./FeaturedProject.module.css";

const STEPS = ["Ask in English", "Generate SQL", "Validate & gate", "Stream answer"];

export default function FeaturedProject() {
  return (
    <section className={styles.band}>
      <div className={styles.inner}>
        <p className={styles.kicker}>/ FEATURED PROJECT</p>
        <h2 className={styles.heading}>A drop-in text-to-SQL engine</h2>
        <p className={styles.paragraph}>
          Point it at your database, ask questions in plain English, get
          answers you can trust, with validation gates between the model
          and your data.
        </p>
        <div className={styles.pipeline}>
          {STEPS.map((step, i) => (
            <span key={step} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className={styles.pill}>{step}</span>
              {i < STEPS.length - 1 && (
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
          <Link href="/projects" className={styles.btnFilled}>
            Explore →
          </Link>
        </div>
      </div>
    </section>
  );
}
