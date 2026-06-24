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
            Text-to-SQL
          </h2>
          <p
            className="text-sm leading-relaxed mb-5 flex-1"
            style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
          >
            Ask the Chinook music store database questions in plain English. Claude
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
            — the same real-time-observability instinct, by hand, before AI.
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
            for proxy assignments, built by hand at Cisco — before AI was part of
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
            — the same instinct, years later, observing an AI pipeline instead.
          </p>
        </article>
      </div>
    </main>
  );
}
