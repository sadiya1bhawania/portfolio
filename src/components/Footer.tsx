"use client";

import { usePathname } from "next/navigation";
import HomeFooter from "./home/HomeFooter";
import Reveal from "./motion/Reveal";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/projects/envelope/demo")) return null;

  // Keyed so the reveal is set up again for each page's height.
  return (
    <Reveal key={pathname}>
      <HomeFooter />
    </Reveal>
  );
}
