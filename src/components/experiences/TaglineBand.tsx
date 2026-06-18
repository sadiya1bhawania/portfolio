import styles from "./TaglineBand.module.css";

export default function TaglineBand() {
  return (
    <section className={styles.band}>
      <p className={styles.tagline}>
        Making AI reliable enough to <u>ship</u> is what I love doing most.
      </p>
    </section>
  );
}
