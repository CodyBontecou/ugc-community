// Browser-safe labels and links. Keep validation and import processing out.
export const PAY_TYPES = ["cash", "mixed", "performance_only", "affiliate", "gifted_or_unpaid", "unspecified"] as const;
export const PAY_LABELS: Record<string, string> = { cash: "Guaranteed cash", mixed: "Base + variable pay", performance_only: "Performance only", affiliate: "Affiliate / commission", gifted_or_unpaid: "Gifted / unpaid", unspecified: "Pay not specified" };
export function safeLink(value: string) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
