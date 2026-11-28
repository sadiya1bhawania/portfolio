"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Project } from "@/src/lib/projects";
import styles from "./home/WorkCards.module.css";

type FlipCardProps = {
  project: Project;
  /** A touch user has flipped this card open. */
  revealed: boolean;
  onReveal: () => void;
};

export default function FlipCard({ project, revealed, onReveal }: FlipCardProps) {
  const pointer = useRef("");

  return (
    <Link
      href={project.href}
      className={styles.card}
      data-revealed={revealed || undefined}
      onPointerDown={(event) => {
        pointer.current = event.pointerType;
      }}
      onKeyDown={() => {
        pointer.current = "";
      }}
      onClick={(event) => {
        // First tap reveals the back; the second one follows the link.
        if (pointer.current === "touch" && !revealed) {
          event.preventDefault();
          onReveal();
        }
      }}
    >
      <span className={styles.front}>
        <span className={project.solid ? styles.tagSolid : styles.tag}>{project.tag}</span>
        <span className={styles.name}>{project.name}</span>
      </span>
      <span className={styles.summary}>{project.summary}</span>
      <span className={styles.back}>
        <span className={styles.backBody}>
          <span className={styles.backLabel}>{project.question ? "THE QUESTION" : "ABOUT"}</span>
          <span className={project.question ? styles.question : styles.about}>
            {project.question ?? project.description}
          </span>
        </span>
        <span className={styles.cta}>{project.cta}</span>
      </span>
    </Link>
  );
}
