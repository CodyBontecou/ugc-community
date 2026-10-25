import Link from "next/link";
import Image from "next/image";
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
          <Link href="/" className="inline-flex items-center gap-2.5 whitespace-nowrap font-semibold text-[1.1rem] text-warm-gray-900">
            <Image
              src="/brand/icon.svg"
              alt=""
              width={32}
              height={32}
              className="shrink-0"
            />
            <span>ugc.community</span>
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
