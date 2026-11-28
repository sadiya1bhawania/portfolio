"use client";

// Chapter-agnostic engine. All story content lives in src/lib/experience/chapters.ts.
import { useCallback, useEffect, useRef, useState } from "react";
import manifest from "@/public/experience/frames/manifest.json";
import { CHAPTERS, type Chapter, type PoseAnchors } from "@/src/lib/experience/chapters";
import { gsap, useGSAP } from "../motion/SmoothScroll";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../motion/useReducedMotion";
import styles from "./SadiesWalk.module.css";

const WALK_PX_PER_FRAME = 22;
// Head centre of the walk frames inside the 350px frame box.
const WALK_HEAD_X = manifest.contract.headX / 2;
const AUTOPLAY_PX_PER_SEC = 250;
// Pause on landing before the story starts, so the first frames can load.
const AUTOPLAY_DELAY_MS = 1000;

type Frame = { file: string; anchors?: PoseAnchors };
const WALK: Frame[] = manifest.walk;
const FRAME_SETS = manifest as unknown as Record<string, Record<string, Frame> | undefined>;

function frameFor(chapter: Chapter, key: string): Frame {
  const frame = FRAME_SETS[chapter.frameSet ?? chapter.id]?.[key] ?? FRAME_SETS.poses?.[key];
  if (!frame) throw new Error(`No frame "${key}" in the manifest for chapter ${chapter.id}`);
  return frame;
}

// Every frame any chapter uses, so all of them are mounted and loaded from the start.
const ALL_FILES = [
  ...new Set([
    ...WALK.map((f) => f.file),
    ...CHAPTERS.flatMap((c) => c.beats.filter((b) => b.frame !== "walk").map((b) => frameFor(c, b.frame).file)),
  ]),
];

const STARTS = CHAPTERS.map((_, i) => CHAPTERS.slice(0, i).reduce((sum, c) => sum + c.length, 0));
const TOTAL = CHAPTERS.reduce((sum, c) => sum + c.length, 0);

const clamp = (v: number) => Math.max(0, Math.min(1, v));

function chapterAt(px: number) {
  let index = 0;
  while (index < CHAPTERS.length - 1 && px >= STARTS[index + 1]) index += 1;
  return index;
}

function rangeOf(chapter: Chapter, beatId: string): [number, number] {
  const i = chapter.beats.findIndex((b) => b.id === beatId);
  return [i > 0 ? chapter.beats[i - 1].to : 0, chapter.beats[i].to];
}

function poseAt(chapter: Chapter, p: number) {
  let from = 0;
  let restX = 0;
  for (let i = 0; i < chapter.beats.length; i += 1) {
    const beat = chapter.beats[i];
    if (p < beat.to || i === chapter.beats.length - 1) {
      const t = clamp((p - from) / (beat.to - from));
      const x = beat.x ? beat.x[0] + (beat.x[1] - beat.x[0]) * t : restX;
      return { beat, x, from };
    }
    from = beat.to;
    if (beat.x) restX = beat.x[1];
  }
  throw new Error(`Chapter ${chapter.id} has no beats`);
}

/** Reduced motion shows the moment just before the closing beat (the departure). */
const finalProgress = (chapter: Chapter) => chapter.staticAt ?? chapter.beats[chapter.beats.length - 2].to - 0.001;

type StageProps = {
  index: number;
  p: number;
  scrollPx: number;
  onJump: (index: number) => void;
  /** Omitted for the static reduced-motion stages. */
  controls?: { playing: boolean; onToggle: () => void; total: number };
};

