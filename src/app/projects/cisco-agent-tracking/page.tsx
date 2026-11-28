import Link from "next/link";

export default function CiscoAgentTrackingPage() {
  return (
    <main className="max-w-[800px] mx-auto px-6 py-16">
      <Link
        href="/projects"
        className="type-fine"
        style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
      >
        ← Back to projects
      </Link>

      <p
        className="type-label uppercase track-fine mt-6 mb-2"
        style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
      >
        Cisco ThousandEyes · SWE Intern · May 2023 – Sep 2023
      </p>
      <h1
        className="type-h1 weight-medium mb-4"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Real-Time Agent Tracking & Proxy gRPC API
      </h1>

      <div className="flex items-center gap-2 flex-wrap mb-8">
        {["TypeScript", "Spring Boot", "gRPC"].map((tag) => (
          <span
            key={tag}
            className="type-label px-2 py-1 rounded-md"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--copper-dark)",
              background: "var(--copper-light)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        className="type-small lead-body space-y-4"
        style={{ fontFamily: "var(--font-body)", color: "var(--ink)" }}
      >
        <p>
          During my internship on ThousandEyes at Cisco, I built a real-time
          agent-tracking UI in TypeScript backed by a Spring Boot service, removing
          the need for manual SQL querying to check agent status. Alongside it, I
          delivered a gRPC API that gave users real-time visibility and control over
          proxy assignments directly, instead of going through the database.
        </p>
        <p>
          I wrote integration tests at roughly 95% coverage for this work, since at
          intern scale the bar for not quietly breaking someone else&apos;s workflow
          was still high.
        </p>
        <p
          className="rounded-lg border p-4 type-small"
          style={{ borderColor: "var(--border)", background: "var(--copper-light)" }}
        >
          This was hand-built, pre-AI-assisted engineering, no agent frameworks, no
          LLM scaffolding. I wrote up the full story, including the throughline to
          how that same instinct shows up in my text-to-SQL pipeline&apos;s live
          visualization, in{" "}
          <Link href="/blog/cisco-agent-tracking" className="underline" style={{ color: "var(--copper-dark)" }}>
            this post
          </Link>
          .
        </p>
      </div>

      <div
        className="mt-10 rounded-lg border p-5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p
          className="type-label uppercase track-fine mb-2"
          style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
        >
          Related project
        </p>
        <p className="type-small mb-3" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
          Real-time observability, by hand, then with AI. My text-to-SQL pipeline
          carries the same instinct forward, except now it&apos;s an AI system
          observing itself, live, stage by stage.
        </p>
        <Link
          href="/projects/textToSql"
          className="type-small weight-medium"
          style={{ fontFamily: "var(--font-mono)", color: "var(--copper)" }}
        >
          Text-to-SQL →
        </Link>
      </div>
    </main>
  );
}
