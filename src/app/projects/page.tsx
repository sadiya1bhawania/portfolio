import PageHeader from "../../components/page/PageHeader";
import ProjectGrid from "../../components/page/ProjectGrid";
import styles from "../../components/page/Listing.module.css";

export default function ProjectsPage() {
  return (
    <main className="flex flex-col flex-1">
      <PageHeader eyebrow="/ projects" title="Things I've built" accent="built" />
      <div className={styles.body}>
        <ProjectGrid />
      </div>
    </main>
  );
}
