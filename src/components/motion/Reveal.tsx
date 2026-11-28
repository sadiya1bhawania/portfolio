"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./SmoothScroll";
import { useReducedMotion } from "./useReducedMotion";

type RevealProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Seconds between direct children. Omit to reveal the wrapper as one block. */
  stagger?: number;
};

export default function Reveal({ stagger, children, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (reduced || !el) return;

      gsap.from(stagger === undefined ? el : Array.from(el.children), {
        opacity: 0,
        y: 16,
        stagger,
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: el, once: true },
      });
    },
    { dependencies: [reduced, stagger], revertOnUpdate: true },
  );

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}
