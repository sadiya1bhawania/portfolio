import { LayoutDashboard, Search, Stethoscope } from "lucide-react";
import type { ChapterPropsProps } from "@/src/lib/experience/chapters";
import PropBox from "./PropBox";
import styles from "./KnowtexProps.module.css";

type Spot = { dx: number; up: number };
// Around her on wide stages; stacked to her right on mobile.
const CARDS: { title: string; Icon: typeof Search; at: Spot; mobile: Spot }[] = [
  { title: "Clinical intelligence", Icon: Stethoscope, at: { dx: -292, up: 330 }, mobile: { dx: 90, up: 366 } },
  { title: "Knowledge retrieval", Icon: Search, at: { dx: 90, up: 400 }, mobile: { dx: 90, up: 262 } },
  { title: "Intelligent interfaces", Icon: LayoutDashboard, at: { dx: 96, up: 220 }, mobile: { dx: 90, up: 158 } },
];

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export default function KnowtexProps({ p, range }: ChapterPropsProps) {
  const progress = (id: string) => {
    const [a, b] = range(id);
    return clamp((p - a) / (b - a));
  };
  const tCards = progress("cards");
  // The wordmark finishes scaling in over the first 60% of the finale, then holds.
  const tMark = clamp(progress("finale") / 0.6);
  const eased = 1 - (1 - tMark) ** 3;

  return (
    <>
      <div
        className={styles.wordmark}
        aria-hidden="true"
        style={{ opacity: clamp(tMark * 2), scale: `${(0.6 + 0.4 * eased).toFixed(3)}` }}
      >
        Knowtex
      </div>

      {CARDS.map(({ title, Icon, at, mobile }, i) => {
        // Each card takes a third of the beat.
        const v = clamp(tCards * 3 - i);
        return (
          <PropBox
            key={title}
            visible={v > 0}
            at={30}
            dx={at.dx}
            up={at.up}
            mobile={mobile}
            label={title}
            className={styles.card}
            style={{ opacity: v, translate: `0 ${Math.round((1 - v) * 14)}px`, transition: "none" }}
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{title}</span>
          </PropBox>
        );
      })}
    </>
  );
}
