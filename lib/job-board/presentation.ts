import { PAY_LABELS } from "./model";

// Keep the source wording and payment unit; all qualifications remain in the brief.
export function compensationSummary(text: string, payType: string) {
  const value = text.trim();
  return value.split(/,(?!\d)|;|\.(?:\s|$)/, 1)[0].trim() || PAY_LABELS[payType] || "Pay not specified";
}
