import Image from "next/image";

// Known public hosts use Cloudflare image optimization. Preserve existing
// authenticated, data/blob and custom-host avatars without proxying them.
export function AvatarImage({ src, alt, size, className }: { src: string; alt: string; size: number; className?: string }) {
  let optimized = false;
  try {
    const url = new URL(src);
    optimized = url.protocol === "https:" && (["avatars.githubusercontent.com", "lh3.googleusercontent.com"].includes(url.hostname) || url.hostname.endsWith(".r2.cloudflarestorage.com"));
  } catch { /* Other sources retain direct browser loading. */ }
  return <Image src={src} alt={alt} width={size} height={size} sizes={`${size}px`} unoptimized={!optimized} className={className} />;
}
