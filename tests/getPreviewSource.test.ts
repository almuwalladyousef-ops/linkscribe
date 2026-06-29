import { describe, expect, test } from "vitest";
import { getPreviewSource } from "@/lib/preview/getPreviewSource";

describe("getPreviewSource", () => {
  test("maps standard YouTube watch URLs to embed previews", () => {
    expect(getPreviewSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "embed",
      src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      label: "YouTube preview",
      aspect: "landscape",
    });
  });

  test("maps youtu.be URLs to embed previews", () => {
    expect(getPreviewSource("https://youtu.be/dQw4w9WgXcQ?si=abc")).toEqual({
      kind: "embed",
      src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      label: "YouTube preview",
      aspect: "landscape",
    });
  });

  test("uses native video preview for direct media links", () => {
    expect(getPreviewSource("https://example.com/path/video.mp4")).toEqual({
      kind: "video",
      src: "https://example.com/path/video.mp4",
      label: "Direct video preview",
      aspect: "landscape",
    });
  });

  test("returns unavailable for unknown platforms", () => {
    expect(getPreviewSource("https://example.com/watch/123")).toEqual({
      kind: "unavailable",
      label: "Preview unavailable",
    });
  });

  test("maps Instagram reel URLs to portrait embeds", () => {
    expect(getPreviewSource("https://www.instagram.com/reel/DaJSxFpMrtV/?igsh=abc")).toEqual({
      kind: "embed",
      src: "https://www.instagram.com/reel/DaJSxFpMrtV/embed",
      label: "Instagram preview",
      aspect: "portrait",
    });
  });

  test("maps TikTok video URLs to portrait embeds", () => {
    expect(getPreviewSource("https://www.tiktok.com/@user/video/7250000000000000000")).toEqual({
      kind: "embed",
      src: "https://www.tiktok.com/embed/v2/7250000000000000000",
      label: "TikTok preview",
      aspect: "portrait",
    });
  });
});
