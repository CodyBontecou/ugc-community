export type ConversionCounts = { impressions: number; opened: number; applied: number; sent: number };
export type PostingConversions = ConversionCounts & { briefRate: number | null; applyRate: number | null; emailRate: number | null };
export function conversionRates(counts: ConversionCounts): PostingConversions {
  const rate = (n: number) => counts.impressions ? Math.round(n / counts.impressions * 1000) / 10 : null;
  return { impressions: counts.impressions, opened: counts.opened, applied: counts.applied, sent: counts.sent, briefRate: rate(counts.opened), applyRate: rate(counts.applied), emailRate: rate(counts.sent) };
}
export function combineConversions(rows: ConversionCounts[]): PostingConversions {
  return conversionRates(rows.reduce((total, row) => ({ impressions: total.impressions + row.impressions, opened: total.opened + row.opened, applied: total.applied + row.applied, sent: total.sent + row.sent }), { impressions: 0, opened: 0, applied: 0, sent: 0 }));
}
