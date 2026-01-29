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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBF9; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!-- Outer wrapper for background -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBF9;">
    <tr>
      <td align="center" style="padding: 48px 20px;">

        <!-- Main content card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 28px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.08);">

          <!-- Gradient header bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 50%, #A855F7 100%); border-radius: 28px 28px 0 0;"></td>
          </tr>

          <!-- Logo section -->
          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #1A1614; letter-spacing: -0.02em;">
                    ugc.community
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main heading -->
          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 400; line-height: 1.2; color: #1A1614;">
                You're on the list
              </h1>
            </td>
          </tr>

          <!-- Decorative sparkle accent -->
          <tr>
            <td align="center" style="padding: 16px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 60px; height: 3px; background: linear-gradient(90deg, transparent, #FF9A8B, #FF6B95, #A855F7, transparent); border-radius: 2px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="padding: 28px 40px 0 40px;">
              <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #453D37;">
                Thanks for joining the waitlist. We're building something special for UGC creators, and we're excited you want to be part of it.
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #453D37;">
                We're rolling out slowly to ensure every creator gets the best experience. When it's your turn, we'll reach out with your personal invite.
              </p>
            </td>
          </tr>

          <!-- Feature highlight box -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #FFF5F3 0%, #FFE8E3 100%); border-radius: 20px;">
                <tr>
                  <td style="padding: 28px;">
                    <p style="margin: 0 0 4px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: 400; color: #FF6B95; letter-spacing: 0.02em;">
                      What you'll get
                    </p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #625850;">
                      Your own creator portfolio at <strong style="color: #453D37;">yourname.ugc.community</strong> — completely free when you post 10 times per month. Your content is your subscription.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #453D37;">
                In the meantime, keep creating.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 28px 40px 40px 40px;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #1A1614;">
                — The ugc.community team
              </p>
            </td>
          </tr>

        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #A69B91;">
                You're receiving this email because you signed up for the waitlist at ugc.community
              </p>
            </td>
          </tr>
        </table>

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
