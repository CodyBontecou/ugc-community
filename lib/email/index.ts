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

export async function sendInvitationEmail(email: string, inviteUrl: string) {
  const calendlyUrl = "https://calendly.com/cody-isolated/30min";

  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: "You're in! Welcome to ugc.community",
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
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 28px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.12);">

          <!-- Gradient header bar - thicker for celebration -->
          <tr>
            <td style="height: 8px; background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 50%, #A855F7 100%); border-radius: 28px 28px 0 0;"></td>
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

          <!-- Celebration emoji row -->
          <tr>
            <td align="center" style="padding: 28px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size: 40px; letter-spacing: 8px;">
                    &#127881;&#10024;&#127881;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main heading -->
          <tr>
            <td align="center" style="padding: 20px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 36px; font-weight: 400; line-height: 1.15; color: #1A1614;">
                You're in!
              </h1>
            </td>
          </tr>

          <!-- Gradient subheading -->
          <tr>
            <td align="center" style="padding: 8px 40px 0 40px;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; background: linear-gradient(135deg, #FF9A8B, #FF6B95, #A855F7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Welcome to ugc.community
              </p>
            </td>
          </tr>

          <!-- Decorative sparkle accent -->
          <tr>
            <td align="center" style="padding: 24px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 80px; height: 3px; background: linear-gradient(90deg, transparent, #FF9A8B, #FF6B95, #A855F7, transparent); border-radius: 2px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="padding: 28px 40px 0 40px;">
              <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #453D37;">
                The wait is over. Your spot is ready, and we couldn't be more excited to have you join our community of incredible UGC creators.
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #453D37;">
                Click below to claim your personal creator portfolio and start building your brand today.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 100%); box-shadow: 0 4px 20px rgba(255, 107, 149, 0.35);">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 18px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none; letter-spacing: 0.02em;">
                      Claim Your Spot &#8594;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's included box -->
          <tr>
            <td style="padding: 36px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #FFF5F3 0%, #FFE8E3 100%); border-radius: 20px; border: 1px solid rgba(255, 107, 149, 0.15);">
                <tr>
                  <td style="padding: 28px;">
                    <p style="margin: 0 0 16px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 400; color: #1A1614;">
                      What you're getting:
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #453D37;">
                          <span style="color: #FF6B95; margin-right: 10px;">&#10003;</span> Your own portfolio at <strong>yourname.ugc.community</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #453D37;">
                          <span style="color: #FF6B95; margin-right: 10px;">&#10003;</span> Unlimited uploads & premium templates
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #453D37;">
                          <span style="color: #FF6B95; margin-right: 10px;">&#10003;</span> Analytics dashboard & custom branding
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #453D37;">
                          <span style="color: #FF6B95; margin-right: 10px;">&#10003;</span> <strong style="color: #FF6B95;">Free forever</strong> with 30 posts/month
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Calendly section -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #F8F4FF 0%, #EDE9FE 100%); border-radius: 20px; border: 1px solid rgba(168, 85, 247, 0.15);">
                <tr>
                  <td style="padding: 24px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; font-weight: 400; color: #1A1614;">
                            &#128197; Let's chat!
                          </p>
                          <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #625850;">
                            Want a personal walkthrough? Book a quick 30-minute call to get you set up and answer any questions.
                          </p>
                          <a href="${calendlyUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #A855F7; text-decoration: none; border: 2px solid #A855F7; border-radius: 50px; transition: all 0.2s;">
                            Schedule a Call &#8594;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #453D37;">
                We can't wait to see what you create.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 24px 40px 40px 40px;">
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
                You're receiving this email because you were on the waitlist at ugc.community.<br>
                Your invite link expires in 7 days.
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
    console.error("Failed to send invitation email:", error);
    throw error;
  }
}
