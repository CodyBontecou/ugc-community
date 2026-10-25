// Native binding types come from `wrangler types`, not a second provider schema.
export type EmailBinding = CloudflareEnv["EMAIL"];
export type NativeEmail = Parameters<EmailBinding["send"]>[0];
const rejectedBeforeAcceptance = new Set([
  "E_CONFIGURATION", "E_VALIDATION_ERROR", "E_FIELD_MISSING", "E_TOO_MANY_RECIPIENTS", "E_TOO_MANY_ATTACHMENTS",
  "E_SENDER_NOT_VERIFIED", "E_RECIPIENT_NOT_ALLOWED", "E_RECIPIENT_SUPPRESSED", "E_ACCOUNT_SUSPENDED",
  "E_SENDER_DOMAIN_NOT_AVAILABLE", "E_CONTENT_TOO_LARGE", "E_RATE_LIMIT_EXCEEDED", "E_DAILY_LIMIT_EXCEEDED",
  "E_HEADER_NOT_ALLOWED", "E_HEADER_USE_API_FIELD", "E_HEADER_VALUE_INVALID", "E_HEADER_VALUE_TOO_LONG",
  "E_HEADER_NAME_INVALID", "E_HEADERS_TOO_LARGE", "E_HEADERS_TOO_MANY",
]);
export class EmailDeliveryError extends Error {
  readonly retryable: boolean;
  constructor(readonly code: string) {
    super("Email sending was not confirmed");
    this.retryable = rejectedBeforeAcceptance.has(code);
  }
}
export async function deliverEmail(binding: EmailBinding, message: NativeEmail): Promise<string> {
  try {
    const result = await binding.send(message);
    if (!result.messageId) throw new EmailDeliveryError("E_UNKNOWN_RESULT");
    return result.messageId;
  } catch (error) {
    if (error instanceof EmailDeliveryError) throw error;
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "E_UNKNOWN";
    // Never log message content, login links, recipients, or raw provider errors.
    console.error("Cloudflare Email send failed", { code });
    throw new EmailDeliveryError(code);
  }
}
export function emailPlainText(html: string) {
  return html.replace(/<(head|style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|div|h[1-6]|tr|table)>|<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split("\n").map(line => line.trim()).filter(Boolean).join("\n\n");
}
