// Sadie's Walk story config. Chapter 1 copy and timings come from docs/sadies-walk-reference.html.
import type { ComponentType } from "react";
import manifest from "@/public/experience/frames/manifest.json";
import AvalaraProps from "@/src/components/experience/props/AvalaraProps";
import KnowtexProps from "@/src/components/experience/props/KnowtexProps";
import ElbProps from "@/src/components/experience/props/ElbProps";
import HomePulseProps, { HomePulseHats, NameTag } from "@/src/components/experience/props/HomePulseProps";
import CiscoProps, { InternBadge, InternBadgeWithCoffee } from "@/src/components/experience/props/CiscoProps";
import NortheasternProps from "@/src/components/experience/props/NortheasternProps";

export type Beat = {
  /** Used by prop components to look up their timing. */
  id: string;
  /** Chapter progress (0-1) where this beat ends. It starts where the previous one ends. */
  to: number;
  /** "walk" for the walk cycle, otherwise a key in the chapter's manifest frame set or in "poses". */
  frame: string;
  /** Figure centre in % of stage width. Omit to stay where the previous beat ended. */
  x?: [number, number];
  /** Walk beats: over this many px at the end of the beat, the steps run at half speed. */
  slowdown?: number;
  /** Shift the pose so its face (manifest faceCx) lands where the walk frames' head is. */
  alignFace?: boolean;
  /** Px of scroll over which the pose settles into place after cutting in. */
  settle?: number;
  label: string;
  caption: string;
  /** Extra points listed under the caption. */
  bullets?: string[];
};

export type ChapterPropsProps = {
  /** Chapter progress, 0-1. */
  p: number;
  /** Figure centre in % of stage width. */
  x: number;
  /** [start, end] chapter progress of a beat. */
  range: (beatId: string) => [number, number];
};

export type PoseAnchors = {
  faceCx: number;
  faceTop: number;
  faceBottom: number;
  hands: { x: number; y: number }[];
};

export type PoseOverlayProps = Pick<ChapterPropsProps, "p" | "range"> & { anchors: PoseAnchors };

/** A hat, badge, etc. drawn in a 350x550 box aligned to the figure. */
export type PoseOverlay = {
  frame: string;
  Component: ComponentType<PoseOverlayProps>;
};

export type Chapter = {
  /** Also the key of this chapter's frame set in the frame manifest, unless frameSet is given. */
  id: string;
  /** Borrow another chapter's frame set. */
  frameSet?: string;
  years: string;
  role: string;
  title: string;
  subtitle: string;
  wordmark: string;
  /** Scroll distance in px. */
  length: number;
  beats: Beat[];
  achievement: { at: number; label: string; headline: string; body: string };
  /** CSS clip-path per frame key, in 350x550 frame px, to hide artwork a prop replaces. */
  frameClips?: Record<string, string>;
  /** The faint background wordmark hides from this progress, e.g. when a prop takes its place. */
  wordmarkUntil?: number;
  /** Progress shown under reduced motion. Defaults to just before the last beat. */
  staticAt?: number;
  Props?: ComponentType<ChapterPropsProps>;
  overlays?: PoseOverlay[];
};

// The cap throw: the frames in manifest order share this stretch of chapter 2 evenly.
// The two in-between frames are skipped, so she cuts from holding the cap straight to throwing it.
const THROW = { from: 0.32, to: 0.75, skip: ["ne_mid_grab", "ne_lift"] };
const THROW_BEATS: Beat[] = manifest.northeastern.order.filter((f) => !THROW.skip.includes(f)).map((frame, i, order) => ({
  id: frame,
  frame,
  to: THROW.from + ((THROW.to - THROW.from) * (i + 1)) / order.length,
  label: "",
  caption: "",
}));

