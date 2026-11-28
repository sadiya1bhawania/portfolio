"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";
import { useTheme } from "../theme/useTheme";

// Geometry, widths, opacities and speeds come from docs/motion-reference.html.
const VIEW_W = 1440;
const VIEW_H = 760;

type Point = [number, number];
type Curve = { points: [Point, Point, Point, Point]; speed: number };

// speed: viewBox units per second.
const CURVES: Curve[] = [
  { points: [[-50, 120], [400, 60], [700, 300], [1490, 220]], speed: 500 / 9 },
  { points: [[-50, 380], [300, 520], [900, 200], [1490, 420]], speed: 500 / 12 },
  { points: [[-50, 660], [500, 560], [900, 720], [1490, 560]], speed: 500 / 10 },
  { points: [[-50, 260], [600, 440], [800, 80], [1490, 120]], speed: 500 / 14 },
];

const SPACING = 48;
const MAX_PARTICLES = 400;
const FAIL_CURVE = 1;
const FAIL_SPEED = 500 / 6;
const FAIL_EVERY = 6; // seconds
const SAMPLES = 200;
const MOUSE_RADIUS = 120;
const MOUSE_PUSH = 18;

/** Samples a curve at equal arc-length steps, so particles move at a constant speed. */
function measure({ points: [a, b, c, d] }: Curve) {
  const at = (t: number, i: 0 | 1) => {
    const u = 1 - t;
    return u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i];
  };
  const raw: Point[] = [];
  const lengths = [0];
  for (let n = 0; n <= SAMPLES; n++) {
    raw.push([at(n / SAMPLES, 0), at(n / SAMPLES, 1)]);
    if (n) {
      lengths.push(lengths[n - 1] + Math.hypot(raw[n][0] - raw[n - 1][0], raw[n][1] - raw[n - 1][1]));
    }
  }
  const length = lengths[SAMPLES];
  const even: Point[] = [];
  for (let n = 0, j = 1; n <= SAMPLES; n++) {
    const target = (n / SAMPLES) * length;
    while (j < SAMPLES && lengths[j] < target) j++;
    const f = (target - lengths[j - 1]) / (lengths[j] - lengths[j - 1]);
    even.push([
      raw[j - 1][0] + (raw[j][0] - raw[j - 1][0]) * f,
      raw[j - 1][1] + (raw[j][1] - raw[j - 1][1]) * f,
    ]);
  }
  return {
    length,
    pointAt(distance: number): Point {
      const s = Math.min(Math.max(distance / length, 0), 1) * SAMPLES;
      const n = Math.min(Math.floor(s), SAMPLES - 1);
      const f = s - n;
      return [
        even[n][0] + (even[n + 1][0] - even[n][0]) * f,
        even[n][1] + (even[n + 1][1] - even[n][1]) * f,
      ];
    },
  };
}

export default function StreamField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  // The canvas reads its colors from CSS, so a theme change has to set it up again.
  const theme = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const tokens = getComputedStyle(canvas);
    const copper = tokens.getPropertyValue("--stream-color").trim();
    const lineAlpha = Number(tokens.getPropertyValue("--stream-line-alpha"));
    const dotAlpha = Number(tokens.getPropertyValue("--stream-dot-alpha"));
    const brick = tokens.getPropertyValue("--brick").trim();
    const paths = CURVES.map(measure);
    const totalLength = paths.reduce((sum, path) => sum + path.length, 0);

    let width = 0;
    let height = 0;
    let particles: { curve: number; offset: number }[] = [];
    let fails: number[] = []; // distance travelled by each brick particle
    let sinceFail = 0;
    let elapsed = 0;
    let frame = 0;
    let last = 0;
    let onScreen = true;
    let mouse: Point | null = null;

    const seed = () => {
      const full = Math.min(MAX_PARTICLES, Math.floor(totalLength / SPACING));
      const count = window.innerWidth < 640 ? Math.floor(full / 2) : full;
      const spacing = totalLength / count;
      particles = paths.flatMap((path, curve) => {
        const n = Math.floor(path.length / spacing);
        return Array.from({ length: n }, (_, i) => ({ curve, offset: (i * path.length) / n }));
      });
    };

    const dot = (curve: number, distance: number, radius: number) => {
      const [vx, vy] = paths[curve].pointAt(distance);
      let x = (vx * width) / VIEW_W;
      let y = (vy * height) / VIEW_H;
      if (mouse) {
        const dx = x - mouse[0];
        const dy = y - mouse[1];
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < MOUSE_RADIUS) {
          const push = (1 - d / MOUSE_RADIUS) ** 2 * MOUSE_PUSH;
          x += (dx / d) * push;
          y += (dy / d) * push;
        }
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = copper;
      ctx.lineWidth = 1;
      ctx.globalAlpha = lineAlpha;
      for (const { points: [a, b, c, d] } of CURVES) {
        const sx = width / VIEW_W;
        const sy = height / VIEW_H;
        ctx.beginPath();
        ctx.moveTo(a[0] * sx, a[1] * sy);
        ctx.bezierCurveTo(b[0] * sx, b[1] * sy, c[0] * sx, c[1] * sy, d[0] * sx, d[1] * sy);
        ctx.stroke();
      }

      ctx.fillStyle = copper;
      ctx.globalAlpha = dotAlpha;
      for (const { curve, offset } of particles) {
        dot(curve, (offset + elapsed * CURVES[curve].speed) % paths[curve].length, 1.25);
      }

      ctx.fillStyle = brick;
      ctx.globalAlpha = 1;
      for (const distance of fails) dot(FAIL_CURVE, distance, 1.5);
    };

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      elapsed += dt;
      sinceFail += dt;
      if (sinceFail >= FAIL_EVERY) {
        sinceFail = 0;
        fails.push(0);
      }
      fails = fails.map((s) => s + dt * FAIL_SPEED).filter((s) => s < paths[FAIL_CURVE].length);
      draw();
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      const run = !reduced && onScreen && !document.hidden;
      if (run && !frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      } else if (!run && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      // The static (reduced motion) frame shows one brick particle, mid-path.
      if (reduced) fails = [paths[FAIL_CURVE].length / 2];
      draw();
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = canvas.getBoundingClientRect();
      mouse = [event.clientX - box.left, event.clientY - box.top];
    };
    const leave = () => {
      mouse = null;
    };

    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);
    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    watcher.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    if (!reduced) {
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
    }

    resize();
    sync();

    return () => {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      watcher.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [reduced, theme]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
