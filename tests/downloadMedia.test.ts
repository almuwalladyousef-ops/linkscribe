import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";
import {
  downloadMedia,
  getMediaCodecs,
  getYtDlpAuthArgs,
  hasVideoStream,
  isQuickTimeCompatible,
} from "@/lib/transcribe/downloadMedia";
import { UserFacingError } from "@/lib/transcribe/runCommand";

describe("getYtDlpAuthArgs", () => {
  test("uses browser cookies when LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER is set", () => {
    expect(
      getYtDlpAuthArgs({
        LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER: "chrome",
      }),
    ).toEqual(["--cookies-from-browser", "chrome"]);
  });

  test("uses a cookies file when LINKSCRIBE_YTDLP_COOKIES is set", () => {
    expect(
      getYtDlpAuthArgs({
        LINKSCRIBE_YTDLP_COOKIES: "/Users/yousef/cookies.txt",
      }),
    ).toEqual(["--cookies", "/Users/yousef/cookies.txt"]);
  });

  test("prefers browser cookies over cookies file when both are set", () => {
    expect(
      getYtDlpAuthArgs({
        LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER: "safari",
        LINKSCRIBE_YTDLP_COOKIES: "/Users/yousef/cookies.txt",
      }),
    ).toEqual(["--cookies-from-browser", "safari"]);
  });
});