function Stage({ index, p, scrollPx, onJump, controls }: StageProps) {
  const chapter = CHAPTERS[index];
  const { beat, x, from } = poseAt(chapter, p);
  // Exactly one frame is visible at any time, so every pose change is a hard cut.
  let activeSrc: string;
  // Frame-space px that move the pose sideways, and how settled it is after cutting in (0-1, eased).
  let faceShift = 0;
  let settled = 1;
  if (beat.frame === "walk") {
    let walkPx = scrollPx;
    if (beat.slowdown) {
      // Past this point the walk cycle advances at half speed, without skipping a frame on the way in.
      const slowFrom = STARTS[index] + beat.to * chapter.length - beat.slowdown;
      if (walkPx > slowFrom) walkPx = slowFrom + (walkPx - slowFrom) / 2;
    }
    activeSrc = WALK[Math.floor(walkPx / WALK_PX_PER_FRAME) % WALK.length].file;
  } else {
    const frame = frameFor(chapter, beat.frame);
    activeSrc = frame.file;
    if (beat.alignFace && frame.anchors) faceShift = WALK_HEAD_X - frame.anchors.faceCx;
    if (beat.settle) settled = 1 - (1 - clamp(((p - from) * chapter.length) / beat.settle)) ** 3;
  }
  const clips = new Map(
    Object.entries(chapter.frameClips ?? {}).map(([key, clip]) => [frameFor(chapter, key).file, clip]),
  );
  const atEnd = controls !== undefined && scrollPx >= controls.total - 1;
  const achieved = p >= chapter.achievement.at;
  const { Props } = chapter;

  return (
    <section className={styles.stage} aria-label={`${chapter.title} chapter`}>
      <nav className={styles.rail} aria-label="Chapters">
        <span className={styles.brand}>
          Sadie&apos;s Walk<span>.</span>
        </span>
        <ol>
          {CHAPTERS.map(({ id, wordmark }, i) => (
            <li key={id}>
              <button
                type="button"
                className={styles.pill}
                aria-current={i === index ? "step" : undefined}
                onClick={() => onJump(i)}
              >
                {String(i + 1).padStart(2, "0")} {wordmark}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div
        className={styles.wordmark}
        aria-hidden="true"
        style={p >= (chapter.wordmarkUntil ?? Infinity) ? { visibility: "hidden" } : undefined}
      >
        {chapter.wordmark}
      </div>
      <div className={styles.ground} aria-hidden="true" />

      {Props && <Props key={chapter.id} p={p} x={x} range={(id) => rangeOf(chapter, id)} />}

      <div
        className={styles.figure}
        style={{
          left: `calc(${x}% - 175px + ${faceShift}px * var(--s))`,
          transform: settled < 1 ? `translateY(${4 * (1 - settled)}px) scale(${0.97 + 0.03 * settled})` : undefined,
        }}
        aria-hidden="true"
      >
        {ALL_FILES.map((file) => (
          // Plain img: every frame stays mounted and loads up front so pose swaps never flash.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={file}
            src={file}
            alt=""
            width={350}
            height={550}
            loading="eager"
            decoding="sync"
            style={{ opacity: file === activeSrc ? 1 : 0, clipPath: clips.get(file) }}
          />
        ))}
        {chapter.overlays?.map(({ frame, Component }) => {
          const { file, anchors } = frameFor(chapter, frame);
          if (file !== activeSrc || !anchors) return null;
          return (
            <div key={frame} className={styles.overlay}>
              <Component anchors={anchors} p={p} range={(id) => rangeOf(chapter, id)} />
            </div>
          );
        })}
      </div>

      <div className={`${styles.text} ${achieved ? styles.achieved : ""} ${beat.bullets ? styles.bulleted : ""}`}>
        <span className={styles.meta}>
          {String(index + 1).padStart(2, "0")} / {chapter.years} · {chapter.role}
        </span>
        <h2 className={styles.title}>{chapter.title}</h2>
        <span className={styles.subtitle}>{chapter.subtitle}</span>
        <div className={styles.divider} />
        <span className={styles.beatLabel}>{beat.label}</span>
        <p className={styles.caption}>{beat.caption}</p>
        {beat.bullets && (
          <ul className={styles.bullets}>
            {beat.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        )}
        {/* Keyed so the next chapter's card never fades out in place of the last one. */}
        <div key={chapter.id} className={styles.card} aria-hidden={!achieved}>
          <span className={styles.cardLabel}>{chapter.achievement.label}</span>
          <span className={styles.cardHeadline}>{chapter.achievement.headline}</span>
          <span className={styles.cardBody}>{chapter.achievement.body}</span>
        </div>
      </div>

      {controls && (
        <div className={styles.controls}>
          {/* The story holds on its last pose, so there is nothing to play from the end. */}
          <button type="button" className={styles.play} onClick={controls.onToggle} disabled={atEnd}>
            {controls.playing ? "❚❚ pause" : "▶ play"}
          </button>
          <div className={styles.bar} aria-hidden="true">
            <div style={{ width: `${((scrollPx / controls.total) * 100).toFixed(1)}%` }} />
          </div>
          <span
            className={`${styles.hint} ${scrollPx < controls.total * 0.02 ? styles.bounce : ""}`}
            style={{ opacity: scrollPx < controls.total * 0.98 ? 1 : 0.3 }}
          >
            scroll to walk ↓
          </span>
        </div>
      )}
    </section>
  );
}

function StaticStory() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const jump = (i: number) => refs.current[i]?.scrollIntoView();

  return CHAPTERS.map((chapter, i) => {
    const p = finalProgress(chapter);
    return (
      <div
        key={chapter.id}
        className={styles.anchor}
        ref={(el) => {
          refs.current[i] = el;
        }}
      >
        <Stage index={i} p={p} scrollPx={0} onJump={jump} />
      </div>
    );
  });
}

function PinnedStory() {
  const pinRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [scrollPx, setScrollPx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useGSAP(() => {
    const el = pinRef.current;
    if (!el) return;
    const update = (self: ScrollTrigger) => setScrollPx(Math.round(self.progress * TOTAL));

    triggerRef.current = ScrollTrigger.create({
      trigger: el,
      // Pin below the sticky NavBar, or higher when the viewport is too short for both.
      start: () => {
        const nav = document.querySelector("header")?.offsetHeight ?? 0;
        return `top top+=${Math.min(nav, window.innerHeight - el.offsetHeight)}`;
      },
      end: `+=${TOTAL}`,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: update,
      onRefresh: update,
    });
  });

  const scrollToPx = useCallback((px: number) => {
    const trigger = triggerRef.current;
    if (trigger) window.scrollTo({ top: trigger.start + px, behavior: "instant" });
  }, []);

  // Autoplay on landing, unless the visitor acts first or arrives partway down the page.
  useEffect(() => {
    const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    const timer = window.setTimeout(() => {
      cancel();
      const trigger = triggerRef.current;
      if (trigger && window.scrollY <= trigger.start + 1) setPlaying(true);
    }, AUTOPLAY_DELAY_MS);
    function cancel() {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, cancel));
    }
    events.forEach((name) => window.addEventListener(name, cancel, { passive: true }));
    return cancel;
  }, []);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!playing || !trigger) return;

    // Tracked as a float: the browser may round window.scrollY.
    let y = Math.max(window.scrollY, trigger.start);

    const tick = (_time: number, deltaMs: number) => {
      // Capped so that returning to a background tab doesn't skip ahead.
      y = Math.min(trigger.end, y + (AUTOPLAY_PX_PER_SEC * Math.min(deltaMs, 50)) / 1000);
      window.scrollTo({ top: y, behavior: "instant" });
      if (y >= trigger.end) setPlaying(false);
    };
    const stop = () => setPlaying(false);
    // Grabbing the scrollbar also hands control back.
    const grab = (e: MouseEvent) => {
      if (e.clientX >= document.documentElement.clientWidth) stop();
    };
    window.addEventListener("mousedown", grab);
    const events = ["wheel", "touchmove", "keydown"] as const;

    gsap.ticker.add(tick);
    events.forEach((name) => window.addEventListener(name, stop, { passive: true }));
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("mousedown", grab);
      events.forEach((name) => window.removeEventListener(name, stop));
    };
  }, [playing]);

  const index = chapterAt(scrollPx);

  return (
    // Block wrapper: ScrollTrigger skips pin spacing inside flex parents.
    <div>
      <div ref={pinRef}>
        <Stage
          index={index}
          p={clamp((scrollPx - STARTS[index]) / CHAPTERS[index].length)}
          scrollPx={scrollPx}
          onJump={(i) => {
            setPlaying(false);
            // +1px lands inside the chapter rather than on the previous one's last pixel.
            scrollToPx(STARTS[i] + 1);
          }}
          controls={{ playing, onToggle: () => setPlaying((on) => !on), total: TOTAL }}
        />
      </div>
    </div>
  );
}

export default function SadiesWalk() {
  const reduced = useReducedMotion();

  return (
    <div className={styles.root}>
      <h1 className="sr-only">Sadie&apos;s Walk</h1>
      {reduced ? <StaticStory /> : <PinnedStory />}
    </div>
  );
}
