// =====================================================
// Style Directives System
// Generates style parameters informed by user's questionnaire input
// Falls back to random selection for variety when no clear preference
// =====================================================

export interface StyleDirective {
  typography: TypographyPairing;
  colorMood: ColorMood;
  layoutArchetype: LayoutArchetype;
  animationStyle: AnimationStyle;
  visualTexture: VisualTexture;
  themeMode: ThemeMode;
}

export interface UserStyleInput {
  portfolioVision: string | null;
  inspiringBrands?: string | null;
  portfolioExamples?: string | null;
}

// =====================================================
// Typography Pairings
// =====================================================

interface TypographyPairing {
  name: string;
  displayFont: string;
  bodyFont: string;
  description: string;
  keywords: string[];
}

const TYPOGRAPHY_PAIRINGS: TypographyPairing[] = [
  {
    name: "Editorial Elegance",
    displayFont: "Playfair Display",
    bodyFont: "Source Sans 3",
    description: "Classic serif headlines with clean sans-serif body text. Sophisticated and timeless.",
    keywords: ["elegant", "sophisticated", "classic", "luxury", "editorial", "magazine", "timeless", "refined", "upscale", "premium", "fashion", "beauty"],
  },
  {
    name: "Brutalist Type",
    displayFont: "Bebas Neue",
    bodyFont: "IBM Plex Mono",
    description: "Bold condensed headlines with monospace body. Raw, industrial, unapologetic.",
    keywords: ["brutalist", "raw", "industrial", "bold", "edgy", "urban", "streetwear", "grunge", "punk", "alternative", "tech", "developer"],
  },
  {
    name: "Soft Modern",
    displayFont: "DM Serif Display",
    bodyFont: "DM Sans",
    description: "Warm serif display with geometric sans body. Approachable yet refined.",
    keywords: ["modern", "warm", "approachable", "friendly", "lifestyle", "wellness", "coaching", "personal", "blog", "writer"],
  },
  {
    name: "Neo Grotesque",
    displayFont: "Archivo Black",
    bodyFont: "Archivo",
    description: "Heavy grotesque headlines with matching family body. Bold and cohesive.",
    keywords: ["bold", "strong", "impactful", "sports", "fitness", "athletic", "powerful", "dynamic", "energy"],
  },
  {
    name: "Artistic Flow",
    displayFont: "Cormorant Garamond",
    bodyFont: "Proza Libre",
    description: "Elegant, high-contrast serif with humanist sans. Artistic and literary.",
    keywords: ["artistic", "creative", "literary", "poetic", "gallery", "fine art", "museum", "cultural", "writer", "author"],
  },
  {
    name: "Tech Forward",
    displayFont: "Syne",
    bodyFont: "Space Mono",
    description: "Experimental geometric display with technical mono. Futuristic and precise.",
    keywords: ["tech", "futuristic", "digital", "startup", "coding", "developer", "ai", "innovation", "cyber", "sci-fi", "gaming"],
  },
  {
    name: "Warm Humanist",
    displayFont: "Fraunces",
    bodyFont: "Commissioner",
    description: "Soft, wonky serif with variable sans. Friendly and characterful.",
    keywords: ["friendly", "warm", "human", "personal", "handmade", "artisan", "craft", "organic", "natural", "cozy", "homey"],
  },
  {
    name: "Swiss Precision",
    displayFont: "Darker Grotesque",
    bodyFont: "Karla",
    description: "Tight, bold grotesque with clean geometric body. Minimal and controlled.",
    keywords: ["minimal", "clean", "swiss", "precision", "corporate", "professional", "business", "sleek", "modern", "simple"],
  },
  {
    name: "Retro Revival",
    displayFont: "Righteous",
    bodyFont: "Quicksand",
    description: "Groovy display with rounded sans. Nostalgic 70s vibes, modernized.",
    keywords: ["retro", "vintage", "70s", "groovy", "nostalgic", "funky", "disco", "throwback", "classic", "old school"],
  },
  {
    name: "Luxury Minimal",
    displayFont: "Cormorant",
    bodyFont: "Jost",
    description: "Refined thin serif with geometric sans. High-end fashion aesthetic.",
    keywords: ["luxury", "high-end", "fashion", "minimal", "refined", "exclusive", "premium", "designer", "couture", "chic"],
  },
  {
    name: "Bold Statement",
    displayFont: "Oswald",
    bodyFont: "Lato",
    description: "Condensed impact headlines with neutral body. Strong and direct.",
    keywords: ["bold", "statement", "strong", "direct", "confident", "loud", "impactful", "attention", "headline"],
  },
  {
    name: "Playful Creative",
    displayFont: "Rubik Mono One",
    bodyFont: "Rubik",
    description: "Chunky monospace display with rounded family. Fun and approachable.",
    keywords: ["playful", "fun", "creative", "quirky", "young", "vibrant", "cheerful", "kids", "gaming", "entertainment"],
  },
  {
    name: "Classic Revival",
    displayFont: "Libre Baskerville",
    bodyFont: "Open Sans",
    description: "Traditional Baskerville with modern sans. Trustworthy and established.",
    keywords: ["classic", "traditional", "trustworthy", "established", "professional", "law", "finance", "consulting", "corporate"],
  },
  {
    name: "Geometric Drama",
    displayFont: "Big Shoulders Display",
    bodyFont: "Outfit",
    description: "Industrial condensed with soft geometric. Urban and contemporary.",
    keywords: ["geometric", "urban", "contemporary", "industrial", "city", "architecture", "design", "modern", "angular"],
  },
  {
    name: "Organic Modern",
    displayFont: "Vollkorn",
    bodyFont: "Nunito",
    description: "Warm text serif with rounded sans. Natural and welcoming.",
    keywords: ["organic", "natural", "eco", "sustainable", "green", "earth", "wellness", "health", "plant", "nature"],
  },
  {
    name: "Digital Native",
    displayFont: "Press Start 2P",
    bodyFont: "VT323",
    description: "Pixel-style retro gaming fonts. 8-bit nostalgia, digital culture.",
    keywords: ["gaming", "pixel", "retro", "8-bit", "arcade", "nostalgic", "gamer", "esports", "streamer", "twitch"],
  },
  {
    name: "Art Deco",
    displayFont: "Poiret One",
    bodyFont: "Raleway",
    description: "Geometric decorative with elegant thin sans. 1920s glamour.",
    keywords: ["art deco", "glamour", "1920s", "gatsby", "elegant", "decorative", "vintage", "jazz", "cocktail", "event"],
  },
  {
    name: "Contemporary Serif",
    displayFont: "Lora",
    bodyFont: "Poppins",
    description: "Modern calligraphic serif with geometric sans. Balanced and versatile.",
    keywords: ["balanced", "versatile", "contemporary", "modern", "professional", "blog", "content", "media", "journalism"],
  },
];

