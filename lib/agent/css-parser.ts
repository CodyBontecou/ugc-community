// =====================================================
// CSS/HTML Design Metadata Extraction
// =====================================================

import { GeneratedFile } from "./portfolio-generator";

export interface DesignMetadata {
  fonts: string[];
  colors: string[];
}

/**
 * Extracts design metadata (fonts and colors) from generated portfolio files.
 * Uses simple regex — no full CSS parser needed.
 */
export function extractDesignMetadata(files: GeneratedFile[]): DesignMetadata {
  const fonts = new Set<string>();
  const colors = new Set<string>();

  for (const file of files) {
    if (file.isBinary) continue;

    const content = file.content;

    // Extract Google Fonts from <link> tags
    const linkRegex =
      /fonts\.googleapis\.com\/css2?\?family=([^&"']+)/g;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(content)) !== null) {
      // Family param might contain multiple families separated by &family=
      const familyParam = decodeURIComponent(match[1]);
      // Extract font name before the colon (weight specifiers)
      const fontName = familyParam.split(":")[0].replace(/\+/g, " ");
      if (fontName) fonts.add(fontName);
    }

    // Extract Google Fonts from @import url()
    const importRegex =
      /@import\s+url\(['"]?[^'"]*fonts\.googleapis\.com\/css2?\?family=([^&'")\s]+)[^'")\s]*['"]?\)/g;
    while ((match = importRegex.exec(content)) !== null) {
      const familyParam = decodeURIComponent(match[1]);
      const fontName = familyParam.split(":")[0].replace(/\+/g, " ");
      if (fontName) fonts.add(fontName);
    }

    // Extract font-family declarations for known Google Fonts patterns
    const fontFamilyRegex =
      /font-family\s*:\s*['"]?([^;'"}\n]+)['"]?\s*[;}]/g;
    while ((match = fontFamilyRegex.exec(content)) !== null) {
      const families = match[1].split(",").map((f) => f.trim().replace(/['"]/g, ""));
      for (const family of families) {
        // Only capture non-generic font names
        const generic = [
          "serif",
          "sans-serif",
          "monospace",
          "cursive",
          "fantasy",
          "system-ui",
          "ui-serif",
          "ui-sans-serif",
          "ui-monospace",
          "inherit",
          "initial",
          "unset",
        ];
        if (family && !generic.includes(family.toLowerCase())) {
          fonts.add(family);
        }
      }
    }

    // Extract hex colors
    const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    while ((match = hexRegex.exec(content)) !== null) {
      const hex = match[0].toLowerCase();
      // Skip very common generic colors
      if (hex !== "#fff" && hex !== "#000" && hex !== "#ffffff" && hex !== "#000000") {
        colors.add(hex);
      }
    }

    // Extract CSS custom properties that hold color values
    const customPropRegex =
      /--[\w-]+\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\))/g;
    while ((match = customPropRegex.exec(content)) !== null) {
      colors.add(match[1].toLowerCase());
    }

    // Extract rgb/hsl colors
    const rgbHslRegex = /(rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\))/g;
    while ((match = rgbHslRegex.exec(content)) !== null) {
      colors.add(match[1].toLowerCase());
    }
  }

  return {
    fonts: Array.from(fonts),
    colors: Array.from(colors),
  };
}
