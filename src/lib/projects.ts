// The project cards on the homepage and /projects.
export type ProjectLink = { href: string; label: string };

export type Project = {
  href: string;
  tag: string;
  solid?: boolean;
  name: string;
  summary?: string;
  /** Shown on the back of the card. Projects without one show their description there. */
  question?: string;
  description: string;
  cta: string;
  notes: ProjectLink;
  related?: ProjectLink & { lead: string };
};

const X2SQL: Project = {
  href: "/projects/textToSql",
  tag: "PRODUCTION",
  solid: true,
  name: "X2SQL",
  summary: "Text to SQL · validated · streamed",
  question: "Can text-to-SQL be safe enough for real users?",
  description:
    "Ask the Chinook music store database questions in plain English. LLM generates the SQL, a hardened pipeline executes it read-only with a self-correct retry loop, and every answer shows the SQL and rows behind it.",
  cta: "Try it live →",
  notes: { href: "/blog", label: "Engineering notes →" },
  related: { lead: "See also:", href: "/projects/cisco-agent-tracking", label: "Cisco agent tracking" },
};

const ENVELOPE: Project = {
  href: "/projects/envelope",
  tag: "EXPERIMENT · PHASE 2",
  name: "Envelope",
  summary: "Policy-driven human-in-the-loop",
  question: "What if policy, not a human, handled the routine calls?",
  description:
    "Document extraction pipeline for invoices and property records. Every extracted field carries a confidence score, and mismatched line-item totals or missing required fields get flagged instead of silently passed through.",
  cta: "See both phases →",
  notes: { href: "/blog/envelope-overview", label: "Engineering notes →" },
};

const RAG_VS_OKF: Project = {
  href: "/rag-vs-okf",
  tag: "EXPERIMENT",
  name: "RAG vs OKF",
  summary: "Northwind corpus · 4 test scenarios",
  question: "Is vector search always the right retrieval?",
  description:
    "Compares two ways of answering questions over the same company documents: retrieval by chunks versus retrieval by curated concepts.",
  cta: "See the race →",
  notes: { href: "/blog/rag-vs-okf-hub", label: "Engineering blog →" },
};

const WORLD_MODELS: Project = {
  href: "/beyond-llms",
  tag: "RESEARCH",
  name: "World Models",
  summary: "JEPA · live model calls",
  question: "What comes after LLMs?",
  description:
    "An interactive illustration of world models, and why predicting the next word is not the same as understanding the world.",
  cta: "Explore →",
  notes: { href: "/blog/words-are-not-the-world", label: "Engineering blog →" },
};

const PHASE_TWO: Project = {
  href: "/projects/envelope/phase-two",
  tag: "AI SYSTEMS · IN-BUILD PROTOTYPE",
  name: "Envelope · Phase two - boundary proposals",
  description:
    "An interactive design piece exploring how an AI could propose new policy boundaries by watching the corrections a human already makes - without turning approval into a rubber stamp. Not a shipped system: an in-build prototype of the interaction, not the pipeline.",
  cta: "Open demo →",
  notes: { href: "/blog/envelope-phase-two", label: "Engineering notes →" },
  related: { lead: "Builds on:", href: "/projects/envelope", label: "Envelope" },
};

const CISCO: Project = {
  href: "/projects/cisco-agent-tracking",
  tag: "CISCO THOUSANDEYES · 2023",
  name: "Real-Time Agent Tracking",
  description:
    "A real-time agent-tracking UI (TypeScript + Spring Boot) and a gRPC API for proxy assignments, built by hand at Cisco, before AI was part of how I built anything.",
  cta: "Read more →",
  notes: { href: "/blog/cisco-agent-tracking", label: "Engineering notes →" },
  related: { lead: "See also:", href: "/projects/textToSql", label: "Text-to-SQL" },
};

/** "Built to find out" on the homepage. */
export const FEATURED_PROJECTS = [X2SQL, ENVELOPE, RAG_VS_OKF, WORLD_MODELS];

export const ALL_PROJECTS = [WORLD_MODELS, RAG_VS_OKF, ENVELOPE, PHASE_TWO, X2SQL, CISCO];
