/**
 * Utilities for HTML element selection and manipulation
 */

import type { SectionInfo } from "./types";

/**
 * Generate a unique CSS selector for an element
 * Creates a path from root to element using tag names and nth-child
 */
export function generateSelector(element: Element, root: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== root && current.parentElement) {
    const parent: Element = current.parentElement;
    const currentTagName = current.tagName;
    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === currentTagName
    );

    if (siblings.length === 1) {
      path.unshift(current.tagName.toLowerCase());
    } else {
      const index = siblings.indexOf(current) + 1;
      path.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
    }

    current = parent;
  }

  return path.join(" > ");
}

/**
 * Find an element by CSS selector within HTML string
 * Returns the element's outer HTML and position info
 */
export function findElementBySelector(
  html: string,
  selector: string
): { outerHtml: string; startIndex: number; endIndex: number } | null {
  // Use DOMParser for accurate HTML parsing
  if (typeof DOMParser === "undefined") {
    // Server-side fallback - shouldn't be needed for client operations
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const element = doc.querySelector(selector);

  if (!element) return null;

  const outerHtml = element.outerHTML;

  // Find the position in original HTML
  // This is approximate - for complex HTML might need more sophisticated matching
  const startIndex = html.indexOf(outerHtml);
  if (startIndex === -1) {
    // Try finding by opening tag
    const tagMatch = outerHtml.match(/^<(\w+)[^>]*>/);
    if (tagMatch) {
      const openingTag = tagMatch[0];
      const approxStart = html.indexOf(openingTag);
      if (approxStart !== -1) {
        return {
          outerHtml,
          startIndex: approxStart,
          endIndex: approxStart + outerHtml.length,
        };
      }
    }
    return null;
  }

  return {
    outerHtml,
    startIndex,
    endIndex: startIndex + outerHtml.length,
  };
}

/**
 * Replace an element's content in HTML string
 * Preserves the element's tag and attributes, replaces innerHTML
 */
export function replaceElementContent(
  html: string,
  selector: string,
  newContent: string
): string {
  if (typeof DOMParser === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const element = doc.querySelector(selector);

  if (!element) return html;

  // Store original outerHTML to find in source
  const originalOuter = element.outerHTML;

  // Update content
  element.innerHTML = newContent;
  const newOuter = element.outerHTML;

  // Replace in original HTML string to preserve formatting
  return html.replace(originalOuter, newOuter);
}

/**
 * Replace an element's entire outer HTML
 */
export function replaceElementOuter(
  html: string,
  selector: string,
  newOuterHtml: string
): string {
  if (typeof DOMParser === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const element = doc.querySelector(selector);

  if (!element) return html;

  const originalOuter = element.outerHTML;
  return html.replace(originalOuter, newOuterHtml);
}

/**
 * Parse sections from HTML for reordering
 */
export function parseSections(html: string): SectionInfo[] {
  if (typeof DOMParser === "undefined") {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Look for section elements, or top-level divs in body
  let sections = Array.from(doc.querySelectorAll("body > section"));

  if (sections.length === 0) {
    // Fallback: look for direct children of body that are containers
    sections = Array.from(
      doc.querySelectorAll("body > div, body > header, body > main, body > footer")
    );
  }

  return sections.map((section, index) => {
    // Try to find a heading for the title
    const heading = section.querySelector("h1, h2, h3, h4");
    const title = heading?.textContent?.trim() || `Section ${index + 1}`;

    // Get preview text (first meaningful text content)
    const textContent = section.textContent?.trim() || "";
    const preview = textContent.slice(0, 100) + (textContent.length > 100 ? "..." : "");

    return {
      id: `section-${index}`,
      index,
      title,
      tagName: section.tagName.toLowerCase(),
      preview,
    };
  });
}

/**
 * Reorder sections in HTML
 */
export function reorderSections(html: string, newOrder: number[]): string {
  if (typeof DOMParser === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Get current sections
  let sections = Array.from(doc.querySelectorAll("body > section"));
  let parent = doc.body;

  if (sections.length === 0) {
    sections = Array.from(
      doc.querySelectorAll("body > div, body > header, body > main, body > footer")
    );
  }

  if (sections.length === 0 || sections.length !== newOrder.length) {
    return html;
  }

  // Create reordered sections
  const reordered = newOrder.map((oldIndex) => sections[oldIndex]);

  // Clear and re-add sections in new order
  // Preserve elements that aren't sections (scripts, etc.)
  const nonSections = Array.from(parent.children).filter(
    (child) => !sections.includes(child as Element)
  );

  // Remove all children
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }

  // Re-add in new order
  reordered.forEach((section) => parent.appendChild(section));
  nonSections.forEach((element) => parent.appendChild(element));

  // Return as HTML string
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

/**
 * Check if a selector targets a text-editable element
 */
export function isTextEditable(tagName: string): boolean {
  const textElements = [
    "H1", "H2", "H3", "H4", "H5", "H6",
    "P", "SPAN", "A", "LI", "TD", "TH",
    "LABEL", "BUTTON", "FIGCAPTION",
    "BLOCKQUOTE", "CITE", "Q",
    "STRONG", "EM", "B", "I", "U",
    "SMALL", "MARK", "DEL", "INS",
    "SUB", "SUP", "TIME", "ADDRESS"
  ];
  return textElements.includes(tagName.toUpperCase());
}

/**
 * Get human-readable element type
 */
export function getElementTypeName(tagName: string): string {
  const names: Record<string, string> = {
    H1: "Heading 1",
    H2: "Heading 2",
    H3: "Heading 3",
    H4: "Heading 4",
    H5: "Heading 5",
    H6: "Heading 6",
    P: "Paragraph",
    A: "Link",
    SPAN: "Text",
    LI: "List Item",
    BUTTON: "Button",
    LABEL: "Label",
    FIGCAPTION: "Caption",
    BLOCKQUOTE: "Quote",
    TD: "Table Cell",
    TH: "Table Header",
  };
  return names[tagName.toUpperCase()] || tagName;
}
