import { getAllTutorials, getTutorialBySlug } from "@/lib/tutorials";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTutorials().filter(tutorial => tutorial.contentFormat === "markdown").map(({ slug }) => ({ slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial || tutorial.contentFormat !== "markdown") return new Response("Tutorial not found", { status: 404 });
  const body = `# ${tutorial.title}\n\n${tutorial.description}\n\nSource: https://ugc.community/tutorials/${slug}\nPublisher: ugc.community\nPublished: ${tutorial.publishedAt}\nUpdated: ${tutorial.updatedAt || tutorial.publishedAt}\n\n${tutorial.content}\n`;
  return new Response(body, { headers: {
    "Content-Type": "text/markdown; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Link": `<https://ugc.community/tutorials/${slug}>; rel="canonical"`,
    "X-Robots-Tag": "noindex",
  } });
}
