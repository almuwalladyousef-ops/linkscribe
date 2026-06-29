import { mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { createJob, getJobPaths, readJobMetadata, writeJobMetadata } from "@/lib/jobs/createJob";

describe("job helpers", () => {
  test("creates a unique job directory under the configured base directory", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "linkscribe-jobs-"));

    const first = await createJob(baseDir);
    const second = await createJob(baseDir);

    expect(first.id).not.toBe(second.id);
    expect(first.dir.startsWith(baseDir)).toBe(true);
    expect((await stat(first.dir)).isDirectory()).toBe(true);
  });

  test("writes and reads job metadata", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "linkscribe-jobs-"));
    const job = await createJob(baseDir);
    const mediaPath = join(job.dir, "media.mp4");
    const transcriptPath = join(job.dir, "transcript.txt");

    await writeFile(mediaPath, "media");
    await writeFile(transcriptPath, "transcript");
    await writeJobMetadata(job, {
      sourceUrl: "https://example.com/video.mp4",
      title: "Example",
      mediaPath,
      mediaFilename: "media.mp4",
      transcriptPath,
      transcriptFilename: "transcript.txt",
      createdAt: "2026-06-29T00:00:00.000Z",
    });

    expect(await readJobMetadata(job.id, baseDir)).toMatchObject({
      sourceUrl: "https://example.com/video.mp4",
      title: "Example",
      mediaFilename: "media.mp4",
      transcriptFilename: "transcript.txt",
    });
  });

  test("rejects unsafe job ids when resolving paths", () => {
    expect(() => getJobPaths("../outside")).toThrow("Invalid job id.");
  });
});
