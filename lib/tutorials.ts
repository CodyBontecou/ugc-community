import fs from "fs";
import path from "path";
import matter from "gray-matter";

const TUTORIALS_DIR = path.join(process.cwd(), "content/tutorials");

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
}

export function getAllTutorials(): TutorialMeta[] {
  if (!fs.existsSync(TUTORIALS_DIR)) return [];

  const files = fs
    .readdirSync(TUTORIALS_DIR)
    .filter((f) => f.endsWith(".mdx"));

  const tutorials = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const fullPath = path.join(TUTORIALS_DIR, filename);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug,
      ...(data as TutorialFrontmatter),
    };
  });

  return tutorials.sort((a, b) => a.order - b.order);
}

export function getTutorialBySlug(slug: string): Tutorial | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const fullPath = path.join(TUTORIALS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    content,
    ...(data as TutorialFrontmatter),
  };
}

export function getTutorialSlugs(): string[] {
  if (!fs.existsSync(TUTORIALS_DIR)) return [];

  return fs
    .readdirSync(TUTORIALS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
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
