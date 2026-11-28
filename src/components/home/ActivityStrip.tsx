"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import styles from "./ActivityStrip.module.css";

const DESKTOP = { weeks: 34, markerCols: [5, 13, 21, 28] };
const MOBILE = { weeks: 18, markerCols: [2, 7, 11, 15] };
const MOBILE_QUERY = "(max-width: 639.98px)";
const MARKERS = ["retrieval", "safety gates", "evals", "generative UI"];
const CELL = 11;
const STEP = CELL + 3; // square plus gap
// Share of past days at levels 0-3, then 4.
const LEVEL_CUTS = [0.3, 0.58, 0.8, 0.94];

/** A repeatable 0-1 value for a calendar day, so the pattern is the same on every load. */
function seeded(day: number) {
  let t = (day + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function levelFor(day: number) {
  const value = seeded(day);
  const level = LEVEL_CUTS.findIndex((cut) => value < cut);
  return level === -1 ? LEVEL_CUTS.length : level;
}

const dayNumber = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

function subscribeMedia(onChange: () => void) {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const noSubscription = () => () => {};
// The visitor's own date. Unknown on the server, which would otherwise bake in the build date.
const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
};

type ActivityStripProps = {
  /** True once the columns should fill. Remount (change the key) to run the fill again. */
  filling: boolean;
};

export default function ActivityStrip({ filling }: ActivityStripProps) {
  const today = useSyncExternalStore(noSubscription, todayKey, () => null);
  const mobile = useSyncExternalStore(subscribeMedia, () => window.matchMedia(MOBILE_QUERY).matches, () => false);

  // Holds the strip's height until the date is known, so nothing below it shifts.
  if (!today) return <div className={styles.placeholder} />;

  const [year, month, date] = today.split("-").map(Number);
  const { weeks, markerCols } = mobile ? MOBILE : DESKTOP;
  const weekday = new Date(year, month, date).getDay(); // 0 = Sunday
  // The first square is the Sunday that starts the earliest week.
  const firstOffset = date - weekday - (weeks - 1) * 7;
  const start = new Date(year, month, firstOffset);
  const now = new Date(year, month, date);
  const todayIndex = (weeks - 1) * 7 + weekday;
  const width = weeks * STEP - 3;
  // Centre of today's column, from the strip's right edge.
  const todayFromRight = CELL / 2;

  return (
    <div
      className={`${styles.strip} ${filling ? styles.filling : ""}`}
      style={{ width, "--weeks": weeks } as CSSProperties}
    >
      <div className={styles.markers} aria-hidden="true">
        {MARKERS.map((label, i) => (
          <div
            key={label}
            className={styles.marker}
            style={{ left: (markerCols[i] - 1) * STEP + CELL / 2, "--col": markerCols[i] - 1 } as CSSProperties}
          >
            <span>{label}</span>
            <i />
          </div>
        ))}
      </div>

      <div className={styles.grid} role="img" aria-label={`Activity over the last ${weeks} weeks, ending today: what's next`}>
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const future = i > todayIndex;
          const cell = new Date(year, month, firstOffset + i);
          const level = i === todayIndex ? 4 : levelFor(dayNumber(cell));
          return (
            <span
              key={i}
              className={future ? styles.future : i === todayIndex ? styles.today : styles.cell}
              style={{ "--col": Math.floor(i / 7), "--shade": `var(--activity-${level})` } as CSSProperties}
            />
          );
        })}
      </div>

      <div className={styles.pillRow} aria-hidden="true">
        <span className={styles.pill} style={{ "--point": `${todayFromRight}px` } as CSSProperties}>
          today: what&apos;s next.
        </span>
      </div>

      <div className={styles.dates}>
        <span>{shortDate(start)}</span>
        <span>today · {shortDate(now)}</span>
      </div>
    </div>
  );
}