// =====================================================
// Color Moods
// =====================================================

interface ColorMood {
  name: string;
  description: string;
  palette: string[];
  cssVariables: string;
  keywords: string[];
}

const COLOR_MOODS: ColorMood[] = [
  {
    name: "Midnight Electric",
    description: "Deep navy/black base with electric blue and cyan accents. High contrast, digital energy.",
    palette: ["#0a0a0f", "#1a1a2e", "#00d9ff", "#0099ff", "#ffffff"],
    cssVariables: `--color-bg: #0a0a0f; --color-surface: #1a1a2e; --color-primary: #00d9ff; --color-secondary: #0099ff; --color-text: #ffffff; --color-text-muted: #8892b0;`,
    keywords: ["tech", "digital", "cyber", "futuristic", "electric", "neon", "gaming", "developer", "startup", "innovation"],
  },
  {
    name: "Warm Terracotta",
    description: "Earthy terracotta and rust with cream and sage accents. Organic warmth, grounded.",
    palette: ["#faf6f1", "#e07b53", "#c25d3d", "#8b9a82", "#2d2d2d"],
    cssVariables: `--color-bg: #faf6f1; --color-surface: #fff8f3; --color-primary: #e07b53; --color-secondary: #8b9a82; --color-text: #2d2d2d; --color-text-muted: #6b6b6b;`,
    keywords: ["earthy", "organic", "natural", "warm", "cozy", "artisan", "handmade", "craft", "pottery", "home", "interior"],
  },
  {
    name: "Neon Noir",
    description: "Pure black with hot pink and purple neons. Cyberpunk, nightlife, bold.",
    palette: ["#000000", "#1a1a1a", "#ff2d95", "#b829dd", "#ffffff"],
    cssVariables: `--color-bg: #000000; --color-surface: #1a1a1a; --color-primary: #ff2d95; --color-secondary: #b829dd; --color-text: #ffffff; --color-text-muted: #888888;`,
    keywords: ["bold", "edgy", "nightlife", "club", "music", "dj", "party", "cyberpunk", "punk", "alternative", "neon", "pink"],
  },
  {
    name: "Forest Deep",
    description: "Dark forest greens with gold accents on near-black. Luxurious nature, mysterious.",
    palette: ["#0d1f0d", "#1a3a1a", "#c9a227", "#4a7c4a", "#e8e4d9"],
    cssVariables: `--color-bg: #0d1f0d; --color-surface: #1a3a1a; --color-primary: #c9a227; --color-secondary: #4a7c4a; --color-text: #e8e4d9; --color-text-muted: #8a9a8a;`,
    keywords: ["nature", "forest", "luxury", "mysterious", "dark", "botanical", "green", "gold", "premium", "outdoors", "adventure"],
  },
  {
    name: "Soft Blush",
    description: "Gentle pinks and peaches with cream base. Feminine, soft, approachable.",
    palette: ["#fff9f7", "#ffeae3", "#e8a598", "#d4847a", "#3d3d3d"],
    cssVariables: `--color-bg: #fff9f7; --color-surface: #ffeae3; --color-primary: #d4847a; --color-secondary: #e8a598; --color-text: #3d3d3d; --color-text-muted: #7a7a7a;`,
    keywords: ["feminine", "soft", "beauty", "skincare", "makeup", "wellness", "self-care", "romantic", "gentle", "blush", "pink", "peach"],
  },
  {
    name: "Arctic Mono",
    description: "Cool grays and whites with ice blue accent. Clean, professional, minimal.",
    palette: ["#fafbfc", "#e1e4e8", "#0366d6", "#586069", "#24292e"],
    cssVariables: `--color-bg: #fafbfc; --color-surface: #ffffff; --color-primary: #0366d6; --color-secondary: #586069; --color-text: #24292e; --color-text-muted: #6a737d;`,
    keywords: ["professional", "corporate", "clean", "minimal", "business", "tech", "saas", "enterprise", "consulting", "finance"],
  },
  {
    name: "Sunset Gradient",
    description: "Warm oranges flowing to deep purples. Dynamic, energetic, creative.",
    palette: ["#1a1a2e", "#ff6b35", "#f7c59f", "#7b2cbf", "#efefef"],
    cssVariables: `--color-bg: #1a1a2e; --color-surface: #252542; --color-primary: #ff6b35; --color-secondary: #7b2cbf; --color-text: #efefef; --color-text-muted: #a0a0b0;`,
    keywords: ["creative", "energetic", "dynamic", "vibrant", "sunset", "gradient", "colorful", "artistic", "bold", "warm"],
  },
  {
    name: "Matcha Cream",
    description: "Soft sage green with warm cream. Calm, zen-like, contemporary.",
    palette: ["#f5f5eb", "#e8ebe0", "#7d9a6a", "#5c7a4a", "#2e2e28"],
    cssVariables: `--color-bg: #f5f5eb; --color-surface: #ffffff; --color-primary: #7d9a6a; --color-secondary: #5c7a4a; --color-text: #2e2e28; --color-text-muted: #6b6b5a;`,
    keywords: ["calm", "zen", "wellness", "yoga", "meditation", "organic", "natural", "health", "green", "peaceful", "sustainable"],
  },
  {
    name: "Obsidian Gold",
    description: "Rich black with luxurious gold accents. Premium, exclusive, sophisticated.",
    palette: ["#0a0a0a", "#1a1a1a", "#d4af37", "#b8962e", "#f5f5f5"],
    cssVariables: `--color-bg: #0a0a0a; --color-surface: #1a1a1a; --color-primary: #d4af37; --color-secondary: #b8962e; --color-text: #f5f5f5; --color-text-muted: #8a8a8a;`,
    keywords: ["luxury", "premium", "gold", "exclusive", "vip", "high-end", "elegant", "sophisticated", "black", "rich", "jewelry"],
  },
  {
    name: "Ocean Depths",
    description: "Deep teals and navy with seafoam highlights. Calming, professional, trustworthy.",
    palette: ["#0d2137", "#164050", "#4ecdc4", "#1a936f", "#f7fff7"],
    cssVariables: `--color-bg: #0d2137; --color-surface: #164050; --color-primary: #4ecdc4; --color-secondary: #1a936f; --color-text: #f7fff7; --color-text-muted: #8ab4b4;`,
    keywords: ["ocean", "sea", "calm", "trustworthy", "professional", "travel", "surf", "beach", "marine", "water", "blue", "teal"],
  },
  {
    name: "Lavender Haze",
    description: "Soft purples and lilacs on light base. Dreamy, creative, gentle.",
    palette: ["#faf8ff", "#e8e0f0", "#9381ff", "#7161a8", "#2d2d3a"],
    cssVariables: `--color-bg: #faf8ff; --color-surface: #ffffff; --color-primary: #9381ff; --color-secondary: #7161a8; --color-text: #2d2d3a; --color-text-muted: #6b6b7a;`,
    keywords: ["dreamy", "creative", "gentle", "spiritual", "mystical", "purple", "lavender", "soft", "ethereal", "magical"],
  },
  {
    name: "Burnt Studio",
    description: "Charcoal with burnt orange and amber. Creative professional, warm industrial.",
    palette: ["#1f1f1f", "#2d2d2d", "#e85d04", "#f48c06", "#fafafa"],
    cssVariables: `--color-bg: #1f1f1f; --color-surface: #2d2d2d; --color-primary: #e85d04; --color-secondary: #f48c06; --color-text: #fafafa; --color-text-muted: #9a9a9a;`,
    keywords: ["creative", "studio", "photography", "film", "video", "production", "industrial", "warm", "orange", "amber", "media"],
  },
  {
    name: "Cotton Candy",
    description: "Playful pastels - pink, blue, mint on white. Youthful, fun, lighthearted.",
    palette: ["#ffffff", "#fff0f5", "#ffb6c1", "#87ceeb", "#2d2d2d"],
    cssVariables: `--color-bg: #ffffff; --color-surface: #fff0f5; --color-primary: #ffb6c1; --color-secondary: #87ceeb; --color-text: #2d2d2d; --color-text-muted: #6b6b6b;`,
    keywords: ["playful", "fun", "youthful", "kids", "pastel", "cute", "sweet", "kawaii", "cheerful", "party", "young"],
  },
  {
    name: "Industrial Steel",
    description: "Cool grays with rust accent. Raw, honest, utilitarian.",
    palette: ["#e8e8e8", "#d0d0d0", "#8b4513", "#666666", "#1a1a1a"],
    cssVariables: `--color-bg: #e8e8e8; --color-surface: #f5f5f5; --color-primary: #8b4513; --color-secondary: #666666; --color-text: #1a1a1a; --color-text-muted: #555555;`,
    keywords: ["industrial", "raw", "honest", "utilitarian", "manufacturing", "construction", "metal", "steel", "workshop", "maker"],
  },
  {
    name: "Moss & Stone",
    description: "Muted olive and warm gray. Natural, timeless, understated.",
    palette: ["#f0ebe3", "#e6dfd4", "#606c38", "#8a8a7a", "#283618"],
    cssVariables: `--color-bg: #f0ebe3; --color-surface: #faf7f2; --color-primary: #606c38; --color-secondary: #8a8a7a; --color-text: #283618; --color-text-muted: #5a5a4a;`,
    keywords: ["natural", "timeless", "understated", "earthy", "organic", "sustainable", "eco", "minimal", "neutral", "muted"],
  },
];