export const CHAPTERS: Chapter[] = [
  {
    id: "avalara",
    years: "2018–2020",
    role: "Software Engineer",
    title: "Avalara",
    subtitle: "Automating complexity",
    wordmark: "Avalara",
    length: 3600,
    beats: [
      { id: "arrive", to: 0.16, frame: "walk", x: [3, 22], label: "ARRIVAL", caption: "First stop: Avalara." },
      { id: "spot", to: 0.24, frame: "spot", label: "THE PROBLEM", caption: "250+ tax forms. Every filing, built by hand." },
      { id: "plan", to: 0.32, frame: "plan", label: "THE IDEA", caption: "What if the forms could fill and file themselves?" },
      {
        id: "build",
        to: 0.46,
        frame: "build",
        label: "THE BUILD",
        caption: "Designed and built an automated tax-form filing system with iTextSharp and SQL.",
      },
      { id: "reach", to: 0.53, frame: "reach", label: "THE SWITCH", caption: "Manual…" },
      { id: "flip", to: 0.6, frame: "flip", label: "THE SWITCH", caption: "Automated." },
      { id: "morph", to: 0.72, frame: "morph", label: "THE TRANSFORMATION", caption: "Paper forms in, finished filings out." },
      { id: "reveal", to: 0.84, frame: "reveal", label: "THE RESULT", caption: "Tax filing, automated." },
      { id: "depart", to: 1, frame: "walk", x: [22, 108], label: "NEXT", caption: "Next stop: Northeastern University →" },
    ],
    achievement: {
      at: 0.768,
      label: "ACHIEVEMENT · from résumé",
      headline: "2 weeks → 1 day",
      body: "Document creation across 250+ tax forms. Cleared a 30-day customer backlog in 1 week.",
    },
    Props: AvalaraProps,
  },
  {
    id: "northeastern",
    years: "2021-2022",
    role: "M.S. Computer Science",
    title: "Northeastern University",
    subtitle: "Investing in knowledge",
    wordmark: "Northeastern",
    length: 2600,
    beats: [
      { id: "arrive", to: 0.2, frame: "walk", x: [-8, 22], label: "ARRIVAL", caption: "Back to school." },
      { id: "stand", to: 0.32, frame: "ne_stand", label: "THE DEGREE", caption: "M.S. in Computer Science." },
      ...THROW_BEATS,
      // No text through the swap back to walking clothes.
      { id: "swap", to: 0.82, frame: "walk", label: "", caption: "" },
      { id: "depart", to: 1, frame: "walk", x: [22, 108], label: "NEXT", caption: "Next: Cisco." },
    ],
    achievement: {
      at: 0.58,
      label: "ACHIEVEMENT",
      headline: "M.S. Computer Science",
      body: "Northeastern University",
    },
    // The toss pose, while the cap is still on stage.
    staticAt: 0.62,
    // The release frame has a cap drawn in it, which would double the flying one.
    frameClips: {
      ne_mid_release: "polygon(0 0, 194px 0, 194px 184px, 286px 184px, 286px 0, 100% 0, 100% 100%, 0 100%)",
    },
    Props: NortheasternProps,
  },
  {
    id: "cisco",
    years: "2023",
    role: "Software Engineering Intern",
    title: "Cisco ThousandEyes",
    subtitle: "The internship",
    wordmark: "Cisco",
    length: 2600,
    beats: [
      { id: "arrive", to: 0.18, frame: "walk", x: [-8, 22], label: "ARRIVAL", caption: "Summer internship." },
      { id: "badge", to: 0.3, frame: "front_wave", label: "DAY ONE", caption: "Badge on, coffee in hand." },
      { id: "query", to: 0.45, frame: "front_present", label: "THE PROBLEM", caption: "Tracking agents meant querying SQL by hand." },
      {
        id: "table",
        to: 0.62,
        frame: "front_present",
        label: "THE BUILD",
        caption: "Built a real-time Agent Tracking UI in TypeScript and Spring Boot.",
      },
      { id: "grpc", to: 0.74, frame: "front_present", label: "THE API", caption: "Delivered a gRPC API for agent proxy listing." },
      { id: "coverage", to: 0.84, frame: "front_present", label: "THE TESTS", caption: "JUnit integration tests at 95% coverage." },
      { id: "depart", to: 1, frame: "walk", x: [22, 108], label: "NEXT", caption: "Next: HomePulse." },
    ],
    achievement: {
      at: 0.81,
      label: "ACHIEVEMENT",
      headline: "95% test coverage",
      body: "~40% fewer production bugs",
    },
    Props: CiscoProps,
    overlays: [
      { frame: "front_wave", Component: InternBadgeWithCoffee },
      { frame: "front_present", Component: InternBadge },
    ],
  },
  {
    id: "homepulse",
    years: "2024-2025",
    role: "Sr. Software Engineer",
    title: "HomePulse.ai",
    subtitle: "Wearing many hats",
    wordmark: "HomePulse",
    length: 2800,
    beats: [
      { id: "arrive", to: 0.15, frame: "walk", x: [-8, 22], label: "ARRIVAL", caption: "A seed-stage proptech startup." },
      {
        id: "engineer",
        to: 0.38,
        frame: "front_pocket",
        label: "HAT 1 · ENGINEER",
        caption: "",
        bullets: [
          "Unified siloed vendor records into one master vendor table, then built vendor marketplaces on it.",
          "Put the AI in HomePulse: built its first agentic document-extraction flow, cutting manual data entry by 90%.",
        ],
      },
      {
        id: "marketing",
        to: 0.56,
        frame: "front_pocket",
        label: "HAT 2 · MARKETING",
        caption: "Marketing: growth engineering, onboarding scripts and nurture funnels.",
      },
      {
        id: "meetups",
        to: 0.74,
        frame: "front_present",
        label: "HAT 3 · COMMUNITY",
        caption: "Homeowner meetups: demoing the product alongside the founders.",
      },
      {
        id: "comps",
        to: 0.86,
        frame: "front_present",
        label: "INSURANCE COMPS",
        caption:
          "Built Insurance Comps: are you paying over or under for home insurance, compared to similar homes in your ZIP?",
      },
      { id: "depart", to: 1, frame: "walk", x: [22, 108], label: "NEXT", caption: "Next: ELB." },
    ],
    achievement: {
      at: 0.81,
      label: "ACHIEVEMENT",
      headline: "Insurance Comps",
      body: "A highly used feature: used by 90% of users. Compares your insurance against similar homes in your ZIP and other metrics, then connects you to an insurer through the HomePulse Yellow Pages.",
    },
    Props: HomePulseProps,
    overlays: [
      { frame: "front_pocket", Component: HomePulseHats },
      { frame: "front_present", Component: NameTag },
    ],
  },
  {
    id: "elb",
    frameSet: "avalara",
    years: "2025-2026",
    role: "Sr. Software Engineer",
    title: "ELB US",
    subtitle: "Connecting fragmented information",
    wordmark: "ELB",
    length: 3400,
    beats: [
      {
        id: "arrive",
        to: 0.12,
        frame: "walk",
        x: [-8, 22],
        label: "ARRIVAL",
        caption: "Hired for the AI I put in HomePulse.",
      },
      { id: "scatter", to: 0.26, frame: "spot", label: "THE PROBLEM", caption: "Answers lived in scattered systems." },
      { id: "idea", to: 0.34, frame: "plan", label: "THE IDEA", caption: "What if anyone could just ask in plain English?" },
      { id: "build", to: 0.48, frame: "build", label: "THE BUILD", caption: "Architected an agentic Q&A system." },
      { id: "merge", to: 0.6, frame: "morph", label: "THE MERGE", caption: "Text-to-SQL and document RAG, behind one chat." },
      {
        id: "gate",
        to: 0.74,
        frame: "morph",
        label: "THE GATE",
        caption: "Every generated query waits at a human-approval gate before it runs.",
      },
      { id: "answer", to: 0.86, frame: "reveal", label: "THE RESULT", caption: "One answer, with its sources." },
      { id: "depart", to: 1, frame: "walk", x: [22, 108], label: "NEXT", caption: "Next: Knowtex." },
    ],
    achievement: {
      at: 0.8,
      label: "ACHIEVEMENT",
      headline: "150 employees",
      body: "~20 hours saved every two weeks for AP/finance · 100+ invoices a week",
    },
    Props: ElbProps,
  },
  {
    id: "knowtex",
    years: "2026 →",
    role: "Senior Software Engineer",
    title: "Knowtex",
    subtitle: "Building the future of healthcare AI",
    wordmark: "Knowtex",
    length: 2200,
    // No departure: the story ends and holds on the last beat.
    beats: [
      {
        id: "arrive",
        to: 0.3,
        frame: "walk",
        x: [-8, 30],
        slowdown: 250,
        label: "ARRIVAL",
        caption: "The first frontier AI lab for healthcare.",
      },
      {
        id: "turn",
        to: 0.45,
        frame: "front_pocket",
        alignFace: true,
        settle: 150,
        label: "ARRIVAL",
        caption: "The first frontier AI lab for healthcare.",
      },
      { id: "cards", to: 0.75, frame: "front_pocket", alignFace: true, label: "NOW", caption: "The first frontier AI lab for healthcare." },
      { id: "finale", to: 1, frame: "front_pocket", alignFace: true, label: "NOW", caption: "" },
    ],
    achievement: {
      at: 0.85,
      label: "ACHIEVEMENT",
      headline: "Now · Senior Software Engineer",
      body: "Clinical AI experience",
    },
    wordmarkUntil: 0.75,
    staticAt: 1,
    Props: KnowtexProps,
  },
];
