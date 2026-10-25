export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ugc.community/#organization",
      name: "ugc.community",
      url: "https://ugc.community/",
      email: "cody@isolated.tech",
      address: {
        "@type": "PostalAddress",
        streetAddress: "76-6182 Lehua Rd",
        addressLocality: "Kailua-Kona",
        addressRegion: "HI",
        postalCode: "96740",
        addressCountry: "US",
      },
      contactPoint: { "@type": "ContactPoint", email: "cody@isolated.tech", contactType: "customer support", url: "https://ugc.community/contact", availableLanguage: "English" },
    },
    {
      "@type": "WebApplication",
      "@id": "https://ugc.community/#app",
      name: "ugc.community",
      url: "https://ugc.community/",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "A searchable UGC job board with reviewed external opportunities and free brand submissions.",
      provider: { "@id": "https://ugc.community/#organization" },
      featureList: [
        "Searchable UGC opportunities",
        "Free job submissions with manual review",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://ugc.community/#website",
      name: "ugc.community",
      url: "https://ugc.community/",
      publisher: { "@id": "https://ugc.community/#organization" },
    },
  ],
};

