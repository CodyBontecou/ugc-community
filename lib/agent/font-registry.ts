// =====================================================
// Curated Google Fonts Registry
// =====================================================

export interface Font {
  name: string;
  googleImportUrl: string;
  category: "display" | "serif" | "sans-serif" | "mono" | "handwritten";
  moods: string[];
  weights: number[];
}

export interface FontPairing {
  display: string;
  body: string;
  description: string;
}

// =====================================================
// Font Registry (80+ curated Google Fonts)
// =====================================================

export const FONT_REGISTRY: Font[] = [
  // === DISPLAY ===
  {
    name: "Playfair Display",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap",
    category: "display",
    moods: ["luxury", "editorial", "elegant", "classic", "sophisticated"],
    weights: [400, 700, 900],
  },
  {
    name: "Cormorant Garamond",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&display=swap",
    category: "display",
    moods: ["luxury", "elegant", "refined", "classic", "editorial"],
    weights: [300, 400, 600, 700],
  },
  {
    name: "Archivo Black",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap",
    category: "display",
    moods: ["bold", "industrial", "brutalist", "modern", "strong"],
    weights: [400],
  },
  {
    name: "Bebas Neue",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
    category: "display",
    moods: ["bold", "modern", "industrial", "cinematic", "strong"],
    weights: [400],
  },
  {
    name: "Abril Fatface",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap",
    category: "display",
    moods: ["editorial", "elegant", "dramatic", "luxury", "retro"],
    weights: [400],
  },
  {
    name: "Righteous",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Righteous&display=swap",
    category: "display",
    moods: ["retro", "playful", "bold", "fun", "energetic"],
    weights: [400],
  },
  {
    name: "Yeseva One",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Yeseva+One&display=swap",
    category: "display",
    moods: ["elegant", "classic", "editorial", "dramatic", "luxury"],
    weights: [400],
  },
  {
    name: "Cinzel",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap",
    category: "display",
    moods: ["classic", "elegant", "luxury", "art-deco", "formal"],
    weights: [400, 700, 900],
  },
  {
    name: "Josefin Sans",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&display=swap",
    category: "display",
    moods: ["modern", "clean", "geometric", "elegant", "minimal"],
    weights: [300, 400, 600, 700],
  },
  {
    name: "Syne",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap",
    category: "display",
    moods: ["modern", "bold", "tech", "creative", "futuristic"],
    weights: [400, 500, 600, 700, 800],
  },
  {
    name: "Instrument Serif",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap",
    category: "display",
    moods: ["editorial", "elegant", "refined", "classic", "sophisticated"],
    weights: [400],
  },
  {
    name: "Fraunces",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&display=swap",
    category: "display",
    moods: ["warm", "organic", "editorial", "vintage", "friendly"],
    weights: [400, 700, 900],
  },
  {
    name: "Literata",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Literata:wght@400;500;700;900&display=swap",
    category: "display",
    moods: ["editorial", "classic", "readable", "refined", "warm"],
    weights: [400, 500, 700, 900],
  },
  {
    name: "Young Serif",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Young+Serif&display=swap",
    category: "display",
    moods: ["warm", "friendly", "editorial", "approachable", "modern"],
    weights: [400],
  },
  {
    name: "Bungee",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Bungee&display=swap",
    category: "display",
    moods: ["bold", "playful", "retro", "fun", "energetic"],
    weights: [400],
  },
  {
    name: "Alfa Slab One",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap",
    category: "display",
    moods: ["bold", "strong", "industrial", "retro", "dramatic"],
    weights: [400],
  },
  {
    name: "Rubik Mono One",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Rubik+Mono+One&display=swap",
    category: "display",
    moods: ["bold", "tech", "industrial", "modern", "geometric"],
    weights: [400],
  },
  {
    name: "Vast Shadow",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Vast+Shadow&display=swap",
    category: "display",
    moods: ["retro", "western", "dramatic", "vintage", "bold"],
    weights: [400],
  },
  {
    name: "Stint Ultra Expanded",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Stint+Ultra+Expanded&display=swap",
    category: "display",
    moods: ["wide", "modern", "geometric", "bold", "futuristic"],
    weights: [400],
  },
  {
    name: "Passion One",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Passion+One:wght@400;700;900&display=swap",
    category: "display",
    moods: ["bold", "energetic", "sporty", "fun", "strong"],
    weights: [400, 700, 900],
  },

  // === SANS-SERIF ===
  {
    name: "DM Sans",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap",
    category: "sans-serif",
    moods: ["clean", "modern", "minimal", "professional", "geometric"],
    weights: [400, 500, 700],
  },
  {
    name: "Outfit",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["modern", "clean", "geometric", "friendly", "professional"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Plus Jakarta Sans",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    category: "sans-serif",
    moods: ["modern", "clean", "professional", "friendly", "geometric"],
    weights: [400, 500, 600, 700, 800],
  },
  {
    name: "Lexend",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["clean", "accessible", "modern", "friendly", "readable"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Figtree",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["friendly", "modern", "clean", "warm", "approachable"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Sora",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["tech", "modern", "clean", "geometric", "futuristic"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Manrope",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap",
    category: "sans-serif",
    moods: ["modern", "clean", "professional", "geometric", "tech"],
    weights: [300, 400, 500, 600, 700, 800],
  },
  {
    name: "Urbanist",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap",
    category: "sans-serif",
    moods: ["modern", "geometric", "clean", "futuristic", "minimal"],
    weights: [300, 400, 500, 600, 700, 800],
  },
  {
    name: "Bricolage Grotesque",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap",
    category: "sans-serif",
    moods: ["creative", "modern", "bold", "editorial", "unique"],
    weights: [400, 500, 600, 700, 800],
  },
  {
    name: "Albert Sans",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["clean", "modern", "geometric", "minimal", "professional"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Work Sans",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["clean", "professional", "modern", "friendly", "versatile"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Archivo",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap",
    category: "sans-serif",
    moods: ["strong", "modern", "bold", "industrial", "editorial"],
    weights: [400, 500, 600, 700, 800],
  },
  {
    name: "Red Hat Display",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;600;700;900&display=swap",
    category: "sans-serif",
    moods: ["modern", "clean", "tech", "professional", "geometric"],
    weights: [400, 500, 600, 700, 900],
  },
  {
    name: "Rubik",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["friendly", "modern", "rounded", "playful", "clean"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Exo 2",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["tech", "futuristic", "geometric", "modern", "sci-fi"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Barlow",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["clean", "industrial", "modern", "neutral", "professional"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Karla",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["friendly", "clean", "approachable", "modern", "warm"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Overpass",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Overpass:wght@300;400;600;700&display=swap",
    category: "sans-serif",
    moods: ["clean", "modern", "professional", "neutral", "tech"],
    weights: [300, 400, 600, 700],
  },
  {
    name: "Space Mono",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap",
    category: "sans-serif",
    moods: ["tech", "retro", "futuristic", "monospace", "industrial"],
    weights: [400, 700],
  },
  {
    name: "Clash Display",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
    category: "display",
    moods: ["bold", "modern", "editorial", "strong", "creative"],
    weights: [400],
  },

  // === SERIF (Body) ===
  {
    name: "Source Serif 4",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@300;400;600;700&display=swap",
    category: "serif",
    moods: ["editorial", "classic", "readable", "professional", "refined"],
    weights: [300, 400, 600, 700],
  },
  {
    name: "Lora",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
    category: "serif",
    moods: ["elegant", "classic", "warm", "readable", "editorial"],
    weights: [400, 500, 600, 700],
  },
  {
    name: "Crimson Pro",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700&display=swap",
    category: "serif",
    moods: ["elegant", "classic", "editorial", "refined", "readable"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Libre Baskerville",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap",
    category: "serif",
    moods: ["classic", "traditional", "elegant", "readable", "editorial"],
    weights: [400, 700],
  },
  {
    name: "EB Garamond",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap",
    category: "serif",
    moods: ["classic", "elegant", "editorial", "refined", "traditional"],
    weights: [400, 500, 600, 700],
  },
  {
    name: "Noto Serif",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap",
    category: "serif",
    moods: ["classic", "readable", "neutral", "professional", "versatile"],
    weights: [400, 700],
  },
  {
    name: "Bitter",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Bitter:wght@300;400;500;600;700&display=swap",
    category: "serif",
    moods: ["warm", "readable", "friendly", "modern", "editorial"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Merriweather",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap",
    category: "serif",
    moods: ["readable", "classic", "warm", "professional", "editorial"],
    weights: [300, 400, 700, 900],
  },
  {
    name: "Spectral",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Spectral:wght@300;400;500;600;700&display=swap",
    category: "serif",
    moods: ["elegant", "editorial", "readable", "refined", "classic"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Newsreader",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Newsreader:wght@300;400;500;600;700&display=swap",
    category: "serif",
    moods: ["editorial", "classic", "readable", "traditional", "warm"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Cardo",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Cardo:wght@400;700&display=swap",
    category: "serif",
    moods: ["classic", "elegant", "traditional", "refined", "academic"],
    weights: [400, 700],
  },
  {
    name: "Cormorant",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Cormorant:wght@300;400;500;600;700&display=swap",
    category: "serif",
    moods: ["elegant", "luxury", "refined", "classic", "sophisticated"],
    weights: [300, 400, 500, 600, 700],
  },

  // === MONO ===
  {
    name: "JetBrains Mono",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
    category: "mono",
    moods: ["tech", "code", "modern", "clean", "developer"],
    weights: [400, 500, 700],
  },
  {
    name: "Fira Code",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap",
    category: "mono",
    moods: ["tech", "code", "modern", "developer", "clean"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "IBM Plex Mono",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap",
    category: "mono",
    moods: ["tech", "corporate", "industrial", "clean", "professional"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Red Hat Mono",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Red+Hat+Mono:wght@400;500;600;700&display=swap",
    category: "mono",
    moods: ["tech", "modern", "clean", "developer", "professional"],
    weights: [400, 500, 600, 700],
  },
  {
    name: "Martian Mono",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Martian+Mono:wght@300;400;500;600;700&display=swap",
    category: "mono",
    moods: ["futuristic", "sci-fi", "tech", "bold", "modern"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Source Code Pro",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@300;400;500;600;700&display=swap",
    category: "mono",
    moods: ["tech", "clean", "professional", "developer", "neutral"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Inconsolata",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Inconsolata:wght@300;400;500;600;700&display=swap",
    category: "mono",
    moods: ["tech", "retro", "clean", "developer", "readable"],
    weights: [300, 400, 500, 600, 700],
  },

  // === HANDWRITTEN / CHARACTER ===
  {
    name: "Caveat",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap",
    category: "handwritten",
    moods: ["handwritten", "casual", "warm", "personal", "friendly"],
    weights: [400, 500, 600, 700],
  },
  {
    name: "Pacifico",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Pacifico&display=swap",
    category: "handwritten",
    moods: ["fun", "retro", "casual", "tropical", "playful"],
    weights: [400],
  },
  {
    name: "Press Start 2P",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap",
    category: "handwritten",
    moods: ["retro", "gaming", "pixel", "8-bit", "nostalgic"],
    weights: [400],
  },
  {
    name: "Silkscreen",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap",
    category: "handwritten",
    moods: ["pixel", "retro", "gaming", "tech", "nostalgic"],
    weights: [400, 700],
  },
  {
    name: "VT323",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=VT323&display=swap",
    category: "handwritten",
    moods: ["retro", "terminal", "pixel", "vintage", "tech"],
    weights: [400],
  },
  {
    name: "Sacramento",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Sacramento&display=swap",
    category: "handwritten",
    moods: ["elegant", "script", "feminine", "luxury", "romantic"],
    weights: [400],
  },
  {
    name: "Indie Flower",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap",
    category: "handwritten",
    moods: ["handwritten", "playful", "casual", "fun", "personal"],
    weights: [400],
  },
  {
    name: "Dancing Script",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap",
    category: "handwritten",
    moods: ["script", "elegant", "casual", "romantic", "warm"],
    weights: [400, 500, 600, 700],
  },
  {
    name: "Permanent Marker",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap",
    category: "handwritten",
    moods: ["bold", "grunge", "casual", "energetic", "raw"],
    weights: [400],
  },
  {
    name: "Kalam",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap",
    category: "handwritten",
    moods: ["handwritten", "warm", "personal", "friendly", "organic"],
    weights: [300, 400, 700],
  },
  {
    name: "Satisfy",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Satisfy&display=swap",
    category: "handwritten",
    moods: ["script", "retro", "elegant", "vintage", "casual"],
    weights: [400],
  },

  // === Additional Sans-Serif ===
  {
    name: "Geologica",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["modern", "clean", "geometric", "professional", "tech"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Onest",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["friendly", "modern", "rounded", "clean", "warm"],
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: "Nunito Sans",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700&display=swap",
    category: "sans-serif",
    moods: ["friendly", "rounded", "clean", "readable", "modern"],
    weights: [300, 400, 600, 700],
  },
  {
    name: "Instrument Sans",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap",
    category: "sans-serif",
    moods: ["modern", "clean", "professional", "minimal", "editorial"],
    weights: [400, 500, 600, 700],
  },
  {
    name: "Wix Madefor Display",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Wix+Madefor+Display:wght@400;500;600;700;800&display=swap",
    category: "sans-serif",
    moods: ["modern", "friendly", "clean", "professional", "readable"],
    weights: [400, 500, 600, 700, 800],
  },
  {
    name: "Schibsted Grotesk",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&display=swap",
    category: "sans-serif",
    moods: ["editorial", "modern", "clean", "professional", "bold"],
    weights: [400, 500, 600, 700, 800],
  },

  // === Additional Display ===
  {
    name: "Unbounded",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&display=swap",
    category: "display",
    moods: ["bold", "futuristic", "rounded", "modern", "tech"],
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    name: "Anybody",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Anybody:wght@400;500;600;700;800&display=swap",
    category: "display",
    moods: ["bold", "wide", "industrial", "modern", "strong"],
    weights: [400, 500, 600, 700, 800],
  },
  {
    name: "Chivo",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Chivo:wght@300;400;700;900&display=swap",
    category: "display",
    moods: ["modern", "bold", "clean", "strong", "professional"],
    weights: [300, 400, 700, 900],
  },
  {
    name: "Dela Gothic One",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap",
    category: "display",
    moods: ["bold", "heavy", "dramatic", "strong", "japanese"],
    weights: [400],
  },
  {
    name: "Silkscreen",
    googleImportUrl:
      "https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap",
    category: "display",
    moods: ["pixel", "retro", "gaming", "tech", "nostalgic"],
    weights: [400, 700],
  },
];

// =====================================================
// Font Pairings (30 curated combinations)
// =====================================================

export const FONT_PAIRINGS: FontPairing[] = [
  { display: "Playfair Display", body: "DM Sans", description: "Classic editorial elegance meets clean modernity" },
  { display: "Bebas Neue", body: "Outfit", description: "Bold cinematic headlines with friendly body text" },
  { display: "Abril Fatface", body: "Crimson Pro", description: "Dramatic editorial display with refined serif body" },
  { display: "Syne", body: "Plus Jakarta Sans", description: "Creative modern display with professional body" },
  { display: "Cormorant Garamond", body: "Figtree", description: "Luxurious serif paired with warm sans-serif" },
  { display: "Archivo Black", body: "Barlow", description: "Industrial bold headlines with clean body text" },
  { display: "Young Serif", body: "Lexend", description: "Warm friendly serif with accessible body text" },
  { display: "Instrument Serif", body: "Instrument Sans", description: "Matching editorial serif and sans duo" },
  { display: "Fraunces", body: "Manrope", description: "Warm organic display with geometric body text" },
  { display: "Cinzel", body: "EB Garamond", description: "Art Deco elegance with classic serif body" },
  { display: "Righteous", body: "Karla", description: "Retro fun display with approachable body text" },
  { display: "Bungee", body: "Red Hat Display", description: "Playful bold display with modern body text" },
  { display: "Alfa Slab One", body: "Source Serif 4", description: "Heavy slab headlines with readable serif body" },
  { display: "Josefin Sans", body: "Lora", description: "Geometric minimal display with warm serif body" },
  { display: "Literata", body: "Albert Sans", description: "Editorial serif display with clean sans body" },
  { display: "Yeseva One", body: "Merriweather", description: "Dramatic serif display with classic readable body" },
  { display: "Passion One", body: "Rubik", description: "Energetic bold display with friendly rounded body" },
  { display: "Syne", body: "JetBrains Mono", description: "Creative display with tech monospace body" },
  { display: "Unbounded", body: "Sora", description: "Futuristic rounded display with tech body text" },
  { display: "Archivo Black", body: "IBM Plex Mono", description: "Industrial bold with corporate mono body" },
  { display: "Dela Gothic One", body: "Urbanist", description: "Heavy Japanese-style display with geometric body" },
  { display: "Playfair Display", body: "Source Serif 4", description: "All-serif luxury editorial pairing" },
  { display: "Bebas Neue", body: "Fira Code", description: "Cinematic headlines with developer-style body" },
  { display: "Fraunces", body: "Bitter", description: "Warm organic serif pairing for editorial sites" },
  { display: "Cormorant Garamond", body: "Spectral", description: "Refined luxury with elegant serif body" },
  { display: "Press Start 2P", body: "VT323", description: "Full retro gaming pixel aesthetic" },
  { display: "Chivo", body: "Work Sans", description: "Bold modern display with versatile body text" },
  { display: "Anybody", body: "Overpass", description: "Wide industrial display with neutral body text" },
  { display: "Bricolage Grotesque", body: "Newsreader", description: "Creative grotesque headlines with editorial body" },
  { display: "Rubik Mono One", body: "Red Hat Mono", description: "Heavy geometric mono with clean mono body" },
];

// =====================================================
// Banned Fonts
// =====================================================

export const BANNED_FONTS: string[] = [
  "Inter",
  "Roboto",
  "Arial",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Space Grotesk",
  "Poppins",
  "Nunito",
  "Raleway",
  "Helvetica",
  "system-ui",
];

// =====================================================
// Helper Functions
// =====================================================

/**
 * Returns fonts matching any of the given moods.
 */
export function getRecommendedFonts(moods: string[]): Font[] {
  if (moods.length === 0) return [];
  const lowerMoods = moods.map((m) => m.toLowerCase());
  return FONT_REGISTRY.filter((font) =>
    font.moods.some((mood) => lowerMoods.includes(mood.toLowerCase()))
  );
}

/**
 * Returns a random font pairing.
 */
export function getRandomPairing(): FontPairing {
  return FONT_PAIRINGS[Math.floor(Math.random() * FONT_PAIRINGS.length)];
}
