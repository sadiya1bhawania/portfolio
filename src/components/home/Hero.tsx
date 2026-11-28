"use client";

import { useRef, useState } from "react";
import { CustomEase } from "gsap/CustomEase";
import { gsap, useGSAP } from "../motion/SmoothScroll";
import StreamField from "../motion/StreamField";
import { useReducedMotion } from "../motion/useReducedMotion";
import IntroScene, { replayIntro } from "./IntroScene";
import styles from "./Hero.module.css";

gsap.registerPlugin(CustomEase);

// Seconds, from docs/motion-reference.html.
const WORDS: [string, number][] = [
  ["This", 0.1],
  ["site", 0.2],
  ["builds", 0.3],
  ["itself", 0.45],
  ["while", 0.6],
  ["you", 0.7],
  ["watch.", 0.8],
];
const ROTATOR = ["retrieval.", "eval gates.", "safety rails.", "generative UI.", "what's next."];
const WORD_SECONDS = 2;
const SLIDE_SECONDS = 0.4;

export default function Hero() {
  // Counts IntroScene's onDone calls; each one (re)starts the hero.
  const [run, setRun] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = ref.current;
      if (!run || reduced || !root) return;

      const q = gsap.utils.selector(root);
      const wordEase = CustomEase.create("heroWord", "0.2,0.8,0.2,1");
      const easeOut = CustomEase.create("heroOut", "0,0,0.58,1");
      const slideEase = CustomEase.create("heroSlide", "0.7,0,0.2,1");
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
      rise("rotator", 1, 0.7, easeOut);
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

      const track = q("[data-track]");
      // One line per step. The track ends on a copy of the first word, so the loop
      // restarts without rewinding through every word.
      const cycle = gsap.timeline({ repeat: -1, delay: 1.5 });
      ROTATOR.forEach((_, i) => {
        cycle.to(
          track,
          {
            yPercent: -(i + 1) * (100 / (ROTATOR.length + 1)),
            duration: SLIDE_SECONDS,
            ease: slideEase,
          },
          (i + 1) * WORD_SECONDS - SLIDE_SECONDS,
        );
      });
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
            {WORDS.map(([word], i) => (
              <span key={word}>
                <span className={word === "itself" ? styles.itself : styles.word} data-in={`word${i}`}>
                  {word}
                  {word === "itself" && (
                    <span className={styles.underline} data-underline aria-hidden="true" />
                  )}
                </span>{" "}
              </span>
            ))}
          </h1>

          <div className={styles.rotator} data-in="rotator">
            <span className={styles.rotatorLead}>Today it&apos;s</span>
            <span className="sr-only">{ROTATOR.join(" ")}</span>
            <span className={styles.window} aria-hidden="true">
              <span className={styles.track} data-track>
                {[...ROTATOR, ROTATOR[0]].map((word, i) => (
                  <span key={i} className={word === "generative UI." ? styles.highlight : undefined}>
                    {word}
                  </span>
                ))}
              </span>
            </span>
          </div>

          <p className={styles.line} data-in="line">
            Retrieval, safety gates, and interfaces that build themselves are{" "}
            <span className={styles.highlight}>just the beginning.</span>{" "}
            I&apos;m here for whatever&apos;s harder.
          </p>

          <div className={styles.actions} data-in="actions">
            <a href="#demo" className={styles.watch}>
              <span className={styles.playWrap} aria-hidden="true">
                <span className={styles.ring} data-ping />
                <span className={styles.play}>
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M3 1.5v9l7.5-4.5z" />
                  </svg>
                </span>
              </span>
              Watch it build
            </a>
            <a href="#work" className={styles.hover}>
              or hover the work ↓
            </a>
          </div>

          {/* Replay does nothing under reduced motion, so the link is hidden then. */}
          {!reduced && (
            <button type="button" className={styles.replay} onClick={replayIntro}>
              ↺ replay intro
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
