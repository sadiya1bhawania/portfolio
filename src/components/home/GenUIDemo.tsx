"use client";

import { useRef, useState } from "react";
import { CustomEase } from "gsap/CustomEase";
import { gsap, useGSAP } from "../motion/SmoothScroll";
import { useReducedMotion } from "../motion/useReducedMotion";
import styles from "./GenUIDemo.module.css";

gsap.registerPlugin(CustomEase);

const AUTOPLAY_SECONDS = 5;

// Copy and timings from docs/motion-reference.html.
const MODES = [
  { id: "systems", label: "Show me her systems", query: "Show me what Sadiya has built" },
  { id: "evals", label: "How does she think about evals?", query: "How does she think about evals?" },
  { id: "building", label: "What is she building now?", query: "What is she building now?" },
] as const;

type ModeId = (typeof MODES)[number]["id"];

const SYSTEMS = [
  ["RETRIEVE", "RAG vs OKF", "Two retrieval strategies, raced live."],
  ["GENERATE + GATE", "X2SQL", "English to SQL. Nothing runs unvalidated."],
  ["HUMAN GATE", "Envelope", "Learns new rules from human corrections."],
  ["RESEARCH", "World Models", "JEPA, explained interactively."],
];

const SYSTEM_DELAYS = [0.1, 0.25, 0.4, 0.55];

export default function GenUIDemo() {
  const [mode, setMode] = useState<ModeId>("systems");
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // Content never changes on its own under reduced motion.
  const autoplay = auto && !reduced;
  const current = MODES.find((m) => m.id === mode) ?? MODES[0];

  // Caret blink and the one-off scan line.
  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const q = gsap.utils.selector(ref.current);
      gsap
        .timeline({ repeat: -1 })
        .set(q("[data-caret]"), { opacity: 0 }, 0.5)
        .set(q("[data-caret]"), { opacity: 1 }, 1);
      gsap.fromTo(
        q("[data-scan]"),
        { xPercent: -100, opacity: 1 },
        { xPercent: 400, duration: 1.2, ease: "power1.inOut", onComplete: () => {
          gsap.set(q("[data-scan]"), { opacity: 0 });
        } },
      );
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  // The active panel's pieces stagger in on every switch.
  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const ease = CustomEase.create("demoOut", "0,0,0.58,1");
      ref.current
        .querySelectorAll<HTMLElement>(`[data-panel="${mode}"] [data-rise]`)
        .forEach((piece) => {
          gsap.fromTo(
            piece,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5, ease, delay: Number(piece.dataset.rise) },
          );
        });
    },
    { scope: ref, dependencies: [mode, reduced], revertOnUpdate: true },
  );

  // The progress bar is the autoplay clock.
  useGSAP(
    () => {
      if (!autoplay || !ref.current) return;
      const next = (MODES.findIndex((m) => m.id === mode) + 1) % MODES.length;
      gsap.fromTo(
        ref.current.querySelector("[data-progress]"),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: AUTOPLAY_SECONDS,
          ease: "none",
          onComplete: () => setMode(MODES[next].id),
        },
      );
    },
    { scope: ref, dependencies: [mode, autoplay], revertOnUpdate: true },
  );

  const panel = (id: ModeId) => ({
    "data-panel": id,
    className: `${styles.panel} ${id === mode ? "" : styles.inactive}`,
  });

  return (
    <section ref={ref} id="demo" className={styles.section} aria-label="Generative UI demo">
      <div className={styles.frame}>
        <div className={styles.top}>
          <div className={styles.prompt}>
            <span className={styles.accent} aria-hidden="true">›</span>
            <span>
              {current.query}
              <span className={`${styles.accent} ${styles.caret}`} data-caret aria-hidden="true">
                ▍
              </span>
            </span>
          </div>
          <div className={styles.chips}>
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={styles.chip}
                aria-pressed={m.id === mode}
                onClick={() => {
                  setAuto(false);
                  setMode(m.id);
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.stage}>
          <div className={styles.scan} data-scan aria-hidden="true" />
          <div
            className={`${styles.progress} ${autoplay ? "" : styles.inactive}`}
            aria-hidden="true"
          >
            <div data-progress />
          </div>

          {/* All panels share one grid cell, so switching never moves the page below. */}
          <div className={styles.panels}>
            <div {...panel("systems")}>
              <div className={styles.systems}>
                {SYSTEMS.map(([tag, name, text], i) => (
                  <div key={name} className={styles.system} data-rise={SYSTEM_DELAYS[i]}>
                    <span className={styles.label}>{tag}</span>
                    <span className={styles.systemName}>{name}</span>
                    <span className={styles.systemText}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div {...panel("evals")}>
              <div className={styles.row}>
                <div className={styles.evalRun} data-rise="0.1">
                  <span className={styles.label}>EVAL RUN · synthetic</span>
                  <div className={styles.check}>
                    <span>SQL is read-only</span>
                    <span className={styles.pass}>✓ pass</span>
                  </div>
                  <div className={styles.check}>
                    <span>Answer cites retrieved rows</span>
                    <span className={styles.pass}>✓ pass</span>
                  </div>
                  <div className={styles.check}>
                    <span>No invented columns</span>
                    <span className={styles.fail}>✗ fail · blocked</span>
                  </div>
                </div>
                <div className={styles.rule} data-rise="0.3">
                  <span className={styles.ruleLabel}>MY RULE</span>
                  <span className={styles.ruleText}>Models propose. Checks decide.</span>
                </div>
              </div>
            </div>

            <div {...panel("building")}>
              <div className={styles.row}>
                <div className={styles.about} data-rise="0.1">
                  <span className={styles.label}>NOW BUILDING · OPEN SOURCE</span>
                  <span className={styles.aboutTitle}>Gen UI engine</span>
                  <span className={styles.aboutText}>
                    An agent connected to your component library. Every answer comes back as
                    real UI. You&apos;re using a preview of it right now.
                  </span>
                </div>
                <div className={styles.steps}>
                  <div data-rise="0.25">
                    1 · request <span className={styles.dimmed}>&quot;What is she building now?&quot;</span>
                  </div>
                  <div data-rise="0.4">
                    2 · agent picks <span className={styles.accent}>Heading, Text, StepList</span>
                  </div>
                  <div data-rise="0.55">
                    3 · props validated against schema <span className={styles.accent}>✓</span>
                  </div>
                  <div className={styles.rendered} data-rise="0.7">4 · rendered: this panel</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span>rendered by gen-ui · scripted preview · {autoplay ? "autoplay on" : "you are driving"}</span>
          <span>
            eval gate <span className={styles.accent}>✓ passed</span>
          </span>
        </div>
      </div>
    </section>
  );
}
