import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/transcribe/processVideo", () => ({
  processVideo: vi.fn(async () => ({
    jobId: "job_123",
    title: "Example video",
    segments: [{ startSeconds: 0, endSeconds: 2, text: "Hello world." }],
    transcriptText: "[00:00:00 - 00:00:02] Hello world.",
    downloads: {
      transcript: "/api/jobs/job_123/transcript",
      media: "/api/jobs/job_123/media",
    },
  })),
}));

import { POST } from "@/app/api/transcribe/route";
import { processVideo } from "@/lib/transcribe/processVideo";

describe("POST /api/transcribe", () => {
  test("rejects missing URLs with a user-facing error", async () => {
    const response = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        body: JSON.stringify({ url: "" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Paste a video link first.",
    });
  });

  test("returns transcript data for valid URLs", async () => {
    const response = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/video.mp4" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      jobId: "job_123",
      transcriptText: "[00:00:00 - 00:00:02] Hello world.",
    });
    expect(processVideo).toHaveBeenCalledWith("https://example.com/video.mp4");
  });
});
