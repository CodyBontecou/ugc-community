"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Globe,
  BarChart3,
  ArrowRight,
  Play,
  Instagram,
  Youtube,
  Camera,
} from "lucide-react";

function CreatorPreview() {
  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-coral to-rose shadow-[0_4px_12px_rgba(255,107,149,0.3)]" />
        <div className="text-left">
          <div className="font-[family-name:var(--font-display)] text-2xl text-warm-gray-900">
            Dany
          </div>
          <div className="text-sm text-warm-gray-500">
            Lifestyle & Beauty Creator
          </div>
        </div>
      </div>
      <div className="flex gap-8 mb-6">
        <div className="flex items-center gap-1 text-sm font-medium text-warm-gray-700">
          <Instagram size={14} className="text-rose" />
          <span>245K</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-warm-gray-700">
          <Youtube size={14} className="text-rose" />
          <span>89K</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-warm-gray-700">
          <Camera size={14} className="text-rose" />
          <span>120+</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="aspect-[9/16] bg-gradient-to-br from-coral to-rose rounded-[--radius-md] row-span-2" />
        <div className="aspect-[9/16] bg-gradient-to-br from-warm-gray-200 to-warm-gray-300 rounded-[--radius-md]" />
        <div className="aspect-[9/16] bg-gradient-to-br from-warm-gray-200 to-warm-gray-300 rounded-[--radius-md]" />
        <div className="aspect-[9/16] bg-gradient-to-br from-warm-gray-200 to-warm-gray-300 rounded-[--radius-md]" />
      </div>
      <div className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-coral to-rose text-white rounded-full font-medium text-sm shadow-[0_4px_12px_rgba(255,107,149,0.3)]">
        <span>Work With Me</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative z-[1] pt-40 pb-20 min-h-screen flex items-center">
      <div className="container text-center">
        <motion.div
          className="inline-flex items-center gap-2 py-2 px-4 bg-white border border-warm-gray-200 rounded-full text-sm font-medium text-warm-gray-600 mb-8 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Sparkles size={14} className="text-coral" />
          <span>Free custom websites for creators</span>
        </motion.div>

        <motion.h1
          className="text-[clamp(3rem,8vw,5rem)] leading-[1.05] mb-8 tracking-[-0.02em]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          We build your website.
          <br />
          <span className="gradient-text">You create content.</span>
        </motion.h1>

        <motion.p
          className="text-xl text-warm-gray-600 max-w-[540px] mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Get a stunning, custom-built website — completely free.
          <br />
          <span className="text-rose font-medium">All we ask in return is UGC content.</span>
        </motion.p>

        <motion.div
          className="flex gap-4 justify-center flex-wrap mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <motion.a
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 font-medium rounded-full py-4 px-8 text-base bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 transition-opacity"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Your Free Website
            <ArrowRight size={18} />
          </motion.a>
          <motion.a
            href="#features"
            className="inline-flex items-center justify-center gap-2 font-medium rounded-full py-4 px-8 text-base bg-transparent text-warm-gray-700 border border-warm-gray-200 hover:bg-white hover:border-warm-gray-300 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play size={18} />
            Learn More
          </motion.a>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          className="relative max-w-[900px] mx-auto"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-white rounded-[--radius-xl] shadow-xl overflow-hidden border border-warm-gray-200">
            <div className="flex items-center gap-6 py-4 px-6 bg-warm-gray-50 border-b border-warm-gray-100">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
              </div>
              <div className="flex-1 flex items-center gap-2 py-1.5 px-4 bg-white rounded-[--radius-sm] text-xs text-warm-gray-500 border border-warm-gray-200">
                <Globe size={12} />
                <span>dany.ugc.community</span>
              </div>
            </div>
            <div className="p-8 min-h-[400px] bg-gradient-to-b from-peach-100 to-cream">
              <CreatorPreview />
            </div>
          </div>

          {/* Floating Cards */}
          <motion.div
            className="hidden lg:flex absolute top-[20%] -left-[60px] bg-white rounded-[--radius-lg] p-4 shadow-lg border border-warm-gray-100 items-center gap-4"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <BarChart3 size={20} className="text-lavender" />
            <div>
              <span className="block font-semibold text-xl text-warm-gray-900">
                847
              </span>
              <span className="block text-xs text-warm-gray-500">
                Profile Views
              </span>
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:flex absolute bottom-[25%] -right-[40px] bg-white rounded-[--radius-lg] p-4 shadow-lg border border-warm-gray-100 items-center gap-4 max-w-[240px]"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-semibold text-sm shrink-0">
              B
            </div>
            <div>
              <span className="block text-xs text-warm-gray-500">
                Brand Inquiry
              </span>
              <span className="block text-xs text-warm-gray-700 mt-0.5">
                "Love your content! Let's collab..."
              </span>
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:flex absolute top-[40%] -right-[20px] bg-white rounded-[--radius-lg] py-2 px-4 shadow-lg border border-warm-gray-100 items-center gap-2 font-semibold text-sm text-warm-gray-800"
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            <Instagram size={16} className="text-rose" />
            <span>245K</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
