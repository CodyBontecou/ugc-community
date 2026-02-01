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
import {
  createPortfolioRepo,
  pushFilesToRepo,
  repoExists,
  getRepoInfo,
  waitForRepoInitialized,
} from "@/lib/github/push-portfolio";
import {
  createProject,
  addDomain,
  linkGitHubRepo,
  createDeployment,
} from "@/lib/vercel";
import { Octokit } from "@octokit/rest";

export const generatePortfolioFunction = inngest.createFunction(
  {
    id: "generate-portfolio",
    retries: 1, // Only retry once - generation is expensive
  },
  { event: "portfolio/generate.requested" },
  async ({ event, step }) => {
    const { generationId, questionnaireId, userId, githubRepoFullName, adminUserId } = event.data;

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
            vercelProjectId: users.vercelProjectId,
            githubRepoFullName: users.githubRepoFullName,
            githubRepoId: users.githubRepoId,
          })
          .from(users)
          .where(eq(users.id, userId));

        if (!questionnaire || !user) {
          throw new Error("Missing required data");
        }

        // Use service token (preferred) or fall back to admin token for backward compatibility
        let githubToken = process.env.GITHUB_SERVICE_TOKEN;
        let githubUsername = process.env.GITHUB_SERVICE_USERNAME;

        // Fall back to admin token if service token not configured and adminUserId provided
        if (!githubToken && adminUserId) {
          const [admin] = await db
            .select({
              githubAccessToken: users.githubAccessToken,
              githubUsername: users.githubUsername,
            })
            .from(users)
            .where(eq(users.id, adminUserId));

          if (admin?.githubAccessToken) {
            githubToken = admin.githubAccessToken;
            githubUsername = admin.githubUsername || undefined;
          }
        }

        if (!githubToken) {
          throw new Error("No GitHub token available for portfolio generation");
        }

        return {
          questionnaire,
          user,
          githubToken,
          githubUsername,
          // Use repo from event data if provided, otherwise from user record
          repoFullName: githubRepoFullName || user.githubRepoFullName,
        };
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

      // Step 3: Push to GitHub
      await step.run("update-status-pushing", async () => {
        await updateStatus({
          status: "pushing",
          filesGenerated: generationResult.files.length,
        });
      });

      const githubResult = await step.run("push-to-github", async () => {
        const octokit = new Octokit({ auth: data.githubToken });
        const repoName = `${data.user.subdomain}-portfolio`;
        let repoFullName = data.repoFullName || data.user.githubRepoFullName;
        let repoId = data.user.githubRepoId;

        // Verify existing repo still exists, or create a new one
        let needsNewRepo = !repoFullName;
        if (repoFullName) {
          const exists = await repoExists(octokit, repoFullName);
          if (!exists) {
            console.log(`Repo ${repoFullName} no longer exists, will create new one`);
            needsNewRepo = true;
            repoFullName = null;
            repoId = null;
          }
        }

        // Create repo if needed
        if (needsNewRepo && data.githubUsername) {
          const expectedRepoName = `${data.githubUsername}/${repoName}`;
          const exists = await repoExists(octokit, expectedRepoName);

          if (exists) {
            repoFullName = expectedRepoName;
            const repoInfo = await getRepoInfo(octokit, expectedRepoName);
            repoId = String(repoInfo.id);
          } else {
            const createResult = await createPortfolioRepo(
              octokit,
              data.user.subdomain!,
              {
                description: `Portfolio website for ${data.user.name}`,
                isPrivate: true,
              }
            );
            repoFullName = createResult.repoFullName;
            repoId = String(createResult.repoId);

            // Wait for repo to be initialized (auto_init creates commit asynchronously)
            await waitForRepoInitialized(octokit, repoFullName);
          }

          // Update user with repo info
          await db
            .update(users)
            .set({
              githubRepoFullName: repoFullName,
              githubRepoId: repoId,
            })
            .where(eq(users.id, userId));
        }

        if (!repoFullName) {
          throw new Error("No GitHub repository available for push. Ensure GITHUB_SERVICE_USERNAME is configured.");
        }

        // Get repo ID if we don't have it
        if (!repoId) {
          const repoInfo = await getRepoInfo(octokit, repoFullName);
          repoId = String(repoInfo.id);
        }

        // Push files
        await pushFilesToRepo(
          octokit,
          repoFullName,
          generationResult.files,
          "feat: portfolio generated by UGC Community"
        );

        await updateStatus({ githubRepo: repoFullName });

        return { repoFullName, repoId };
      });

      // Step 4: Deploy to Vercel
      await step.run("update-status-deploying", async () => {
        await updateStatus({ status: "deploying" });
      });

      const deployResult = await step.run("deploy-to-vercel", async () => {
        let vercelProjectId = data.user.vercelProjectId;

        if (!vercelProjectId) {
          const vercelProject = await createProject({
            name: `${data.user.subdomain}-portfolio`,
            framework: undefined,
            gitRepository: {
              type: "github",
              repo: githubResult.repoFullName,
            },
          });
          vercelProjectId = vercelProject.id;

          const domain = `${data.user.subdomain}.ugc.community`;
          await addDomain(vercelProjectId, domain);

          await db
            .update(users)
            .set({
              vercelProjectId,
              siteEnabled: true,
            })
            .where(eq(users.id, userId));
        } else {
          await linkGitHubRepo(vercelProjectId, githubResult.repoFullName);
        }

        const deployment = await createDeployment(vercelProjectId, {
          target: "production",
          gitSource: {
            type: "github",
            ref: "main",
            repoId: githubResult.repoId!,
          },
        });

        return {
          deploymentUrl: `https://${deployment.url}`,
          previewUrl: `https://${data.user.subdomain}.ugc.community`,
        };
      });

      // Step 5: Mark complete
      await step.run("mark-complete", async () => {
        await updateStatus({
          status: "completed",
          deploymentUrl: deployResult.deploymentUrl,
          previewUrl: deployResult.previewUrl,
          completedAt: new Date(),
        });
      });

      return { success: true, ...deployResult };
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
