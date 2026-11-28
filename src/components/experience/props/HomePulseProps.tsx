import { Phone } from "lucide-react";
import type { ChapterPropsProps, PoseOverlayProps } from "@/src/lib/experience/chapters";
import PropBox from "./PropBox";
import styles from "./HomePulseProps.module.css";

// Chapter progress each half of a hat swap takes.
const SWAP = 0.03;
// Px a hat travels while it drops in or lifts off.
const TRAVEL = 55;
// Positions along the comparison bar, in % of its width.
const TICKS = [
  { label: "low", at: 8 },
  { label: "typical", at: 50 },
  { label: "high", at: 92 },
];
const YOU_START = 8;
const YOU_END = 74;

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** A hat worn from `on` to `off`: it drops in after `on` and has lifted away by `off`. */
function hatStyle(p: number, on: number, off: number) {
  const dropped = clamp((p - on) / SWAP);
  const lifted = clamp((p - (off - SWAP)) / SWAP);
  return {
    opacity: dropped * (1 - lifted),
    transform: `translateY(${-TRAVEL * (1 - dropped + lifted)}px)`,
  };
}

export function HomePulseHats({ anchors: { faceCx, faceTop }, p, range }: PoseOverlayProps) {
  return (
    <svg viewBox="0 0 350 550" overflow="visible">
      {/* Hard hat */}
      <g style={hatStyle(p, ...range("engineer"))}>
        {/* Slightly small, tilted and pulled down so it sits on her head rather than resting on top. */}
        <g transform={`translate(${faceCx} ${faceTop + 3}) rotate(-7) scale(0.9)`}>
          <path className={styles.helmet} d="M-27 0 C-27 -38 27 -38 27 0 Z" />
          <path className={styles.ridge} d="M-6 -27 H6 L8 0 H-8 Z" />
          <rect className={styles.helmet} x="-34" y="-3" width="68" height="7" rx="3.5" />
        </g>
      </g>
      {/* Beret */}
      <g style={hatStyle(p, ...range("marketing"))}>
        <g transform={`translate(${faceCx} ${faceTop - 6}) rotate(-10)`}>
          <path className={styles.beret} d="M-30 4 C-38 -18 30 -28 35 -4 C37 6 16 6 0 5 C-14 5 -28 9 -30 4 Z" />
          <rect className={styles.beret} x="-1" y="-24" width="4" height="8" rx="2" />
          <path className={styles.beretBand} d="M-27 5 C-8 1 12 2 27 3" />
        </g>
      </g>
    </svg>
  );
}

export function NameTag({ anchors: { faceCx, faceBottom } }: PoseOverlayProps) {
  const top = faceBottom + 40;
  return (
    <svg viewBox="0 0 350 550" data-island="light">
      <rect className={styles.tag} x={faceCx - 25} y={top} width="50" height="32" rx="3" />
      <rect className={styles.tagBand} x={faceCx - 25} y={top} width="50" height="13" rx="3" />
      <text className={styles.tagHello} x={faceCx} y={top + 9} textAnchor="middle">HELLO I&apos;M</text>
      <text className={styles.tagName} x={faceCx} y={top + 26} textAnchor="middle">SADIE</text>
    </svg>
  );
}

export default function HomePulseProps({ p, range }: ChapterPropsProps) {
  const progress = (id: string) => {
    const [a, b] = range(id);
    return clamp((p - a) / (b - a));
  };
  const during = (id: string) => {
    const [a, b] = range(id);
    return p >= a && p < b;
  };

  const comparing = p >= range("comps")[0];
  const tComps = progress("comps");
  // Three steps in turn: the range bar draws, the "You" marker settles, the contact card slides up.
  const tBar = clamp(tComps / 0.22);
  const tYou = clamp((tComps - 0.28) / 0.34);
  const youAt = YOU_START + (YOU_END - YOU_START) * (1 - (1 - tYou) ** 3);
  const tContact = clamp((tComps - 0.72) / 0.22);
  // Scroll-driven float, so it plays backwards too.
  const float = Math.round(Math.sin(p * 120) * 7);

  return (
    <>
      <PropBox visible={during("engineer")} at={22} dx={90} up={270} mobile={{ dx: 80, up: 230 }} style={{ translate: `0 ${float}px` }}>
        <svg className={styles.laptop} viewBox="0 0 150 100">
          <rect className={styles.lidShell} x="20" y="4" width="110" height="74" rx="6" />
          <rect className={styles.screen} x="26" y="10" width="98" height="62" rx="2" />
          <path className={styles.codeRules} d="M34 22 H78 M42 34 H100 M42 46 H88 M34 58 H66" />
          <path className={styles.base} d="M6 80 H144 L136 90 H14 Z" />
        </svg>
      </PropBox>

      <PropBox island visible={during("marketing")} at={22} dx={90} up={300} mobile={{ dx: 80, up: 270 }}>
        <svg className={styles.megaphone} viewBox="0 0 170 110">
          <path className={styles.horn} d="M20 42 L92 14 V92 L20 66 Z" />
          <rect className={styles.mouth} x="90" y="10" width="12" height="86" rx="5" />
          <rect className={styles.grip} x="6" y="42" width="18" height="24" rx="4" />
          <path className={styles.handle} d="M36 70 L44 98 H58 L52 74" />
          {["M114 36 Q124 53 114 70", "M130 26 Q146 53 130 80", "M146 16 Q168 53 146 90"].map((d, i) => (
            <path key={d} className={styles.sound} d={d} style={{ opacity: 0.2 + 0.8 * Math.abs(Math.sin(p * 150 - i)) }} />
          ))}
        </svg>
      </PropBox>

      <PropBox
        visible={during("meetups") || during("comps")}
        at={22}
        dx={100}
        up={338}
        mobile={{ up: 225 }}
        className={styles.tablet}
      >
        <div className={styles.glass} data-island="light">
          {comparing ? (
            <>
              <span className={styles.tabletTitle}>Insurance Comps · your ZIP</span>
              <div className={styles.comps}>
                <span className={styles.compsLabel}>Similar homes</span>
                <div className={styles.range}>
                  <div className={styles.rangeBar} style={{ scale: `${tBar.toFixed(3)} 1` }} />
                  {TICKS.map(({ label, at }) => (
                    <div key={label} className={styles.tick} style={{ left: `${at}%`, opacity: clamp(tBar * 2 - 1) }}>
                      <i />
                      <span>{label}</span>
                    </div>
                  ))}
                  <div className={styles.you} style={{ left: `${youAt.toFixed(1)}%`, opacity: clamp(tYou * 5) }}>
                    <span>You</span>
                    <i />
                  </div>
                </div>
                <span className={styles.over} style={{ opacity: clamp((tYou - 0.8) / 0.2) }}>
                  Paying over
                </span>
              </div>
              <div
                className={styles.contact}
                style={{ opacity: clamp(tContact * 2), translate: `0 ${Math.round((1 - tContact) * 52)}px` }}
              >
                <Phone size={16} aria-hidden="true" />
                <div>
                  <span>Connect with an insurer</span>
                  <span className={styles.yellowPages}>HomePulse Yellow Pages</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <span className={styles.tabletTitle}>HomePulse · demo</span>
              <div className={styles.demo}>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={Math.floor(progress("meetups") * 4) === i ? styles.picked : undefined} />
                ))}
              </div>
            </>
          )}
        </div>
      </PropBox>
    </>
  );
}
