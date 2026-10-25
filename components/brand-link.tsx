import Link from "@/components/public/link";

export function BrandLink({
  href = "/",
  className = "",
  iconSize = 32,
  light = false,
}: {
  href?: string;
  className?: string;
  iconSize?: number;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label="ugc.community home"
      className={`inline-flex items-center gap-2.5 whitespace-nowrap font-semibold text-[1.1rem] ${light ? "text-white" : "text-warm-gray-900"} ${className}`}
    >
      {/* Fixed-size SVG needs no image optimization or client runtime. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/icon.svg" alt="" width={iconSize} height={iconSize} style={{ width: iconSize, height: iconSize }} className="shrink-0" />
      <span>ugc.community</span>
    </Link>
  );
}
