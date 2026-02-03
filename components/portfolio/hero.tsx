import { Instagram, Mail, Youtube, Twitter, Linkedin, Globe } from "lucide-react";
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

export function Hero({ creator }: { creator: CreatorData }) {
  const { name, tagline, bio, email, socialHandles, brandPartnerships } = creator;
  const primarySocial = socialHandles[0];
  const featuredBrands = brandPartnerships.slice(0, 2).map((b) => b.name);

  return (
    <section className="px-6 py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-16">
          <div className="flex-1">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Media Kit
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
              {name}
            </h1>
            {tagline && <p className="mt-2 text-lg text-primary font-medium">{tagline}</p>}
            <p className="mt-6 text-base leading-relaxed text-muted-foreground max-w-lg">
              {bio}
            </p>
            {featuredBrands.length > 0 && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-lg">
                Partnered with brands like{" "}
                {featuredBrands.map((brand, i) => (
                  <span key={brand}>
                    <span className="text-foreground font-medium">{brand}</span>
                    {i < featuredBrands.length - 1 && " and "}
                  </span>
                ))}
                .
              </p>
            )}

            <div className="mt-8 flex items-center gap-6">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Mail className="h-4 w-4" />
                Get in Touch
              </a>
              {primarySocial && (
                <a
                  href={getSocialUrl(primarySocial)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {getSocialIcon(primarySocial.platform, "h-4 w-4")}
                  {primarySocial.handle}
                </a>
              )}
            </div>
          </div>

          <nav className="hidden md:flex flex-col gap-3 text-sm">
            <span className="w-12 h-px bg-border" />
            <a
              href="#stats"
              className="uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Stats
            </a>
            <a
              href="#brands"
              className="uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Brands
            </a>
            <a
              href="#videos"
              className="uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Content
            </a>
            <a
              href="#services"
              className="uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Services
            </a>
            <a
              href="#contact"
              className="uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </section>
  );
}
