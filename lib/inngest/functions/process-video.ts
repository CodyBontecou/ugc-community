import { inngest } from "../client";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uploadToBlob, generateThumbnailPathname } from "@/lib/storage/blob-client";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execFileAsync = promisify(execFile);

// Get ffmpeg and ffprobe paths from the installer
const ffmpegPath = ffmpegInstaller.path;
const ffprobePath = ffmpegPath.replace(/ffmpeg$/, "ffprobe");

async function getVideoDuration(videoPath: string): Promise<number> {
  const { stdout } = await execFileAsync(ffprobePath, [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    videoPath,
  ]);
  const metadata = JSON.parse(stdout);
  return parseFloat(metadata.format?.duration) || 0;
}

async function extractFrame(
  videoPath: string,
  outputPath: string,
  seekTime: number
): Promise<void> {
  await execFileAsync(ffmpegPath, [
    "-ss", seekTime.toString(),
    "-i", videoPath,
    "-frames:v", "1",
    "-y",
    outputPath,
  ]);
}

export const processVideoFunction = inngest.createFunction(
  {
    id: "process-video",
    retries: 2,
  },
  { event: "media/video.uploaded" },
  async ({ event, step }) => {
    const { mediaId, videoUrl } = event.data;

    // Step 1: Download video and extract metadata in one step
    // (Inngest serializes step outputs, so we keep file paths and re-read in later steps)
    const { tempDir, posterPath, duration } = await step.run("process-video-file", async () => {
      const dir = path.join(os.tmpdir(), `video-${mediaId}-${Date.now()}`);
      await fs.promises.mkdir(dir, { recursive: true });

      // Download video
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const videoPath = path.join(dir, "video.mp4");
      await fs.promises.writeFile(videoPath, buffer);

      // Get duration using ffprobe
      const videoDuration = await getVideoDuration(videoPath);

      // Extract poster frame at 1 second (or earlier if video is shorter)
      const seekTime = Math.min(1, videoDuration / 2);
      const posterFilePath = path.join(dir, "poster.jpg");
      await extractFrame(videoPath, posterFilePath, seekTime);

      return { tempDir: dir, posterPath: posterFilePath, duration: videoDuration };
    });

    // Step 2: Upload poster as thumbnail
    const thumbnailUrl = await step.run("upload-poster", async () => {
      // Get the media record to get the original pathname
      const [mediaRecord] = await db
        .select({ filename: media.filename })
        .from(media)
        .where(eq(media.id, mediaId));

      if (!mediaRecord) {
        throw new Error(`Media record not found: ${mediaId}`);
      }

      // Read the poster file from disk
      const posterBuffer = await fs.promises.readFile(posterPath);

      // Generate thumbnail pathname based on original video pathname
      const thumbnailPathname = generateThumbnailPathname(mediaRecord.filename).replace(/\.\w+$/, ".jpg");
      const result = await uploadToBlob(thumbnailPathname, posterBuffer, "image/jpeg");
      return result.url;
    });

    // Step 3: Update media record with thumbnail and duration
    await step.run("update-media-record", async () => {
      const [existing] = await db
        .select({ metadata: media.metadata })
        .from(media)
        .where(eq(media.id, mediaId));

      await db
        .update(media)
        .set({
          thumbnailUrl,
          metadata: {
            ...(existing?.metadata || {}),
            duration: Math.round(duration),
          },
          updatedAt: new Date(),
        })
        .where(eq(media.id, mediaId));
    });

    // Step 4: Cleanup temp files
    await step.run("cleanup", async () => {
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    return {
      mediaId,
      thumbnailUrl,
      duration: Math.round(duration),
    };
  }
);
