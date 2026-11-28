import Link from "next/link";
import ConfigurePanel from "../components/ConfigurePanel";

export default function EnvelopeConfigurePage() {
  return (
    <main className="max-w-[760px] mx-auto px-6 py-16">
      <p className="eyebrow-text mb-4">
        <Link href="/projects/envelope" className="hover:underline">
          / PROJECTS / ENVELOPE
        </Link>{" "}
        / CONFIGURE
      </p>
      <h1
        className="type-h2 weight-medium mb-2"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Configure validation policy
      </h1>
      <p className="type-small lead-body mb-10" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
        Choose exactly two rules to enforce. Activating a third swaps out whichever
        rule has been active longest.
      </p>

      <ConfigurePanel />
    </main>
  );
}
