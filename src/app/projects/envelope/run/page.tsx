import Link from "next/link";
import RunPanel from "../components/RunPanel";

export default function EnvelopeRunPage() {
  return (
    <main className="max-w-[820px] mx-auto px-6 py-16">
      <p className="eyebrow-text mb-4">
        <Link href="/projects/envelope" className="hover:underline">
          / PROJECTS / ENVELOPE
        </Link>{" "}
        / RUN ·{" "}
        <Link href="/projects/envelope/log" className="hover:underline">
          view log →
        </Link>
      </p>
      <h1
        className="type-h2 weight-medium mb-2"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Run the pipeline
      </h1>
      <p className="type-small lead-body mb-10" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
        Drop a document or pick a sample, then run it through extract → load policy →
        evaluate → decide → act → log. Extract and act&apos;s email compose call Gemini;
        load policy, evaluate, and decide are deterministic code. Log is still a stub.
      </p>

      <RunPanel />
    </main>
  );
}
