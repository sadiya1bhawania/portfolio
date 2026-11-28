"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import styles from "./ReadingProgress.module.css";

const subscribe = () => () => {};

/** How far through the element with `targetId` the reader is. */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Portalled to <body> so the page transition's transform can't unfix it.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    if (!mounted) return;
    const update = () => {
      const target = document.getElementById(targetId);
      if (!target || !ref.current) return;
      const { top, height } = target.getBoundingClientRect();
      // 0 at the top of the page, 1 once the end of the article is on screen.
      const distance = top + window.scrollY + height - window.innerHeight;
      const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 1;
      ref.current.style.transform = `scaleX(${progress})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [mounted, targetId]);

  if (!mounted) return null;
  return createPortal(<div ref={ref} className={styles.bar} aria-hidden="true" />, document.body);
}
