import { config } from "dotenv";
import { stat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  PortfolioUploadError,
  uploadPortfolioForUser,
  type UploadInputFile,
} from "@/lib/portfolio/admin-upload";

// Load env vars for local CLI usage
config({ path: ".env.local", quiet: true });
config({ quiet: true });

const CONFIG_FILENAMES = [
  "portfolio-upload.config.json",
  ".portfolio-upload.json",
] as const;

interface PortfolioUploadConfig {
  userId?: string;
  subdomain?: string;
  replaceExisting?: boolean;
  files?: string[];
}

interface CliOptions {
  userId?: string;
  subdomain?: string;
  replaceExisting?: boolean;
  configPath?: string;
  filePaths: string[];
}

interface SourceFile {
  absolutePath: string;
  uploadPath: string;
  allowDirectory: boolean;
}

function printUsage() {
  console.log(`\nUsage:
  pnpm portfolio:upload --user <userId> [--no-replace] <file-or-dir> [file-or-dir ...]
  pnpm portfolio:upload --subdomain <subdomain> [--no-replace] <file-or-dir> [file-or-dir ...]
  pnpm portfolio:upload --config <path/to/portfolio-upload.config.json> [file-or-dir ...]

Config discovery:
  If you pass a portfolio directory, the CLI auto-loads one of:
    - portfolio-upload.config.json
    - .portfolio-upload.json

Examples:
  pnpm portfolio:upload --user user_123 ./index.html ./styles.css ./script.js
  pnpm portfolio:upload --subdomain janecreator ./portfolio.zip
  pnpm portfolio:upload ./my-portfolio
  pnpm portfolio:upload --config ./my-portfolio/portfolio-upload.config.json

Config schema (JSON):
  {
    "userId": "user_123",                // or "subdomain": "janecreator"
    "replaceExisting": true,
    "files": ["index.html", "styles.css"] // optional file paths, relative to config file
  }

Notes:
  - This uses the same upload pipeline as the admin drag-and-drop UI.
  - CLI flags override config values.
  - Default behavior is replaceExisting=true (same as UI default).\n`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    filePaths: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--user") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--user requires a value");
      }
      options.userId = value;
      i++;
      continue;
    }

    if (arg === "--subdomain") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--subdomain requires a value");
      }
      options.subdomain = value.toLowerCase();
      i++;
      continue;
    }

    if (arg === "--config") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--config requires a file path");
      }
      options.configPath = value;
      i++;
      continue;
    }

    if (arg === "--replace") {
      options.replaceExisting = true;
      continue;
    }

    if (arg === "--no-replace") {
      options.replaceExisting = false;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.filePaths.push(arg);
  }

  return options;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeUploadPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^[./]+/, "");
}

async function getPathType(
  targetPath: string
): Promise<"file" | "directory" | null> {
  try {
    const fileStat = await stat(targetPath);
    if (fileStat.isFile()) return "file";
    if (fileStat.isDirectory()) return "directory";
    return null;
  } catch {
    return null;
  }
}

async function findConfigInDirectory(directoryPath: string): Promise<string | null> {
  for (const filename of CONFIG_FILENAMES) {
    const candidate = path.join(directoryPath, filename);
    if ((await getPathType(candidate)) === "file") {
      return candidate;
    }
  }
  return null;
}

