"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { THEME_KEY } from "./themeScript";
import { useTheme, type Theme } from "./useTheme";
import styles from "./ThemeToggle.module.css";

const SWITCH_MS = 250;

function saved() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  // The class's transition rule is itself off under reduced motion.
  root.classList.add("theme-switching");
  root.dataset.theme = theme;
  window.setTimeout(() => root.classList.remove("theme-switching"), SWITCH_MS + 20);
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const next: Theme = theme === "dark" ? "light" : "dark";

  // Until the visitor chooses, keep following the system.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const follow = () => {
      if (!saved()) apply(media.matches ? "light" : "dark");
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className}`}
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        apply(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          // Private windows can refuse storage; the choice then lasts for this visit.
        }
      }}
    >
      {/* Both icons render; CSS picks one, so the server markup never mismatches. */}
      <Sun className={styles.sun} size={12} aria-hidden="true" />
      <Moon className={styles.moon} size={12} aria-hidden="true" />
    </button>
  );
}
