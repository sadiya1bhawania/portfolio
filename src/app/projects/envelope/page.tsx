// TODO(sadie): confirm whether this ships as its own route or gets a Products-page entry too.

import Link from "next/link";

export default function EnvelopePage() {
  return (
    <main className="max-w-[900px] mx-auto px-6 py-16">
      <p
        className="text-[12px] tracking-wide mb-4"
        style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
      >
        / PROJECTS / ENVELOPE
      </p>
      <h1
        className="text-[clamp(28px,5vw,40px)] font-medium mb-4"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Envelope
      </h1>
      <p
        className="text-sm leading-relaxed mb-8"
        style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
      >
        Document extraction &amp; confidence-scoring pipeline: AI infers field values,
        deterministic code decides what happens next. Configure a policy, run a document
        through it, and see the session log - all in one walkthrough.
      </p>

      <Link
        href="/projects/envelope/demo"
        className="inline-flex items-center px-5 py-3 rounded-md text-sm font-medium text-white mb-8"
        style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
      >
        Open demo →
      </Link>

      <p
        className="text-[11px] uppercase tracking-wide mb-3"
        style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
      >
        Or jump directly to a step
      </p>
      <div className="flex gap-4">
        <Link
          href="/projects/envelope/configure"
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
          style={{ border: "1px solid var(--copper)", color: "var(--copper-dark)", fontFamily: "var(--font-body)" }}
        >
          Configure →
        </Link>
        <Link
          href="/projects/envelope/run"
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
          style={{ border: "1px solid var(--copper)", color: "var(--copper-dark)", fontFamily: "var(--font-body)" }}
        >
          Run →
        </Link>
        <Link
          href="/projects/envelope/log"
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
          style={{ border: "1px solid var(--copper)", color: "var(--copper-dark)", fontFamily: "var(--font-body)" }}
        >
          Log →
        </Link>
      </div>
    </main>
  );
}