function parseConfig(configContent: string, configPath: string): PortfolioUploadConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(configContent);
  } catch {
    throw new Error(`Invalid JSON in config file: ${configPath}`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`Config must be a JSON object: ${configPath}`);
  }

  const configValue: PortfolioUploadConfig = {};

  if (parsed.userId !== undefined) {
    if (typeof parsed.userId !== "string" || parsed.userId.length === 0) {
      throw new Error(`config.userId must be a non-empty string: ${configPath}`);
    }
    configValue.userId = parsed.userId;
  }

  if (parsed.subdomain !== undefined) {
    if (typeof parsed.subdomain !== "string" || parsed.subdomain.length === 0) {
      throw new Error(`config.subdomain must be a non-empty string: ${configPath}`);
    }
    configValue.subdomain = parsed.subdomain.toLowerCase();
  }

  if (parsed.replaceExisting !== undefined) {
    if (typeof parsed.replaceExisting !== "boolean") {
      throw new Error(`config.replaceExisting must be a boolean: ${configPath}`);
    }
    configValue.replaceExisting = parsed.replaceExisting;
  }

  if (parsed.files !== undefined) {
    if (!Array.isArray(parsed.files) || !parsed.files.every((f) => typeof f === "string")) {
      throw new Error(`config.files must be an array of strings: ${configPath}`);
    }
    configValue.files = parsed.files;
  }

  return configValue;
}

async function loadConfig(options: CliOptions): Promise<{
  config: PortfolioUploadConfig;
  configPath?: string;
  configDir?: string;
}> {
  let resolvedConfigPath: string | undefined;

  if (options.configPath) {
    resolvedConfigPath = path.resolve(process.cwd(), options.configPath);
    if ((await getPathType(resolvedConfigPath)) !== "file") {
      throw new Error(`Config file not found: ${options.configPath}`);
    }
  } else {
    for (const inputPath of options.filePaths) {
      const absolutePath = path.resolve(process.cwd(), inputPath);
      if ((await getPathType(absolutePath)) === "directory") {
        const discoveredConfigPath = await findConfigInDirectory(absolutePath);
        if (discoveredConfigPath) {
          resolvedConfigPath = discoveredConfigPath;
          break;
        }
      }
    }
  }

  if (!resolvedConfigPath) {
    return { config: {} };
  }

  const content = await readFile(resolvedConfigPath, "utf8");
  const parsedConfig = parseConfig(content, resolvedConfigPath);

  return {
    config: parsedConfig,
    configPath: resolvedConfigPath,
    configDir: path.dirname(resolvedConfigPath),
  };
}

