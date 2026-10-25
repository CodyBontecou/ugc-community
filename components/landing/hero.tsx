import { ArrowRight, BriefcaseBusiness, Search } from "lucide-react";
export function Hero() {
  return <section className="relative z-[1] pt-28 pb-10 sm:pt-40 sm:pb-16"><div className="container text-center">
    <span className="inline-flex items-center gap-2 py-2 px-4 bg-white border border-warm-gray-200 rounded-full text-sm text-warm-gray-600 mb-8 shadow-sm"><BriefcaseBusiness size={14} className="text-rose" /> UGC opportunities, in one place</span>
    <h1 className="text-[clamp(3rem,8vw,5rem)] leading-[1.05] mb-8 tracking-[-0.02em]">Your next brief.<br /><span className="gradient-text">Your next brand.</span></h1>
    <p className="text-base sm:text-xl text-warm-gray-600 max-w-[600px] mx-auto mb-10 leading-relaxed">Find UGC opportunities from across the web and jobs posted directly by brands. Clear source labels, visible compensation, and a path to the original application.</p>
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 justify-center mb-7"><a href="#jobs" className="inline-flex items-center justify-center gap-2 rounded-full py-3 px-5 sm:py-4 sm:px-8 font-medium bg-gradient-to-r from-coral to-rose text-white hover:opacity-90"><Search size={18} /> Browse opportunities</a><a href="/post-job" className="inline-flex items-center justify-center gap-2 rounded-full py-3 px-5 sm:py-4 sm:px-8 font-medium border border-warm-gray-200 bg-white/60 text-warm-gray-700 hover:bg-white">Post a job for free <ArrowRight size={18} /></a></div>
    <p className="text-sm text-warm-gray-600">Free for creators · Free brand submissions during launch · Every listing reviewed</p>
  </div></section>;
}
