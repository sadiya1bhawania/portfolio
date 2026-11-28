import manifest from "@/public/experience/frames/manifest.json";
import type { ChapterPropsProps } from "@/src/lib/experience/chapters";
import FigureBox from "./FigureBox";
import styles from "./NortheasternProps.module.css";

const CAP = manifest.northeastern.ne_cap;
// Half the width of one flash in chapter progress: 300ms at autoplay speed over this chapter.
const FLASH_HALF = 0.0144;
// Share of the toss spent rising.
const APEX_AT = 0.6;
// Px below its start where the cap ends up, which is past the bottom of the stage.
const FALL = 600;

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export default function NortheasternProps({ p, x, range }: ChapterPropsProps) {
  // The cap launches as the release frame appears and flies until the toss pose ends.
  const tossStart = range("ne_mid_release")[0];
  const tossEnd = range("ne_toss")[1];
  const t = clamp((p - tossStart) / (tossEnd - tossStart));
  const rise = Math.sin((Math.min(t / APEX_AT, 1) * Math.PI) / 2);
  const fall = clamp((t - APEX_AT) / (1 - APEX_AT)) ** 2;

  // One flash over each outfit swap.
  const flash = Math.max(...[range("stand")[0], range("swap")[0]].map((at) => clamp(1 - Math.abs(p - at) / FLASH_HALF)));

  return (
    <>
      <FigureBox x={x}>
        <div className={styles.flash} style={{ opacity: flash }} />
        {p >= tossStart && p < tossEnd && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.cap}
            src={CAP.file}
            alt=""
            width={CAP.w}
            height={CAP.h}
            style={{
              left: CAP.x,
              top: CAP.y,
              width: CAP.w,
              height: CAP.h,
              translate: `${60 * t}px calc(var(--apex) * ${-rise} + (var(--apex) + ${FALL}px) * ${fall})`,
              rotate: `${720 * t}deg`,
            }}
          />
        )}
      </FigureBox>
      {/* Fetch the cap before the toss starts. */}
      <link rel="preload" as="image" href={CAP.file} />
    </>
  );
}
