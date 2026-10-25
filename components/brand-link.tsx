import Image from "next/image";
import Link from "next/link";

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
      className={`inline-flex items-center gap-2.5 whitespace-nowrap font-semibold text-[1.1rem] ${light ? "text-white" : "text-warm-gray-900"} ${className}`}
    >
      <Image src="/brand/icon.svg" alt="" width={iconSize} height={iconSize} className="shrink-0" />
      <span>ugc.community</span>
    </Link>
  );
}
