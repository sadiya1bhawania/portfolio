"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import styles from "./Tip.module.css";

export function Tip({ text, label = "More info" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const popover = popoverRef.current;
    if (!popover) return;

    popover.style.setProperty("--tip-shift", "0px");
    const rect = popover.getBoundingClientRect();
    const edge = 8;
    let shift = 0;
    if (rect.right > window.innerWidth - edge) {
      shift = window.innerWidth - edge - rect.right;
    } else if (rect.left < edge) {
      shift = edge - rect.left;
    }
    popover.style.setProperty("--tip-shift", `${shift}px`);
  }, [open]);

  return (
    <span
      className={styles.root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={popoverId}
        aria-describedby={open ? popoverId : undefined}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="info" size={13} />
      </button>

      {open && (
        <span id={popoverId} className={styles.popover} ref={popoverRef}>
          {text}
        </span>
      )}
    </span>
  );
}
