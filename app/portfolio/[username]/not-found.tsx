import Link from "next/link";

export default function PortfolioNotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4">
          404
        </h1>
        <p className="text-xl text-warm-gray-600 mb-8">
          This portfolio doesn't exist or hasn't been published yet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-full shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] transition-shadow"
        >
          Go to ugc.community
        </Link>
      </div>
    </div>
  );
}
