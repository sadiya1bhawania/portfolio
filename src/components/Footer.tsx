import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="w-full py-16 px-4 flex flex-col items-center text-center gap-4"
      style={{ background: "var(--ink)" }}
    >
      <h2
        className="text-white text-2xl font-bold"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Let&apos;s build something reliable.
      </h2>
      <p
        className="max-w-md text-[var(--muted)] text-sm"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Take a look at what I&apos;ve built, then say hi — recruiters,
        founders, anyone curious.
      </p>
      <Link
        href="/projects"
        className="mt-2 inline-block px-5 py-3 rounded text-white text-sm font-medium"
        style={{ background: "var(--copper)", fontFamily: "var(--font-mono)" }}
      >
        Explore the projects →
      </Link>
    </footer>
  );
}
