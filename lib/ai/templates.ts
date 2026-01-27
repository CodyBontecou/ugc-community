// Portfolio Templates for AI Generation
// Each template defines structure, default styling, and section layout

export interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji or icon identifier
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontStyle: "modern" | "classic" | "playful" | "minimal" | "bold";
  };
  sections: {
    type: string;
    order: number;
    defaultContent: Record<string, unknown>;
    styles: Record<string, string>;
  }[];
}

export const templates: PortfolioTemplate[] = [
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Clean and professional with focus on your work",
    preview: "minimal",
    theme: {
      primaryColor: "#FF6B95",
      secondaryColor: "#A855F7",
      backgroundColor: "#FFFBF9",
      fontStyle: "modern",
    },
    sections: [
      {
        type: "hero",
        order: 0,
        defaultContent: {
          layout: "centered",
          showAvatar: true,
        },
        styles: {
          padding: "80px 0",
          textAlign: "center",
        },
      },
      {
        type: "about",
        order: 1,
        defaultContent: {
          layout: "split",
        },
        styles: {
          padding: "60px 0",
          backgroundColor: "#FFFFFF",
        },
      },
      {
        type: "work",
        order: 2,
        defaultContent: {
          layout: "grid",
          columns: 3,
        },
        styles: {
          padding: "60px 0",
        },
      },
      {
        type: "contact",
        order: 3,
        defaultContent: {
          layout: "simple",
        },
        styles: {
          padding: "80px 0",
          backgroundColor: "#FF6B95",
          textColor: "#FFFFFF",
        },
      },
    ],
  },
  {
    id: "bold-creative",
    name: "Bold Creative",
    description: "Stand out with vibrant colors and dynamic layouts",
    preview: "bold",
    theme: {
      primaryColor: "#7C3AED",
      secondaryColor: "#FF9A8B",
      backgroundColor: "#1A1614",
      fontStyle: "bold",
    },
    sections: [
      {
        type: "hero",
        order: 0,
        defaultContent: {
          layout: "fullscreen",
          showAvatar: true,
        },
        styles: {
          padding: "120px 0",
          textAlign: "left",
        },
      },
      {
        type: "work",
        order: 1,
        defaultContent: {
          layout: "masonry",
          columns: 2,
        },
        styles: {
          padding: "80px 0",
        },
      },
      {
        type: "about",
        order: 2,
        defaultContent: {
          layout: "narrative",
        },
        styles: {
          padding: "80px 0",
          backgroundColor: "#2D2723",
        },
      },
      {
        type: "contact",
        order: 3,
        defaultContent: {
          layout: "cta-focused",
        },
        styles: {
          padding: "100px 0",
        },
      },
    ],
  },
  {
    id: "soft-elegant",
    name: "Soft & Elegant",
    description: "Warm tones and gentle aesthetics for lifestyle creators",
    preview: "elegant",
    theme: {
      primaryColor: "#FF9A8B",
      secondaryColor: "#C4B5FD",
      backgroundColor: "#FDF9F7",
      fontStyle: "classic",
    },
    sections: [
      {
        type: "hero",
        order: 0,
        defaultContent: {
          layout: "editorial",
          showAvatar: true,
        },
        styles: {
          padding: "100px 0",
          textAlign: "center",
        },
      },
      {
        type: "about",
        order: 1,
        defaultContent: {
          layout: "story",
        },
        styles: {
          padding: "80px 0",
        },
      },
      {
        type: "work",
        order: 2,
        defaultContent: {
          layout: "carousel",
          columns: 1,
        },
        styles: {
          padding: "60px 0",
          backgroundColor: "#FFFFFF",
        },
      },
      {
        type: "testimonials",
        order: 3,
        defaultContent: {
          layout: "quotes",
        },
        styles: {
          padding: "60px 0",
        },
      },
      {
        type: "contact",
        order: 4,
        defaultContent: {
          layout: "elegant",
        },
        styles: {
          padding: "80px 0",
        },
      },
    ],
  },
  {
    id: "vibrant-energy",
    name: "Vibrant Energy",
    description: "Energetic and fun for dynamic content creators",
    preview: "playful",
    theme: {
      primaryColor: "#6EE7B7",
      secondaryColor: "#FF6B95",
      backgroundColor: "#FFFBF9",
      fontStyle: "playful",
    },
    sections: [
      {
        type: "hero",
        order: 0,
        defaultContent: {
          layout: "dynamic",
          showAvatar: true,
        },
        styles: {
          padding: "80px 0",
        },
      },
      {
        type: "stats",
        order: 1,
        defaultContent: {
          layout: "horizontal",
        },
        styles: {
          padding: "40px 0",
          backgroundColor: "#6EE7B7",
        },
      },
      {
        type: "work",
        order: 2,
        defaultContent: {
          layout: "showcase",
          columns: 2,
        },
        styles: {
          padding: "60px 0",
        },
      },
      {
        type: "about",
        order: 3,
        defaultContent: {
          layout: "casual",
        },
        styles: {
          padding: "60px 0",
        },
      },
      {
        type: "contact",
        order: 4,
        defaultContent: {
          layout: "friendly",
        },
        styles: {
          padding: "80px 0",
        },
      },
    ],
  },
  {
    id: "professional-focus",
    name: "Professional Focus",
    description: "Business-oriented layout to attract brand partnerships",
    preview: "professional",
    theme: {
      primaryColor: "#453D37",
      secondaryColor: "#7DD3FC",
      backgroundColor: "#FFFFFF",
      fontStyle: "minimal",
    },
    sections: [
      {
        type: "hero",
        order: 0,
        defaultContent: {
          layout: "professional",
          showAvatar: true,
        },
        styles: {
          padding: "60px 0",
          textAlign: "left",
        },
      },
      {
        type: "services",
        order: 1,
        defaultContent: {
          layout: "cards",
        },
        styles: {
          padding: "60px 0",
          backgroundColor: "#FAF7F5",
        },
      },
      {
        type: "work",
        order: 2,
        defaultContent: {
          layout: "portfolio",
          columns: 3,
        },
        styles: {
          padding: "60px 0",
        },
      },
      {
        type: "brands",
        order: 3,
        defaultContent: {
          layout: "logo-grid",
        },
        styles: {
          padding: "40px 0",
        },
      },
      {
        type: "about",
        order: 4,
        defaultContent: {
          layout: "professional",
        },
        styles: {
          padding: "60px 0",
        },
      },
      {
        type: "contact",
        order: 5,
        defaultContent: {
          layout: "business",
        },
        styles: {
          padding: "60px 0",
          backgroundColor: "#453D37",
          textColor: "#FFFFFF",
        },
      },
    ],
  },
];

export function getTemplate(id: string): PortfolioTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function getDefaultTemplate(): PortfolioTemplate {
  return templates[0];
}
