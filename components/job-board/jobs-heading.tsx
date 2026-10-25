import Link from "@/components/public/link";
import { ArrowUpRight } from "lucide-react";
export function JobsHeading() { return (
        <div className="container relative z-[1] max-w-6xl pb-7 pt-32 sm:pb-9 sm:pt-36">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-warm-gray-600">The UGC job board</span>
              <h1 className="mb-3 mt-3 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05]">Good briefs. <span className="gradient-text">Great opportunities.</span></h1>
              <p className="text-sm text-warm-gray-600 sm:text-base">Find your next UGC gig. The details up front, the full brief one click away.</p>
            </div>
            <Link prefetch={false} href="/post-job" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-warm-gray-200 bg-white/70 px-5 py-2.5 text-sm font-medium text-warm-gray-700 hover:bg-peach-100">Post a free job<ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>

); }
