"use client";

import { useState } from "react";
import { FEATURED_PROJECTS } from "@/src/lib/projects";
import FlipCard from "../FlipCard";
import styles from "./WorkCards.module.css";

export default function WorkCards() {
  // The card a touch user has flipped open.
  const [revealed, setRevealed] = useState<string | null>(null);

  return (
    <section id="work" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>
          Built to <span className={styles.accent}>find out.</span>
        </h2>
        <span className={styles.hint}>hover a card →</span>
      </div>

      <div className={styles.grid}>
        {FEATURED_PROJECTS.map((project) => (
          <FlipCard
            key={project.href}
            project={project}
            revealed={revealed === project.href}
            onReveal={() => setRevealed(project.href)}
          />
        ))}
      </div>
    </section>
  );
}
