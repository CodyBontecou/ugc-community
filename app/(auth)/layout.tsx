import Link from "next/link";
import { BackgroundBlobs } from "@/components/landing";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex flex-col">
      <BackgroundBlobs />

      {/* Header */}
      <header className="relative z-10 p-4">
        <div className="container">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-9 h-9 rounded-[--radius-md] bg-gradient-to-br from-coral via-rose to-lavender flex items-center justify-center shadow-[0_4px_12px_rgba(255,107,149,0.3)]">
              <span className="font-[family-name:var(--font-display)] text-xl text-white mt-0.5">
                u
              </span>
            </div>
            <span className="font-semibold text-[1.1rem] text-warm-gray-900">
              ugc.community
            </span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
