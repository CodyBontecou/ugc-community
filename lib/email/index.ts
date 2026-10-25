import { emailBrandMark } from "./brand";
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

interface WaitlistNotificationParams {
  email: string;
  userType: string;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  youtubeHandle?: string | null;
  facebookHandle?: string | null;
  twitterHandle?: string | null;
}

export async function sendWaitlistNotification(params: WaitlistNotificationParams) {
  const { email, userType, instagramHandle, tiktokHandle, youtubeHandle, facebookHandle, twitterHandle } = params;

  const socialHandles = [
    instagramHandle && `Instagram: @${instagramHandle}`,
    tiktokHandle && `TikTok: @${tiktokHandle}`,
    youtubeHandle && `YouTube: ${youtubeHandle}`,
    facebookHandle && `Facebook: ${facebookHandle}`,
    twitterHandle && `X/Twitter: @${twitterHandle}`,
  ].filter(Boolean);

  const socialsHtml = socialHandles.length > 0
    ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #625850;">${socialHandles.join("<br>")}</p>`
    : "";

  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: "cody@isolated.tech",
    subject: `New waitlist signup: ${email}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 16px 0; color: #1A1614;">New Waitlist Signup</h2>
    <p style="margin: 0; font-size: 16px; color: #1A1614;"><strong>Email:</strong> ${email}</p>
    <p style="margin: 8px 0 0 0; font-size: 16px; color: #1A1614;"><strong>Type:</strong> ${userType}</p>
    ${socialsHtml}
  </div>
</body>
</html>
    `.trim(),
  });

  if (error) {
    console.error("Failed to send waitlist notification email:", error);
    throw error;
  }
}

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
                    ${emailBrandMark()}
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
  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: "You're in — let's build your portfolio",
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
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBF9;">
    <tr>
      <td align="center" style="padding: 48px 20px;">

        <!-- Main content card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.08);">

          <!-- Gradient header bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #FF9A8B 0%, #FF6B95 50%, #A855F7 100%); border-radius: 24px 24px 0 0;"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 48px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1A1614; letter-spacing: -0.02em;">
                    ${emailBrandMark()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main heading -->
          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 400; line-height: 1.2; color: #1A1614;">
                You're in.
              </h1>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Your portfolio is ready. Claim your spot at <strong style="color: #1A1614;">yourname.ugc.community</strong> and schedule a quick call so we can set everything up together.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 36px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 100%); box-shadow: 0 4px 16px rgba(255, 107, 149, 0.3);">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 40px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="height: 1px; background-color: #E8E2DD;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's included -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p style="margin: 0 0 20px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: 400; color: #1A1614;">
                What you get
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #453D37;">
                    <span style="display: inline-block; width: 6px; height: 6px; background: linear-gradient(135deg, #FF9A8B, #FF6B95); border-radius: 50%; margin-right: 12px; vertical-align: middle;"></span>
                    Your own portfolio at yourname.ugc.community
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #453D37;">
                    <span style="display: inline-block; width: 6px; height: 6px; background: linear-gradient(135deg, #FF9A8B, #FF6B95); border-radius: 50%; margin-right: 12px; vertical-align: middle;"></span>
                    Unlimited video uploads
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #453D37;">
                    <span style="display: inline-block; width: 6px; height: 6px; background: linear-gradient(135deg, #FF9A8B, #FF6B95); border-radius: 50%; margin-right: 12px; vertical-align: middle;"></span>
                    Analytics and custom branding
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #453D37;">
                    <span style="display: inline-block; width: 6px; height: 6px; background: linear-gradient(135deg, #FF6B95, #A855F7); border-radius: 50%; margin-right: 12px; vertical-align: middle;"></span>
                    <strong style="color: #1A1614;">Earn rewards</strong> by tagging @ugc.community
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 40px 40px 48px 40px;">
              <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #625850;">
                Talk soon,
              </p>
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #1A1614;">
                Cody
              </p>
            </td>
          </tr>

        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding: 28px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #A69B91;">
                This link expires in 7 days.
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

interface ContactInquiryParams {
  creatorName: string;
  creatorEmail: string;
  senderName: string;
  senderEmail: string;
  company: string;
  message: string;
  portfolioUrl: string;
}

