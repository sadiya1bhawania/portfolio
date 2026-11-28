import Hero from "../components/home/Hero";
import GenUIDemo from "../components/home/GenUIDemo";
import WorkCards from "../components/home/WorkCards";
import LabLog from "../components/home/LabLog";
import Reveal from "../components/motion/Reveal";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 bg-[var(--paper)] text-[var(--ink)]">
      <Hero />
      <Reveal>
        <GenUIDemo />
      </Reveal>
      <Reveal>
        <WorkCards />
      </Reveal>
      <Reveal>
        <LabLog />
      </Reveal>
    </main>
  );
}
