import { z } from "zod";
import { PAY_TYPES } from "./model";
export const reviewSchema = z.object({
  id: z.string().min(1).max(100), expectedUpdatedAt: z.iso.datetime(), action: z.enum(["publish", "reject", "close"]),
  company: z.string().max(160), title: z.string().max(200), description: z.string().max(12_000),
  compensationType: z.enum(PAY_TYPES), compensationText: z.string().max(2000), cashAmount: z.number().positive().max(10_000_000).nullable(),
  deliverables: z.string().max(3000), eligibility: z.string().max(3000), usageRights: z.string().max(3000),
  applicationEmail: z.union([z.email().max(254), z.literal("")]).optional(),
  applicationUrl: z.string().max(2000), closingAt: z.iso.datetime().nullable(), campaignKey: z.string().max(200),
  notes: z.string().max(3000), verified: z.boolean(),
});
