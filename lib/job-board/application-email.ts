import { emailBrandMark } from "@/lib/email/brand";
import { Resend } from "resend";
import type { Application } from "./applications";
import type { CreatorProfile } from "./profiles";
const escape = (text: string) => text.replace(/[&<>"']/g, value => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[value]!);
export function applicationEmailContent(application: Application, profile: CreatorProfile) {
  const profileUrl = `https://ugc.community/applications/${application.id}/profile`;
  const details = [profile.headline, profile.bio, profile.location && `Location: ${profile.location}`, profile.niches && `Niches: ${profile.niches}`, profile.availability && `Availability: ${profile.availability}`].filter(Boolean).join("\n\n");
  const links = [["Instagram", profile.instagram], ["TikTok", profile.tiktok], ["YouTube", profile.youtube], ["Portfolio", profile.portfolio]].filter(([, url]) => url);
  const text = `${profile.name} applied for ${application.job_title} at ${application.company}\n\n${application.message}\n\n${details}\n\n${links.map(([label, url]) => `${label}: ${url}`).join("\n")}\n\nReply directly to this email to contact ${profile.name}.\n\nView creator profile on ugc.community: ${profileUrl}\n\nSent through ugc.community at the creator's request in response to your email-enabled listing.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#292524">${emailBrandMark()}<p>Application via ugc.community</p><h1>${escape(profile.name)}</h1><h2>${escape(application.job_title)} · ${escape(application.company)}</h2><p style="white-space:pre-wrap">${escape(application.message)}</p><hr><p style="white-space:pre-wrap">${escape(details)}</p>${links.map(([label, url]) => `<p><a href="${escape(url)}">${escape(label)}</a></p>`).join("")}<p>Reply directly to this email to contact the creator.</p><p><a href="${profileUrl}" style="display:inline-block;padding:14px 20px;background:#be3455;color:white;border-radius:24px">View creator profile on ugc.community</a></p><p style="font-size:12px">Sent at the creator's request in response to your email-enabled listing.</p></div>`;
  return { text, html };
}
export async function sendApplicationEmail(application: Application, profile: CreatorProfile) {
  if (!process.env.RESEND_API_KEY) throw new Error("Application email is not configured");
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: `${process.env.FROM_NAME || "ugc.community"} <${process.env.FROM_EMAIL || "noreply@ugc.community"}>`,
    to: application.recipient, replyTo: application.reply_email,
    subject: `UGC application: ${application.job_title} — ${profile.name}`.replace(/[\r\n]/g, " ").slice(0, 250),
    ...applicationEmailContent(application, profile),
  }, { idempotencyKey: `job-application/${application.id}` });
  if (error) {
    const providerMessage = error.message.split(process.env.RESEND_API_KEY).join("[redacted]").slice(0, 400);
    console.error("Application email rejected", { name: error.name, statusCode: error.statusCode, message: providerMessage });
  }
  if (error || !data?.id) throw new Error("Application email was not accepted");
  return data.id;
}
