import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "../components/tutorials/content-components.tsx";

// Workers cannot read arbitrary traced content files at runtime. Bundle the
// source articles as JSON, regenerated before every production build.
const source = path.resolve("content/tutorials");
const files = (await readdir(source)).filter(file => file.endsWith(".mdx")).sort();
const tutorials = await Promise.all(files.map(async file => {
  const { data, content } = matter(await readFile(path.join(source, file), "utf8"));
  let html;
  if (data.contentFormat === "markdown") {
    const rendered = await compileMDX({ source: content, components: mdxComponents, options: { mdxOptions: { remarkPlugins: [remarkGfm] } } });
    html = renderToStaticMarkup(rendered.content);
  }
  return { ...data, slug: file.slice(0, -4), content, ...(html ? { html } : {}) };
}));
await writeFile(path.resolve("content/tutorials.generated.json"), `${JSON.stringify(tutorials, null, 2)}\n`);
await writeFile(path.resolve("content/tutorial-paths.generated.json"), `${JSON.stringify(tutorials.filter(t => t.contentFormat === "markdown" && t.html).map(t => `/tutorials/${t.slug}`), null, 2)}\n`);
console.log(`Bundled ${tutorials.length} tutorials`);
