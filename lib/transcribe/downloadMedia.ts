import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import type { Job } from "@/lib/jobs/types";
import type { CommandRunner } from "./runCommand";
import { runCommand, UserFacingError } from "./runCommand";

export type DownloadedMedia = {
  path: string;
  filename: string;
  title: string;
};

export async function downloadMedia(
  url: string,
  job: Job,
  runner: CommandRunner = runCommand,
  env: NodeJS.ProcessEnv = process.env,
): Promise<DownloadedMedia> {
  const outputTemplate = join(job.dir, "media.%(ext)s");

  try {
    const result = await runner("yt-dlp", [
      "--no-playlist",
      ...getYtDlpAuthArgs(env),
      "--print",
      "after_move:filepath",
      "--print",
      "title",
      "-f",
      "bv*[vcodec!=none]+ba[acodec!=none]/b[vcodec!=none]/best[vcodec!=none]",
      "--merge-output-format",
      "mp4",
      "-o",
      outputTemplate,
      url,
    ]);

    const lines = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const mediaPath = lines.find((line) => line.startsWith(job.dir)) ?? (await findMediaFile(job.dir));
    const title = lines.find((line) => !line.startsWith(job.dir)) ?? "Video";

    if (!mediaPath) {
      throw new UserFacingError("The video downloaded, but LinkScribe could not find the media file.");
    }

    if (!(await hasVideoStream(mediaPath, runner))) {
      throw new UserFacingError(
        "LinkScribe downloaded audio only. This source did not provide a downloadable video stream with the current cookies/settings.",
      );
    }

    const quickTimePath = await ensureQuickTimeCompatible(mediaPath, job.dir, runner);

    return {
      path: quickTimePath,
      filename: basename(quickTimePath),
      title,
    };
  } catch (error) {
    if (error instanceof UserFacingError) {
      if (isForbiddenError(error.message)) {
        throw new UserFacingError(
          "The site blocked the media download with HTTP 403. If this is Instagram, TikTok, or another logged-in source, set LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER=chrome or LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER=safari, make sure the video opens in that browser while logged in, restart LinkScribe from the same terminal, and try again.",
        );
      }

      if (isAuthRequiredError(error.message)) {
        throw new UserFacingError(
          "Instagram did not return media without login cookies. Set LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER=chrome or LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER=safari, restart LinkScribe from that terminal, and try again.",
        );
      }

      throw error;
    }

    throw new UserFacingError("Download failed. Check that the link is public and supported by yt-dlp.");
  }
}

export function getYtDlpAuthArgs(env: Pick<NodeJS.ProcessEnv, string>): string[] {
  const browser = env.LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER?.trim();
  if (browser) {
    return ["--cookies-from-browser", browser];
  }

  const cookiesFile = env.LINKSCRIBE_YTDLP_COOKIES?.trim();
  if (cookiesFile) {
    return ["--cookies", cookiesFile];
  }

  return [];
}

export async function hasVideoStream(
  mediaPath: string,
  runner: CommandRunner = runCommand,
): Promise<boolean> {
  try {
    const result = await runner("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=codec_type",
      "-of",
      "csv=p=0",
      mediaPath,
    ]);

    return result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .includes("video");
  } catch {
    return false;
  }
}

export type MediaCodecs = {
  videoCodec: string | null;
  audioCodec: string | null;
};

type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
};

export async function getMediaCodecs(
  mediaPath: string,
  runner: CommandRunner = runCommand,
): Promise<MediaCodecs> {
  const result = await runner("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "stream=codec_type,codec_name",
    "-of",
    "json",
    mediaPath,
  ]);
  const parsed = JSON.parse(result.stdout) as { streams?: FfprobeStream[] };
  const video = parsed.streams?.find((stream) => stream.codec_type === "video");
  const audio = parsed.streams?.find((stream) => stream.codec_type === "audio");

  return {
    videoCodec: video?.codec_name ?? null,
    audioCodec: audio?.codec_name ?? null,
  };
}

export function isQuickTimeCompatible(codecs: MediaCodecs): boolean {
  const videoCodec = codecs.videoCodec?.toLowerCase();
  const audioCodec = codecs.audioCodec?.toLowerCase();
  const videoCompatible = videoCodec === "h264";
  const audioCompatible = !audioCodec || audioCodec === "aac" || audioCodec === "mp3";

  return videoCompatible && audioCompatible;
}

async function ensureQuickTimeCompatible(
  mediaPath: string,
  jobDir: string,
  runner: CommandRunner,
): Promise<string> {
  const codecs = await getMediaCodecs(mediaPath, runner);

  if (isQuickTimeCompatible(codecs)) {
    return mediaPath;
  }

  const outputPath = join(jobDir, "media-quicktime.mp4");
  await runner("ffmpeg", [
    "-y",
    "-i",
    mediaPath,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    outputPath,
  ]);

  return outputPath;
}

function isAuthRequiredError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("empty media response") ||
    normalized.includes("cookies-from-browser") ||
    normalized.includes("login") ||
    normalized.includes("authentication")
  );
}

function isForbiddenError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("http error 403") || normalized.includes("403: forbidden");
}

async function findMediaFile(dir: string): Promise<string | null> {
  const entries = await readdir(dir);
  const media = entries.find((entry) => /^media\.(mp4|webm|mkv|mov|m4a|mp3|wav)$/i.test(entry));
  return media ? join(dir, media) : null;
}
