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
  `;
}

// Apply design system to HTML
export function applyDesignSystemToHtml(html: string, design: DesignSystem): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  // Find or create style element
  let styleEl = doc.querySelector("style#design-system");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.id = "design-system";
    doc.head.appendChild(styleEl);
  }
  
  styleEl.textContent = generateDesignSystemCSS(design);
  
  // Apply CSS variable references to elements
  const applyColorMappings = () => {
    // Apply primary color to buttons and CTAs
    doc.querySelectorAll("button, .btn, [class*='primary'], a[href*='mailto'], a[href*='contact']").forEach(el => {
      const element = el as HTMLElement;
      if (element.style.backgroundColor) {
        element.style.backgroundColor = "var(--primary)";
        element.style.color = "var(--primary-foreground)";
      }
    });
    
    // Apply font family
    const body = doc.querySelector("body");
    if (body) {
      body.style.fontFamily = `var(--font-${design.fonts.defaultStyle})`;
      body.style.backgroundColor = "var(--background)";
      body.style.color = "var(--foreground)";
    }
    
    // Apply border radius to images and cards
    doc.querySelectorAll("img, .card, [class*='card']").forEach(el => {
      const element = el as HTMLElement;
      element.style.borderRadius = `var(--radius)`;
    });
  };
  
  applyColorMappings();
  
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
