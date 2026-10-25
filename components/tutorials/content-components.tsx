import type React from "react";
import { Callout, Checklist, ChecklistItem, Step, CodeBlock, Highlight } from "@/components/tutorials/mdx-components";

/* Custom MDX components mapped to our design system */
export const mdxComponents = {
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

