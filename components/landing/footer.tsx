import Link from "@/components/public/link";
import { BrandLink } from "@/components/brand-link";

export function Footer() {
  return (
    <footer className="relative z-[1] bg-warm-gray-900 py-16 text-warm-gray-300">
      <div className="container">
        <div className="mb-12">
          <BrandLink light iconSize={36} className="mb-6" />
          <p className="text-sm leading-relaxed max-w-[280px] mb-6">
            Find your next UGC opportunity. Collected jobs and brand-posted briefs in one place.
          </p>
          <nav aria-label="Site information" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link prefetch={false} href="/jobs" className="hover:text-white">Browse jobs</Link>
            <Link prefetch={false} href="/tutorials" className="hover:text-white">Creator guides</Link>
            <Link prefetch={false} href="/post-job" className="hover:text-white">Post a job</Link>
            <Link prefetch={false} href="/#faq" className="hover:text-white">FAQ</Link>
            <Link prefetch={false} href="/about" className="hover:text-white">About</Link>
            <Link prefetch={false} href="/contact" className="hover:text-white">Contact</Link>
            <Link prefetch={false} href="/docs" className="hover:text-white">Developers</Link>
            <Link prefetch={false} href="/guide" className="hover:text-white">Agent guide</Link>
            <Link prefetch={false} href="/privacy" className="hover:text-white">Privacy</Link>
            <Link prefetch={false} href="/terms" className="hover:text-white">Terms</Link>
            <a href="mailto:cody@isolated.tech" className="hover:text-white">Support</a>
          </nav>
        </div>

        <div className="pt-8 border-t border-warm-gray-800 text-center">
          <p className="text-sm text-warm-gray-400">
            &copy; {new Date().getFullYear()} ugc.community. Made with love for
            creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
