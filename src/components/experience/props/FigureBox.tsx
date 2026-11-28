import type { CSSProperties, ReactNode } from "react";
import styles from "./FigureBox.module.css";

/** A 350x550 box laid exactly over the figure, for effects positioned in frame coordinates. */
export default function FigureBox({ x, style, children }: { x: number; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={styles.box} style={{ left: `calc(${x}% - 175px)`, ...style }} aria-hidden="true">
      {children}
    </div>
  );
}
