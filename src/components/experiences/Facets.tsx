import { GitBranch, Rocket, Camera } from "lucide-react";
import styles from "./Facets.module.css";

export default function Facets() {
  return (
    <section className={styles.section}>
      <div className={styles.facet}>
        <div className={styles.ring} aria-hidden="true">
          <GitBranch size={24} />
        </div>
        <h3 className={styles.title}>Systems thinker</h3>
        <p className={styles.blurb}>
          I don&apos;t just call the model — I design the gates that catch it
          when it&apos;s wrong, before it ever hits your database.
        </p>
      </div>

      <div className={styles.facet}>
        <div className={styles.ring} aria-hidden="true">
          <Rocket size={24} />
        </div>
        <h3 className={styles.title}>Ships, not prototypes</h3>
        <p className={styles.blurb}>
          Six years owning features end-to-end — from the prompt all the way
          to the product the user actually uses.
        </p>
      </div>

      <div className={styles.facet}>
        <div className={`${styles.ring} ${styles.ringHi}`} aria-hidden="true">
          <Camera size={24} />
        </div>
        <h3 className={styles.title}>Off the clock</h3>
        <p className={styles.blurb}>
          When I&apos;m not building, I&apos;m behind a camera. Find my
          photography at{" "}
          <a
            href="https://www.instagram.com/shutterbysadiya/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.handle}
          >
            @shutterbysadiya
          </a>
          .
        </p>
      </div>
    </section>
  );
}
