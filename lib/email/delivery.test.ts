import { test } from "node:test";
import assert from "node:assert/strict";
import { deliverEmail, EmailDeliveryError, emailPlainText, type EmailBinding, type NativeEmail } from "./delivery";
const message: NativeEmail = { from: { email: "noreply@ugc.community", name: "ugc.community" }, to: "operator@example.com", subject: "Application", text: "Hello", html: "<p>Hello</p>", replyTo: "creator@example.com", headers: { "X-Application-ID": "application-1" } };
const binding = (send: (message: NativeEmail) => Promise<{ messageId: string }>) => ({ send }) as EmailBinding;
test("uses the native binding payload and records its message ID", async () => {
  let received: NativeEmail | undefined;
  const id = await deliverEmail(binding(async value => { received = value; return { messageId: "cloudflare-id" }; }), message);
  assert.equal(id, "cloudflare-id"); assert.deepEqual(received, message);
});
test("only definite pre-acceptance rejections permit retry", async () => {
  await assert.rejects(() => deliverEmail(binding(async () => { throw Object.assign(new Error("private provider detail"), { code: "E_SENDER_NOT_VERIFIED" }); }), message), error => error instanceof EmailDeliveryError && error.retryable && !error.message.includes("private"));
  for (const code of ["E_INTERNAL_SERVER_ERROR", "E_DELIVERY_FAILED", "E_UNKNOWN"]) {
    await assert.rejects(() => deliverEmail(binding(async () => { throw { code }; }), message), error => error instanceof EmailDeliveryError && !error.retryable);
  }
  await assert.rejects(() => deliverEmail(binding(async () => ({ messageId: "" })), message), error => error instanceof EmailDeliveryError && !error.retryable);
});
test("plain-text alternatives preserve CTA links and omit HTML boilerplate", () => {
  assert.equal(emailPlainText('<head><style>secret-css</style></head><p>Hello &amp; welcome</p><a href="https://ugc.community/apply-profile">View profile</a>'), "Hello & welcome\n\nView profile (https://ugc.community/apply-profile)");
});
