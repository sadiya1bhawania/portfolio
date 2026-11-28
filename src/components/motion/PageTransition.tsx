"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./PageTransition.module.css";

/** Fades and lifts each new route in. The first page load is left alone. */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [landing] = useState(pathname);
  const [navigated, setNavigated] = useState(false);
  if (!navigated && pathname !== landing) setNavigated(true);

  return (
    <div
      key={pathname}
      className={`${styles.page} ${navigated ? styles.enter : ""}`}
      // Triggers measured while the page was still offset need measuring again.
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) ScrollTrigger.refresh();
      }}
    >
      {children}
    </div>
  );
}
