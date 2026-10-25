import { ArrowRight, Database, RefreshCw, Search } from "lucide-react";
import { DatabasePreview } from "@/components/directory/database-preview";

export function Hero() {
  return (
    <section className="relative z-[1] pt-40 pb-20">
      <div className="container text-center">
        <span className="inline-flex items-center gap-2 py-2 px-4 bg-white border border-warm-gray-200 rounded-full text-sm text-warm-gray-600 mb-8 shadow-sm">
          <Database size={14} className="text-rose" /> The UGC creator database · Coming soon
        </span>
        <h1 className="text-[clamp(3rem,8vw,5rem)] leading-[1.05] mb-8 tracking-[-0.02em]">
          Your next creator.<br /><span className="gradient-text">Already on your radar.</span>
        </h1>
        <p className="text-xl text-warm-gray-600 max-w-[600px] mx-auto mb-10 leading-relaxed">
          A searchable UGC creator database for brands and agencies. Find social profiles, portfolios, and contact details shared on r/UGCcreators, with new discoveries added as they come in.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-8">
          <a href="#pricing" className="inline-flex items-center gap-2 rounded-full py-4 px-8 font-medium bg-gradient-to-r from-coral to-rose text-white hover:opacity-90">Get early access <ArrowRight size={18} /></a>
          <a href="#database-preview" className="inline-flex items-center gap-2 rounded-full py-4 px-8 font-medium border border-warm-gray-200 bg-white/60 text-warm-gray-700 hover:bg-white"><Search size={18} /> Try the preview</a>
        </div>
        <p className="inline-flex items-center gap-2 text-sm text-warm-gray-600 mb-14"><RefreshCw size={14} className="text-rose" /> Planned subscription access to a growing database</p>
        <DatabasePreview />
      </div>
    </section>
  );
}
