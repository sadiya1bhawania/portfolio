"use client";

import { useState } from "react";
import styles from "./ExperienceTimeline.module.css";

type Milestone = {
  id: string;
  label: string;
  sub: string;
  heading: string;
  range: string;
  tags: string[];
  bullets: string[];
};

const MILESTONES: Milestone[] = [
  {
    id: "avalara",
    label: "Avalara",
    sub: "2018–20",
    heading: "Software Engineer · Avalara",
    range: "Sep 2018 – Dec 2020 · 2 yrs 4 mos",
    tags: [".NET", "MySQL", "Entity Framework"],
    bullets: [
      "Built an automated tax-form filing system spanning 250+ forms, cutting document creation from 2 weeks to 1 day.",
      "Merged 8 overlapping applications into 3, reducing customer dissatisfaction ~30%.",
      "Automated GST filing and secure data APIs — 98% less manual checking, 99% uptime.",
    ],
  },
  {
    id: "neu",
    label: "Northeastern",
    sub: "M.S. · 21–22",
    heading: "M.S. Computer Science · Northeastern University",
    range: "Jan 2021 – Dec 2022",
    tags: ["Graduate TA", "Instructional Assistant"],
    bullets: [
      "Master of Science in Computer Science.",
      "Graduate Teaching Assistant and Instructional Assistant alongside coursework.",
    ],
  },
  {
    id: "cisco",
    label: "Cisco",
    sub: "intern · 23",
    heading: "SWE Intern · Cisco (ThousandEyes)",
    range: "May 2023 – Sep 2023 · internship",
    tags: ["TypeScript", "Spring Boot", "gRPC"],
    bullets: [
      "Built a real-time agent-tracking UI, removing manual SQL querying for status checks.",
      "Delivered a gRPC API giving users real-time visibility and control over proxy assignments.",
      "Wrote integration tests at ~95% coverage.",
    ],
  },
  {
    id: "homepulse",
    label: "HomePulse",
    sub: "2024–25",
    heading: "Sr. Software Engineer · HomePulse.ai",
    range: "Feb 2024 – Sep 2025 · 1 yr 8 mos",
    tags: ["React", "Node", "MongoDB", "AWS", "Docker"],
    bullets: [
      "Built a master vendor table and a suite of vendor marketplaces — ~150 vendors across 600 users.",
      "Automated HTML/PDF parsing with TensorLake, reducing manual data entry ~90%.",
      "Led growth engineering: 40% faster onboarding, 30% lower drop-off.",
    ],
  },
  {
    id: "elb",
    label: "ELB US",
    sub: "2025–26",
    heading: "Sr. Software Engineer · ELB US",
    range: "Sep 2025 – May 2026 · most recent",
    tags: ["Agentic AI", "Text-to-SQL", "RAG", "Docker", "Redis"],
    bullets: [
      "Architected an agentic AI Q&A system routing between a text-to-SQL pipeline and document RAG for 150 employees.",
      "Designed human-approval gates that validate generated SQL before it reaches the database.",
      "Added query-complexity routing and Redis caching to cut inference cost and latency.",
    ],
  },
  {
    id: "next",
    label: "Next",
    sub: "let's talk",
    heading: "Open to what's next",
    range: "2026 –",
    tags: ["AI · Full-Stack"],
    bullets: [
      "Looking for my next role on a team building seriously with AI — startup or scaled.",
      "Recruiters and founders, let's talk.",
    ],
  },
];

export default function ExperienceTimeline() {
  const [pinnedId, setPinnedId] = useState("elb");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId ?? pinnedId;
  const active = MILESTONES.find((m) => m.id === activeId) ?? MILESTONES[4];

  return (
    <section className={styles.section}>
      <p className={styles.kicker}>/ THE PATH SO FAR</p>
      <p className={styles.hint}>Hover or tap a milestone to see the detail.</p>

      <div className={styles.trackWrap}>
        <div className={styles.track}>
          {MILESTONES.map((m) => {
            const isActive = m.id === activeId;
            return (
              <button
                key={m.id}
                type="button"
                className={styles.milestone}
                aria-label={`${m.heading}, ${m.range}`}
                aria-pressed={m.id === pinnedId}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(m.id)}
                onBlur={() => setHoveredId(null)}
                onClick={() => {
                  setPinnedId(m.id);
                  setHoveredId(m.id);
                }}
              >
                <span
                  className={`${styles.dot} ${isActive ? styles.dotActive : ""}`}
                  aria-hidden="true"
                />
                <span className={`${styles.label} ${isActive ? styles.labelActive : ""}`}>
                  {m.label}
                </span>
                <span className={styles.sub}>{m.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.role}>{active.heading}</h3>
          <span className={styles.range}>{active.range}</span>
        </div>
        <div className={styles.tags}>
          {active.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <ul className={styles.bullets}>
          {active.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>

      <a href="/resume.pdf" className={styles.resumeLink}>
        View résumé ↗
      </a>
    </section>
  );
}
