"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CustomEase } from "gsap/CustomEase";
import { gsap, useGSAP } from "../motion/SmoothScroll";
import StreamField from "../motion/StreamField";
import { useReducedMotion } from "../motion/useReducedMotion";
import ActivityStrip from "./ActivityStrip";
import IntroScene, { replayIntro } from "./IntroScene";
import styles from "./Hero.module.css";

gsap.registerPlugin(CustomEase);

// Seconds, from docs/motion-reference.html.
const WORDS: [string, number][] = [
  ["The", 0.1],
  ["model", 0.2],
  ["is", 0.3],
  ["the", 0.45],
  ["easy", 0.6],
  ["part.", 0.75],
];
// The closing words that are set in copper and underlined.
const ACCENT_FROM = 4;

// When the headline has finished revealing, whether or not the intro played first.
const STRIP_AT = 1.5;

export default function Hero() {
  // Counts IntroScene's onDone calls; each one (re)starts the hero.
  const [run, setRun] = useState(0);
  // The run whose strip has started filling; it empties again as soon as a replay begins a new run.
  const [filledRun, setFilledRun] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = ref.current;
      if (!run || reduced || !root) return;

      const q = gsap.utils.selector(root);
      const wordEase = CustomEase.create("heroWord", "0.2,0.8,0.2,1");
      const easeOut = CustomEase.create("heroOut", "0,0,0.58,1");
      const tl = gsap.timeline();

      const rise = (name: string, at: number, duration: number, ease: gsap.EaseString | gsap.EaseFunction) =>
        tl.fromTo(
          q(`[data-in="${name}"]`),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration, ease },
          at,
        );

      rise("eyebrow", 0, 0.6, easeOut);
      WORDS.forEach(([, at], i) => rise(`word${i}`, at, 0.7, wordEase));
      rise("strip", 1, 0.5, easeOut);
      tl.call(() => setFilledRun(run), undefined, STRIP_AT);
      rise("line", 1.2, 0.7, easeOut);
      rise("actions", 1.4, 0.7, easeOut);
      tl.fromTo(q("[data-underline]"), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: easeOut }, 1.2);

      gsap.fromTo(
        q("[data-ping]"),
        { scale: 1, opacity: 0.6 },
        {
          // The ring grows 14px past its dot on every side.
          scale: (_, ring: HTMLElement) => (ring.offsetWidth + 28) / ring.offsetWidth,
          opacity: 0,
          duration: 1.6,
          ease: easeOut,
          repeat: -1,
        },
      );

    },
    { scope: ref, dependencies: [run, reduced], revertOnUpdate: true },
  );

  return (
    <>
      <IntroScene onDone={() => setRun((n) => n + 1)} />

      <section ref={ref} className={styles.hero}>
        <StreamField className={styles.streams} />

        <div className={styles.inner}>
          <p className={styles.eyebrow} data-in="eyebrow">
            <span className={styles.pulse} aria-hidden="true">
              <span className={styles.ring} data-ping />
            </span>
            system online · building in the open
          </p>

          <h1 className={styles.heading}>
            {WORDS.slice(0, ACCENT_FROM).map(([word], i) => (
              <span key={i}>
                <span className={styles.word} data-in={`word${i}`}>
                  {word}
                </span>{" "}
              </span>
            ))}
            {/* One box, so the underline spans both words and they wrap together. */}
            <span className={styles.accent}>
              {WORDS.slice(ACCENT_FROM).map(([word], i) => (
                <span key={word}>
                  {i > 0 && " "}
                  <span className={styles.word} data-in={`word${ACCENT_FROM + i}`}>
                    {word}
                  </span>
                </span>
              ))}
              <span className={styles.underline} data-underline aria-hidden="true" />
            </span>
          </h1>

          <div className={styles.activity} data-in="strip">
            <ActivityStrip key={run} filling={run > 0 && filledRun === run} />
          </div>

          <p className={styles.line} data-in="line">
            The hard part is everything around it: retrieval, safety gates, evals, and the interface the answer
            lands in. <span className={styles.highlight}>That&apos;s the part I build.</span>
          </p>

          <div className={styles.actions} data-in="actions">
            <Link href="/experiences" className={styles.watch}>
              <span className={styles.playWrap} aria-hidden="true">
                <span className={styles.ring} data-ping />
                <span className={styles.play}>
                  <svg width="10" height="10" viewBox="0 0 12 12">
                    <path d="M3 1.5v9l7.5-4.5z" />
                  </svg>
                </span>
              </span>
              Watch her journey
            </Link>
            <a href="#work" className={styles.hover}>
              or hover the work ↓
            </a>
          </div>

          {/* Replay does nothing under reduced motion, so the link is hidden then. */}
          {!reduced && (
            <button type="button" className={styles.replay} onClick={replayIntro}>
              ↺ replay
            </button>
          )}
        </div>

        <noscript>
          <style>{`.${styles.hero} [data-in]{opacity:1}`}</style>
        </noscript>
      </section>
    </>
  );
}
