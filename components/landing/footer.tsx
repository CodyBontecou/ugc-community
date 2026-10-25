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
            Discover UGC creators for your next campaign. A growing database for brands and agencies.
          </p>
          <nav aria-label="Site information" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/#database-preview" className="hover:text-white">Database preview</Link>
            <Link href="/creators" className="hover:text-white">Community portfolios</Link>
            <Link href="/#faq" className="hover:text-white">FAQ</Link>
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
