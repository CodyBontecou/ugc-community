import { BrandLink } from "@/components/brand-link";
import { BackgroundBlobs } from "@/components/landing";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh relative flex flex-col">
      <BackgroundBlobs />

      {/* Header */}
      <header className="relative z-10 py-4 sm:py-6">
        <div className="container">
          <BrandLink />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-6 sm:gap-8 sm:pt-10 sm:pb-12">
        {children}
      </main>
    </div>
  );
}
