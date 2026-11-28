import Link from "next/link";
import { getAllPosts } from "@/src/lib/blog";
import Reveal from "../../components/motion/Reveal";
import PageHeader from "../../components/page/PageHeader";
import styles from "../../components/page/Listing.module.css";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="flex flex-col flex-1">
      <PageHeader eyebrow="/ blog" title="Engineering notes" accent="notes" />

      <div className={styles.body}>
        <Reveal stagger={0.06} className={styles.rows}>
          {posts.map((post) => (
            <article key={post.slug} className={styles.row}>
              <p className={styles.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h2 className={styles.rowTitle}>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className={styles.excerpt}>{post.excerpt}</p>
              <div className={styles.tags}>
                {post.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </main>
  );
}
