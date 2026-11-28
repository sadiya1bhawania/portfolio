import styles from "./HomeFooter.module.css";

const LINKEDIN = "https://www.linkedin.com/in/sadiyabhawania";

export default function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>
          Follow the <span className={styles.accent}>build.</span>
        </h2>
        <div className={styles.actions}>
          <a href={LINKEDIN} className={styles.filled}>
            Read the notes →
          </a>
          <a href={LINKEDIN} className={styles.outline}>
            Say hi on LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
