import Link from "next/link";
import Image from "next/image";
import { Instagram, Youtube } from "lucide-react";

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
