import Link from "next/link";
import ConfigurePanel from "../components/ConfigurePanel";

export default function EnvelopeConfigurePage() {
  return (
    <main className="max-w-[760px] mx-auto px-6 py-16">
      <p
        className="text-[12px] tracking-wide mb-4"
        style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
      >
        <Link href="/projects/envelope" className="hover:underline">
          / PROJECTS / ENVELOPE
        </Link>{" "}
        / CONFIGURE
      </p>
      <h1
        className="text-[clamp(24px,4vw,34px)] font-medium mb-2"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Configure validation policy
      </h1>
      <p className="text-sm leading-relaxed mb-10" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
        Choose exactly two rules to enforce. Activating a third swaps out whichever
        rule has been active longest.
      </p>

      <ConfigurePanel />
    </main>
  );
}
