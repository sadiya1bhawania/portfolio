"use client";

import { useRef } from "react";
import { CustomEase } from "gsap/CustomEase";
import { gsap, useGSAP } from "../motion/SmoothScroll";
import StreamField from "../motion/StreamField";
import { useReducedMotion } from "../motion/useReducedMotion";
import styles from "./PageHeader.module.css";

gsap.registerPlugin(CustomEase);

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  /** The word in the title set in copper. Defaults to the last one. */
  accent?: string;
  /** Post titles are long, so they use a smaller size. */
  compact?: boolean;
  children?: React.ReactNode;
};

export default function PageHeader({ eyebrow, title, accent, compact, children }: PageHeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const words = title.split(" ");
  const accentAt = accent ? words.indexOf(accent) : words.length - 1;

  // The homepage hero's word stagger.
  useGSAP(
    () => {
      const root = ref.current;
      if (reduced || !root) return;
      gsap.fromTo(
        root.querySelectorAll("[data-word]"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.1, stagger: 0.1, ease: CustomEase.create("heroWord", "0.2,0.8,0.2,1") },
      );
    },
    { scope: ref, dependencies: [reduced, title], revertOnUpdate: true },
  );

  return (
    <header ref={ref} className={styles.header}>
      <StreamField className={styles.streams} />
      <div className={`${styles.inner} ${compact ? styles.compact : ""}`}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>
          {words.map((word, i) => (
            <span key={`${word}-${i}`}>
              <span className={`${styles.word} ${i === accentAt ? styles.accent : ""}`} data-word>
                {word}
              </span>{" "}
            </span>
          ))}
        </h1>
        {children}
      </div>
      <noscript>
        <style>{`.${styles.header} [data-word]{opacity:1}`}</style>
      </noscript>
    </header>
  );
}