// =====================================================
// Layout Archetypes
// =====================================================

interface LayoutArchetype {
  name: string;
  description: string;
  characteristics: string[];
  keywords: string[];
}

const LAYOUT_ARCHETYPES: LayoutArchetype[] = [
  {
    name: "Editorial Grid",
    description: "Magazine-inspired layout with clear columns, pull quotes, and deliberate negative space.",
    characteristics: [
      "Multi-column grid system (3-4 columns)",
      "Large pull quotes or highlighted text",
      "Generous margins and gutters",
      "Mixed content widths within sections",
      "Clear typographic hierarchy",
    ],
    keywords: ["editorial", "magazine", "journalism", "blog", "content", "writer", "publication", "media", "news", "article"],
  },
  {
    name: "Asymmetric Flow",
    description: "Off-balance compositions that create visual tension and guide the eye unexpectedly.",
    characteristics: [
      "Elements positioned off-center",
      "Overlapping content areas",
      "Varied section heights",
      "Text wrapping around irregular shapes",
      "Diagonal or angled dividers",
    ],
    keywords: ["creative", "artistic", "unique", "dynamic", "unconventional", "experimental", "avant-garde", "designer", "art"],
  },
  {
    name: "Full-Bleed Immersive",
    description: "Edge-to-edge imagery and content that creates a cinematic, immersive experience.",
    characteristics: [
      "Hero sections spanning full viewport",
      "Images bleeding to edges",
      "Minimal visible containers",
      "Content overlaid on imagery",
      "Seamless section transitions",
    ],
    keywords: ["immersive", "cinematic", "photography", "visual", "video", "film", "stunning", "dramatic", "impactful", "portfolio"],
  },
  {
    name: "Brutalist Blocks",
    description: "Bold, chunky sections with stark borders and unapologetic structure.",
    characteristics: [
      "Thick visible borders and outlines",
      "Harsh color blocks",
      "Boxy, geometric sections",
      "Visible grid structure",
      "No rounded corners",
    ],
    keywords: ["brutalist", "bold", "raw", "edgy", "punk", "alternative", "stark", "harsh", "industrial", "grunge"],
  },
  {
    name: "Minimal Scroll",
    description: "Long single-column flow with generous whitespace and focused content.",
    characteristics: [
      "Single centered column",
      "Very generous vertical spacing",
      "One idea per viewport",
      "Subtle scroll indicators",
      "Maximum readability",
    ],
    keywords: ["minimal", "clean", "simple", "focused", "zen", "calm", "elegant", "refined", "understated", "whitespace"],
  },
  {
    name: "Card Mosaic",
    description: "Playful arrangement of cards in varied sizes creating a dynamic, Pinterest-like feel.",
    characteristics: [
      "Masonry or varied-size grid",
      "Cards with distinct boundaries",
      "Mixed card sizes and orientations",
      "Hover interactions on cards",
      "Organic-feeling arrangement",
    ],
    keywords: ["creative", "portfolio", "gallery", "showcase", "projects", "work", "collection", "diverse", "variety", "visual"],
  },
  {
    name: "Split Screen",
    description: "Bold 50/50 or asymmetric splits that create visual dialogue between content.",
    characteristics: [
      "Vertical splits dividing viewport",
      "Contrasting content on each side",
      "Fixed/scroll interactions between halves",
      "Color contrast between splits",
      "Responsive collapse behavior",
    ],
    keywords: ["contrast", "dual", "comparison", "before-after", "storytelling", "narrative", "bold", "impactful", "dramatic"],
  },
  {
    name: "Layered Depth",
    description: "Overlapping elements and z-depth creating a sense of 3D space.",
    characteristics: [
      "Stacked, overlapping cards/images",
      "Drop shadows for elevation",
      "Parallax depth effects",
      "Elements breaking out of containers",
      "Foreground/background interplay",
    ],
    keywords: ["depth", "3d", "layered", "dimensional", "parallax", "immersive", "rich", "complex", "sophisticated"],
  },
  {
    name: "Horizontal Journey",
    description: "Side-scrolling sections or strong horizontal emphasis breaking vertical monotony.",
    characteristics: [
      "Horizontal scroll sections",
      "Wide panoramic content areas",
      "Side-scrolling carousels",
      "Horizontal progress indicators",
      "Landscape-oriented compositions",
    ],
    keywords: ["journey", "story", "timeline", "process", "horizontal", "unique", "different", "creative", "unconventional"],
  },
  {
    name: "Bento Grid",
    description: "Japanese-inspired organized compartments with varied content types perfectly arranged.",
    characteristics: [
      "Tight, varied-size grid cells",
      "Mixed content types in cells",
      "Clean separation between items",
      "Organized chaos aesthetic",
      "Responsive cell reflow",
    ],
    keywords: ["organized", "structured", "grid", "modular", "tech", "dashboard", "modern", "systematic", "clean", "japanese"],
  },
];

