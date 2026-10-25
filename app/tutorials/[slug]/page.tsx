import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  getTutorialBySlug,
  getTutorialSlugs,
  getAdjacentTutorials,
  extractHeadings,
} from "@/lib/tutorials";
import { Navbar, Footer } from "@/components/landing";
import { TableOfContents } from "@/components/tutorials/table-of-contents";
import {
  Callout,
  Checklist,
  ChecklistItem,
  Step,
  CodeBlock,
  Highlight,
} from "@/components/tutorials/mdx-components";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getTutorialSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) return {};

  return {
    title: `${tutorial.title} — ugc.community`,
    description: tutorial.description,
    alternates: {
      canonical: `/tutorials/${slug}`,
      ...(tutorial.contentFormat === "markdown" ? { types: { "text/markdown": `/tutorials/${slug}/content.md` } } : {}),
    },
    openGraph: {
      type: "article",
      title: tutorial.title,
      description: tutorial.description,
      url: `/tutorials/${slug}`,
      publishedTime: tutorial.publishedAt,
      modifiedTime: tutorial.updatedAt,
      images: ["/social-preview.png?v=brand-icon"],
    },
    twitter: {
      card: "summary_large_image",
      title: tutorial.title,
      description: tutorial.description,
      images: ["/social-preview.png?v=brand-icon"],
    },
  };
}

/* Custom MDX components mapped to our design system */
const mdxComponents = {
  Callout,
  Checklist,
  ChecklistItem,
  Step,
  CodeBlock,
  Highlight,

  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = typeof children === "string" ? children : String(children);
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    return (
      <h2
        id={id}
        className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mt-12 mb-4 pt-6 border-t border-warm-gray-100 first:mt-0 first:pt-0 first:border-0 scroll-mt-24"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = typeof children === "string" ? children : String(children);
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    return (
      <h3
        id={id}
        className="text-lg font-semibold text-warm-gray-900 mt-8 mb-3 font-[family-name:var(--font-body)] scroll-mt-24"
        {...props}
      >
        {children}
      </h3>
    );
  },
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-warm-gray-600 leading-relaxed mb-4" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="space-y-2 mb-4 ml-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="space-y-2 mb-4 ml-1 list-decimal list-inside" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className="text-warm-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-coral before:font-bold [ol>&]:before:content-none [ol>&]:pl-0"
      {...props}
    >
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-warm-gray-800" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-warm-gray-600" {...props}>
      {children}
    </em>
  ),
  blockquote: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-3 border-coral/40 pl-4 my-6 text-warm-gray-500 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-warm-gray-200" />,
  a: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    // Rewrite dashboard tutorial links to public paths
    const resolvedHref = href?.replace(
      /^\/dashboard\/tutorials\//,
      "/tutorials/"
    );
    return (
      <a
        href={resolvedHref}
        className="text-coral hover:text-coral-dark underline underline-offset-2 transition-colors"
        target={resolvedHref?.startsWith("http") ? "_blank" : undefined}
        rel={resolvedHref?.startsWith("http") ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto rounded-[--radius-md] border border-warm-gray-200">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-warm-gray-50" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="text-left px-4 py-3 text-xs font-semibold text-warm-gray-500 uppercase tracking-wider border-b border-warm-gray-200"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="px-4 py-3 text-warm-gray-600 border-b border-warm-gray-100"
      {...props}
    >
      {children}
    </td>
  ),
};

export default async function TutorialPage({ params }: PageProps) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) notFound();

  const headings = extractHeadings(tutorial.content);
  const { prev, next } = getAdjacentTutorials(slug);
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `https://ugc.community/tutorials/${slug}#article`,
    headline: tutorial.title,
    description: tutorial.description,
    mainEntityOfPage: `https://ugc.community/tutorials/${slug}`,
    datePublished: tutorial.publishedAt,
    dateModified: tutorial.updatedAt,
    ...(tutorial.publishedAt ? { author: { "@type": "Organization", name: "ugc.community", url: "https://ugc.community/about" } } : {}),
    publisher: { "@id": "https://ugc.community/#organization" },
    image: "https://ugc.community/social-preview.png?v=brand-icon",
  };

  return (
    <div className="relative overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }} />
      <Navbar />

      <section className="pt-32 pb-16 sm:pt-36 sm:pb-20">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {/* Back link */}
            <Link
              href="/tutorials"
              className="inline-flex items-center gap-2 text-warm-gray-500 hover:text-warm-gray-900 transition-colors mb-6 text-sm"
            >
              <ArrowLeft size={16} />
              All Tutorials
            </Link>

            <div className="flex gap-10">
              {/* Main content */}
              <article className="flex-1 min-w-0">
                {/* Header */}
                <header className="mb-8 pb-8 border-b border-warm-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium text-coral bg-coral/10 px-2.5 py-1 rounded-full">
                      {tutorial.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-warm-gray-400">
                      <Clock size={12} />
                      {tutorial.estimatedReadTime}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-3">
                    {tutorial.title}
                  </h1>
                  <p className="text-lg text-warm-gray-500">
                    {tutorial.description}
                  </p>
                  {tutorial.contentFormat === "markdown" && <p className="mt-4 text-sm text-warm-gray-600">
                    {tutorial.publishedAt && <><Link href="/about" className="underline underline-offset-2">By ugc.community</Link>{" · "}<time dateTime={tutorial.updatedAt || tutorial.publishedAt}>{tutorial.updatedAt ? "Updated" : "Published"} {tutorial.updatedAt || tutorial.publishedAt}</time>{" · "}</>}
                    <a href={`/tutorials/${slug}/content.md`} className="underline underline-offset-2">Read as Markdown</a>
                  </p>}
                </header>

                {/* MDX content */}
                <div className="tutorial-prose">
                  <MDXRemote
                    source={tutorial.content}
                    components={mdxComponents}
                    options={{
                      mdxOptions: {
                        remarkPlugins: [remarkGfm],
                      },
                    }}
                  />
                </div>

                {/* Prev / Next navigation */}
                <nav className="mt-12 pt-8 border-t border-warm-gray-200 grid grid-cols-2 gap-4">
                  {prev ? (
                    <Link
                      href={`/tutorials/${prev.slug}`}
                      className="group flex flex-col p-4 rounded-[--radius-lg] border border-warm-gray-200 hover:border-warm-gray-300 hover:shadow-sm transition-all"
                    >
                      <span className="text-xs text-warm-gray-400 flex items-center gap-1 mb-1">
                        <ChevronLeft size={12} />
                        Previous
                      </span>
                      <span className="text-sm font-medium text-warm-gray-700 group-hover:text-coral transition-colors">
                        {prev.title}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}
                  {next ? (
                    <Link
                      href={`/tutorials/${next.slug}`}
                      className="group flex flex-col items-end text-right p-4 rounded-[--radius-lg] border border-warm-gray-200 hover:border-warm-gray-300 hover:shadow-sm transition-all"
                    >
                      <span className="text-xs text-warm-gray-400 flex items-center gap-1 mb-1">
                        Next
                        <ChevronRight size={12} />
                      </span>
                      <span className="text-sm font-medium text-warm-gray-700 group-hover:text-coral transition-colors">
                        {next.title}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}
                </nav>
              </article>

              {/* Table of contents sidebar (desktop) */}
              <aside className="hidden lg:block w-56 flex-shrink-0">
                <div className="sticky top-32">
                  <TableOfContents headings={headings} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
