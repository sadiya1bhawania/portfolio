import Link from "next/link";
import Image from "next/image";
import styles from "./AboutHero.module.css";

export default function AboutHero() {
  return (
    <section className={styles.hero}>
      <div>
        <p className={styles.kicker}>/ ABOUT ME</p>
        <h1 className={styles.heading}>
          I make AI you can actually <span className="hl">trust</span> in
          production.
        </h1>
        <p className={styles.paragraph}>
          Senior software engineer working where LLMs meet real product
          problems — text-to-SQL, agentic pipelines, and the validation gates
          that keep them safe to ship. Looking for my next role on a team
          building seriously with AI.
        </p>
        <div className={styles.actions}>
          <Link href="/projects" className={styles.btnFilled}>
            See the projects →
          </Link>
          {/* TODO: swap to contact form later */}
          <a
            href="https://www.linkedin.com/in/sadiya-bhawania/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnOutline}
          >
            Get in touch
          </a>
        </div>
      </div>

      <div className={styles.photo}>
        <Image
          src="/linkedin.jpg"
          alt="Sadiya Bhawania"
          fill
          className={styles.photoImg}
          sizes="(min-width: 768px) 45vw, 90vw"
          priority
        />
      </div>
    </section>
  );
}
