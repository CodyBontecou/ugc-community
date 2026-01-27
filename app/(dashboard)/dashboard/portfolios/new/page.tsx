"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, Layout } from "lucide-react";

export default function NewPortfolioPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tagline }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create portfolio");
      }

      const portfolio = await response.json();
      router.push(`/dashboard/portfolios/${portfolio.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/portfolios"
        className="inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-warm-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to portfolios
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
            Create New Portfolio
          </h1>
          <p className="text-warm-gray-500">
            Start by giving your portfolio a name and tagline
          </p>
        </div>

        {/* Method selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-[--radius-xl] border-2 border-rose p-6">
            <div className="w-12 h-12 rounded-[--radius-lg] bg-peach-100 flex items-center justify-center text-rose mb-4">
              <Layout size={24} />
            </div>
            <h3 className="font-semibold text-warm-gray-900 mb-1">
              Start from scratch
            </h3>
            <p className="text-sm text-warm-gray-500">
              Create a blank portfolio and customize it yourself
            </p>
          </div>

          <Link
            href="/dashboard/portfolios/ai-generate"
            className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 hover:border-lavender transition-colors group"
          >
            <div className="w-12 h-12 rounded-[--radius-lg] bg-lavender-soft/30 flex items-center justify-center text-lavender mb-4 group-hover:bg-lavender group-hover:text-white transition-colors">
              <Sparkles size={24} />
            </div>
            <h3 className="font-semibold text-warm-gray-900 mb-1">
              AI Generation
            </h3>
            <p className="text-sm text-warm-gray-500">
              Let AI create your portfolio from a description
            </p>
          </Link>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6"
        >
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-[--radius-md] text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-warm-gray-700 mb-1.5"
              >
                Portfolio Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                placeholder="My UGC Portfolio"
                required
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            <div>
              <label
                htmlFor="tagline"
                className="block text-sm font-medium text-warm-gray-700 mb-1.5"
              >
                Tagline{" "}
                <span className="text-warm-gray-400 font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                placeholder="UGC Creator | Beauty & Lifestyle"
                disabled={isLoading}
                maxLength={200}
              />
              <p className="mt-1 text-xs text-warm-gray-400">
                A short description that appears below your name
              </p>
            </div>

            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="w-full py-3 px-4 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow flex items-center justify-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Portfolio"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
