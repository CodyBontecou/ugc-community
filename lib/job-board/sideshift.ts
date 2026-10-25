import { z } from "zod";
import type { SourceSnapshot } from "./model";

const scalar = z.union([z.string().max(2000), z.number(), z.null()]).optional();
const captureSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9]{1,100}$/), capturedAt: z.iso.datetime(),
  payload: z.object({ success: z.literal(true), company: z.object({ name: z.string().max(160).optional() }).nullable().optional(),
    job: z.object({
      id: z.string(), title: z.string().min(1).max(200), description: z.string().min(1).max(1_000_000),
      companyName: z.string().max(160).optional(), createdAt: z.iso.datetime().nullable().optional(),
      pay: scalar, payFrequency: scalar, paymentType: scalar, fixedAmount: scalar, hourlyRate: scalar,
      cpmRate: scalar, perPostRate: scalar, hoursPerWeek: scalar, ageRequirement: scalar,
      postingStatus: z.string().max(100).optional(), openCampaign: z.boolean().optional(),
      resumeRequired: z.boolean().optional(), instagramRequired: z.boolean().optional(),
      twentyOneRequired: z.boolean().optional(), tiktokRequired: z.boolean().optional(),
      verifiedResidenceCountries: z.array(z.string().max(100)).max(250).optional(),
      bonuses: z.array(z.object({ milestone: z.number(), bonusAmount: z.number(), description: z.string().max(2000).optional() })).max(100).optional(),
      applicationRequirements: z.array(z.object({ label: z.string().max(2000).optional(), description: z.string().max(3000).optional(), required: z.boolean().optional(), type: z.string().max(100).optional() })).max(100).optional(),
    }),
  }),
});

// Import a captured response from the public /api/jobs/:id endpoint used by the
// source page. Provider setup flags and badges do not establish open hiring or trust.
// Explicit projection omits applicant counters and unrelated company/account data.
export async function normalizeSideShiftCapture(input: unknown): Promise<SourceSnapshot | null> {
  const parsed = captureSchema.safeParse(input);
  if (!parsed.success || parsed.data.id !== parsed.data.payload.job.id) return null;
  const { id, capturedAt, payload } = parsed.data;
  const { title, description, createdAt, companyName, ...terms } = payload.job;
  const source = `https://app.sideshift.app/jobs/${id}`;
  const fullText = `Public application page: ${source}\nEmployer as stated: ${payload.company?.name || companyName || "Not stated"}\nTitle: ${title}\n\n${description}\n\nStructured pay and application terms from the same public job response:\n${JSON.stringify(terms)}`;
  if (fullText.length > 1_000_000) return null;
  const publishedAt = createdAt || null;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([fullText, publishedAt])));
  const revision = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return { key: `sideshift:${id}`, source, title, fullText, publishedAt, capturedAt, revision,
    contentStatus: "available", classification: "hiring_unconfirmed", compensationType: "unspecified", compensationText: "" };
}
