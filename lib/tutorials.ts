import bundledTutorials from "@/content/tutorials.generated.json";

export interface TutorialFrontmatter {
  title: string;
  description: string;
  icon: string;
  order: number;
  category: "Getting Started" | "Content Creation" | "Growth & Strategy";
  estimatedReadTime: string;
  contentFormat?: "markdown";
  publishedAt?: string;
  updatedAt?: string;
}

export interface TutorialMeta extends TutorialFrontmatter {
  slug: string;
}

export interface Tutorial extends TutorialMeta {
  content: string;
  html?: string;
}

export function getAllTutorials(): TutorialMeta[] {
  return bundledTutorials.map(({ content: _content, ...meta }) => meta as TutorialMeta)
    .sort((a, b) => a.order - b.order);
}

export function getTutorialBySlug(slug: string): Tutorial | null {
  return (bundledTutorials.find(tutorial => tutorial.slug === slug) as Tutorial | undefined) ?? null;
}

export function getTutorialSlugs(): string[] {
  return bundledTutorials.map(tutorial => tutorial.slug);
}

export function getAdjacentTutorials(
  slug: string
): { prev: TutorialMeta | null; next: TutorialMeta | null } {
  const all = getAllTutorials();
  const idx = all.findIndex((t) => t.slug === slug);
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

/** Extract headings from raw MDX content for table of contents */
export function extractHeadings(
  content: string
): { text: string; level: number; id: string }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { text: string; level: number; id: string }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].replace(/[*_`~]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ text, level: match[1].length, id });
  }

  return headings;
}
