import Link from "next/link";

export default function ProjectsPage() {
  return (
    <main className="max-w-[1100px] mx-auto px-6 py-16">
      <p
        className="text-[12px] tracking-wide mb-4"
        style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
      >
        / PROJECTS
      </p>
      <h1
        className="text-[clamp(28px,5vw,40px)] font-medium mb-10"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Things I&apos;ve built
      </h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <article
          className="rounded-lg border p-6 flex flex-col"
          style={{ borderColor: "var(--border)", background: "#fff" }}
        >
          <p
            className="text-[11px] uppercase tracking-wide mb-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            AI Systems
          </p>
          <h2
            className="text-xl font-medium mb-3"
            style={{ fontFamily: "var(--font-head)" }}
          >
            Words are not the world
          </h2>
          <p
            className="text-sm leading-relaxed mb-5 flex-1"
            style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
          >
            An interactive illustration of world models, and why predicting the
            next word is not the same as understanding the world.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/beyond-llms"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
            >
              Open demo →
            </Link>
            <Link
              href="/blog/words-are-not-the-world"
              className="text-sm hover:underline"
              style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
            >
              Engineering blog →
            </Link>
          </div>
        </article>

        <article
          className="rounded-lg border p-6 flex flex-col"
          style={{ borderColor: "var(--border)", background: "#fff" }}
        >
          <p
            className="text-[11px] uppercase tracking-wide mb-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            AI Systems
          </p>
          <h2
            className="text-xl font-medium mb-3"
            style={{ fontFamily: "var(--font-head)" }}
          >
            RAG vs OKF
          </h2>
          <p
            className="text-sm leading-relaxed mb-5 flex-1"
            style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
          >
            Compares two ways of answering questions over the same company documents:
            retrieval by chunks versus retrieval by curated concepts.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/rag-vs-okf"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
            >
              Open demo →
            </Link>
            <Link
              href="/blog/rag-vs-okf-hub"
              className="text-sm hover:underline"
              style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
            >
              Engineering blog →
            </Link>
          </div>
        </article>

        <article
          className="rounded-lg border p-6 flex flex-col"
          style={{ borderColor: "var(--border)", background: "#fff" }}
        >
          <p
            className="text-[11px] uppercase tracking-wide mb-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            AI Systems
          </p>
          <h2
            className="text-xl font-medium mb-3"
            style={{ fontFamily: "var(--font-head)" }}
          >
            Envelope
          </h2>
          <p
            className="text-sm leading-relaxed mb-5 flex-1"
            style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
          >
            Document extraction pipeline for invoices and property records. Every
            extracted field carries a confidence score, and mismatched line-item
            totals or missing required fields get flagged instead of silently passed
            through.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/projects/envelope"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
            >
              Open project →
            </Link>
            <Link
              href="/blog/envelope-overview"
              className="text-sm hover:underline"
              style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
            >
              Engineering notes →
            </Link>
          </div>
        </article>

        <article
          className="rounded-lg border p-6 flex flex-col"
          style={{ borderColor: "var(--border)", background: "#fff" }}
        >
          <p
            className="text-[11px] uppercase tracking-wide mb-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            AI Systems · In-build prototype
          </p>
          <h2
            className="text-xl font-medium mb-3"
            style={{ fontFamily: "var(--font-head)" }}
          >
            Envelope · Phase two - boundary proposals
          </h2>
          <p
            className="text-sm leading-relaxed mb-5 flex-1"
            style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
          >
            An interactive design piece exploring how an AI could propose new policy
            boundaries by watching the corrections a human already makes - without
            turning approval into a rubber stamp. Not a shipped system: an in-build
            prototype of the interaction, not the pipeline.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/projects/envelope/phase-two"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
            >
              Open demo →
            </Link>
            <Link
              href="/blog/envelope-phase-two"
              className="text-sm hover:underline"
              style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
            >
              Engineering notes →
            </Link>
          </div>
          <p
            className="text-[11px] mt-4"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            Builds on:{" "}
            <Link href="/projects/envelope" className="underline" style={{ color: "var(--copper-dark)" }}>
              Envelope
            </Link>{" "}
            , the extraction &amp; confidence-scoring pipeline this proposes boundaries for.
          </p>
        </article>

        <article
          className="rounded-lg border p-6 flex flex-col"
          style={{ borderColor: "var(--border)", background: "#fff" }}
        >
          <p
            className="text-[11px] uppercase tracking-wide mb-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            AI Systems
          </p>
          <h2
            className="text-xl font-medium mb-3"
            style={{ fontFamily: "var(--font-head)" }}
          >
            Text-to-SQL
          </h2>
          <p
            className="text-sm leading-relaxed mb-5 flex-1"
            style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
          >
            Ask the Chinook music store database questions in plain English. LLM
            generates the SQL, a hardened pipeline executes it read-only with a
            self-correct retry loop, and every answer shows the SQL and rows behind it.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/projects/textToSql"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
            >
              Open demo →
            </Link>
            <Link
              href="/blog"
              className="text-sm hover:underline"
              style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
            >
              Engineering notes →
            </Link>
          </div>
          <p
            className="text-[11px] mt-4"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            See also:{" "}
            <Link href="/projects/cisco-agent-tracking" className="underline" style={{ color: "var(--copper-dark)" }}>
              Cisco agent tracking
            </Link>{" "}
            , the same real-time-observability instinct, by hand, before AI.
          </p>
        </article>

        <article
          className="rounded-lg border p-6 flex flex-col"
          style={{ borderColor: "var(--border)", background: "#fff" }}
        >
          <p
            className="text-[11px] uppercase tracking-wide mb-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            Cisco ThousandEyes · 2023
          </p>
          <h2
            className="text-xl font-medium mb-3"
            style={{ fontFamily: "var(--font-head)" }}
          >
            Real-Time Agent Tracking
          </h2>
          <p
            className="text-sm leading-relaxed mb-5 flex-1"
            style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
          >
            A real-time agent-tracking UI (TypeScript + Spring Boot) and a gRPC API
            for proxy assignments, built by hand at Cisco, before AI was part of
            how I built anything.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/projects/cisco-agent-tracking"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: "var(--copper)", fontFamily: "var(--font-body)" }}
            >
              Read more →
            </Link>
            <Link
              href="/blog/cisco-agent-tracking"
              className="text-sm hover:underline"
              style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
            >
              Engineering notes →
            </Link>
          </div>
          <p
            className="text-[11px] mt-4"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            See also:{" "}
            <Link href="/projects/textToSql" className="underline" style={{ color: "var(--copper-dark)" }}>
              Text-to-SQL
            </Link>{" "}
            , the same instinct, years later, observing an AI pipeline instead.
          </p>
        </article>


      </div>
    </main>
  );
}