describe("downloadMedia", () => {
  test("passes configured browser cookies to yt-dlp", async () => {
    const dir = join(process.cwd(), "tmp", `download-test-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const mediaPath = join(dir, "media.mp4");
    await writeFile(mediaPath, "media");
    const runner = vi
      .fn()
      .mockResolvedValueOnce({
        stdout: `${mediaPath}\nExample title\n`,
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: "video\n",
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            { codec_type: "video", codec_name: "h264" },
            { codec_type: "audio", codec_name: "aac" },
          ],
        }),
        stderr: "",
      });

    await downloadMedia("https://www.instagram.com/reel/example/", { id: "job_test", dir }, runner, {
      LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER: "chrome",
    });

    expect(runner).toHaveBeenCalledWith(
      "yt-dlp",
      expect.arrayContaining(["--cookies-from-browser", "chrome"]),
    );
  });

  test("asks yt-dlp for formats that contain video for downloadable media", async () => {
    const dir = join(process.cwd(), "tmp", `download-test-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const mediaPath = join(dir, "media.mp4");
    await writeFile(mediaPath, "media");
    const runner = vi
      .fn()
      .mockResolvedValueOnce({
        stdout: `${mediaPath}\nExample title\n`,
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: "video\n",
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            { codec_type: "video", codec_name: "h264" },
            { codec_type: "audio", codec_name: "aac" },
          ],
        }),
        stderr: "",
      });

    await downloadMedia("https://example.com/video", { id: "job_test", dir }, runner);
    const args = runner.mock.calls[0][1];

    expect(args).toContain("-f");
    expect(args[args.indexOf("-f") + 1]).toContain("vcodec!=none");
  });

  test("verifies downloaded media has a video stream", async () => {
    const dir = join(process.cwd(), "tmp", `download-test-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const mediaPath = join(dir, "media.mp4");
    await writeFile(mediaPath, "media");
    const runner = vi
      .fn()
      .mockResolvedValueOnce({
        stdout: `${mediaPath}\nExample title\n`,
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: "video\n",
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            { codec_type: "video", codec_name: "h264" },
            { codec_type: "audio", codec_name: "aac" },
          ],
        }),
        stderr: "",
      });

    await expect(downloadMedia("https://example.com/video", { id: "job_test", dir }, runner)).resolves.toMatchObject({
      path: mediaPath,
    });

    expect(runner).toHaveBeenCalledWith(
      "ffprobe",
      expect.arrayContaining(["-select_streams", "v:0", mediaPath]),
    );
  });

  test("transcodes non-QuickTime-compatible video before returning it", async () => {
    const dir = join(process.cwd(), "tmp", `download-test-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const mediaPath = join(dir, "media.mp4");
    await writeFile(mediaPath, "media");
    const runner = vi
      .fn()
      .mockResolvedValueOnce({
        stdout: `${mediaPath}\nExample title\n`,
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: "video\n",
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            { codec_type: "video", codec_name: "vp9" },
            { codec_type: "audio", codec_name: "aac" },
          ],
        }),
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: "",
        stderr: "",
      });

    await expect(downloadMedia("https://example.com/video", { id: "job_test", dir }, runner)).resolves.toMatchObject({
      path: join(dir, "media-quicktime.mp4"),
      filename: "media-quicktime.mp4",
    });

    expect(runner).toHaveBeenCalledWith(
      "ffmpeg",
      expect.arrayContaining(["-c:v", "libx264", "-c:a", "aac", join(dir, "media-quicktime.mp4")]),
    );
  });

  test("rejects audio-only media for the video download", async () => {
    const dir = join(process.cwd(), "tmp", `download-test-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const mediaPath = join(dir, "media.m4a");
    await writeFile(mediaPath, "media");
    const runner = vi
      .fn()
      .mockResolvedValueOnce({
        stdout: `${mediaPath}\nExample title\n`,
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: "",
        stderr: "",
      });

    await expect(downloadMedia("https://example.com/video", { id: "job_test", dir }, runner)).rejects.toThrow(
      "LinkScribe downloaded audio only",
    );
  });

  test("turns Instagram empty media responses into a setup action", async () => {
    const runner = vi.fn(async () => {
      throw new UserFacingError(
        "ERROR: [Instagram] DaJSxFpMrtV: Instagram sent an empty media response. use --cookies-from-browser",
      );
    });

    await expect(
      downloadMedia(
        "https://www.instagram.com/reel/example/",
        { id: "job_test", dir: process.cwd() },
        runner,
      ),
    ).rejects.toThrow(
      "Instagram did not return media without login cookies. Set LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER",
    );
  });

  test("turns 403 media downloads into a cookie setup action", async () => {
    const runner = vi.fn(async () => {
      throw new UserFacingError("ERROR: unable to download video data: HTTP Error 403: Forbidden");
    });

    await expect(
      downloadMedia(
        "https://www.instagram.com/reel/example/",
        { id: "job_test", dir: process.cwd() },
        runner,
      ),
    ).rejects.toThrow("The site blocked the media download with HTTP 403");
  });
});

describe("hasVideoStream", () => {
  test("returns true when ffprobe finds a video stream", async () => {
    const runner = vi.fn(async () => ({ stdout: "video\n", stderr: "" }));

    await expect(hasVideoStream("/tmp/media.mp4", runner)).resolves.toBe(true);
  });

  test("returns false when ffprobe finds no video stream", async () => {
    const runner = vi.fn(async () => ({ stdout: "", stderr: "" }));

    await expect(hasVideoStream("/tmp/media.m4a", runner)).resolves.toBe(false);
  });
});

describe("getMediaCodecs", () => {
  test("reads video and audio codecs from ffprobe", async () => {
    const runner = vi.fn(async () => ({
      stdout: JSON.stringify({
        streams: [
          { codec_type: "video", codec_name: "vp9" },
          { codec_type: "audio", codec_name: "aac" },
        ],
      }),
      stderr: "",
    }));

    await expect(getMediaCodecs("/tmp/media.mp4", runner)).resolves.toEqual({
      audioCodec: "aac",
      videoCodec: "vp9",
    });
  });
});

describe("isQuickTimeCompatible", () => {
  test("accepts h264 video with aac audio", () => {
    expect(isQuickTimeCompatible({ videoCodec: "h264", audioCodec: "aac" })).toBe(true);
  });

  test("rejects vp9 and av1 videos", () => {
    expect(isQuickTimeCompatible({ videoCodec: "vp9", audioCodec: "aac" })).toBe(false);
    expect(isQuickTimeCompatible({ videoCodec: "av1", audioCodec: "opus" })).toBe(false);
  });
});
