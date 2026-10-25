import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";

export function Hero() {
  return (
    <section className="relative z-[1] pb-6 pt-28 sm:pb-8 sm:pt-32">
      <div className="container max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-warm-gray-600">
              <BriefcaseBusiness size={15} aria-hidden="true" className="text-rose" />
              The UGC job board
            </p>
            <h1 className="mb-3 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05]">
              Find your next <span className="gradient-text">UGC job.</span>
            </h1>
            <p className="max-w-xl text-sm text-warm-gray-600 sm:text-base">
              Explore reviewed briefs from brands and across the web. Search, compare compensation, and apply.
            </p>
          </div>
          <Link href="/post-job" className="hidden min-h-11 shrink-0 sm:inline-flex items-center gap-2 rounded-full border border-warm-gray-200 bg-white/70 px-5 py-2.5 text-sm font-medium text-warm-gray-700 hover:bg-peach-100">
            Post a free job<ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
