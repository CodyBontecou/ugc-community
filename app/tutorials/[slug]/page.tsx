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
import { mdxComponents } from "@/components/tutorials/content-components";
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
                  {tutorial.html ? <div dangerouslySetInnerHTML={{ __html: tutorial.html }} /> : <MDXRemote
                    source={tutorial.content}
                    components={mdxComponents}
                    options={{
                      mdxOptions: {
                        remarkPlugins: [remarkGfm],
                      },
                    }}
                  />}
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
