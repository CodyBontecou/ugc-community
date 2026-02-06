// =====================================================
// Design Seed System
// =====================================================

import { FontPairing, FONT_PAIRINGS, FONT_REGISTRY } from "./font-registry";

// =====================================================
// Types
// =====================================================

export interface DesignSeed {
  id: string;
  name: string;
  fontPairing: FontPairing;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  layoutArchetype: string;
  moodKeywords: string[];
  theme: "light" | "dark" | "mixed";
  cssInspiration: string;
}

// =====================================================
// Helper to find a pairing by display name
// =====================================================

function pairing(display: string, body: string): FontPairing {
  const found = FONT_PAIRINGS.find(
    (p) => p.display === display && p.body === body
  );
  if (found) return found;
  // Fallback: create the pairing directly
  return { display, body, description: `${display} + ${body}` };
}

// =====================================================
// 30+ Design Seeds
// =====================================================

export const DESIGN_SEEDS: DesignSeed[] = [
  {
    id: "warm-editorial",
    name: "Warm Editorial",
    fontPairing: pairing("Playfair Display", "DM Sans"),
    colorPalette: {
      primary: "#2D2A26",
      secondary: "#8B7355",
      accent: "#C9A96E",
      background: "#FAF6F0",
      text: "#2D2A26",
      muted: "#A09484",
    },
    layoutArchetype: "editorial magazine with asymmetric column grid",
    moodKeywords: ["warm", "editorial", "sophisticated", "literary"],
    theme: "light",
    cssInspiration:
      "A high-end literary magazine spread: warm cream paper, golden accents, serif headlines with generous tracking, pull quotes with oversized quotation marks.",
  },
  {
    id: "neon-brutalist",
    name: "Neon Brutalist",
    fontPairing: pairing("Archivo Black", "IBM Plex Mono"),
    colorPalette: {
      primary: "#0D0D0D",
      secondary: "#1A1A2E",
      accent: "#00FF88",
      background: "#0D0D0D",
      text: "#E0E0E0",
      muted: "#555555",
    },
    layoutArchetype: "stacked full-bleed sections with raw edges",
    moodKeywords: ["brutalist", "raw", "industrial", "neon"],
    theme: "dark",
    cssInspiration:
      "Raw concrete walls with neon signage. Thick borders, exposed grid lines, monospace accents. The glow of terminal green on pitch black.",
  },
  {
    id: "soft-luxury",
    name: "Soft Luxury",
    fontPairing: pairing("Cormorant Garamond", "Figtree"),
    colorPalette: {
      primary: "#1C1C1C",
      secondary: "#6B5B4F",
      accent: "#D4A574",
      background: "#F8F5F1",
      text: "#1C1C1C",
      muted: "#9B8E82",
    },
    layoutArchetype: "centered single-column with generous whitespace",
    moodKeywords: ["luxury", "soft", "refined", "elegant"],
    theme: "light",
    cssInspiration:
      "A Celine storefront: whisper-quiet elegance, muted earth tones, impossibly generous spacing. Every element breathes. Thin gold lines as dividers.",
  },
  {
    id: "retro-pop",
    name: "Retro Pop",
    fontPairing: pairing("Righteous", "Karla"),
    colorPalette: {
      primary: "#FF6B35",
      secondary: "#FFD23F",
      accent: "#EE4266",
      background: "#FFF8E7",
      text: "#1A1423",
      muted: "#7A6A8A",
    },
    layoutArchetype: "modular card grid with playful overlapping elements",
    moodKeywords: ["retro", "playful", "vibrant", "pop-art"],
    theme: "light",
    cssInspiration:
      "A vintage record store meets modern design studio. Bold primary colors, rounded corners, halftone dot patterns, thick outlines, rotated elements at slight angles.",
  },
  {
    id: "nature-organic",
    name: "Nature Organic",
    fontPairing: pairing("Young Serif", "Lexend"),
    colorPalette: {
      primary: "#2D4A3E",
      secondary: "#5B7B6F",
      accent: "#D4A373",
      background: "#F5F0EA",
      text: "#2D3B35",
      muted: "#8A9A90",
    },
    layoutArchetype: "flowing sections with organic curves and asymmetric balance",
    moodKeywords: ["organic", "natural", "earthy", "calm"],
    theme: "light",
    cssInspiration:
      "A botanical garden catalog: sage greens, terracotta accents, flowing organic shapes as section dividers, leaf-like SVG patterns. Warm and grounded.",
  },
  {
    id: "tech-dark",
    name: "Tech Dark",
    fontPairing: pairing("Syne", "JetBrains Mono"),
    colorPalette: {
      primary: "#0A0A0F",
      secondary: "#16161D",
      accent: "#6C5CE7",
      background: "#0A0A0F",
      text: "#E8E8ED",
      muted: "#4A4A5A",
    },
    layoutArchetype: "dashboard-inspired grid with data visualization elements",
    moodKeywords: ["tech", "dark", "futuristic", "developer"],
    theme: "dark",
    cssInspiration:
      "A developer's command center. Deep void blacks, electric purple accents, subtle grid backgrounds, glowing borders, animated code-like elements scrolling in the background.",
  },
  {
    id: "art-deco",
    name: "Art Deco",
    fontPairing: pairing("Cinzel", "EB Garamond"),
    colorPalette: {
      primary: "#1B1B2F",
      secondary: "#2C2C54",
      accent: "#D4AF37",
      background: "#0F0F1A",
      text: "#E8E0D0",
      muted: "#7A7590",
    },
    layoutArchetype: "symmetrical layout with geometric patterns and borders",
    moodKeywords: ["art-deco", "geometric", "luxury", "golden"],
    theme: "dark",
    cssInspiration:
      "The Chrysler Building's lobby as a website. Gold on deep navy, geometric fan patterns, sharp symmetry, thin gold lines, diamond shapes, gatsby-era opulence.",
  },
  {
    id: "pastel-dreamy",
    name: "Pastel Dreamy",
    fontPairing: pairing("Josefin Sans", "Lora"),
    colorPalette: {
      primary: "#9B72CF",
      secondary: "#F2A7C3",
      accent: "#7EC8E3",
      background: "#FDF6FF",
      text: "#3D2C4E",
      muted: "#B8A0C8",
    },
    layoutArchetype: "soft floating cards with rounded corners and gentle shadows",
    moodKeywords: ["pastel", "dreamy", "soft", "feminine"],
    theme: "light",
    cssInspiration:
      "Cotton candy clouds and morning light. Soft lavender, pink, and sky blue pastels. Rounded everything, soft blur effects, floating cards with dreamy drop shadows, gradient meshes.",
  },
  {
    id: "swiss-modern",
    name: "Swiss Modern",
    fontPairing: pairing("Chivo", "Work Sans"),
    colorPalette: {
      primary: "#000000",
      secondary: "#333333",
      accent: "#FF0000",
      background: "#FFFFFF",
      text: "#000000",
      muted: "#888888",
    },
    layoutArchetype: "strict grid system with mathematical precision",
    moodKeywords: ["swiss", "minimal", "structured", "clean"],
    theme: "light",
    cssInspiration:
      "A Joseph Müller-Brockmann poster: pure white space, black type, a single red accent. Strict grid alignment, typographic hierarchy is everything. No decoration — only structure.",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    fontPairing: pairing("Unbounded", "Sora"),
    colorPalette: {
      primary: "#0D0221",
      secondary: "#150530",
      accent: "#FF2A6D",
      background: "#0D0221",
      text: "#D1F7FF",
      muted: "#553377",
    },
    layoutArchetype: "overlapping panels with glitch effects and diagonal cuts",
    moodKeywords: ["cyberpunk", "neon", "futuristic", "glitch"],
    theme: "dark",
    cssInspiration:
      "Rain-slicked Tokyo streets at midnight. Hot pink and cyan neon reflections, glitch effects, scanline overlays, clipped diagonal sections, chromatic aberration text shadows.",
  },
  {
    id: "japanese-minimal",
    name: "Japanese Minimal",
    fontPairing: pairing("Dela Gothic One", "Urbanist"),
    colorPalette: {
      primary: "#1A1A1A",
      secondary: "#4A4A4A",
      accent: "#C41E3A",
      background: "#F5F2EE",
      text: "#1A1A1A",
      muted: "#8A8580",
    },
    layoutArchetype: "zen-inspired with extreme whitespace and vertical rhythm",
    moodKeywords: ["japanese", "minimal", "zen", "restrained"],
    theme: "light",
    cssInspiration:
      "A Japanese tea house: vast emptiness punctuated by single bold elements. Ink black on warm rice paper, a single vermillion accent. Vertical text elements, wide letter-spacing, contemplative negative space.",
  },
  {
    id: "memphis-design",
    name: "Memphis Design",
    fontPairing: pairing("Bungee", "Red Hat Display"),
    colorPalette: {
      primary: "#FF6B6B",
      secondary: "#4ECDC4",
      accent: "#FFE66D",
      background: "#F7F7F7",
      text: "#2C2C54",
      muted: "#95AABF",
    },
    layoutArchetype: "asymmetric playful grid with geometric decorative elements",
    moodKeywords: ["memphis", "playful", "colorful", "80s"],
    theme: "light",
    cssInspiration:
      "The Memphis Group's wildest dreams. Squiggly lines, geometric shapes scattered decoratively, clashing colors that somehow work, dotted patterns, zigzag borders. Maximum fun, zero pretension.",
  },
  {
    id: "noir-cinematic",
    name: "Noir Cinematic",
    fontPairing: pairing("Bebas Neue", "Outfit"),
    colorPalette: {
      primary: "#0A0A0A",
      secondary: "#1A1A1A",
      accent: "#C9A96E",
      background: "#0A0A0A",
      text: "#D4D0C8",
      muted: "#555550",
    },
    layoutArchetype: "full-bleed hero sections with cinematic aspect ratios",
    moodKeywords: ["noir", "cinematic", "dark", "mysterious"],
    theme: "dark",
    cssInspiration:
      "A film noir title sequence. Deep blacks, single gold spotlight effects, dramatic lighting gradients, letterboxed image sections, fade-in reveals like movie credits.",
  },
  {
    id: "coastal-calm",
    name: "Coastal Calm",
    fontPairing: pairing("Instrument Serif", "Instrument Sans"),
    colorPalette: {
      primary: "#1B3A4B",
      secondary: "#3A6B8A",
      accent: "#E8C170",
      background: "#F0F4F8",
      text: "#1B3A4B",
      muted: "#7A98A8",
    },
    layoutArchetype: "horizontal flow with wave-inspired section transitions",
    moodKeywords: ["coastal", "calm", "ocean", "serene"],
    theme: "light",
    cssInspiration:
      "Morning light on still water. Navy blues deepening to ocean, sandy gold accents, wave-shaped SVG dividers between sections, soft horizontal parallax movement.",
  },
  {
    id: "industrial-warehouse",
    name: "Industrial Warehouse",
    fontPairing: pairing("Anybody", "Overpass"),
    colorPalette: {
      primary: "#2B2B2B",
      secondary: "#4A4A4A",
      accent: "#E87A00",
      background: "#1E1E1E",
      text: "#D0D0D0",
      muted: "#6A6A6A",
    },
    layoutArchetype: "exposed structure grid with visible gutters and raw spacing",
    moodKeywords: ["industrial", "warehouse", "raw", "urban"],
    theme: "dark",
    cssInspiration:
      "A converted warehouse loft. Exposed brick textures (CSS patterns), steel beam dividers, industrial orange safety accents, large blocky type, visible grid structure like scaffolding.",
  },
  {
    id: "baroque-maximalist",
    name: "Baroque Maximalist",
    fontPairing: pairing("Yeseva One", "Merriweather"),
    colorPalette: {
      primary: "#2C0735",
      secondary: "#5C1A76",
      accent: "#FFD700",
      background: "#1A0522",
      text: "#F0E6D3",
      muted: "#8A6B9E",
    },
    layoutArchetype: "layered ornamental layout with decorative borders and frames",
    moodKeywords: ["baroque", "maximalist", "ornate", "dramatic"],
    theme: "dark",
    cssInspiration:
      "A Versailles ballroom gone digital. Deep royal purple, gold leaf accents, ornamental CSS borders, layered depth with multiple overlapping frames, decorative flourish dividers.",
  },
  {
    id: "scandinavian-clean",
    name: "Scandinavian Clean",
    fontPairing: pairing("Literata", "Albert Sans"),
    colorPalette: {
      primary: "#1A1A1A",
      secondary: "#4A4A4A",
      accent: "#3D7B80",
      background: "#FAFAF8",
      text: "#1A1A1A",
      muted: "#9A9A95",
    },
    layoutArchetype: "clean grid with ample whitespace and precise alignment",
    moodKeywords: ["scandinavian", "clean", "minimal", "functional"],
    theme: "light",
    cssInspiration:
      "A Finnish design studio's portfolio. Off-white backgrounds, muted teal accent, mathematical spacing, subtle border-radius, photography-first layout with text as caption, not hero.",
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    fontPairing: pairing("Press Start 2P", "VT323"),
    colorPalette: {
      primary: "#FF71CE",
      secondary: "#01CDFE",
      accent: "#B967FF",
      background: "#1A0030",
      text: "#FFFB96",
      muted: "#7A4488",
    },
    layoutArchetype: "retro web 1.0 inspired with grid columns and pixel borders",
    moodKeywords: ["vaporwave", "retro", "aesthetic", "nostalgic"],
    theme: "dark",
    cssInspiration:
      "A 90s internet fever dream. Hot pink/cyan/purple palette, retro pixel fonts, grid backgrounds, faux-3D text shadows, checkerboard patterns, roman bust imagery vibes without actual images.",
  },
  {
    id: "terracotta-earth",
    name: "Terracotta Earth",
    fontPairing: pairing("Fraunces", "Bitter"),
    colorPalette: {
      primary: "#A0522D",
      secondary: "#8B6B4A",
      accent: "#C97B4B",
      background: "#FDF5E6",
      text: "#3B2316",
      muted: "#A89480",
    },
    layoutArchetype: "organic flowing layout with curved sections and earth textures",
    moodKeywords: ["earthy", "warm", "terracotta", "organic"],
    theme: "light",
    cssInspiration:
      "A ceramic artist's studio. Warm terracotta reds, sandy beige, organic curved shapes as containers, handmade texture feeling, clay-like border-radius variations.",
  },
  {
    id: "midnight-jewel",
    name: "Midnight Jewel",
    fontPairing: pairing("Cormorant Garamond", "Spectral"),
    colorPalette: {
      primary: "#0D1B2A",
      secondary: "#1B2838",
      accent: "#00B4D8",
      background: "#0D1B2A",
      text: "#E0E8F0",
      muted: "#3A5068",
    },
    layoutArchetype: "layered depth with frosted glass cards over dark backgrounds",
    moodKeywords: ["midnight", "jewel", "deep", "sophisticated"],
    theme: "dark",
    cssInspiration:
      "Sapphires and moonlight. Deep midnight blue base, jewel-tone cyan accents, frosted glass-morphism cards, subtle star-like dot patterns, elegant serif type floating above dark depths.",
  },
  {
    id: "paper-and-ink",
    name: "Paper & Ink",
    fontPairing: pairing("Bricolage Grotesque", "Newsreader"),
    colorPalette: {
      primary: "#1A1A1A",
      secondary: "#444444",
      accent: "#D94F30",
      background: "#F4F1EB",
      text: "#1A1A1A",
      muted: "#888880",
    },
    layoutArchetype: "newspaper-inspired multi-column layout with ruled lines",
    moodKeywords: ["editorial", "newspaper", "typographic", "ink"],
    theme: "light",
    cssInspiration:
      "The Sunday Times meets indie zine. Multi-column text layouts, thin ruled lines between sections, drop caps, a single accent red like a newspaper masthead, visible type hierarchy.",
  },
  {
    id: "bauhaus",
    name: "Bauhaus",
    fontPairing: pairing("Rubik Mono One", "Red Hat Mono"),
    colorPalette: {
      primary: "#1A1A1A",
      secondary: "#264653",
      accent: "#E76F51",
      background: "#F4F1DE",
      text: "#1A1A1A",
      muted: "#6B705C",
    },
    layoutArchetype: "geometric composition with primary shapes as design elements",
    moodKeywords: ["bauhaus", "geometric", "primary", "modernist"],
    theme: "light",
    cssInspiration:
      "Kandinsky's compositions as web design. Primary geometric shapes (circles, triangles, squares) as decorative elements, primary colors on neutral ground, asymmetric but balanced, functional beauty.",
  },
  {
    id: "tropical-bold",
    name: "Tropical Bold",
    fontPairing: pairing("Passion One", "Rubik"),
    colorPalette: {
      primary: "#006D77",
      secondary: "#83C5BE",
      accent: "#FFDDD2",
      background: "#EDF6F9",
      text: "#1D3557",
      muted: "#6EA8AA",
    },
    layoutArchetype: "bold stacked sections with curved wave transitions",
    moodKeywords: ["tropical", "bold", "vibrant", "fresh"],
    theme: "light",
    cssInspiration:
      "A luxury beach resort's website. Teal ocean hues, coral pink accents, bold chunky type, wave-shaped section dividers, fresh and energetic, palm-leaf inspired decorative patterns.",
  },
  {
    id: "monochrome-elegant",
    name: "Monochrome Elegant",
    fontPairing: pairing("Playfair Display", "Source Serif 4"),
    colorPalette: {
      primary: "#111111",
      secondary: "#333333",
      accent: "#777777",
      background: "#FFFFFF",
      text: "#111111",
      muted: "#AAAAAA",
    },
    layoutArchetype: "minimalist single-column with extreme typographic focus",
    moodKeywords: ["monochrome", "elegant", "minimal", "typography"],
    theme: "light",
    cssInspiration:
      "A black and white fashion editorial. Pure monochrome palette, all hierarchy achieved through type scale and weight alone, generous line heights, impeccable spacing, no color — only form.",
  },
  {
    id: "grunge-texture",
    name: "Grunge Texture",
    fontPairing: pairing("Alfa Slab One", "Source Serif 4"),
    colorPalette: {
      primary: "#2B2B2B",
      secondary: "#4A3728",
      accent: "#B85C38",
      background: "#E8DCC8",
      text: "#2B2B2B",
      muted: "#7A6B5A",
    },
    layoutArchetype: "rough-edged sections with overlapping elements and texture",
    moodKeywords: ["grunge", "textured", "raw", "vintage"],
    theme: "light",
    cssInspiration:
      "A punk rock poster from the 90s gone digital. Noise texture overlays (CSS grain), rough edges, stamp-like elements, leather brown and aged paper tones, distressed type effects.",
  },
  {
    id: "glass-morphism",
    name: "Glass Morphism",
    fontPairing: pairing("Syne", "Plus Jakarta Sans"),
    colorPalette: {
      primary: "#667EEA",
      secondary: "#764BA2",
      accent: "#F093FB",
      background: "#0F0C29",
      text: "#FFFFFF",
      muted: "#8888AA",
    },
    layoutArchetype: "layered frosted glass cards over gradient mesh backgrounds",
    moodKeywords: ["glass", "modern", "gradient", "futuristic"],
    theme: "dark",
    cssInspiration:
      "iOS meets high fashion. Frosted glass panels (backdrop-filter: blur) floating over vibrant gradient mesh backgrounds, subtle border glow, translucent layers creating depth.",
  },
  {
    id: "clay-soft",
    name: "Clay Soft",
    fontPairing: pairing("Fraunces", "Manrope"),
    colorPalette: {
      primary: "#5B4A3F",
      secondary: "#8B7D6B",
      accent: "#C08B6F",
      background: "#F2EDE8",
      text: "#3A302A",
      muted: "#A8998A",
    },
    layoutArchetype: "rounded bento grid with soft shadows and warm palette",
    moodKeywords: ["clay", "soft", "warm", "tactile"],
    theme: "light",
    cssInspiration:
      "Claymation meets web design. Puffy rounded containers with exaggerated border-radius, warm earth tones, soft puffy shadows, elements that look touchable and three-dimensional.",
  },
  {
    id: "copper-and-sage",
    name: "Copper & Sage",
    fontPairing: pairing("Josefin Sans", "Lora"),
    colorPalette: {
      primary: "#4A6741",
      secondary: "#6B8F64",
      accent: "#B87333",
      background: "#F5F2ED",
      text: "#2A3A25",
      muted: "#8A9A82",
    },
    layoutArchetype: "elegant two-column layout with botanical-inspired spacing",
    moodKeywords: ["botanical", "elegant", "natural", "refined"],
    theme: "light",
    cssInspiration:
      "A luxury botanical garden invitation. Sage green and burnished copper, elegant thin-line botanical illustrations as decorative elements, refined spacing, nature meets sophistication.",
  },
  {
    id: "ink-and-gold",
    name: "Ink & Gold",
    fontPairing: pairing("Abril Fatface", "Crimson Pro"),
    colorPalette: {
      primary: "#0A0A0A",
      secondary: "#1A1A1A",
      accent: "#D4AF37",
      background: "#0A0A0A",
      text: "#F0E6D3",
      muted: "#5A5545",
    },
    layoutArchetype: "dramatic full-screen sections with scroll-triggered reveals",
    moodKeywords: ["ink", "gold", "luxury", "dramatic"],
    theme: "dark",
    cssInspiration:
      "Calligraphy ink on black paper with gold leaf. Pitch black base, warm gold accents used sparingly, dramatic serif headlines with extreme size, scroll-triggered fade-ins, opulent restraint.",
  },
  {
    id: "arctic-frost",
    name: "Arctic Frost",
    fontPairing: pairing("Instrument Serif", "Instrument Sans"),
    colorPalette: {
      primary: "#E8EDF0",
      secondary: "#C5D0D8",
      accent: "#5BA4CF",
      background: "#F8FAFB",
      text: "#1A2530",
      muted: "#8A9AA5",
    },
    layoutArchetype: "clean airy layout with cool tones and crisp edges",
    moodKeywords: ["arctic", "frost", "cool", "crisp"],
    theme: "light",
    cssInspiration:
      "A Nordic winter morning. Ice blue and silver tones, crisp clean edges, breath-of-frost backgrounds, crystalline borders, sharp shadows, cool and refreshing with piercing clarity.",
  },
];