export async function sendContactInquiry(params: ContactInquiryParams) {
  const { creatorName, creatorEmail, senderName, senderEmail, company, message, portfolioUrl } = params;

  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: creatorEmail,
    replyTo: senderEmail,
    subject: `New inquiry from ${company}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBF9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBF9;">
    <tr>
      <td align="center" style="padding: 48px 20px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.08);">

          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #FF9A8B 0%, #FF6B95 50%, #A855F7 100%); border-radius: 24px 24px 0 0;"></td>
          </tr>

          <tr>
            <td align="center" style="padding: 48px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1A1614; letter-spacing: -0.02em;">
                    ${emailBrandMark()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 400; line-height: 1.2; color: #1A1614;">
                New project inquiry
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Hey ${creatorName.split(' ')[0] || 'there'}, someone reached out through your portfolio!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF7F5; border-radius: 16px; border: 1px solid #E8E2DD;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 0 0 16px 0;">
                          <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #A69B91; text-transform: uppercase; letter-spacing: 0.05em;">From</p>
                          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1A1614;">${senderName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 16px 0;">
                          <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #A69B91; text-transform: uppercase; letter-spacing: 0.05em;">Company</p>
                          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1A1614;">${company}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 16px 0;">
                          <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #A69B91; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
                          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1A1614;">
                            <a href="mailto:${senderEmail}" style="color: #FF6B95; text-decoration: none;">${senderEmail}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #A69B91; text-transform: uppercase; letter-spacing: 0.05em;">Project Details</p>
                          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #453D37; white-space: pre-wrap;">${message}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 100%); box-shadow: 0 4px 16px rgba(255, 107, 149, 0.3);">
                    <a href="mailto:${senderEmail}?subject=Re: Project inquiry from ${company}" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      Reply to ${senderName.split(' ')[0]}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 48px 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #A69B91;">
                This inquiry was sent via your portfolio at <a href="${portfolioUrl}" style="color: #FF6B95; text-decoration: none;">${portfolioUrl}</a>
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
    console.error("Failed to send contact inquiry email:", error);
    throw error;
  }
}

interface ContactConfirmationParams {
  senderName: string;
  senderEmail: string;
  creatorName: string;
  portfolioUrl: string;
}

export async function sendContactConfirmation(params: ContactConfirmationParams) {
  const { senderName, senderEmail, creatorName, portfolioUrl } = params;

  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: senderEmail,
    subject: `Message sent to ${creatorName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBF9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBF9;">
    <tr>
      <td align="center" style="padding: 48px 20px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.08);">

          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #FF9A8B 0%, #FF6B95 50%, #A855F7 100%); border-radius: 24px 24px 0 0;"></td>
          </tr>

          <tr>
            <td align="center" style="padding: 48px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1A1614; letter-spacing: -0.02em;">
                    ${emailBrandMark()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 40px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 400; line-height: 1.2; color: #1A1614;">
                Message sent!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Hi ${senderName.split(' ')[0]}, thanks for reaching out to ${creatorName}. Your message has been delivered and they'll get back to you directly.
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                In the meantime, feel free to explore more of their work.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; border: 1px solid #D4CBC4; background-color: #FFFFFF;">
                    <a href="${portfolioUrl}" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 500; color: #453D37; text-decoration: none;">
                      View Portfolio
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 48px 40px;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #1A1614;">
                — The ugc.community team
              </p>
            </td>
          </tr>

        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding: 28px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #A69B91;">
                You're receiving this because you submitted a contact form on ugc.community
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
    console.error("Failed to send contact confirmation email:", error);
    throw error;
  }
}

interface MilestoneEarnedParams {
  creatorName: string;
  creatorEmail: string;
  milestoneName: string;
  milestoneDescription: string | null;
  rewardType: string;
  threshold: number;
  isMonthly: boolean;
}

export async function sendMilestoneEarnedEmail(params: MilestoneEarnedParams) {
  const {
    creatorName,
    creatorEmail,
    milestoneName,
    milestoneDescription,
    rewardType,
    threshold,
    isMonthly,
  } = params;

  const firstName = creatorName.split(" ")[0] || "there";
  const milestoneType = isMonthly ? "monthly" : "lifetime";

  // Map reward types to friendly descriptions
  const rewardDescriptions: Record<string, string> = {
    hosting: "Free portfolio hosting",
    analytics: "Advanced analytics dashboard",
    edits: "Video editing credits",
    directory_boost: "Boosted directory listing",
    badge: "Achievement badge on your profile",
    custom_domain: "Custom domain support",
  };

  const rewardText = rewardDescriptions[rewardType] || "Special reward";

  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: creatorEmail,
    subject: `You earned the ${milestoneName} milestone!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBF9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBF9;">
    <tr>
      <td align="center" style="padding: 48px 20px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.08);">

          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B95 100%); border-radius: 24px 24px 0 0;"></td>
          </tr>

          <tr>
            <td align="center" style="padding: 48px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1A1614; letter-spacing: -0.02em;">
                    ${emailBrandMark()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <div style="font-size: 48px; line-height: 1;">🏆</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 24px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 400; line-height: 1.2; color: #1A1614;">
                Milestone Unlocked!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Hey ${firstName}, amazing work! You just hit a ${milestoneType} milestone by posting ${threshold} times${isMonthly ? " this month" : ""}.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #FFF5F3 0%, #FFE8E3 100%); border-radius: 16px; border: 1px solid #FFD7CF;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1A1614;">
                      ${milestoneName}
                    </p>
                    ${milestoneDescription ? `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #625850;">${milestoneDescription}</p>` : ""}
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #FF6B95; font-weight: 500;">
                      ✓ ${rewardText}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Keep creating and watch your milestones stack up. Each one brings you closer to more rewards.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 100%); box-shadow: 0 4px 16px rgba(255, 107, 149, 0.3);">
                    <a href="https://ugc.community/dashboard" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      View Your Progress
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 48px 40px;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #1A1614;">
                — The ugc.community team
              </p>
            </td>
          </tr>

        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding: 28px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #A69B91;">
                You're receiving this because you earned a milestone on ugc.community
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
    console.error("Failed to send milestone earned email:", error);
    throw error;
  }
}

