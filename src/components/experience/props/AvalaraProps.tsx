import type { ChapterPropsProps } from "@/src/lib/experience/chapters";
import PropBox from "./PropBox";
import styles from "./AvalaraProps.module.css";

const CODE = ["const forms = load(250)", "for (f of forms)", "  fill(f, data)", "  validate(f)", "file(forms)"];
const CHECKS = ["250+ tax forms integrated", "Built with iTextSharp + SQL", "2 weeks → 1 day"];
// [y, tilt] of each sheet in the paper pile.
const SHEETS = [
  [214, -2], [198, 3], [182, -3], [166, 2], [150, -1], [134, 4], [118, -3], [102, 2], [86, -2], [70, 3], [54, -1],
];

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function Dots() {
  return (
    <div className={styles.dots}>
      <span />
      <span />
      <span />
    </div>
  );
}

export default function AvalaraProps({ p, range }: ChapterPropsProps) {
  const progress = (id: string) => {
    const [a, b] = range(id);
    return clamp((p - a) / (b - a));
  };
  const during = (id: string) => {
    const [a, b] = range(id);
    return p >= a && p < b;
  };

  const tBuild = progress("build");
  const tMorph = progress("morph");
  const tReveal = progress("reveal");
  const flipped = p >= range("flip")[0];

  return (
    <>
      <PropBox island visible={p < range("depart")[0]} at={36} up={-1}>
        <svg
          className={styles.pile}
          viewBox="0 0 160 240"
          style={{ transform: `scaleY(${(1 - 0.85 * tMorph).toFixed(3)})` }}
        >
          <g className={styles.sheet}>
            {SHEETS.map(([y, tilt]) => (
              <rect key={y} x="14" y={y} width="130" height="12" rx="2" transform={`rotate(${tilt} 80 ${y + 6})`} />
            ))}
          </g>
          <rect className={styles.cover} x="34" y="24" width="92" height="118" rx="3" />
          <text className={styles.coverText} x="80" y="58" textAnchor="middle">TAX</text>
          <text className={styles.coverText} x="80" y="76" textAnchor="middle">FORMS</text>
          <path className={styles.coverRules} d="M46 94 H114 M46 106 H104 M46 118 H110" />
          <rect className={styles.sticky} x="118" y="130" width="16" height="16" transform="rotate(8 126 138)" />
        </svg>
      </PropBox>

      <PropBox visible={during("plan")} at={22} dx={30} up={501} mobile={{ dx: 80, up: 360 }}>
        <svg className={styles.bulb} viewBox="0 0 60 70">
          <path className={styles.glass} d="M30 6 C 16 6 8 16 8 28 C 8 38 16 44 20 52 L 40 52 C 44 44 52 38 52 28 C 52 16 44 6 30 6 Z" />
          <rect className={styles.socket} x="21" y="54" width="18" height="10" rx="3" />
          <path className={styles.rays} d="M30 -10 V -2 M2 6 L 8 12 M58 6 L 52 12" />
        </svg>
      </PropBox>

      <PropBox visible={during("build")} at={22} dx={-10} up={391} mobile={{ dx: 130, up: 250 }} className={styles.code}>
        <Dots />
        <div className={styles.lines}>
          {CODE.map((line, i) => {
            const v = clamp(tBuild * CODE.length - i);
            return (
              <div key={line} className={i === CODE.length - 1 ? styles.lastLine : undefined} style={{ opacity: v > 0 ? 1 : 0.2 }}>
                {line.slice(0, Math.round(line.length * v)) || " "}
              </div>
            );
          })}
        </div>
      </PropBox>

      <PropBox
        visible={during("reach") || during("flip")}
        at={22}
        dx={78}
        up={259}
        label={flipped ? "Switch set to Automated" : "Switch set to Manual"}
        className={`${styles.switch} ${flipped ? styles.on : ""}`}
      >
        <span className={styles.knob} data-island="light" />
        <span className={styles.switchText}>{flipped ? "Automated" : "Manual"}</span>
      </PropBox>

      <PropBox visible={during("morph")} at={36} dx={150} up={241} mobile={{ dx: 132 }} className={styles.engine} island>
        <Dots />
        <div className={styles.engineBody}>
          <svg className={styles.gear} viewBox="0 0 48 48" style={{ transform: `rotate(${Math.round(tMorph * 540)}deg)` }}>
            <path className={styles.gearTeeth} d="M24 4 l4 6 7-2 1 7 7 1-2 7 6 4-6 4 2 7-7 1-1 7-7-2-4 6-4-6-7 2-1-7-7-1 2-7-6-4 6-4-2-7 7-1 1-7 7 2z" />
            <circle className={styles.gearHub} cx="24" cy="24" r="7" />
          </svg>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${Math.round(tMorph * 100)}%` }} />
          </div>
          <span className={styles.engineText}>
            {tMorph < 1 ? `filing ${Math.round(tMorph * 250)} / 250 forms` : "all forms filed"}
          </span>
        </div>
      </PropBox>

      {/* Papers flying from the pile into the engine. */}
      {[0, 1, 2, 3].map((i) => {
        const t = clamp(tMorph * 1.6 - i * 0.2);
        const rise = lerp(220, 360, Math.sin((t * Math.PI) / 2)) + Math.sin(t * Math.PI) * 60;
        return (
          <PropBox
            island
            key={i}
            visible={during("morph") && t > 0 && t < 1}
            at={36}
            dx={40 + lerp(0, 230, t)}
            up={rise - 59}
            style={{ rotate: `${Math.round(t * 200 - 20)}deg`, transition: "none" }}
          >
            <svg className={styles.paper} viewBox="0 0 40 50">
              <rect x="1" y="1" width="38" height="48" rx="2" />
              <path d="M8 14 H32 M8 22 H28 M8 30 H30" />
            </svg>
          </PropBox>
        );
      })}

      <PropBox
        visible={during("reveal")}
        at={22}
        dx={108}
        up={191}
        label="Tax filing automated"
        island
        className={styles.result}
        style={{ translate: `0 ${Math.round((1 - clamp(tReveal * 3)) * 14)}px` }}
      >
        <div className={styles.resultHead}>
          <span className={styles.badge}>✓</span>
          <span className={styles.resultTitle}>Tax filing automated</span>
        </div>
        {CHECKS.map((check, i) => (
          <div key={check} className={styles.check} style={{ opacity: clamp(tReveal * 4 - i * 0.7 - 0.3) }}>
            <span>✓</span>
            <span>{check}</span>
          </div>
        ))}
      </PropBox>
    </>
  );
}
