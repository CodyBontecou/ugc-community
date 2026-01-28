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
          <Link href="/" className="font-semibold text-[1.1rem] text-warm-gray-900">
            ugc.community
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
