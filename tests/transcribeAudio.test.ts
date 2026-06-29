import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";
import { resolveWhisperCommand, transcribeAudio } from "@/lib/transcribe/transcribeAudio";

describe("resolveWhisperCommand", () => {
  test("uses LINKSCRIBE_WHISPER_COMMAND when configured", async () => {
    await expect(
      resolveWhisperCommand({
        LINKSCRIBE_WHISPER_COMMAND: "/custom/bin/whisper",
      }),
    ).resolves.toBe("/custom/bin/whisper");
  });

  test("finds a macOS user Python whisper executable", async () => {
    const home = join(process.cwd(), "tmp", `home-${Date.now()}`);
    const bin = join(home, "Library", "Python", "3.9", "bin");
    await mkdir(bin, { recursive: true });
    await writeFile(join(bin, "whisper"), "#!/bin/sh\n");

    await expect(resolveWhisperCommand({ HOME: home })).resolves.toBe(join(bin, "whisper"));
  });
});

describe("transcribeAudio", () => {
  test("calls the resolved whisper command", async () => {
    const dir = join(process.cwd(), "tmp", `transcribe-test-${Date.now()}`);
    const mediaPath = join(dir, "media.mp4");
    await mkdir(dir, { recursive: true });
    await writeFile(mediaPath, "media");
    await writeFile(
      join(dir, "media.json"),
      JSON.stringify({ segments: [{ start: 0, end: 1, text: "Hello." }] }),
    );
    const runner = vi.fn(async () => ({ stdout: "", stderr: "" }));

    await expect(
      transcribeAudio(mediaPath, { id: "job_test", dir }, runner, {
        LINKSCRIBE_WHISPER_COMMAND: "/custom/bin/whisper",
      }),
    ).resolves.toEqual([{ startSeconds: 0, endSeconds: 1, text: "Hello." }]);

    expect(runner).toHaveBeenCalledWith(
      "/custom/bin/whisper",
      expect.arrayContaining([mediaPath, "--output_format", "json"]),
    );
  });
});
