import { describe, expect, test } from "vitest";
import { formatTranscript, formatTranscriptPlainText } from "@/lib/transcribe/formatTranscript";

describe("formatTranscript", () => {
  test("formats transcript segments with timestamps", () => {
    expect(
      formatTranscript([
        { startSeconds: 12.2, endSeconds: 17.9, text: "This is the first line." },
        { startSeconds: 78, endSeconds: 82.3, text: "This is the second line." },
      ]),
    ).toBe(
      [
        "[00:00:12 - 00:00:18] This is the first line.",
        "[00:01:18 - 00:01:22] This is the second line.",
      ].join("\n"),
    );
  });

  test("returns an empty string for an empty transcript", () => {
    expect(formatTranscript([])).toBe("");
  });

  test("formats plain transcript text without timestamps", () => {
    expect(
      formatTranscriptPlainText([
        { startSeconds: 12.2, endSeconds: 17.9, text: "This is the first line." },
        { startSeconds: 78, endSeconds: 82.3, text: " This is the second line. " },
      ]),
    ).toBe(["This is the first line.", "This is the second line."].join("\n"));
  });
});
