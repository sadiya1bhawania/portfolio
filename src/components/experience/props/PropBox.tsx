import type { CSSProperties, ReactNode } from "react";
import styles from "./PropBox.module.css";

type PropBoxProps = {
  visible: boolean;
  /** Horizontal anchor in % of stage width. */
  at: number;
  /** Px right of the anchor, at full scale. */
  dx?: number;
  /** Px above the ground line, at full scale. */
  up: number;
  /** Overrides for the <640px stage. */
  mobile?: { dx?: number; up?: number };
  /** Accessible name. Without it the prop is decorative. */
  label?: string;
  /** A white card: keeps the light palette in both themes. */
  island?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function PropBox({
  visible,
  at,
  dx = 0,
  up,
  mobile,
  label,
  island,
  className = "",
  style,
  children,
}: PropBoxProps) {
  return (
    <div
      className={`${styles.box} ${className}`}
      data-island={island ? "light" : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label || !visible}
      style={
        {
          "--at": `${at}%`,
          "--dx": `${dx}px`,
          "--up": `${up}px`,
          "--m-dx": `${mobile?.dx ?? dx}px`,
          "--m-up": `${mobile?.up ?? up}px`,
          opacity: visible ? 1 : 0,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