// =====================================================
// Animation Styles
// =====================================================

interface AnimationStyle {
  name: string;
  description: string;
  techniques: string[];
  keywords: string[];
}

const ANIMATION_STYLES: AnimationStyle[] = [
  {
    name: "Cinematic Reveal",
    description: "Dramatic, sequenced entrance animations like a film opening.",
    techniques: [
      "Staggered fade-up animations with significant delays (100-200ms between elements)",
      "Slow, sweeping transitions (800ms-1200ms duration)",
      "Clip-path reveals and mask animations",
      "Scale from 0.95 to 1 for subtle zoom effect",
      "Orchestrated load sequence",
    ],
    keywords: ["cinematic", "dramatic", "film", "video", "production", "storytelling", "epic", "premium", "luxury", "elegant"],
  },
  {
    name: "Playful Bounce",
    description: "Fun, springy animations with personality and energy.",
    techniques: [
      "Elastic easing (cubic-bezier with overshoot)",
      "Bounce effects on hover",
      "Wobble animations on interactions",
      "Playful loading states",
      "Elements that react to each other",
    ],
    keywords: ["playful", "fun", "energetic", "youthful", "creative", "quirky", "friendly", "casual", "entertainment", "kids"],
  },
  {
    name: "Subtle Whisper",
    description: "Nearly imperceptible animations that add polish without distraction.",
    techniques: [
      "Very short durations (150-300ms)",
      "Small transform values (5-10px, 2-5%)",
      "Opacity changes (0.7 to 1)",
      "Gentle color transitions",
      "Micro-interactions only on direct engagement",
    ],
    keywords: ["subtle", "minimal", "refined", "elegant", "professional", "sophisticated", "quiet", "calm", "understated"],
  },
  {
    name: "Parallax Depth",
    description: "Layered movement speeds creating depth and dimension.",
    techniques: [
      "Multiple scroll-speed layers",
      "Background moves slower than foreground",
      "Floating elements with different rates",
      "3D transform perspective effects",
      "Mouse-follow parallax on hero",
    ],
    keywords: ["immersive", "depth", "3d", "dimensional", "visual", "rich", "engaging", "interactive", "dynamic"],
  },
  {
    name: "Kinetic Typography",
    description: "Text that animates character-by-character or word-by-word.",
    techniques: [
      "Split text into spans for individual animation",
      "Character-by-character reveals",
      "Word-by-word fade or slide",
      "Animated underlines and highlights",
      "Text scramble or typewriter effects",
    ],
    keywords: ["typography", "text", "writer", "content", "editorial", "words", "creative", "unique", "artistic", "expressive"],
  },
  {
    name: "Morph & Flow",
    description: "Smooth shape and color transitions creating fluid, organic movement.",
    techniques: [
      "CSS shape morphing with border-radius",
      "Gradient position animations",
      "Blob-like organic shapes",
      "Smooth color cycling",
      "Flowing SVG path animations",
    ],
    keywords: ["organic", "fluid", "smooth", "natural", "flowing", "soft", "gentle", "wellness", "artistic", "creative"],
  },
  {
    name: "Snap & Pop",
    description: "Quick, decisive animations with instant feedback.",
    techniques: [
      "Very fast transitions (100-200ms)",
      "Step easing for mechanical feel",
      "Instant color changes",
      "Click ripple effects",
      "Snappy hover state changes",
    ],
    keywords: ["snappy", "fast", "responsive", "tech", "modern", "efficient", "direct", "bold", "confident", "energetic"],
  },
  {
    name: "Scroll-Triggered Theater",
    description: "Animations that perform as user scrolls through the page.",
    techniques: [
      "Intersection Observer for triggers",
      "Elements animate in as they enter viewport",
      "Progress-linked animations",
      "Sticky elements with scroll-driven changes",
      "Section-based scene changes",
    ],
    keywords: ["storytelling", "narrative", "journey", "experience", "interactive", "engaging", "immersive", "dynamic", "scroll"],
  },
];

