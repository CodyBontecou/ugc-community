# Test Agent SDK Portfolio Generation

## Context

The portfolio generator has been migrated to Claude Agent SDK (v0.2.29). The implementation is complete:

- **lib/agent/portfolio-generator.ts** - Now uses `query()` from Agent SDK with built-in tools (Write, Read, WebSearch, WebFetch)
- **lib/agent/portfolio-prompt.ts** - Updated with research workflow instructions

## Task: End-to-End Testing (ugc-community-k6xk)

Test the new Agent SDK implementation to verify it works correctly.

### Test Script

Create a test script at `scripts/test-portfolio-sdk.ts`:

```typescript
import { generatePortfolio } from "../lib/agent/portfolio-generator";
import { QuestionnaireData } from "../lib/agent/portfolio-prompt";

async function main() {
  const testData: QuestionnaireData = {
    portfolioVision: "A minimal, elegant portfolio with lots of whitespace. I want it to feel premium and sophisticated, like a high-end fashion brand. Dark mode with subtle animations.",
    inspiringBrands: "Apple, Aesop, Glossier",
    portfolioExamples: "https://brittanychiang.com, https://leerob.io",
    creatorName: "Test Creator",
    subdomain: "test-creator",
  };

  console.log("Starting portfolio generation with Agent SDK...\n");
  console.log("Test data:", JSON.stringify(testData, null, 2), "\n");

  const startTime = Date.now();
  const result = await generatePortfolio(testData);
  const duration = (Date.now() - startTime) / 1000;

  console.log("\n=== RESULT ===");
  console.log(`Success: ${result.success}`);
  console.log(`Duration: ${duration.toFixed(1)}s`);
  console.log(`Files generated: ${result.files.length}`);

  if (result.usage) {
    console.log(`Tokens - Input: ${result.usage.inputTokens}, Output: ${result.usage.outputTokens}`);
  }

  if (result.error) {
    console.error(`Error: ${result.error}`);
  }

  console.log("\n=== FILES ===");
  for (const file of result.files) {
    console.log(`- ${file.path} (${file.content.length} bytes)`);
  }

  // Verify required files
  const requiredFiles = ["index.html", "styles.css"];
  const missingFiles = requiredFiles.filter(
    (rf) => !result.files.some((f) => f.path === rf)
  );

  if (missingFiles.length > 0) {
    console.error(`\nMISSING REQUIRED FILES: ${missingFiles.join(", ")}`);
  }

  // Optionally write files to disk for inspection
  if (process.argv.includes("--write")) {
    const fs = await import("fs/promises");
    const path = await import("path");
    const outDir = "./test-output";
    await fs.mkdir(outDir, { recursive: true });

    for (const file of result.files) {
      const filePath = path.join(outDir, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content);
      console.log(`Wrote: ${filePath}`);
    }
    console.log(`\nFiles written to ${outDir}/`);
  }
}

main().catch(console.error);
```

### Run the Test

```bash
# Basic test (logs only)
npx tsx scripts/test-portfolio-sdk.ts

# Test with file output for inspection
npx tsx scripts/test-portfolio-sdk.ts --write
```

### What to Verify

1. **Web research is happening** - Look for WebSearch/WebFetch tool calls in logs
2. **Files are generated** - At minimum: index.html, styles.css
3. **Design reflects research** - Check if colors/typography match inspiring brands
4. **No errors** - Clean completion with success=true

### After Testing

```bash
# If tests pass, close the task
bd close ugc-community-k6xk --reason="End-to-end tests passed"

# Close the epic if all subtasks are done
bd close ugc-community-ruli --reason="SDK migration complete and tested"

# Sync and commit
bd sync
git add lib/agent/ scripts/test-portfolio-sdk.ts
git commit -m "feat(portfolio): migrate generator to Claude Agent SDK

- Replace @anthropic-ai/sdk with @anthropic-ai/claude-agent-sdk
- Add WebSearch/WebFetch for brand research
- Use temp directory for file output
- Update prompt with research workflow

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push
```

### Optional: Test via Inngest

To test the full pipeline including GitHub push and Vercel deploy:

1. Start the dev server: `npm run dev`
2. Open Inngest dev UI: http://localhost:3000/api/inngest
3. Trigger `portfolio/generate.requested` event with test data
4. Monitor the function execution steps
