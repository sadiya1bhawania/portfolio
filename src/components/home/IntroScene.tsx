"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CustomEase } from "gsap/CustomEase";
import { gsap, useGSAP } from "../motion/SmoothScroll";
import styles from "./IntroScene.module.css";

gsap.registerPlugin(CustomEase);

const SEEN_KEY = "intro-seen";
const REPLAY_EVENT = "intro:replay";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

// Seconds, from docs/motion-reference.html.
const LINE_STARTS = [0.4, 1, 1.6, 2.2, 2.8];
const POPS: [string, number][] = [
  ["nav", 0.6],
  ["title", 1.2],
  ["accent", 1.35],
  ["pipeline", 1.8],
  ["card1", 2.4],
  ["card2", 2.5],
  ["card3", 2.6],
  ["card4", 2.7],
  ["deployed", 3.2],
];
const HEADLINE_AT = 3.6;
const ZOOM_AT = 5.4;
const DONE_AT = 5.7;

// Sadie at her desk. All four frames share one framing, so they swap in place.
// Made by scripts/intro-frames.py.
const FRAMES = ["intro_type_01", "intro_type_02", "intro_lookup"];
// Only the hands move.
const TYPING_CYCLE = ["intro_type_01", "intro_type_02"];
const TYPING_STEP = 0.14;
const TYPING_UNTIL = 3.4; // when the last code line finishes typing

// Runs before first paint so repeat and reduced-motion visits never see the intro.
const PRE_PAINT = `{var s=false;try{s=sessionStorage.getItem("${SEEN_KEY}")==="1"}catch(e){}if(s||matchMedia("${REDUCED_QUERY}").matches){var n=document.currentScript.previousElementSibling;if(n)n.hidden=true}}`;

/** Replays the intro. Only has an effect while IntroScene is mounted. */
export function replayIntro() {
  window.dispatchEvent(new Event(REPLAY_EVENT));
}

function hasSeenIntro() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage is blocked: the intro plays again next time.
  }
}

type IntroSceneProps = {
  /** Fires once per play, as the hero is revealed. Also fires when the intro is skipped. */
  onDone?: () => void;
};

