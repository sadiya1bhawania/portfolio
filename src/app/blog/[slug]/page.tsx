import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPostBySlug } from "@/src/lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-2xl font-medium mt-10 mb-4"
      style={{ fontFamily: "var(--font-head)" }}
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-lg font-medium mt-8 mb-3"
      style={{ fontFamily: "var(--font-head)" }}
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="text-[15px] leading-relaxed mb-4"
      style={{ fontFamily: "var(--font-body)", color: "var(--ink)" }}
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 mb-4 space-y-1 text-[15px]" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1 text-[15px]" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="underline"
      style={{ color: "var(--copper-dark)" }}
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="px-1.5 py-0.5 rounded text-[13px]"
      style={{
        fontFamily: "var(--font-mono)",
        background: "var(--copper-light)",
        color: "var(--copper-dark)",
      }}
      {...props}
    />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6">
      <table
        className="w-full text-[13px] border-collapse"
        style={{ borderColor: "var(--border)" }}
        {...props}
      />
    </div>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border px-3 py-2 text-left"
      style={{
        borderColor: "var(--border)",
        background: "var(--copper-light)",
        fontFamily: "var(--font-mono)",
      }}
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border px-3 py-2"
      style={{ borderColor: "var(--border)" }}
      {...props}
    />
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
    <main className="max-w-[800px] mx-auto px-6 py-16">
      <Link
        href="/blog"
        className="text-[12px]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
      >
        ← Back to blog
      </Link>

      <p
        className="text-[11px] uppercase tracking-wide mt-6 mb-2"
        style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
      >
        {new Date(post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <h1
        className="text-[clamp(26px,5vw,38px)] font-medium mb-4"
        style={{ fontFamily: "var(--font-head)" }}
      >
        {post.title}
      </h1>

      <div className="flex items-center gap-2 flex-wrap mb-10">
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

      <article>
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </article>
    </main>
  );
}
