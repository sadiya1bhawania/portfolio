import { Database, FileText, HardDrive, Receipt } from "lucide-react";
import type { ChapterPropsProps } from "@/src/lib/experience/chapters";
import PropBox from "./PropBox";
import styles from "./ElbProps.module.css";

type Spot = { dx: number; up: number };
// Where each source window sits while scattered, on the desktop and mobile stages.
const SOURCES: { name: string; Icon: typeof Database; at: Spot; mobile: Spot }[] = [
  { name: "Google Drive", Icon: HardDrive, at: { dx: -228, up: 370 }, mobile: { dx: -112, up: 335 } },
  { name: "Documents", Icon: FileText, at: { dx: 108, up: 410 }, mobile: { dx: 105, up: 345 } },
  { name: "Database", Icon: Database, at: { dx: -236, up: 170 }, mobile: { dx: -112, up: 120 } },
  { name: "Invoices", Icon: Receipt, at: { dx: 128, up: 190 }, mobile: { dx: 140, up: 150 } },
];
// Where they converge: the middle of the chat panel.
const MERGE: Spot = { dx: 160, up: 250 };
const MERGE_MOBILE: Spot = { dx: 160, up: 170 };

const CODE = ["agent.route(question)", "  case 'data': textToSql()", "  case 'docs': rag()", "await approve(sql)", "return answer(sources)"];
const STEPS = ["Intent detected", "Text-to-SQL | RAG", "Human approval gate ✓"];
const SQL = ["SELECT vendor, due_date, amount", "FROM invoices", "WHERE status = 'unpaid'", "  AND due_date < :month_end;"];
const ROWS = ["Vendor A", "Vendor B", "Vendor C"];
const CITATIONS = ["[1] Invoices · database", "[2] Documents · Google Drive"];

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function ElbProps({ p, range }: ChapterPropsProps) {
  const progress = (id: string) => {
    const [a, b] = range(id);
    return clamp((p - a) / (b - a));
  };
  const during = (id: string) => {
    const [a, b] = range(id);
    return p >= a && p < b;
  };

  const scatterStart = range("scatter")[0];
  const mergeStart = range("merge")[0];
  const mergeEnd = range("merge")[1];
  const fly = clamp(progress("merge") * 1.25);
  const eased = fly * fly * (3 - 2 * fly);
  // The windows sit back while the idea and the code take the foreground.
  const dimmed = during("idea") || during("build");
  const tBuild = progress("build");
  // The chain plays out over the first 85% of the beat.
  const tGate = progress("gate") / 0.85;

  return (
    <>
      {SOURCES.map(({ name, Icon, at, mobile }, i) => {
        // Scroll-driven jitter, which settles as the window starts to fly.
        const jx = Math.sin(p * 260 + i * 2.1) * 4 * (1 - eased);
        const jy = Math.cos(p * 220 + i * 1.7) * 4 * (1 - eased);
        return (
          <PropBox
            key={name}
            visible={p >= scatterStart && p < mergeEnd}
            at={22}
            dx={lerp(at.dx, MERGE.dx, eased)}
            up={lerp(at.up, MERGE.up, eased)}
            mobile={{ dx: lerp(mobile.dx, MERGE_MOBILE.dx, eased), up: lerp(mobile.up, MERGE_MOBILE.up, eased) }}
            className={styles.source}
            style={{
              translate: `${jx.toFixed(1)}px ${jy.toFixed(1)}px`,
              rotate: `${((i % 2 ? 4 : -4) * (1 - eased)).toFixed(1)}deg`,
              ...(p >= scatterStart && p < mergeEnd && { opacity: dimmed ? 0.35 : 1 - clamp((fly - 0.7) / 0.3) }),
              ...(p >= mergeStart && { transition: "none" }),
            }}
          >
            <div className={styles.sourceHead}>
              <Icon size={14} aria-hidden="true" />
              <span>{name}</span>
            </div>
            <div className={styles.sourceBody}>
              <span />
              <span />
              <span />
            </div>
          </PropBox>
        );
      })}

      <PropBox visible={during("idea")} at={22} dx={30} up={501} mobile={{ dx: 80, up: 360 }}>
        <svg className={styles.bulb} viewBox="0 0 60 70">
          <path className={styles.bulbGlass} d="M30 6 C 16 6 8 16 8 28 C 8 38 16 44 20 52 L 40 52 C 44 44 52 38 52 28 C 52 16 44 6 30 6 Z" />
          <rect className={styles.socket} x="21" y="54" width="18" height="10" rx="3" />
          <path className={styles.rays} d="M30 -10 V -2 M2 6 L 8 12 M58 6 L 52 12" />
        </svg>
      </PropBox>

      <PropBox visible={during("build")} at={22} dx={-10} up={391} mobile={{ dx: 130, up: 250 }} className={styles.code}>
        {CODE.map((line, i) => {
          const v = clamp(tBuild * 1.1 * CODE.length - i);
          return (
            <div key={line} style={{ opacity: v > 0 ? 1 : 0.2 }}>
              {line.slice(0, Math.round(line.length * v)) || " "}
            </div>
          );
        })}
      </PropBox>

      <PropBox
        visible={p >= mergeStart && p < range("gate")[1]}
        at={22}
        dx={92}
        up={110}
        mobile={{ up: 40 }}
        className={styles.chat}
        style={{ ...(during("merge") && { opacity: clamp((fly - 0.6) / 0.4), transition: "none" }) }}
      >
        <div className={styles.chatHead}>One chat</div>
        {during("gate") ? (
          <>
            <div className={styles.question} data-island="light">
              <span className={styles.tag}>example</span>
              Which invoices are still unpaid this month?
            </div>
            <div className={styles.steps}>
              {STEPS.map((step, i) => (
                <span key={step} className={`${styles.step} ${tGate * 4.5 >= i + 1 ? styles.lit : ""}`}>
                  {step}
                </span>
              ))}
            </div>
            <div className={styles.sql} style={{ opacity: clamp(tGate * 4.5 - 3.6) }}>
              {SQL.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.input}>Ask in plain English…</div>
        )}
      </PropBox>

      <PropBox island visible={during("answer")} at={22} dx={108} up={170} mobile={{ up: 70 }} className={styles.answer}>
        <div className={styles.answerHead}>
          <span>Unpaid invoices</span>
          <span className={styles.tag}>example</span>
        </div>
        <div className={`${styles.row} ${styles.columns}`}>
          <span>vendor</span>
          <span>due</span>
          <span>amount</span>
        </div>
        {ROWS.map((vendor, i) => (
          <div key={vendor} className={styles.row} style={{ opacity: clamp(progress("answer") * 8 - i - 0.5) }}>
            <span>{vendor}</span>
            <i />
            <i />
          </div>
        ))}
        {CITATIONS.map((citation, i) => (
          <span key={citation} className={styles.citation} style={{ opacity: clamp(progress("answer") * 8 - i - 4) }}>
            {citation}
          </span>
        ))}
      </PropBox>
    </>
  );
}
