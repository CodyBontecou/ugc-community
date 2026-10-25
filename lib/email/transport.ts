import { getCloudflareContext } from "@opennextjs/cloudflare";
import { deliverEmail, EmailDeliveryError, emailPlainText } from "./delivery";
export interface TransactionalEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}
export async function sendEmail(message: TransactionalEmail) {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.EMAIL) throw new EmailDeliveryError("E_CONFIGURATION");
  return deliverEmail(env.EMAIL, {
    ...message,
    from: { email: "noreply@ugc.community", name: "ugc.community" },
    text: message.text || emailPlainText(message.html),
  });
}
