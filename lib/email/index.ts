import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@ugc.community";
const FROM_NAME = process.env.FROM_NAME || "ugc.community";

export async function sendWaitlistConfirmation(email: string) {
  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: "You're on the waitlist!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAF9F7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <div style="background-color: #FFFFFF; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 600; color: #1A1A1A;">
            You're on the list! 🎉
          </h1>

          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #4A4A4A;">
            Thanks for signing up for <strong>ugc.community</strong>. We're building something special for UGC creators, and we're excited to have you along for the journey.
          </p>

          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #4A4A4A;">
            We're currently invite-only as we roll out the platform slowly to ensure the best experience. We'll reach out when it's your turn to join.
          </p>

          <div style="margin: 32px 0; padding: 24px; background-color: #FFF5F3; border-radius: 12px;">
            <p style="margin: 0; font-size: 14px; color: #6B6B6B;">
              <strong style="color: #1A1A1A;">What to expect:</strong><br>
              When we invite you, you'll get a unique link to create your creator portfolio. Our platform is free for creators who post content - 10 posts/month unlocks all premium features.
            </p>
          </div>

          <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4A4A4A;">
            In the meantime, keep creating!
          </p>

          <p style="margin: 24px 0 0 0; font-size: 16px; color: #1A1A1A;">
            — The ugc.community team
          </p>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 12px; text-align: center; color: #9A9A9A;">
          You're receiving this because you signed up at ugc.community
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });

  if (error) {
    console.error("Failed to send waitlist confirmation email:", error);
    throw error;
  }
}
