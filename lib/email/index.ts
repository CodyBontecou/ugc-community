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
                    ugc.community
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
                    ugc.community
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
                    ugc.community
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
