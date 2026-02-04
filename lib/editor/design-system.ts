// Design System Types and Utilities

export interface ColorScheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
  };
}

export interface FontSettings {
  defaultStyle: "sans" | "serif" | "mono";
  sans: string;
  serif: string;
  mono: string;
}

export interface ShadowSettings {
  preset: "none" | "small" | "medium" | "large" | "glow" | "solid";
  xOffset: number;
  yOffset: number;
  blur: number;
  spread: number;
  opacity: number;
  color: string;
}

export interface DesignSystem {
  fonts: FontSettings;
  colors: ColorScheme;
  radius: number;
  shadows: ShadowSettings;
}

// Pre-defined color schemes
export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "earth",
    name: "Earth Tones",
    colors: {
      primary: "#4b5320",
      primaryForeground: "#ffffff",
      secondary: "#8b7355",
      secondaryForeground: "#ffffff",
      accent: "#c4a76c",
      accentForeground: "#1a1a1a",
      background: "#faf9f6",
      foreground: "#1a1a1a",
      card: "#f5f5dc",
      cardForeground: "#1a1a1a",
      muted: "#d4c5a9",
      mutedForeground: "#5c5c5c",
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    colors: {
      primary: "#1e3a5f",
      primaryForeground: "#ffffff",
      secondary: "#4a6fa5",
      secondaryForeground: "#ffffff",
      accent: "#2196f3",
      accentForeground: "#ffffff",
      background: "#f5f9fc",
      foreground: "#1a1a1a",
      card: "#e8f4f8",
      cardForeground: "#1a1a1a",
      muted: "#b8d4e8",
      mutedForeground: "#4a6fa5",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    colors: {
      primary: "#2e7d32",
      primaryForeground: "#ffffff",
      secondary: "#4a6741",
      secondaryForeground: "#ffffff",
      accent: "#4caf50",
      accentForeground: "#ffffff",
      background: "#f5faf5",
      foreground: "#1a1a1a",
      card: "#e8f5e9",
      cardForeground: "#1a1a1a",
      muted: "#c8e6c9",
      mutedForeground: "#4a6741",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: {
      primary: "#d32f2f",
      primaryForeground: "#ffffff",
      secondary: "#8b6914",
      secondaryForeground: "#ffffff",
      accent: "#ff5722",
      accentForeground: "#ffffff",
      background: "#fff8f5",
      foreground: "#1a1a1a",
      card: "#ffeee8",
      cardForeground: "#1a1a1a",
      muted: "#ffccbc",
      mutedForeground: "#8b6914",
    },
  },
  {
    id: "berry",
    name: "Berry",
    colors: {
      primary: "#ad1457",
      primaryForeground: "#ffffff",
      secondary: "#6a1b4d",
      secondaryForeground: "#ffffff",
      accent: "#e91e63",
      accentForeground: "#ffffff",
      background: "#fdf5f7",
      foreground: "#1a1a1a",
      card: "#fce4ec",
      cardForeground: "#1a1a1a",
      muted: "#f8bbd0",
      mutedForeground: "#6a1b4d",
    },
  },
  {
    id: "neutral",
    name: "Neutral",
    colors: {
      primary: "#424242",
      primaryForeground: "#ffffff",
      secondary: "#757575",
      secondaryForeground: "#ffffff",
      accent: "#9e9e9e",
      accentForeground: "#1a1a1a",
      background: "#fafafa",
      foreground: "#1a1a1a",
      card: "#f5f5f5",
      cardForeground: "#1a1a1a",
      muted: "#e0e0e0",
      mutedForeground: "#616161",
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    colors: {
      primary: "#512da8",
      primaryForeground: "#ffffff",
      secondary: "#7c4dff",
      secondaryForeground: "#ffffff",
      accent: "#9c27b0",
      accentForeground: "#ffffff",
      background: "#f9f5fc",
      foreground: "#1a1a1a",
      card: "#ede7f6",
      cardForeground: "#1a1a1a",
      muted: "#d1c4e9",
      mutedForeground: "#512da8",
    },
  },
  {
    id: "gold",
    name: "Golden",
    colors: {
      primary: "#c9a227",
      primaryForeground: "#1a1a1a",
      secondary: "#8b7355",
      secondaryForeground: "#ffffff",
      accent: "#ffd700",
      accentForeground: "#1a1a1a",
      background: "#fffef5",
      foreground: "#1a1a1a",
      card: "#fff8dc",
      cardForeground: "#1a1a1a",
      muted: "#f5deb3",
      mutedForeground: "#8b7355",
    },
  },
];

// Available fonts
export const FONT_OPTIONS = {
  sans: [
    { value: "Geist", label: "Geist" },
    { value: "Inter", label: "Inter" },
    { value: "Roboto", label: "Roboto" },
    { value: "Open Sans", label: "Open Sans" },
    { value: "Lato", label: "Lato" },
    { value: "Poppins", label: "Poppins" },
    { value: "Nunito", label: "Nunito" },
    { value: "DM Sans", label: "DM Sans" },
  ],
  serif: [
    { value: "Georgia", label: "Georgia" },
    { value: "Playfair Display", label: "Playfair Display" },
    { value: "Merriweather", label: "Merriweather" },
    { value: "Lora", label: "Lora" },
    { value: "Source Serif Pro", label: "Source Serif Pro" },
    { value: "Crimson Text", label: "Crimson Text" },
  ],
  mono: [
    { value: "Geist Mono", label: "Geist Mono" },
    { value: "Fira Code", label: "Fira Code" },
    { value: "JetBrains Mono", label: "JetBrains Mono" },
    { value: "Source Code Pro", label: "Source Code Pro" },
    { value: "IBM Plex Mono", label: "IBM Plex Mono" },
  ],
};

// Shadow presets
export const SHADOW_PRESETS: Record<string, Omit<ShadowSettings, "preset">> = {
  none: { xOffset: 0, yOffset: 0, blur: 0, spread: 0, opacity: 0, color: "#000000" },
  small: { xOffset: 0, yOffset: 1, blur: 2, spread: 0, opacity: 0.1, color: "#000000" },
  medium: { xOffset: 0, yOffset: 4, blur: 6, spread: -1, opacity: 0.1, color: "#000000" },
  large: { xOffset: 0, yOffset: 10, blur: 15, spread: -3, opacity: 0.1, color: "#000000" },
  glow: { xOffset: 0, yOffset: 0, blur: 20, spread: 5, opacity: 0.15, color: "#000000" },
  solid: { xOffset: 4, yOffset: 4, blur: 0, spread: 0, opacity: 1, color: "#000000" },
};

// Default design system
export const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
  fonts: {
    defaultStyle: "sans",
    sans: "Geist",
    serif: "Georgia",
    mono: "Geist Mono",
  },
  colors: COLOR_SCHEMES[0],
  radius: 0.5,
  shadows: {
    preset: "medium",
    ...SHADOW_PRESETS.medium,
  },
};

// Generate CSS variables from design system
export function generateDesignSystemCSS(design: DesignSystem): string {
  const { colors, fonts, radius, shadows } = design;
  
  const shadowValue = shadows.preset === "none" 
    ? "none" 
    : `${shadows.xOffset}px ${shadows.yOffset}px ${shadows.blur}px ${shadows.spread}px rgba(0,0,0,${shadows.opacity})`;
  
  return `
    :root {
      --primary: ${colors.colors.primary};
      --primary-foreground: ${colors.colors.primaryForeground};
      --secondary: ${colors.colors.secondary};
      --secondary-foreground: ${colors.colors.secondaryForeground};
      --accent: ${colors.colors.accent};
      --accent-foreground: ${colors.colors.accentForeground};
      --background: ${colors.colors.background};
      --foreground: ${colors.colors.foreground};
      --card: ${colors.colors.card};
      --card-foreground: ${colors.colors.cardForeground};
      --muted: ${colors.colors.muted};
      --muted-foreground: ${colors.colors.mutedForeground};
      --radius: ${radius}rem;
      --shadow: ${shadowValue};
      --font-sans: "${fonts.sans}", system-ui, sans-serif;
      --font-serif: "${fonts.serif}", Georgia, serif;
      --font-mono: "${fonts.mono}", monospace;
    }
    body {
      font-family: var(--font-${fonts.defaultStyle});
      background-color: var(--background);
      color: var(--foreground);
    }
    :where(a) {
      color: var(--primary);
    }
    :where(a:hover) {
      color: var(--accent);
    }
    :where(button, [role="button"], .btn, .button, [class*="btn"], [class*="button"], [type="submit"]) {
      background-color: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }
    :where(.card, [class*="card"]) {
      background-color: var(--card);
      color: var(--card-foreground);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    :where(img) {
      border-radius: var(--radius);
    }
  `;
}

type ColorRole =
  | "background"
  | "foreground"
  | "card"
  | "muted"
  | "mutedForeground"
  | "primary"
  | "secondary"
  | "accent";

interface ColorUsageStats {
  hex: string;
  count: number;
  background: number;
  text: number;
  border: number;
  saturation: number;
  luminance: number;
}

interface ColorUsageAccumulator {
  hex: string;
  count: number;
  background: number;
  text: number;
  border: number;
}

const COLOR_TOKEN_REGEX = /#(?:[0-9a-fA-F]{3,8})(?![0-9a-fA-F])|rgba?\([^)]*\)/g;

const parseRgbValue = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.replace("%", ""));
    if (Number.isNaN(percent)) return null;
    return Math.round((percent / 100) * 255);
  }
  const numeric = Number.parseFloat(trimmed);
  return Number.isNaN(numeric) ? null : numeric;
};

