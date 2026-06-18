import Hero from "../components/home/Hero";
import FeaturedProject from "../components/home/FeaturedProject";

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      <Hero />
      <FeaturedProject />
    </main>
  );
}
