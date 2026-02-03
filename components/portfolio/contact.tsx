import { Instagram, Mail, ArrowUpRight, Youtube, Twitter, Linkedin, Globe } from "lucide-react";
import { getSocialUrl, type CreatorData } from "@/lib/portfolio/creator-data";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function getSocialIcon(platform: string, className: string) {
  switch (platform) {
    case "instagram":
      return <Instagram className={className} />;
    case "tiktok":
      return <TikTokIcon className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "twitter":
      return <Twitter className={className} />;
    case "linkedin":
      return <Linkedin className={className} />;
    default:
      return <Globe className={className} />;
  }
}

function getPlatformLabel(platform: string): string {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "twitter":
      return "X / Twitter";
    case "linkedin":
      return "LinkedIn";
    default:
      return "Website";
  }
}

export function Contact({ creator }: { creator: CreatorData }) {
  const { name, email, location, niche, socialHandles } = creator;
  const currentYear = new Date().getFullYear();

  return (
    <section id="contact" className="border-t border-border px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Contact
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
              {"Let's work together"}
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Interested in collaborating? I&apos;d love to hear about your brand and discuss how we
              can create something authentic together.
            </p>

            <a
              href={`mailto:${email}`}
              className="mt-8 inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Mail className="h-4 w-4" />
              {email}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <a
                href={`mailto:${email}`}
                className="mt-1 text-foreground hover:text-primary transition-colors"
              >
                {email}
              </a>
            </div>

            {socialHandles.map((social) => (
              <div key={`${social.platform}-${social.handle}`}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {getPlatformLabel(social.platform)}
                </p>
                <a
                  href={getSocialUrl(social)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                >
                  {getSocialIcon(social.platform, "h-4 w-4")}
                  {social.handle}
                </a>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-16 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {name}. All rights reserved.
          </p>
          {location && (
            <p className="text-sm text-muted-foreground">
              {niche} Creator{location ? ` Based in ${location}` : ""}
            </p>
          )}
        </footer>
      </div>
    </section>
  );
}