function parseColorToken(token: string): { r: number; g: number; b: number; a: number } | null {
  const trimmed = token.trim().toLowerCase();
  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    if (hex.length !== 6 && hex.length !== 8) return null;
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  if (trimmed.startsWith("rgb")) {
    const match = trimmed.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(",").map((part) => part.trim());
    if (parts.length < 3) return null;
    const r = parseRgbValue(parts[0]);
    const g = parseRgbValue(parts[1]);
    const b = parseRgbValue(parts[2]);
    if (r === null || g === null || b === null) return null;
    const alpha = parts[3] !== undefined ? Number.parseFloat(parts[3]) : 1;
    return { r, g, b, a: Number.isNaN(alpha) ? 1 : alpha };
  }

  return null;
}

function normalizeColorToken(token: string): string | null {
  const parsed = parseColorToken(token);
  if (!parsed) return null;
  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");
  return `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

function getLuminance(r: number, g: number, b: number): number {
  const toLinear = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function registerColorUsage(
  stats: Map<string, ColorUsageAccumulator>,
  token: string,
  type: "background" | "text" | "border" | "other"
) {
  const normalized = normalizeColorToken(token);
  if (!normalized) return;
  const entry = stats.get(normalized) || {
    hex: normalized,
    count: 0,
    background: 0,
    text: 0,
    border: 0,
  };
  entry.count += 1;
  if (type === "background") entry.background += 1;
  if (type === "text") entry.text += 1;
  if (type === "border") entry.border += 1;
  stats.set(normalized, entry);
}

function collectColorUsageFromCss(
  cssText: string,
  stats: Map<string, ColorUsageAccumulator>
) {
  const propertyRegex = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = propertyRegex.exec(cssText)) !== null) {
    const property = match[1].toLowerCase();
    const value = match[2];
    const tokens = value.match(COLOR_TOKEN_REGEX) || [];
    if (tokens.length === 0) continue;
    let type: "background" | "text" | "border" | "other" = "other";
    if (property.includes("background")) {
      type = "background";
    } else if (
      property === "color" ||
      property.includes("color") ||
      property.includes("fill") ||
      property.includes("stroke")
    ) {
      type = "text";
    } else if (
      property.includes("border") ||
      property.includes("outline") ||
      property.includes("shadow")
    ) {
      type = "border";
    }
    tokens.forEach((token) => registerColorUsage(stats, token, type));
  }
}

function buildColorRoleMap(doc: Document): Map<string, ColorRole> {
  const stats = new Map<string, ColorUsageAccumulator>();

  doc.querySelectorAll("style").forEach((styleEl) => {
    if (styleEl.id === "design-system" || styleEl.id === "design-system-live") return;
    collectColorUsageFromCss(styleEl.textContent || "", stats);
  });

  doc.querySelectorAll("[style]").forEach((el) => {
    const styleAttr = el.getAttribute("style");
    if (styleAttr) {
      collectColorUsageFromCss(styleAttr, stats);
    }
  });

  const colors: ColorUsageStats[] = [];
  stats.forEach((entry) => {
    const parsed = parseColorToken(entry.hex);
    if (!parsed) return;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    colors.push({
      ...entry,
      saturation: hsl.s,
      luminance: getLuminance(parsed.r, parsed.g, parsed.b),
    });
  });

  if (colors.length === 0) return new Map();

  const byBackground = colors
    .filter((color) => color.background > 0)
    .sort((a, b) => b.background - a.background || b.luminance - a.luminance);
  const byText = colors
    .filter((color) => color.text > 0)
    .sort((a, b) => b.text - a.text || a.luminance - b.luminance);
  const lightest = [...colors].sort((a, b) => b.luminance - a.luminance);
  const darkest = [...colors].sort((a, b) => a.luminance - b.luminance);

  const background = byBackground[0] || lightest[0];
  const card = byBackground[1] || lightest[1] || background;
  const muted =
    byBackground.find(
      (color) =>
        color.hex !== background.hex &&
        color.hex !== card.hex &&
        color.saturation < 0.2
    ) ||
    byBackground[2] ||
    lightest[2] ||
    card;
  const foreground = byText[0] || darkest[0];
  const mutedForeground = byText.find((color) => color.hex !== foreground.hex) ||
    darkest[1] ||
    foreground;

  const excluded = new Set([
    background.hex,
    card.hex,
    muted.hex,
    foreground.hex,
    mutedForeground.hex,
  ]);

  const accents = colors
    .filter((color) => !excluded.has(color.hex))
    .sort((a, b) => b.saturation - a.saturation || b.count - a.count);
  const primary = accents[0] || colors.find((color) => !excluded.has(color.hex)) || background;
  const secondary = accents[1] || primary;
  const accent = accents[2] || primary;

  const roleMap = new Map<string, ColorRole>();
  roleMap.set(background.hex, "background");
  roleMap.set(card.hex, "card");
  roleMap.set(muted.hex, "muted");
  roleMap.set(foreground.hex, "foreground");
  roleMap.set(mutedForeground.hex, "mutedForeground");
  roleMap.set(primary.hex, "primary");
  roleMap.set(secondary.hex, "secondary");
  roleMap.set(accent.hex, "accent");

  colors.forEach((color) => {
    if (roleMap.has(color.hex)) return;
    if (color.text >= color.background && color.luminance < 0.5) {
      roleMap.set(color.hex, "foreground");
      return;
    }
    if (color.text >= color.background && color.luminance >= 0.5) {
      roleMap.set(color.hex, "mutedForeground");
      return;
    }
    if (color.luminance > 0.85) {
      roleMap.set(color.hex, "background");
      return;
    }
    if (color.luminance < 0.25) {
      roleMap.set(color.hex, "foreground");
      return;
    }
    if (color.saturation > 0.4) {
      roleMap.set(color.hex, "accent");
      return;
    }
    roleMap.set(color.hex, "muted");
  });

  return roleMap;
}

function replaceColorTokens(
  input: string,
  roleMap: Map<string, ColorRole>,
  roleToColor: Record<ColorRole, string>
): string {
  return input.replace(COLOR_TOKEN_REGEX, (match) => {
    const normalized = normalizeColorToken(match);
    if (!normalized) return match;
    const role = roleMap.get(normalized);
    if (!role) return match;
    const replacement = roleToColor[role];
    if (!replacement) return match;
    const original = parseColorToken(match);
    const nextColor = parseColorToken(replacement);
    if (!original || !nextColor) return replacement;
    if (original.a < 1) {
      return `rgba(${Math.round(nextColor.r)}, ${Math.round(nextColor.g)}, ${Math.round(
        nextColor.b
      )}, ${original.a})`;
    }
    return replacement;
  });
}

// Apply design system to HTML
export function applyDesignSystemToHtml(html: string, design: DesignSystem): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const roleMap = buildColorRoleMap(doc);
  if (roleMap.size > 0) {
    const roleToColor: Record<ColorRole, string> = {
      background: design.colors.colors.background,
      foreground: design.colors.colors.foreground,
      card: design.colors.colors.card,
      muted: design.colors.colors.muted,
      mutedForeground: design.colors.colors.mutedForeground,
      primary: design.colors.colors.primary,
      secondary: design.colors.colors.secondary,
      accent: design.colors.colors.accent,
    };

    doc.querySelectorAll("style").forEach((styleElement) => {
      if (styleElement.id === "design-system" || styleElement.id === "design-system-live") return;
      const cssText = styleElement.textContent || "";
      const updatedCss = replaceColorTokens(cssText, roleMap, roleToColor);
      if (cssText !== updatedCss) {
        styleElement.textContent = updatedCss;
      }
    });

    doc.querySelectorAll("[style]").forEach((element) => {
      const styleAttr = element.getAttribute("style") || "";
      const updatedStyle = replaceColorTokens(styleAttr, roleMap, roleToColor);
      if (styleAttr !== updatedStyle) {
        element.setAttribute("style", updatedStyle);
      }
    });
  }
  
  // Find or create style element
  let styleEl = doc.querySelector("style#design-system");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.id = "design-system";
    doc.head.appendChild(styleEl);
  }
  
  styleEl.textContent = generateDesignSystemCSS(design);
  
  return `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
}

// Element typography options
export const TYPOGRAPHY_OPTIONS = {
  fontWeight: [
    { value: "thin", label: "Thin" },
    { value: "extralight", label: "Extra Light" },
    { value: "light", label: "Light" },
    { value: "normal", label: "Normal" },
    { value: "medium", label: "Medium" },
    { value: "semibold", label: "Semi Bold" },
    { value: "bold", label: "Bold" },
    { value: "extrabold", label: "Extra Bold" },
    { value: "black", label: "Black" },
  ],
  fontSize: [
    { value: "xs", label: "xs" },
    { value: "sm", label: "sm" },
    { value: "base", label: "base" },
    { value: "lg", label: "lg" },
    { value: "xl", label: "xl" },
    { value: "2xl", label: "2xl" },
    { value: "3xl", label: "3xl" },
    { value: "4xl", label: "4xl" },
    { value: "5xl", label: "5xl" },
  ],
  textAlign: ["left", "center", "right", "justify"],
  textDecoration: ["none", "underline", "line-through", "overline"],
};
