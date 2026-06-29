import { describe, expect, test } from "vitest";
import { getMediaContentType } from "@/app/api/jobs/[jobId]/media/route";

describe("getMediaContentType", () => {
  test("returns playable video content types", () => {
    expect(getMediaContentType("media.mp4")).toBe("video/mp4");
    expect(getMediaContentType("media.webm")).toBe("video/webm");
    expect(getMediaContentType("media.mov")).toBe("video/quicktime");
  });

  test("returns audio content types for audio-only files", () => {
    expect(getMediaContentType("media.mp3")).toBe("audio/mpeg");
    expect(getMediaContentType("media.m4a")).toBe("audio/mp4");
  });
});