async function collectDirectoryFiles(
  directoryPath: string,
  ignoredAbsolutePaths: Set<string>
): Promise<UploadInputFile[]> {
  const files: UploadInputFile[] = [];

  async function walk(currentDirectory: string) {
    const entries = await readdir(currentDirectory, { withFileTypes: true });

    for (const entry of entries) {
      const absoluteEntryPath = path.join(currentDirectory, entry.name);
      const resolvedEntryPath = path.resolve(absoluteEntryPath);

      if (ignoredAbsolutePaths.has(resolvedEntryPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(absoluteEntryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const data = await readFile(absoluteEntryPath);
      const relativePath = normalizeUploadPath(
        path.relative(directoryPath, absoluteEntryPath)
      );

      if (!relativePath) {
        continue;
      }

      files.push({
        name: relativePath,
        size: data.length,
        data,
      });
    }
  }

  await walk(directoryPath);
  return files;
}

async function buildSourceFiles(
  options: CliOptions,
  configValue: PortfolioUploadConfig,
  configDir?: string
): Promise<SourceFile[]> {
  // Priority 1: explicit CLI file/dir args
  if (options.filePaths.length > 0) {
    return options.filePaths.map((inputPath) => ({
      absolutePath: path.resolve(process.cwd(), inputPath),
      // Keep old behavior for direct files (basename only).
      uploadPath: path.basename(inputPath),
      allowDirectory: true,
    }));
  }

  // Priority 2: files defined in config (relative to config file)
  if (configValue.files && configValue.files.length > 0) {
    const baseDir = configDir ?? process.cwd();
    return configValue.files.map((inputPath) => ({
      absolutePath: path.resolve(baseDir, inputPath),
      // Preserve relative paths declared in config.
      uploadPath: normalizeUploadPath(inputPath),
      allowDirectory: false,
    }));
  }

  // Priority 3: if config exists and no files were specified, upload config directory
  if (configDir) {
    return [
      {
        absolutePath: configDir,
        uploadPath: path.basename(configDir),
        allowDirectory: true,
      },
    ];
  }

  return [];
}

async function loadFiles(
  sourceFiles: SourceFile[],
  ignoredAbsolutePaths: Set<string>
): Promise<UploadInputFile[]> {
  const files: UploadInputFile[] = [];

  for (const source of sourceFiles) {
    const sourceType = await getPathType(source.absolutePath);

    if (!sourceType) {
      throw new Error(`Path does not exist: ${source.absolutePath}`);
    }

    if (sourceType === "directory") {
      if (!source.allowDirectory) {
        throw new Error(
          `Config files entries must reference files, not directories: ${source.absolutePath}`
        );
      }

      const directoryFiles = await collectDirectoryFiles(
        source.absolutePath,
        ignoredAbsolutePaths
      );
      files.push(...directoryFiles);
      continue;
    }

    const data = await readFile(source.absolutePath);
    files.push({
      name: normalizeUploadPath(source.uploadPath),
      size: data.length,
      data,
    });
  }

  return files;
}

async function resolveUserId(
  userId?: string,
  subdomain?: string
): Promise<string> {
  if (userId) {
    return userId;
  }

  if (!subdomain) {
    throw new Error("Provide --user or --subdomain (or set one in config)");
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.subdomain, subdomain))
    .limit(1);

  if (!user) {
    throw new Error(`No user found with subdomain "${subdomain}"`);
  }

  return user.id;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { config: loadedConfig, configPath, configDir } = await loadConfig(options);

  const mergedUserId = options.userId ?? loadedConfig.userId;
  const mergedSubdomain = options.subdomain ?? loadedConfig.subdomain;
  const mergedReplaceExisting =
    options.replaceExisting ?? loadedConfig.replaceExisting ?? true;

  const sourceFiles = await buildSourceFiles(options, loadedConfig, configDir);

  if (sourceFiles.length === 0) {
    throw new Error(
      "No input files found. Pass files/dirs on CLI, or define config.files in portfolio-upload.config.json"
    );
  }

  const ignoredAbsolutePaths = new Set<string>();
  if (configPath) {
    ignoredAbsolutePaths.add(path.resolve(configPath));
  }

  const files = await loadFiles(sourceFiles, ignoredAbsolutePaths);
  if (files.length === 0) {
    throw new Error("No files found to upload after processing input sources");
  }

  const userId = await resolveUserId(mergedUserId, mergedSubdomain);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  console.log(`\nUploading portfolio for user: ${userId}`);
  if (configPath) {
    console.log(`Config: ${configPath}`);
  }
  console.log(`Mode: ${mergedReplaceExisting ? "replace existing" : "append"}`);
  console.log(`Files: ${files.length} (${formatBytes(totalSize)})`);

  for (const file of files) {
    console.log(`  - ${file.name} (${formatBytes(file.size)})`);
  }

  const result = await uploadPortfolioForUser({
    userId,
    files,
    replaceExisting: mergedReplaceExisting,
  });

  console.log("\n✅ Portfolio deployed successfully");
  console.log(`Subdomain: ${result.subdomain}`);
  console.log(`Site URL: ${result.siteUrl}`);
  console.log(`Uploaded: ${result.filesUploaded} file(s)`);
  console.log(`Deleted: ${result.filesDeleted} file(s)`);

  if (result.skippedFiles && result.skippedFiles.length > 0) {
    console.log(`Skipped: ${result.skippedFiles.join(", ")}`);
  }

  console.log("Uploaded paths:");
  for (const uploadedPath of result.uploadedFiles) {
    console.log(`  - ${uploadedPath}`);
  }
}

main().catch((error) => {
  if (error instanceof PortfolioUploadError) {
    console.error(`\n❌ Upload failed (${error.status}): ${error.message}`);
    if (error.details) {
      console.error(error.details);
    }
    process.exit(1);
  }

  if (error instanceof Error) {
    console.error(`\n❌ ${error.message}`);
  } else {
    console.error("\n❌ Unexpected error", error);
  }
  process.exit(1);
});
