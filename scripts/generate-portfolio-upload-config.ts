import { readdir, stat, writeFile, access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type ConfigData = {
  userId?: string;
  subdomain?: string;
  replaceExisting: boolean;
  files?: string[];
};

type CliOptions = {
  dir: string;
  userId?: string;
  subdomain?: string;
  replaceExisting: boolean;
  includeFiles: boolean;
  output: string;
  force: boolean;
};

const CONFIG_FILENAMES = new Set([
  "portfolio-upload.config.json",
  ".portfolio-upload.json",
]);

const SKIP_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  ".next",
  ".vercel",
  ".DS_Store",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".webmanifest",
  ".xml",
  ".txt",
  ".zip",
]);

function printUsage() {
  console.log(`\nUsage:
  pnpm portfolio:config:init --dir <portfolioDir> (--user <userId> | --subdomain <subdomain>) [options]

Options:
  --dir <path>            Portfolio directory (default: .)
  --user <id>             Target user id
  --subdomain <name>      Target subdomain
  --replace               Set replaceExisting=true (default)
  --no-replace            Set replaceExisting=false
  --include-files         Add "files" array by scanning the directory (allowed upload extensions only)
  --output <filename>     Config filename/path (default: portfolio-upload.config.json)
  --force                 Overwrite existing config file
  --help, -h              Show this help

Examples:
  pnpm portfolio:config:init --dir ./portfolio --subdomain janedoe
  pnpm portfolio:config:init --dir ./portfolio --user user_123 --include-files
  pnpm portfolio:config:init --dir ./portfolio --subdomain janedoe --output .portfolio-upload.json\n`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dir: ".",
    replaceExisting: true,
    includeFiles: false,
    output: "portfolio-upload.config.json",
    force: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--dir") {
      const value = argv[i + 1];
      if (!value) throw new Error("--dir requires a value");
      options.dir = value;
      i++;
      continue;
    }

    if (arg === "--user") {
      const value = argv[i + 1];
      if (!value) throw new Error("--user requires a value");
      options.userId = value;
      i++;
      continue;
    }

    if (arg === "--subdomain") {
      const value = argv[i + 1];
      if (!value) throw new Error("--subdomain requires a value");
      options.subdomain = value.toLowerCase();
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

    if (arg === "--include-files") {
      options.includeFiles = true;
      continue;
    }

    if (arg === "--output") {
      const value = argv[i + 1];
      if (!value) throw new Error("--output requires a value");
      options.output = value;
      i++;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.userId && !options.subdomain) {
    throw new Error("Provide either --user <userId> or --subdomain <subdomain>");
  }

  if (options.userId && options.subdomain) {
    throw new Error("Use either --user or --subdomain, not both");
  }

  return options;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function isAllowedFile(filename: string): boolean {
  if (filename.startsWith(".")) return false;
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectUploadFiles(
  rootDir: string,
  outputPath: string
): Promise<string[]> {
  const files: string[] = [];
  const outputPathAbs = path.resolve(outputPath);

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) continue;
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (path.resolve(absolutePath) === outputPathAbs) continue;
      if (CONFIG_FILENAMES.has(entry.name)) continue;
      if (!isAllowedFile(entry.name)) continue;

      const rel = toPosix(path.relative(rootDir, absolutePath));
      if (rel.length === 0) continue;
      files.push(rel);
    }
  }

  await walk(rootDir);

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const dirAbs = path.resolve(process.cwd(), options.dir);
  const dirStat = await stat(dirAbs).catch(() => null);
  if (!dirStat || !dirStat.isDirectory()) {
    throw new Error(`Directory not found: ${options.dir}`);
  }

  const outputPath = path.resolve(dirAbs, options.output);
  if ((await exists(outputPath)) && !options.force) {
    throw new Error(
      `Config already exists: ${outputPath}. Use --force to overwrite.`
    );
  }

  const configData: ConfigData = {
    replaceExisting: options.replaceExisting,
  };

  if (options.userId) configData.userId = options.userId;
  if (options.subdomain) configData.subdomain = options.subdomain;

  if (options.includeFiles) {
    configData.files = await collectUploadFiles(dirAbs, outputPath);
  }

  const content = `${JSON.stringify(configData, null, 2)}\n`;
  await writeFile(outputPath, content, "utf8");

  console.log("✅ Portfolio upload config generated");
  console.log(`Path: ${outputPath}`);
  console.log(
    `Target: ${configData.userId ? `userId=${configData.userId}` : `subdomain=${configData.subdomain}`}`
  );
  console.log(`replaceExisting: ${configData.replaceExisting}`);
  if (configData.files) {
    console.log(`files: ${configData.files.length}`);
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(`\n❌ ${error.message}`);
  } else {
    console.error("\n❌ Unexpected error", error);
  }
  process.exit(1);
});