// =====================================================
// Visual Textures
// =====================================================

interface VisualTexture {
  name: string;
  description: string;
  techniques: string[];
  keywords: string[];
}

const VISUAL_TEXTURES: VisualTexture[] = [
  {
    name: "Grain & Noise",
    description: "Film grain or noise overlay adding organic, analog warmth.",
    techniques: [
      "SVG noise filter overlay",
      "CSS backdrop noise using tiny gradient",
      "Animated grain for video feel",
      "Noise in gradients",
      "Textured backgrounds",
    ],
    keywords: ["film", "analog", "vintage", "organic", "warm", "photography", "artistic", "retro", "textured", "raw"],
  },
  {
    name: "Gradient Mesh",
    description: "Complex, multi-point gradients creating depth and atmosphere.",
    techniques: [
      "Multiple layered radial gradients",
      "Gradient orbs/blobs positioned absolutely",
      "Animated gradient positions",
      "Mesh-like color blending",
      "Gradient borders and accents",
    ],
    keywords: ["modern", "vibrant", "colorful", "dynamic", "creative", "bold", "contemporary", "tech", "startup", "gradient"],
  },
  {
    name: "Geometric Patterns",
    description: "Repeating shapes creating rhythm and visual interest.",
    techniques: [
      "CSS repeating patterns",
      "SVG pattern fills",
      "Dotted or lined backgrounds",
      "Grid overlays",
      "Decorative geometric borders",
    ],
    keywords: ["geometric", "pattern", "structured", "rhythmic", "graphic", "design", "systematic", "architectural", "grid"],
  },
  {
    name: "Glass & Blur",
    description: "Frosted glass effects with backdrop blur and transparency.",
    techniques: [
      "backdrop-filter: blur()",
      "Semi-transparent surfaces",
      "Layered translucent cards",
      "Glassmorphism containers",
      "Blurred background sections",
    ],
    keywords: ["modern", "sleek", "tech", "futuristic", "clean", "glass", "transparent", "ios", "apple", "premium"],
  },
  {
    name: "Sharp & Flat",
    description: "Clean solid colors with no gradients or textures. Pure and minimal.",
    techniques: [
      "Solid color blocks only",
      "No gradients or shadows",
      "High contrast boundaries",
      "Flat illustration style",
      "Color as the only texture",
    ],
    keywords: ["minimal", "flat", "clean", "simple", "modern", "graphic", "bold", "stark", "pure", "focused"],
  },
  {
    name: "Shadow Play",
    description: "Dramatic shadows creating depth, dimension, and drama.",
    techniques: [
      "Large, soft drop shadows",
      "Layered multiple shadows",
      "Colored shadows matching palette",
      "Inner shadows for depth",
      "Shadow-based hierarchy",
    ],
    keywords: ["depth", "dimensional", "elegant", "sophisticated", "layered", "rich", "dramatic", "premium", "luxury"],
  },
  {
    name: "Line Art Accents",
    description: "Thin decorative lines and strokes as visual elements.",
    techniques: [
      "Decorative divider lines",
      "Outlined shapes and icons",
      "Border-based decorations",
      "Animated line draws",
      "Minimal stroke illustrations",
    ],
    keywords: ["minimal", "refined", "elegant", "delicate", "artistic", "illustration", "graphic", "linear", "outline"],
  },
  {
    name: "Duotone Imagery",
    description: "Images processed with two-color treatment for cohesive style.",
    techniques: [
      "CSS filter combinations for duotone",
      "mix-blend-mode overlays",
      "Consistent image treatment",
      "Brand colors applied to photos",
      "High contrast image style",
    ],
    keywords: ["bold", "graphic", "cohesive", "brand", "stylized", "artistic", "editorial", "striking", "consistent"],
  },
];