// =====================================================
// Functions
// =====================================================

/**
 * Selects a random design seed, optionally excluding recently used ones.
 */
export function selectDesignSeed(excludeIds?: string[]): DesignSeed {
  let candidates = DESIGN_SEEDS;

  if (excludeIds && excludeIds.length > 0) {
    const filtered = DESIGN_SEEDS.filter(
      (seed) => !excludeIds.includes(seed.id)
    );
    // Only use filtered list if there are options remaining
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Formats a design seed as a markdown section for the prompt.
 */
export function formatSeedForPrompt(seed: DesignSeed): string {
  // Look up fonts from registry to get their import URLs
  const displayFont = FONT_REGISTRY.find(
    (f) => f.name === seed.fontPairing.display
  );
  const bodyFont = FONT_REGISTRY.find((f) => f.name === seed.fontPairing.body);

  const displayImport =
    displayFont?.googleImportUrl ||
    `https://fonts.googleapis.com/css2?family=${seed.fontPairing.display.replace(/ /g, "+")}:wght@400;700&display=swap`;
  const bodyImport =
    bodyFont?.googleImportUrl ||
    `https://fonts.googleapis.com/css2?family=${seed.fontPairing.body.replace(/ /g, "+")}:wght@400;700&display=swap`;

  return `## Design Direction (MANDATORY)

You MUST follow this design direction. These are requirements, not suggestions.

### Typography (REQUIRED)
- **Display/Heading font**: ${seed.fontPairing.display}
  Import: ${displayImport}
- **Body font**: ${seed.fontPairing.body}
  Import: ${bodyImport}
- Pairing rationale: ${seed.fontPairing.description}
- Do NOT use any font not listed above. Do NOT use Inter, Roboto, Arial, Open Sans, Lato, Montserrat, Space Grotesk, Poppins, Nunito, Raleway, Helvetica, or system-ui.

### Color Palette (REQUIRED)
Use these EXACT colors as CSS custom properties:
\`\`\`css
:root {
  --color-primary: ${seed.colorPalette.primary};
  --color-secondary: ${seed.colorPalette.secondary};
  --color-accent: ${seed.colorPalette.accent};
  --color-background: ${seed.colorPalette.background};
  --color-text: ${seed.colorPalette.text};
  --color-muted: ${seed.colorPalette.muted};
}
\`\`\`
You may derive additional shades/tints from these base colors but the core palette must be used.

### Layout (REQUIRED)
- Layout archetype: **${seed.layoutArchetype}**
- Build your page structure around this archetype. It should be obvious in the final result.

### Aesthetic (REQUIRED)
- Theme: **${seed.theme}**
- Mood keywords: ${seed.moodKeywords.join(", ")}
- Visual direction: ${seed.cssInspiration}

Execute this vision with full commitment. The resulting site should unmistakably embody the "${seed.name}" aesthetic.`;
}