export default function IntroScene({ onDone }: IntroSceneProps) {
  const [phase, setPhase] = useState<"pending" | "playing" | "done">("pending");
  const [run, setRun] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  const firedRef = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const fireDone = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onDoneRef.current?.();
  };

  const finish = () => {
    markIntroSeen();
    fireDone();
    setPhase("done");
  };

  useLayoutEffect(() => {
    if (hasSeenIntro() || window.matchMedia(REDUCED_QUERY).matches) {
      // Session and motion preference are only readable after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("done");
      fireDone();
    } else {
      setPhase("playing");
    }
  }, []);

  useEffect(() => {
    const replay = () => {
      if (window.matchMedia(REDUCED_QUERY).matches) return;
      window.scrollTo(0, 0);
      firedRef.current = false;
      setRun((n) => n + 1);
      setPhase("playing");
    };
    window.addEventListener(REPLAY_EVENT, replay);
    return () => window.removeEventListener(REPLAY_EVENT, replay);
  }, []);

  useLayoutEffect(() => {
    if (phase !== "playing") return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [phase]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (phase !== "playing" || !root) return;

      const ease = CustomEase.create("introEase", "0.25,0.1,0.25,1");
      const zoomEase = CustomEase.create("introZoom", "0.7,0,0.3,1");
      const q = gsap.utils.selector(root);
      const type = (target: Element[], at: number) =>
        tl.fromTo(
          target,
          { maxWidth: "0ch" },
          { maxWidth: "52ch", duration: 0.6, ease: "steps(36)" },
          at,
        );

      const tl = gsap.timeline({ onComplete: finish });

      // Hard cuts: exactly one frame is ever visible.
      const frames = q("[data-frame]") as HTMLElement[];
      const show = (name: string) =>
        frames.forEach((frame) => {
          frame.style.opacity = frame.dataset.frame === name ? "1" : "0";
        });
      for (let i = 0; i * TYPING_STEP < TYPING_UNTIL; i += 1) {
        tl.call(show, [TYPING_CYCLE[i % TYPING_CYCLE.length]], i * TYPING_STEP);
      }
      // Typing stops, then she looks up as the headline arrives.
      tl.call(show, ["intro_type_01"], TYPING_UNTIL);
      tl.call(show, ["intro_lookup"], HEADLINE_AT);

      type(q("[data-caption]"), 0.1);
      q("[data-line]").forEach((line, i) => type([line], LINE_STARTS[i]));

      POPS.forEach(([name, at]) => {
        tl.fromTo(
          q(`[data-pop="${name}"]`),
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.4, ease },
          at,
        );
      });

      tl.fromTo(
        q("[data-headline]"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, ease },
        HEADLINE_AT,
      )
        .to(
          root,
          { scale: 2.4, opacity: 0, duration: 1.2, ease: zoomEase },
          ZOOM_AT,
        )
        .call(fireDone, undefined, DONE_AT);
    },
    { scope: rootRef, dependencies: [phase, run], revertOnUpdate: true },
  );

  if (phase === "done") return null;

  return (
    <>
      <div
        key={run}
        ref={rootRef}
        className={styles.root}
        role="region"
        aria-label="Intro: The model is the easy part."
        data-lenis-prevent
        suppressHydrationWarning
      >
        <div className={styles.screen}>
          <div className={styles.code}>
            <div className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className={styles.typed} data-line>
              <span className={styles.accent}>const</span> site = await
              agent.plan(sadie)
            </span>
            <span className={styles.typed} data-line>
              {'render(<Hero title="easy part." />)'}
            </span>
            <span className={styles.typed} data-line>
              {'render(<Pipeline gate="safety" />)'}
            </span>
            <span className={styles.typed} data-line>
              {'render(<Systems hover="what broke" />)'}
            </span>
            <span className={styles.typed} data-line>
              <span className={styles.accent}>deploy</span>
              {"({ motion: true })"}
            </span>
          </div>

          <div className={styles.preview} aria-hidden="true">
            <div className={styles.navBlock} data-pop="nav" />
            <div className={styles.titleBlock} data-pop="title" />
            <div className={styles.accentBlock} data-pop="accent" />
            <div className={styles.pipeline} data-pop="pipeline">
              <span className={styles.node} />
              <span className={styles.link} />
              <span className={styles.node} />
              <span className={styles.link} />
              <span className={styles.nodeFail} />
              <span className={styles.link} />
              <span className={styles.nodeDone} />
            </div>
            <div className={styles.cards}>
              <div data-pop="card1" />
              <div data-pop="card2" />
              <div data-pop="card3" />
              <div data-pop="card4" />
            </div>
            <div className={styles.deployed} data-pop="deployed">
              ✓ deployed
            </div>
          </div>

          <div className={styles.dim} data-headline>
            <p className={styles.headline}>
              The model is the <span className={styles.accent}>easy part.</span>
            </p>
          </div>
        </div>

        <div className={styles.figure} aria-hidden="true">
          {FRAMES.map((name) => (
            // Plain img: every frame stays mounted and loads up front so cuts never flash.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={name}
              data-frame={name}
              src={`/experience/frames/${name}.webp`}
              alt=""
              width={1024}
              height={1536}
              loading="eager"
              decoding="sync"
            />
          ))}
        </div>

        <span className={styles.caption} data-caption>
          ~/portfolio $ claude build --live
        </span>
        <button type="button" className={styles.skip} onClick={finish}>
          skip intro →
        </button>
      </div>

      {phase === "pending" && (
        <>
          {/* Must stay directly after the intro layer: it hides its previous sibling. */}
          <script
            type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: PRE_PAINT }}
          />
          <noscript>
            <style>{`.${styles.root}{display:none}`}</style>
          </noscript>
        </>
      )}
    </>
  );
}