// =====================================================
// Theme Modes
// =====================================================

interface ThemeMode {
  name: string;
  description: string;
  characteristics: string[];
  keywords: string[];
}

const THEME_MODES: ThemeMode[] = [
  {
    name: "Dark Dominant",
    description: "Primarily dark backgrounds with light text. Dramatic and immersive.",
    characteristics: [
      "Dark background (near black or deep color)",
      "Light text for contrast",
      "Accent colors pop against dark",
      "Images may have dark overlays",
      "Moody, cinematic feel",
    ],
    keywords: ["dark", "moody", "dramatic", "cinematic", "night", "bold", "mysterious", "edgy", "sleek", "premium", "gaming", "tech"],
  },
  {
    name: "Light & Airy",
    description: "Predominantly white/cream backgrounds. Clean and open.",
    characteristics: [
      "White or very light backgrounds",
      "Dark text for readability",
      "Subtle color accents",
      "Generous whitespace",
      "Fresh, minimal aesthetic",
    ],
    keywords: ["light", "clean", "fresh", "minimal", "airy", "open", "bright", "simple", "professional", "calm", "wellness"],
  },
  {
    name: "Tinted Atmosphere",
    description: "Colored background creating a distinct atmosphere throughout.",
    characteristics: [
      "Saturated or tinted background color",
      "Cohesive color story",
      "Text color chosen for that background",
      "Immersive color experience",
      "Strong brand color presence",
    ],
    keywords: ["colorful", "vibrant", "bold", "unique", "branded", "immersive", "artistic", "expressive", "distinctive"],
  },
  {
    name: "High Contrast Mix",
    description: "Alternating between very dark and very light sections.",
    characteristics: [
      "Sections alternate dark/light",
      "Strong visual rhythm",
      "Each section distinct",
      "Dramatic transitions between sections",
      "Dynamic visual journey",
    ],
    keywords: ["dynamic", "contrast", "bold", "varied", "energetic", "diverse", "impactful", "dramatic", "sections"],
  },
];

