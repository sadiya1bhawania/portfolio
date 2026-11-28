import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPostBySlug } from "@/src/lib/blog";
import PageHeader from "../../../components/page/PageHeader";
import ReadingProgress from "../../../components/page/ReadingProgress";
import listing from "../../../components/page/Listing.module.css";
import styles from "./Post.module.css";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

const mdxComponents = {
  // Wide tables scroll inside the reading column.
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className={styles.table}>
      <table {...props} />
    </div>
  ),
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="flex flex-col flex-1 min-w-0">
      <ReadingProgress targetId="post" />
      <PageHeader eyebrow="/ blog" title={post.title} compact>
        <p className={styles.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className={listing.tags}>
          {post.tags.map((tag) => (
            <span key={tag} className={listing.tag}>
              {tag}
            </span>
          ))}
        </div>
      </PageHeader>

      <div className={styles.body}>
        <Link href="/blog" className={styles.back}>
          ← Back to blog
        </Link>

        <article id="post" className={styles.prose}>
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </article>
      </div>
    </main>
  );
}
