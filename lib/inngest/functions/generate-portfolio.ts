import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  portfolioGenerations,
  users,
  onboardingQuestionnaires,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generatePortfolio } from "@/lib/agent/portfolio-generator";
import { QuestionnaireData } from "@/lib/agent/portfolio-prompt";
import { uploadPortfolio } from "@/lib/portfolio/storage";

export const generatePortfolioFunction = inngest.createFunction(
  {
    id: "generate-portfolio",
    retries: 1, // Only retry once - generation is expensive
  },
  { event: "portfolio/generate.requested" },
  async ({ event, step }) => {
    const { generationId, questionnaireId, userId } = event.data;

    // Helper to update generation status
    const updateStatus = async (updates: Record<string, unknown>) => {
      await db
        .update(portfolioGenerations)
        .set(updates)
        .where(eq(portfolioGenerations.id, generationId));
    };

    try {
      // Step 1: Load data and validate
      const data = await step.run("load-data", async () => {
        const [questionnaire] = await db
          .select({
            portfolioVision: onboardingQuestionnaires.portfolioVision,
            inspiringBrands: onboardingQuestionnaires.inspiringBrands,
            portfolioExamples: onboardingQuestionnaires.portfolioExamples,
          })
          .from(onboardingQuestionnaires)
          .where(eq(onboardingQuestionnaires.id, questionnaireId));

        const [user] = await db
          .select({
            name: users.name,
            subdomain: users.subdomain,
          })
          .from(users)
          .where(eq(users.id, userId));

        if (!questionnaire || !user) {
          throw new Error("Missing required data");
        }

        return { questionnaire, user };
      });

      // Step 2: Generate portfolio with Claude
      await step.run("update-status-generating", async () => {
        await updateStatus({ status: "generating" });
      });

      const generationResult = await step.run(
        "generate-with-claude",
        async () => {
          const questionnaireData: QuestionnaireData = {
            portfolioVision: data.questionnaire.portfolioVision,
            inspiringBrands: data.questionnaire.inspiringBrands,
            portfolioExamples: data.questionnaire.portfolioExamples,
            creatorName: data.user.name,
            subdomain: data.user.subdomain!,
          };

          const result = await generatePortfolio(questionnaireData);
          if (!result.success) {
            throw new Error(result.error || "Generation failed");
          }
          return result;
        }
      );

      // Step 3: Upload to Blob and activate site
      const uploadResult = await step.run("upload-and-activate", async () => {
        // Upload to Blob
        const result = await uploadPortfolio(
          data.user.subdomain!,
          generationResult.files
        );

        // Activate site and mark generation complete
        await db
          .update(users)
          .set({ siteEnabled: true, updatedAt: new Date() })
          .where(eq(users.id, userId));

        await updateStatus({
          status: "completed",
          filesGenerated: generationResult.files.length,
          previewUrl: `https://${data.user.subdomain}.ugc.community`,
          completedAt: new Date(),
        });

        return {
          deploymentUrl: `https://${data.user.subdomain}.ugc.community`,
          previewUrl: `https://${data.user.subdomain}.ugc.community`,
          filesUploaded: result.filesUploaded,
        };
      });

      return { success: true, ...uploadResult };
    } catch (error) {
      // Mark as failed
      await updateStatus({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        errorStep: "inngest",
        completedAt: new Date(),
      });
      throw error;
    }
  }
);
