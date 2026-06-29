import { describe, expect, test } from "vitest";
import { validateVideoUrl } from "@/lib/validation/videoUrl";

describe("validateVideoUrl", () => {
  test("accepts http and https URLs", () => {
    expect(validateVideoUrl("https://www.youtube.com/watch?v=abc123")).toEqual({
      ok: true,
      url: "https://www.youtube.com/watch?v=abc123",
    });

    expect(validateVideoUrl("http://example.com/video.mp4")).toEqual({
      ok: true,
      url: "http://example.com/video.mp4",
    });
  });

  test("trims whitespace before accepting a URL", () => {
    expect(validateVideoUrl("  https://youtu.be/abc123  ")).toEqual({
      ok: true,
      url: "https://youtu.be/abc123",
    });
  });

  test("rejects empty, invalid, and non-web URLs", () => {
    expect(validateVideoUrl("")).toEqual({
      ok: false,
      error: "Paste a video link first.",
    });

    expect(validateVideoUrl("not a url")).toEqual({
      ok: false,
      error: "Paste a valid video URL.",
    });

    expect(validateVideoUrl("file:///Users/yousef/video.mp4")).toEqual({
      ok: false,
      error: "Use an http or https video link.",
    });
  });
});
