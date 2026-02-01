import Replicate from "replicate";
import sharp from "sharp";

// =====================================================
// Types
// =====================================================

export interface FaviconResult {
  files: Record<string, Buffer>;
  htmlSnippet: string;
  webmanifest: string;
}

export interface FaviconOptions {
  subject: string;
  style?: string;
  appName?: string;
  themeColor?: string;
  backgroundColor?: string;
}

// =====================================================
// Constants
// =====================================================

const FAVICON_SIZES: Record<string, number> = {
  "favicon-16x16.png": 16,
  "favicon-32x32.png": 32,
  "apple-touch-icon.png": 180,
  "android-chrome-192x192.png": 192,
  "android-chrome-512x512.png": 512,
};

const STYLE_PRESETS: Record<string, string> = {
  flat: "flat design, minimalist, solid colors, clean geometric shapes, simple",
  modern: "modern glossy, subtle gradient, professional, sleek, polished",
  pixel: "retro 8-bit pixel art aesthetic, pixelated, nostalgic",
  minimal: "ultra minimalist, single color, simple silhouette, clean lines",
  playful: "friendly, rounded shapes, vibrant colors, fun, approachable",
};

// =====================================================
// ICO File Generation
// =====================================================

async function createIco(imageBuffer: Buffer): Promise<Buffer> {
  const sizes = [16, 32, 48];
  const pngBuffers: Buffer[] = [];

  for (const size of sizes) {
    pngBuffers.push(
      await sharp(imageBuffer)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    );
  }

  // ICO header: reserved(2) + type(2) + count(2) = 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(sizes.length, 4); // Number of images

  // Build directory entries (16 bytes each) and concatenate image data
  let dataOffset = 6 + sizes.length * 16;
  const directory = Buffer.alloc(sizes.length * 16);
  const imageData: Buffer[] = [];

  sizes.forEach((size, i) => {
    const png = pngBuffers[i];
    const off = i * 16;

    directory.writeUInt8(size === 256 ? 0 : size, off); // Width (0 = 256)
    directory.writeUInt8(size === 256 ? 0 : size, off + 1); // Height (0 = 256)
    directory.writeUInt8(0, off + 2); // Color palette
    directory.writeUInt8(0, off + 3); // Reserved
    directory.writeUInt16LE(1, off + 4); // Color planes
    directory.writeUInt16LE(32, off + 6); // Bits per pixel
    directory.writeUInt32LE(png.length, off + 8); // Image size
    directory.writeUInt32LE(dataOffset, off + 12); // Image offset

    dataOffset += png.length;
    imageData.push(png);
  });

  return Buffer.concat([header, directory, ...imageData]);
}

// =====================================================
// Webmanifest Generation
// =====================================================

function generateWebmanifest(options: {
  appName: string;
  themeColor: string;
  backgroundColor: string;
}): string {
  return JSON.stringify(
    {
      name: options.appName,
      short_name: options.appName,
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      theme_color: options.themeColor,
      background_color: options.backgroundColor,
      display: "standalone",
    },
    null,
    2
  );
}

// =====================================================
// HTML Snippet Generation
// =====================================================

function generateHtmlSnippet(): string {
  return `<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
}

// =====================================================
// Main Generator Function
// =====================================================

export async function generateFavicon(
  options: FaviconOptions
): Promise<FaviconResult> {
  const {
    subject,
    style = "flat",
    appName = "Portfolio",
    themeColor = "#ffffff",
    backgroundColor = "#ffffff",
  } = options;

  // Check for API token
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN environment variable is required");
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  // Build the style description
  const styleDescription = STYLE_PRESETS[style] || style;

  // Construct the prompt for favicon generation
  const prompt = `App icon favicon for ${subject}, ${styleDescription} design, centered composition, single icon, no text, no watermark, white or transparent background, high quality, 1024x1024, professional app icon`;

  console.log(`Generating favicon for: ${subject} (style: ${style})`);

  // Call Replicate SDXL
  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        prompt,
        negative_prompt:
          "blurry, low quality, text, watermark, multiple icons, busy background, complex, cluttered, words, letters, signature",
        width: 1024,
        height: 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    }
  );

  // Get the image URL from output
  const imageUrl = Array.isArray(output) ? output[0] : output;

  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("Failed to generate image: no URL returned from Replicate");
  }

  console.log("Downloading generated image...");

  // Download the generated image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const baseBuffer = Buffer.from(await response.arrayBuffer());

  console.log("Generating favicon sizes...");

  // Generate all PNG sizes
  const files: Record<string, Buffer> = {};

  for (const [filename, size] of Object.entries(FAVICON_SIZES)) {
    files[filename] = await sharp(baseBuffer)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  }

  // Generate favicon.ico (multi-size)
  files["favicon.ico"] = await createIco(baseBuffer);

  console.log("Favicon generation complete");

  return {
    files,
    htmlSnippet: generateHtmlSnippet(),
    webmanifest: generateWebmanifest({
      appName,
      themeColor,
      backgroundColor,
    }),
  };
}

// =====================================================
// Simplified Generator for Portfolio Integration
// =====================================================

/**
 * Generate favicons from a creator name and portfolio vision.
 * Extracts a suitable subject and style from the portfolio context.
 */
export async function generatePortfolioFavicon(
  creatorName: string,
  portfolioVision: string
): Promise<FaviconResult | null> {
  // Skip if no API token (favicons are optional)
  if (!process.env.REPLICATE_API_TOKEN) {
    console.log("Skipping favicon generation: REPLICATE_API_TOKEN not set");
    return null;
  }

  try {
    // Extract style hints from portfolio vision
    let style = "modern";
    const visionLower = portfolioVision.toLowerCase();

    if (
      visionLower.includes("minimal") ||
      visionLower.includes("clean") ||
      visionLower.includes("simple")
    ) {
      style = "minimal";
    } else if (
      visionLower.includes("playful") ||
      visionLower.includes("fun") ||
      visionLower.includes("vibrant") ||
      visionLower.includes("colorful")
    ) {
      style = "playful";
    } else if (
      visionLower.includes("retro") ||
      visionLower.includes("vintage") ||
      visionLower.includes("nostalgic")
    ) {
      style = "pixel";
    } else if (
      visionLower.includes("flat") ||
      visionLower.includes("geometric")
    ) {
      style = "flat";
    }

    // Create a subject based on creator context
    // Extract key themes from vision for a more relevant icon
    const subject = `${creatorName} personal brand, creative portfolio, professional identity`;

    return await generateFavicon({
      subject,
      style,
      appName: creatorName,
      themeColor: "#000000",
      backgroundColor: "#ffffff",
    });
  } catch (error) {
    console.error("Favicon generation failed:", error);
    return null;
  }
}
