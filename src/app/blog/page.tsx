import Link from "next/link";
import { getAllPosts } from "@/src/lib/blog";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-16">
      <p
        className="text-[12px] tracking-wide mb-4"
        style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
      >
        / BLOG
      </p>
      <h1
        className="text-[clamp(28px,5vw,40px)] font-medium mb-10"
        style={{ fontFamily: "var(--font-head)" }}
      >
        Engineering notes
      </h1>

      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-lg border p-6"
            style={{ borderColor: "var(--border)", background: "#fff" }}
          >
            <p
              className="text-[11px] uppercase tracking-wide mb-2"
              style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
            >
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h2
              className="text-xl font-medium mb-3"
              style={{ fontFamily: "var(--font-head)" }}
            >
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
            >
              {post.excerpt}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-1 rounded-md"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--copper-dark)",
                    background: "var(--copper-light)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
