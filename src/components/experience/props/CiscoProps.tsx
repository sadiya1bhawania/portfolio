import type { ChapterPropsProps, PoseAnchors } from "@/src/lib/experience/chapters";
import PropBox from "./PropBox";
import styles from "./CiscoProps.module.css";

const SQL = ["SELECT * FROM agents", "WHERE ...", "SELECT * FROM agents", "WHERE ..."];
const AGENTS = ["agent-01", "agent-02", "agent-03", "agent-04", "agent-05"];
const PROXIES = ["proxy-01", "proxy-02", "proxy-03"];
const COVERAGE = 95;

const clamp = (v: number) => Math.max(0, Math.min(1, v));

function Badge({ anchors: { faceCx, faceBottom } }: { anchors: PoseAnchors }) {
  const neck = faceBottom + 10;
  const clip = faceBottom + 56;
  return (
    <>
      <path className={styles.lanyard} d={`M${faceCx - 13} ${neck} L${faceCx} ${clip} L${faceCx + 13} ${neck}`} />
      <rect className={styles.badge} x={faceCx - 19} y={clip} width="38" height="26" rx="3" />
      <rect className={styles.badgeBand} x={faceCx - 19} y={clip} width="38" height="6" />
      <text className={styles.badgeText} x={faceCx} y={clip + 18} textAnchor="middle">INTERN</text>
    </>
  );
}

export function InternBadge({ anchors }: { anchors: PoseAnchors }) {
  return (
    <svg viewBox="0 0 350 550" data-island="light">
      <Badge anchors={anchors} />
    </svg>
  );
}

export function InternBadgeWithCoffee({ anchors }: { anchors: PoseAnchors }) {
  const hand = anchors.hands[1];
  return (
    <svg viewBox="0 0 350 550" data-island="light">
      <Badge anchors={anchors} />
      {hand && (
        <g transform={`translate(${hand.x} ${hand.y})`}>
          <path className={styles.cup} d="M-10 -8 H10 L7 20 H-7 Z" />
          <rect className={styles.sleeve} x="-9" y="1" width="18" height="10" />
          <rect className={styles.lid} x="-12" y="-12" width="24" height="5" rx="2" />
        </g>
      )}
    </svg>
  );
}

export default function CiscoProps({ p, range }: ChapterPropsProps) {
  const progress = (id: string) => {
    const [a, b] = range(id);
    return clamp((p - a) / (b - a));
  };
  const queryStart = range("query")[0];
  const end = range("depart")[0];
  const showMonitor = p >= queryStart && p < end;

  const tType = progress("query");
  // The SQL fades into the table over the first third of the "table" beat.
  const morph = clamp(progress("table") * 3);
  const rows = progress("table");
  const tGrpc = progress("grpc");
  const coverage = Math.round(progress("coverage") * 1.25 * COVERAGE);
  const percent = Math.min(COVERAGE, coverage);
  // Scroll-driven pulse, so it plays backwards too.
  const pulse = (i: number) => 0.35 + 0.65 * Math.abs(Math.sin(p * 160 + i * 1.3));

  return (
    <>
      <PropBox visible={showMonitor} at={22} dx={100} up={345} mobile={{ up: 225 }} className={styles.panel}>
        <div className={styles.monitor}>
          <div className={styles.sql} style={{ opacity: 1 - morph }}>
            {SQL.map((line, i) => {
              const v = clamp(tType * 1.2 * SQL.length - i);
              return <div key={i}>{line.slice(0, Math.round(line.length * v)) || " "}</div>;
            })}
          </div>
          <div className={styles.table} style={{ opacity: morph }}>
            <div className={styles.heading}>
              <span>Agent Tracking</span>
              <span className={styles.live}>● live</span>
            </div>
            {AGENTS.map((agent, i) => (
              <div key={agent} className={styles.row} style={{ opacity: clamp(rows * 8 - i - 1) }}>
                <span className={styles.dot} style={{ opacity: pulse(i) }} />
                <span>{agent}</span>
                <span className={styles.stub} />
              </div>
            ))}
          </div>
        </div>
      </PropBox>

      <PropBox
        visible={p >= range("grpc")[0] && p < end}
        at={22}
        dx={150}
        up={140}
        mobile={{ dx: 130, up: 92 }}
        className={`${styles.panel} ${styles.proxies}`}
        style={{ translate: `${Math.round((1 - clamp(tGrpc * 3)) * 48)}px 0` }}
      >
        <div className={styles.heading}>
          <span>gRPC · agent proxies</span>
        </div>
        {PROXIES.map((proxy, i) => (
          <div key={proxy} className={styles.row} style={{ opacity: clamp(tGrpc * 5 - i - 0.5) }}>
            <span className={styles.dot} />
            <span>{proxy}</span>
          </div>
        ))}
      </PropBox>

      <PropBox
        visible={p >= range("coverage")[0] && p < end}
        at={22}
        dx={150}
        up={40}
        mobile={{ dx: 130, up: 8 }}
        className={`${styles.panel} ${styles.coverage}`}
      >
        <div className={styles.coverageHead}>
          <span>JUnit coverage</span>
          <span>{percent}%</span>
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
      </PropBox>
    </>
  );
}