// =====================================================
// Portfolio Enforcement Emails
// =====================================================

interface PortfolioDisabledParams {
  creatorName: string;
  creatorEmail: string;
  subdomain: string;
  currentPostCount: number;
  requiredPostCount: number;
}

export async function sendPortfolioDisabledEmail(params: PortfolioDisabledParams) {
  const { creatorName, creatorEmail, subdomain, currentPostCount, requiredPostCount } = params;
  const firstName = creatorName.split(" ")[0] || "there";
  const postsNeeded = requiredPostCount - currentPostCount;
  const portfolioUrl = `https://${subdomain}.ugc.community`;

  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: creatorEmail,
    subject: "Your portfolio has been paused",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBF9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBF9;">
    <tr>
      <td align="center" style="padding: 48px 20px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.08);">

          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #D4CBC4 0%, #A69B91 100%); border-radius: 24px 24px 0 0;"></td>
          </tr>

          <tr>
            <td align="center" style="padding: 48px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1A1614; letter-spacing: -0.02em;">
                    ${emailBrandMark()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <div style="font-size: 48px; line-height: 1;">⏸️</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 24px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 400; line-height: 1.2; color: #1A1614;">
                Portfolio paused
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Hey ${firstName}, your portfolio at <strong style="color: #1A1614;">${portfolioUrl}</strong> has been temporarily paused because the monthly posting requirement wasn't met.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF7F5; border-radius: 16px; border: 1px solid #E8E2DD;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #A69B91; text-transform: uppercase; letter-spacing: 0.05em;">
                      This month's progress
                    </p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; color: #1A1614;">
                      ${currentPostCount} / ${requiredPostCount} posts
                    </p>
                    <p style="margin: 8px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #625850;">
                      ${postsNeeded} more post${postsNeeded === 1 ? "" : "s"} needed to reactivate
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p style="margin: 0 0 20px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: 400; color: #1A1614;">
                How to reactivate
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Just post ${postsNeeded} more time${postsNeeded === 1 ? "" : "s"} this month tagging <strong style="color: #1A1614;">@ugc.community</strong> and your portfolio will come back online automatically. No action needed on your end — just keep creating.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 100%); box-shadow: 0 4px 16px rgba(255, 107, 149, 0.3);">
                    <a href="https://ugc.community/dashboard" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 48px 40px;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #1A1614;">
                — The ugc.community team
              </p>
            </td>
          </tr>

        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding: 28px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #A69B91;">
                Your portfolio data is safe. Only public access is paused until the posting requirement is met.
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
    console.error("Failed to send portfolio disabled email:", error);
    throw error;
  }
}

interface PortfolioReenabledParams {
  creatorName: string;
  creatorEmail: string;
  subdomain: string;
}

export async function sendPortfolioReenabledEmail(params: PortfolioReenabledParams) {
  const { creatorName, creatorEmail, subdomain } = params;
  const firstName = creatorName.split(" ")[0] || "there";
  const portfolioUrl = `https://${subdomain}.ugc.community`;

  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: creatorEmail,
    subject: "Your portfolio is back online!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBF9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBF9;">
    <tr>
      <td align="center" style="padding: 48px 20px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 8px 40px rgba(26, 22, 20, 0.08);">

          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #34D399 0%, #10B981 50%, #059669 100%); border-radius: 24px 24px 0 0;"></td>
          </tr>

          <tr>
            <td align="center" style="padding: 48px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1A1614; letter-spacing: -0.02em;">
                    ${emailBrandMark()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <div style="font-size: 48px; line-height: 1;">🎉</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 24px 40px 0 40px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 400; line-height: 1.2; color: #1A1614;">
                You're back online!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Hey ${firstName}, great work! You've met the monthly posting requirement and your portfolio at <strong style="color: #1A1614;">${portfolioUrl}</strong> is live again.
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #625850;">
                Brands can discover and contact you through your portfolio. Keep posting to stay visible!
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 50px; background: linear-gradient(135deg, #34D399 0%, #10B981 100%); box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);">
                    <a href="${portfolioUrl}" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      View Your Portfolio
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 48px 40px;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #1A1614;">
                — The ugc.community team
              </p>
            </td>
          </tr>

        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding: 28px 40px 0 40px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #A69B91;">
                Keep tagging @ugc.community in your posts to maintain your portfolio each month.
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
    console.error("Failed to send portfolio re-enabled email:", error);
    throw error;
  }
}


