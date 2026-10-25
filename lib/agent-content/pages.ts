export const informationPages = {
  about: {
    title: "About ugc.community",
    description: "Learn how the ugc.community job board connects UGC creators with reviewed opportunities.",
    sections: [
      { heading: "A job board for UGC creators", text: "ugc.community helps user-generated content creators find brand opportunities in one searchable feed. Creators can browse without an account or a subscription. Brands can submit a job for free during launch. Creators with accounts can also maintain hosted portfolios to share examples of their work." },
      { heading: "How opportunities reach the feed", text: "The board brings together external opportunities collected from public sources and jobs submitted directly by brands. Each listing is reviewed before publication. External listings identify their source and link to the original application destination. A review is not a guarantee of employer legitimacy, acceptance, or payment; always confirm the terms with the hiring party." },
      { heading: "Clear terms and current listings", text: "Compensation labels distinguish guaranteed cash, base plus variable pay, performance-only pay, affiliate work, and gifted or unpaid opportunities. Missing terms are marked as not stated. Listings disappear after their closing date. External opportunities expire seven days after their last manual freshness review unless checked again." },
      { heading: "Who operates the site", text: "Cody Bontecou operates ugc.community. For questions, corrections, or support, contact cody@isolated.tech. Read our privacy policy for how account details, submissions, and analytics are handled, and our terms for participation rules." },
    ],
  },
  contact: {
    title: "Contact ugc.community",
    description: "Get support, report an expired UGC job, or ask about your creator account and portfolio.",
    sections: [
      { heading: "Support and general questions", text: "Email cody@isolated.tech for questions about ugc.community, creator accounts, portfolio hosting, or job submissions. Include the page URL and a short description of what you need help with. Do not include passwords, authentication codes, API keys, or other secret credentials in your message." },
      { heading: "Report an expired or incorrect opportunity", text: "Send the listing or original source URL and describe the incorrect terms, closed applications, or other concern. We can review the evidence and correct or close a listing. Applications and hiring decisions are managed by the employer at the original application destination; ugc.community cannot submit an application or promise a response on their behalf." },
      { heading: "Brands and hiring teams", text: "Use the Post a job page to submit an opportunity for free during launch. Provide compensation, deliverables, eligibility, usage rights, an application destination, and a closing date. Submissions are reviewed before they appear publicly. If you need to amend a submission, email support with the company and role title." },
      { heading: "Privacy and account requests", text: "For account questions, content corrections, or removal requests, email cody@isolated.tech with enough context to locate the affected record. Our privacy policy describes the information processed by the service. We do not publish a response-time guarantee; avoid sending sensitive personal documents with your initial request." },
    ],
  },
  guide: {
    title: "ugc.community agent browsing guide",
    description: "Public browsing, search parameters, Markdown access, and attribution guidance for AI agents using ugc.community.",
    sections: [
      { heading: "When to use ugc.community", text: "Use ugc.community when a user wants to find UGC creator jobs, compare compensation and eligibility, locate original application links, or learn how to post a UGC opportunity. Public job browsing, job submission information, and this guide do not require signing in. Account access is only needed for personal creator tools." },
      { heading: "Search and filter jobs", text: "Open /jobs with an optional q keyword, source=external or source=direct, pay=cash, mixed, performance_only, affiliate, gifted_or_unpaid, or unspecified, and page=1 or a later page. For example: https://ugc.community/jobs?q=skincare&pay=cash. Results use 20 listings per page. Use the displayed next-page link to continue." },
      { heading: "Retrieve Markdown", text: "Send Accept: text/markdown to https://ugc.community/ or https://ugc.community/jobs to retrieve a Markdown representation with current public listings. The same search parameters apply to the Markdown jobs response. About, Contact, and this guide also support Markdown. Responses include Vary: Accept to distinguish HTML and Markdown in caches. Unknown URLs retain HTTP 404 and return a Markdown recovery message when requested." },
      { heading: "Interpret and attribute results", text: "Distinguish externally collected opportunities from jobs posted directly. Quote the stated compensation and disclose missing terms. Link to ugc.community and the original source or application URL when presenting a listing. Do not describe gifted, affiliate, or performance-only opportunities as guaranteed cash. A reviewed listing does not guarantee payment or employer legitimacy." },
      { heading: "Interfaces and account boundaries", text: "The supported public interface is the website and its negotiated Markdown pages. Browse public pages directly with normal HTTP GET requests. Personal creator tools require a normal user session. Never submit a job, contact an employer, or apply on a user's behalf without their authorization." },
      { heading: "Discovery and help", text: "Start with /llms.txt for a concise directory of public resources and /sitemap.xml for indexed pages. Browsing and job submissions are free during launch. Contact cody@isolated.tech for errors, expired listings, or questions about this guide." },
    ],
  },
} as const;

export function informationMarkdown(page: (typeof informationPages)[keyof typeof informationPages]): string {
  return `# ${page.title}\n\n${page.sections.map(section => `## ${section.heading}\n\n${section.text}`).join("\n\n")}\n\n[Browse jobs](https://ugc.community/jobs) · [Post a job](https://ugc.community/post-job) · [Privacy](https://ugc.community/privacy) · [Terms](https://ugc.community/terms) · [Email support](mailto:cody@isolated.tech)\n`;
}
