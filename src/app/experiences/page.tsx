import AboutHero from "../../components/experiences/AboutHero";
import TaglineBand from "../../components/experiences/TaglineBand";
import Facets from "../../components/experiences/Facets";
import ExperienceTimeline from "../../components/experiences/ExperienceTimeline";

export default function ExperiencesPage() {
  return (
    <main className="flex flex-col flex-1">
      <AboutHero />
      <TaglineBand />
      <Facets />
      <ExperienceTimeline />
    </main>
  );
}
