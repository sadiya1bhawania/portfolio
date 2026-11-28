// In-memory session state by design: this is a portfolio demo, not a service
// with users, so history resets on server restart rather than persisting.

import Link from "next/link";
import { getHistory } from "../lib/runHistory";
import { getCounts } from "../lib/serverPolicyState";
import { LedgerRow, SessionSummary } from "../components/LedgerRow";

export const dynamic = "force-dynamic";

export default function EnvelopeLogPage() {
  const history = getHistory();
  const counts = getCounts();

  return (
    <main className="max-w-[820px] mx-auto px-6 py-16">
      <p className="eyebrow-text mb-4">
        <Link href="/projects/envelope" className="hover:underline">
          / PROJECTS / ENVELOPE
        </Link>{" "}
        / LOG
      </p>
      <h1
        className="type-h2 weight-medium mb-2"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Run log
      </h1>
      <p className="type-small lead-body mb-8" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
        Every document run through the pipeline this session, most recent first -
        which two rules were active, whether each passed, and what happened as a result.
      </p>

      <div className="mb-8">
        <SessionSummary counts={counts} />
      </div>

      {history.length === 0 ? (
        <p className="type-small" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
          No runs yet. Activate a policy and process a document to see it here.{" "}
          <Link href="/projects/envelope/configure" className="underline" style={{ color: "var(--copper-dark)" }}>
            Configure a policy →
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <LedgerRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </main>
  );
}