// =====================================================
// Keyword Matching & Selection Logic
// =====================================================

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function calculateMatchScore<T extends { keywords: string[] }>(
  item: T,
  normalizedInput: string
): number {
  let score = 0;
  for (const keyword of item.keywords) {
    // Check for exact word match or partial match
    if (normalizedInput.includes(keyword)) {
      // Exact word boundary match scores higher
      const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`);
      if (wordBoundaryRegex.test(normalizedInput)) {
        score += 3;
      } else {
        score += 1;
      }
    }
  }
  return score;
}

function selectBestMatch<T extends { keywords: string[] }>(
  items: T[],
  normalizedInput: string
): T {
  // Calculate scores for all items
  const scored = items.map((item) => ({
    item,
    score: calculateMatchScore(item, normalizedInput),
  }));

  // Find maximum score
  const maxScore = Math.max(...scored.map((s) => s.score));

  // If no meaningful matches (score 0), return random
  if (maxScore === 0) {
    return items[Math.floor(Math.random() * items.length)];
  }

  // Get all items with the max score (could be ties)
  const topMatches = scored.filter((s) => s.score === maxScore);

  // Randomly select among top matches for variety
  return topMatches[Math.floor(Math.random() * topMatches.length)].item;
}

// =====================================================
// Main Generator Function
// =====================================================

/**
 * Generates a style directive informed by the user's questionnaire input.
 * Analyzes the user's vision, brand preferences, and examples to select
 * appropriate styles. Falls back to random selection when no clear preference.
 */
export function generateStyleDirective(userInput?: UserStyleInput): StyleDirective {
  // If no user input, fall back to random selection
  if (!userInput) {
    return {
      typography: TYPOGRAPHY_PAIRINGS[Math.floor(Math.random() * TYPOGRAPHY_PAIRINGS.length)],
      colorMood: COLOR_MOODS[Math.floor(Math.random() * COLOR_MOODS.length)],
      layoutArchetype: LAYOUT_ARCHETYPES[Math.floor(Math.random() * LAYOUT_ARCHETYPES.length)],
      animationStyle: ANIMATION_STYLES[Math.floor(Math.random() * ANIMATION_STYLES.length)],
      visualTexture: VISUAL_TEXTURES[Math.floor(Math.random() * VISUAL_TEXTURES.length)],
      themeMode: THEME_MODES[Math.floor(Math.random() * THEME_MODES.length)],
    };
  }

  // Combine all user input into a single searchable string
  const combinedInput = [
    userInput.portfolioVision || "",
    userInput.inspiringBrands || "",
    userInput.portfolioExamples || "",
  ].join(" ");

  const normalizedInput = normalizeText(combinedInput);

  // Select best match for each category based on user input
  return {
    typography: selectBestMatch(TYPOGRAPHY_PAIRINGS, normalizedInput),
    colorMood: selectBestMatch(COLOR_MOODS, normalizedInput),
    layoutArchetype: selectBestMatch(LAYOUT_ARCHETYPES, normalizedInput),
    animationStyle: selectBestMatch(ANIMATION_STYLES, normalizedInput),
    visualTexture: selectBestMatch(VISUAL_TEXTURES, normalizedInput),
    themeMode: selectBestMatch(THEME_MODES, normalizedInput),
  };
}

// =====================================================
// Format for Prompt Injection
// =====================================================

export function formatStyleDirectiveForPrompt(
  directive: StyleDirective,
  userInput?: UserStyleInput
): string {
  const preamble = userInput
    ? `Based on your vision and preferences, we've selected these specific style parameters to create a unique portfolio that matches your aesthetic:`
    : `These specific style parameters have been selected to create a unique portfolio:`;

  return `## 🎨 STYLE DIRECTIVE

${preamble}

### Typography: "${directive.typography.name}"
- **Display Font:** ${directive.typography.displayFont} (Google Fonts)
- **Body Font:** ${directive.typography.bodyFont} (Google Fonts)
- ${directive.typography.description}

### Color Mood: "${directive.colorMood.name}"
- ${directive.colorMood.description}
- **Palette:** ${directive.colorMood.palette.join(", ")}
- **Use these CSS variables:**
\`\`\`css
:root {
  ${directive.colorMood.cssVariables}
}
\`\`\`

### Layout: "${directive.layoutArchetype.name}"
- ${directive.layoutArchetype.description}
- Key characteristics:
${directive.layoutArchetype.characteristics.map((c) => `  - ${c}`).join("\n")}

### Animation: "${directive.animationStyle.name}"
- ${directive.animationStyle.description}
- Techniques to use:
${directive.animationStyle.techniques.map((t) => `  - ${t}`).join("\n")}

### Visual Texture: "${directive.visualTexture.name}"
- ${directive.visualTexture.description}
- Implementation:
${directive.visualTexture.techniques.map((t) => `  - ${t}`).join("\n")}

### Theme: "${directive.themeMode.name}"
- ${directive.themeMode.description}
- Apply these principles:
${directive.themeMode.characteristics.map((c) => `  - ${c}`).join("\n")}

---

**IMPORTANT:** These style choices are tailored to the creator's vision. Implement them faithfully while adapting to the specific content. You may make minor adjustments to ensure the styles work well together, but maintain the core aesthetic direction.`;
}
