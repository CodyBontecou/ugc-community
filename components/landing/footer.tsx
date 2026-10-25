import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative z-[1] bg-warm-gray-900 py-16 text-warm-gray-300">
      <div className="container">
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Image
              src="/icon.png"
              alt="ugc.community logo"
              width={36}
              height={36}
              className="rounded-[--radius-md]"
            />
            <span className="font-semibold text-[1.1rem] text-white">
              ugc.community
            </span>
          </Link>
          <p className="text-sm leading-relaxed max-w-[280px] mb-6">
            Find your next UGC opportunity. Collected jobs and brand-posted briefs in one place.
          </p>
          <nav aria-label="Site information" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/jobs" className="hover:text-white">Browse jobs</Link>
            <Link href="/post-job" className="hover:text-white">Post a job</Link>
            <Link href="/#faq" className="hover:text-white">FAQ</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/guide" className="hover:text-white">Agent guide</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <a href="mailto:cody@isolated.tech" className="hover:text-white">Support</a>
          </nav>
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
