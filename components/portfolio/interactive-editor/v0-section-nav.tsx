"use client";

import { useMemo } from "react";

interface Section {
  id: string;
  title: string;
  selector: string;
}

interface V0SectionNavProps {
  html: string;
  onSectionClick: (selector: string) => void;
}

export function V0SectionNav({ html, onSectionClick }: V0SectionNavProps) {
  const sections = useMemo(() => {
    if (typeof window === "undefined") return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = doc.querySelectorAll("section[id], div[id], main, header, footer, nav");
    
    const sectionList: Section[] = [];
    
    elements.forEach((el, index) => {
      // Try to get a meaningful title from the section
      let title = el.id || "";
      
      // If no ID, try to find a heading
      if (!title) {
        const heading = el.querySelector("h1, h2, h3, h4, h5, h6");
        if (heading?.textContent) {
          title = heading.textContent.trim().slice(0, 30);
        }
      }
      
      // If still no title, use the tag name
      if (!title) {
        title = el.tagName.toLowerCase();
        if (el.className) {
          const firstClass = el.className.split(" ")[0];
          if (firstClass && firstClass.length < 20) {
            title = firstClass;
          }
        }
      }
      
      // Clean up the title
      title = title
        .replace(/[-_]/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toUpperCase();
      
      // Build selector
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector = `#${el.id}`;
      } else {
        // Find position among siblings
        const siblings = Array.from(el.parentElement?.children || []).filter(
          (child) => child.tagName === el.tagName
        );
        const pos = siblings.indexOf(el) + 1;
        if (el.parentElement?.tagName === "BODY") {
          selector = `body > ${el.tagName.toLowerCase()}:nth-of-type(${pos})`;
        }
      }
      
      sectionList.push({
        id: `section-${index}`,
        title: title || `SECTION ${index + 1}`,
        selector,
      });
    });
    
    return sectionList;
  }, [html]);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-end gap-2 z-10">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.selector)}
          className="group flex items-center gap-3 text-right"
        >
          <span className="text-xs font-medium text-[#666] group-hover:text-[#999] transition-colors tracking-wider">
            {section.title}
          </span>
          <div className="w-6 h-px bg-[#333] group-hover:bg-[#666] transition-colors" />
        </button>
      ))}
    </div>
  );
}
