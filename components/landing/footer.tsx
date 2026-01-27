import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-[1] bg-warm-gray-900 py-16 text-warm-gray-300">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-[--radius-md] bg-gradient-to-br from-coral to-rose flex items-center justify-center">
                <span className="font-[family-name:var(--font-display)] text-xl text-white mt-0.5">
                  u
                </span>
              </div>
              <span className="font-semibold text-[1.1rem] text-white">
                ugc.community
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-[280px] mb-6">
              The modern way for content creators to showcase their work and
              land brand deals.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-warm-gray-800 flex items-center justify-center text-warm-gray-400 hover:bg-rose hover:text-white transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-10 h-10 rounded-full bg-warm-gray-800 flex items-center justify-center text-warm-gray-400 hover:bg-rose hover:text-white transition-colors"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-body)] font-semibold text-sm text-white mb-6">
              Product
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href="#features"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#portfolios"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Examples
              </a>
              <a
                href="#pricing"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Templates
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-body)] font-semibold text-sm text-white mb-6">
              Resources
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Help Center
              </a>
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Blog
              </a>
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Guides
              </a>
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-body)] font-semibold text-sm text-white mb-6">
              Company
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Careers
              </a>
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-warm-gray-400 hover:text-white transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-warm-gray-800 text-center">
          <p className="text-sm text-warm-gray-500">
            &copy; {new Date().getFullYear()} ugc.community. Made with love for
            creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
