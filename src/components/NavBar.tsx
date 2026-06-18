"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/experiences", label: "Experiences" },
  { href: "/blog", label: "Blog" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <div>
          <div
            className="text-[18px] font-bold leading-tight"
            style={{ fontFamily: "var(--font-head)" }}
          >
            Sadiya Bhawania
          </div>
          <div
            className="text-[11px] text-[var(--muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Full-Stack · AI Systems · LLMs
          </div>
        </div>

        <nav
          className="hidden sm:flex items-center gap-6 text-[12px]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`pb-1 border-b-2 ${
                  active
                    ? "text-[var(--copper)] border-[var(--copper)]"
                    : "text-[var(--ink)] border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="sm:hidden text-[12px]"
          style={{ fontFamily: "var(--font-mono)" }}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          className="sm:hidden flex flex-col gap-3 px-4 pb-4 text-[12px] border-t border-[var(--border)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`inline-block w-fit pb-1 border-b-2 ${
                  active
                    ? "text-[var(--copper)] border-[var(--copper)]"
                    : "text-[var(--ink)] border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
