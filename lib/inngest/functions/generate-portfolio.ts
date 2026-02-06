import { inngest } from "../client";
import { db } from "@/lib/db";
import {
  portfolioGenerations,
  users,
  media,
  onboardingQuestionnaires,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generatePortfolio } from "@/lib/agent/portfolio-generator";
import { QuestionnaireData } from "@/lib/agent/portfolio-prompt";
import { uploadPortfolio } from "@/lib/portfolio/storage";
import {
  getRecentDesignChoices,
  buildAvoidancePrompt,
} from "@/lib/agent/generation-history";
import { selectDesignSeed } from "@/lib/agent/design-seeds";
import { reviewPortfolio, QUALITY_THRESHOLD } from "@/lib/agent/portfolio-reviewer";

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
      // Step 1: Load data and validate (expanded with real creator content)
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
            bio: users.bio,
            tagline: users.tagline,
            niches: users.niches,
            instagramHandles: users.instagramHandles,
            tiktokHandles: users.tiktokHandles,
            youtubeHandles: users.youtubeHandles,
            twitterHandles: users.twitterHandles,
          })
          .from(users)
          .where(eq(users.id, userId));

        if (!questionnaire || !user) {
          throw new Error("Missing required data");
        }

        // Load user media (up to 20 items)
        const mediaItems = await db
          .select({
            url: media.url,
            thumbnailUrl: media.thumbnailUrl,
            type: media.type,
            metadata: media.metadata,
          })
          .from(media)
          .where(eq(media.userId, userId))
          .orderBy(desc(media.createdAt))
          .limit(20);

        // Build social links from handles
        const socialLinks: { platform: string; handle: string; url: string }[] =
          [];

        if (user.instagramHandles) {
          for (const handle of user.instagramHandles) {
            const clean = handle.replace(/^@/, "");
            socialLinks.push({
              platform: "Instagram",
              handle: `@${clean}`,
              url: `https://instagram.com/${clean}`,
            });
          }
        }
        if (user.tiktokHandles) {
          for (const handle of user.tiktokHandles) {
            const clean = handle.replace(/^@/, "");
            socialLinks.push({
              platform: "TikTok",
              handle: `@${clean}`,
              url: `https://tiktok.com/@${clean}`,
            });
          }
        }
        if (user.youtubeHandles) {
          for (const handle of user.youtubeHandles) {
            const clean = handle.replace(/^@/, "");
            socialLinks.push({
              platform: "YouTube",
              handle: `@${clean}`,
              url: `https://youtube.com/@${clean}`,
            });
          }
        }
        if (user.twitterHandles) {
          for (const handle of user.twitterHandles) {
            const clean = handle.replace(/^@/, "");
            socialLinks.push({
              platform: "Twitter/X",
              handle: `@${clean}`,
              url: `https://x.com/${clean}`,
            });
          }
        }

        // Build media items array
        const mediaList = mediaItems.map((item) => ({
          url: item.url,
          thumbnailUrl: item.thumbnailUrl ?? undefined,
          type: item.type,
          caption: item.metadata?.caption ?? undefined,
          width: item.metadata?.width ?? undefined,
          height: item.metadata?.height ?? undefined,
        }));

        return {
          questionnaire,
          user,
          socialLinks,
          mediaItems: mediaList,
        };
      });

      // Step 2: Prepare generation context (seed selection, avoidance)
      const genContext = await step.run("prepare-context", async () => {
        // Get recent design choices for avoidance
        const recentChoices = await getRecentDesignChoices();
        const avoidancePrompt = buildAvoidancePrompt(recentChoices);

        // Select design seed, avoiding recent ones
        const seed = selectDesignSeed(recentChoices.seedIds);

        console.log(`Selected design seed: ${seed.id} ("${seed.name}")`);
        if (avoidancePrompt) {
          console.log(
            `Avoidance prompt includes ${recentChoices.fonts.length} fonts and ${recentChoices.colors.length} colors`
          );
        }

        return { seed, avoidancePrompt };
      });

      // Step 3: Generate portfolio with Claude
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
            bio: data.user.bio,
            tagline: data.user.tagline,
            niches: data.user.niches,
            socialLinks:
              data.socialLinks.length > 0 ? data.socialLinks : undefined,
            mediaItems:
              data.mediaItems.length > 0 ? data.mediaItems : undefined,
            avoidancePrompt: genContext.avoidancePrompt || undefined,
          };

          const result = await generatePortfolio(questionnaireData, {
            designSeed: genContext.seed,
          });
          if (!result.success) {
            throw new Error(result.error || "Generation failed");
          }
          return result;
        }
      );

      // Step 4: Quality review
      const reviewResult = await step.run("review-quality", async () => {
        try {
          const review = await reviewPortfolio(
            generationResult.files,
            {
              name: data.user.name,
              archetype: generationResult.archetype || "general",
              designSeed: genContext.seed,
            }
          );
          return review;
        } catch (error) {
          console.error("Quality review step failed:", error);
          return {
            passed: true,
            overallScore: 0,
            scores: {
              distinctiveness: 0,
              codeQuality: 0,
              brandAlignment: 0,
              responsiveness: 0,
              accessibility: 0,
            },
            critique: "Review step failed",
            issues: [] as string[],
          };
        }
      });

      // Step 5: Retry if quality review failed
      let finalResult = generationResult;
      let finalScore = reviewResult.overallScore;

      if (!reviewResult.passed && reviewResult.overallScore > 0) {
        console.log(
          `Quality review failed (score: ${reviewResult.overallScore}/${QUALITY_THRESHOLD}). Retrying with feedback...`
        );

        const retryResult = await step.run("retry-generation", async () => {
          const reviewerFeedback = `## Reviewer Feedback (MUST ADDRESS)\n\nThe previous generation scored ${reviewResult.overallScore}/10 and was rejected. You MUST fix these issues:\n\n**Critique:** ${reviewResult.critique}\n\n**Issues:**\n${reviewResult.issues.map((i) => `- ${i}`).join("\n")}\n\nAddress ALL of these issues in your new implementation.`;

          const questionnaireData: QuestionnaireData = {
            portfolioVision: data.questionnaire.portfolioVision,
            inspiringBrands: data.questionnaire.inspiringBrands,
            portfolioExamples: data.questionnaire.portfolioExamples,
            creatorName: data.user.name,
            subdomain: data.user.subdomain!,
            bio: data.user.bio,
            tagline: data.user.tagline,
            niches: data.user.niches,
            socialLinks:
              data.socialLinks.length > 0 ? data.socialLinks : undefined,
            mediaItems:
              data.mediaItems.length > 0 ? data.mediaItems : undefined,
            avoidancePrompt: genContext.avoidancePrompt || undefined,
          };

          const result = await generatePortfolio(questionnaireData, {
            designSeed: genContext.seed, // Same seed
            reviewerFeedback,
          });

          if (!result.success) {
            console.warn(
              "Retry generation also failed, using original result"
            );
            return null;
          }

          return result;
        });

        if (retryResult) {
          // Run a quick review on the retry
          const retryReview = await step.run(
            "review-retry-quality",
            async () => {
              try {
                return await reviewPortfolio(retryResult.files, {
                  name: data.user.name,
                  archetype: retryResult.archetype || "general",
                  designSeed: genContext.seed,
                });
              } catch {
                return { overallScore: 0, passed: true };
              }
            }
          );

          // Use retry result if it's better, otherwise keep original
          if (
            retryReview.overallScore > reviewResult.overallScore ||
            retryReview.passed
          ) {
            finalResult = retryResult;
            finalScore = retryReview.overallScore;
            console.log(
              `Retry improved score: ${reviewResult.overallScore} → ${retryReview.overallScore}`
            );
          } else {
            console.warn(
              `Retry did not improve (${retryReview.overallScore} vs ${reviewResult.overallScore}). Using original.`
            );
          }
        }
      }

      // Step 6: Upload to Blob and activate site
      const uploadResult = await step.run("upload-and-activate", async () => {
        // Upload to Blob
        const result = await uploadPortfolio(
          data.user.subdomain!,
          finalResult.files
        );

        // Activate site and mark generation complete
        await db
          .update(users)
          .set({ siteEnabled: true, updatedAt: new Date() })
          .where(eq(users.id, userId));

        await updateStatus({
          status: "completed",
          filesGenerated: finalResult.files.length,
          previewUrl: `https://${data.user.subdomain}.ugc.community`,
          completedAt: new Date(),
          designSeedId: finalResult.designSeedId || genContext.seed.id,
          qualityScore: finalScore,
          fontsUsed: finalResult.designMetadata?.fonts ?? null,
          primaryColors: finalResult.designMetadata?.colors?.slice(0, 10) ?? null,
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
