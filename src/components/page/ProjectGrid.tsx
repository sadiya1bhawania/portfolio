"use client";

import Link from "next/link";
import { useState } from "react";
import { ALL_PROJECTS } from "@/src/lib/projects";
import FlipCard from "../FlipCard";
import Reveal from "../motion/Reveal";
import styles from "./Listing.module.css";

export default function ProjectGrid() {
  const [revealed, setRevealed] = useState<string | null>(null);

  return (
    <Reveal stagger={0.08} className={styles.grid}>
      {ALL_PROJECTS.map((project) => (
        <div key={project.href} className={styles.item}>
          <FlipCard
            project={project}
            revealed={revealed === project.href}
            onReveal={() => setRevealed(project.href)}
          />
          <div className={styles.notes}>
            <Link href={project.notes.href}>{project.notes.label}</Link>
            {project.related && (
              <span>
                {project.related.lead} <Link href={project.related.href}>{project.related.label}</Link>
              </span>
            )}
          </div>
        </div>
      ))}
    </Reveal>
  );
}
