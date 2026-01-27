"use client";

import { motion } from "framer-motion";
import {
  Instagram,
  Youtube,
  Twitter,
  Globe,
  ArrowRight,
  Mail,
} from "lucide-react";
import type {
  Portfolio,
  PortfolioSection,
  Media,
  SectionContent,
  PortfolioTheme,
} from "@/lib/db/schema";

interface PortfolioRendererProps {
  portfolio: Portfolio & {
    sections: PortfolioSection[];
    media: Media[];
  };
  user: {
    name: string;
    image?: string | null;
    bio?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
    twitter?: string | null;
    website?: string | null;
  };
}

// TikTok icon component
function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
        fill="currentColor"
      />
    </svg>
  );
}

function HeroSection({
  section,
  user,
}: {
  section: PortfolioSection;
  user: PortfolioRendererProps["user"];
}) {
  const content = section.content as SectionContent;

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-3xl mx-auto text-center">
        {/* Avatar */}
        {user.image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden shadow-lg"
          >
            <img
              src={user.image}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {!user.image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-3xl font-semibold shadow-lg"
          >
            {user.name.charAt(0)}
          </motion.div>
        )}

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4"
        >
          {content.title || user.name}
        </motion.h1>

        {/* Subtitle */}
        {content.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-warm-gray-600 mb-8"
          >
            {content.subtitle}
          </motion.p>
        )}

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          {user.instagram && (
            <a
              href={`https://instagram.com/${user.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-warm-gray-100 flex items-center justify-center text-warm-gray-600 hover:bg-rose hover:text-white transition-colors"
            >
              <Instagram size={20} />
            </a>
          )}
          {user.tiktok && (
            <a
              href={`https://tiktok.com/@${user.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-warm-gray-100 flex items-center justify-center text-warm-gray-600 hover:bg-warm-gray-900 hover:text-white transition-colors"
            >
              <TikTokIcon size={20} />
            </a>
          )}
          {user.youtube && (
            <a
              href={`https://youtube.com/@${user.youtube}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-warm-gray-100 flex items-center justify-center text-warm-gray-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Youtube size={20} />
            </a>
          )}
          {user.twitter && (
            <a
              href={`https://twitter.com/${user.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-warm-gray-100 flex items-center justify-center text-warm-gray-600 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <Twitter size={20} />
            </a>
          )}
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-warm-gray-100 flex items-center justify-center text-warm-gray-600 hover:bg-lavender hover:text-white transition-colors"
            >
              <Globe size={20} />
            </a>
          )}
        </motion.div>

        {/* CTA */}
        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          href="#contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-full shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] transition-shadow"
        >
          {content.ctaText || "Work With Me"}
          <ArrowRight size={18} />
        </motion.a>
      </div>
    </section>
  );
}

function AboutSection({ section }: { section: PortfolioSection }) {
  const content = section.content as SectionContent;

  return (
    <section className="py-20 px-4 bg-warm-gray-50">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-6 text-center"
        >
          {content.title || "About Me"}
        </motion.h2>
        {content.body && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-warm-gray-600 leading-relaxed text-center whitespace-pre-wrap"
          >
            {content.body}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function WorkSection({
  section,
  media,
}: {
  section: PortfolioSection;
  media: Media[];
}) {
  const content = section.content as SectionContent;
  const sectionMedia = content.mediaIds
    ? media.filter((m) => content.mediaIds?.includes(m.id))
    : media.slice(0, 6);

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-12 text-center"
        >
          {content.title || "My Work"}
        </motion.h2>

        {sectionMedia.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectionMedia.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="aspect-[9/16] rounded-[--radius-xl] overflow-hidden bg-warm-gray-100 shadow-md hover:shadow-xl transition-shadow"
              >
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    poster={item.thumbnailUrl || undefined}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.metadata?.alt || item.originalFilename}
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-warm-gray-500 py-12">
            <p>Content coming soon...</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ContactSection({ section }: { section: PortfolioSection }) {
  const content = section.content as SectionContent;

  return (
    <section id="contact" className="py-20 px-4 bg-warm-gray-50">
      <div className="max-w-xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4"
        >
          {content.title || "Let's Work Together"}
        </motion.h2>
        {content.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-warm-gray-600 mb-8"
          >
            {content.subtitle}
          </motion.p>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
          action="#"
          method="POST"
        >
          <input
            type="text"
            name="name"
            placeholder="Your name"
            required
            className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
          />
          <input
            type="email"
            name="email"
            placeholder="Your email"
            required
            className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
          />
          <input
            type="text"
            name="company"
            placeholder="Company (optional)"
            className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
          />
          <textarea
            name="message"
            placeholder="Tell me about your project..."
            rows={4}
            required
            className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors resize-none"
          />
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] transition-shadow flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            Send Message
          </button>
        </motion.form>
      </div>
    </section>
  );
}

function GenericSection({ section }: { section: PortfolioSection }) {
  const content = section.content as SectionContent;

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {content.title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-6 text-center"
          >
            {content.title}
          </motion.h2>
        )}
        {content.body && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-warm-gray-600 leading-relaxed whitespace-pre-wrap"
          >
            {content.body}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export function PortfolioRenderer({ portfolio, user }: PortfolioRendererProps) {
  const theme = portfolio.theme as PortfolioTheme;

  // Generate custom CSS from theme
  const customStyles = `
    :root {
      ${theme.primaryColor ? `--color-rose: ${theme.primaryColor};` : ""}
      ${theme.secondaryColor ? `--color-lavender: ${theme.secondaryColor};` : ""}
      ${theme.backgroundColor ? `--color-cream: ${theme.backgroundColor};` : ""}
    }
  `;

  return (
    <div className="min-h-screen bg-cream">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {portfolio.sections.map((section) => {
        switch (section.type) {
          case "hero":
            return <HeroSection key={section.id} section={section} user={user} />;
          case "about":
            return <AboutSection key={section.id} section={section} />;
          case "work":
            return (
              <WorkSection
                key={section.id}
                section={section}
                media={portfolio.media}
              />
            );
          case "contact":
            return <ContactSection key={section.id} section={section} />;
          default:
            return <GenericSection key={section.id} section={section} />;
        }
      })}

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-sm text-warm-gray-400 border-t border-warm-gray-200">
        <p>
          Powered by{" "}
          <a
            href="https://ugc.community"
            className="text-rose hover:text-rose/80 transition-colors"
          >
            ugc.community
          </a>
        </p>
      </footer>
    </div>
  );
}
