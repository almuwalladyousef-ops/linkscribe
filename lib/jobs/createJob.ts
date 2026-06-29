import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Job, JobMetadata } from "./types";

const metadataFilename = "job.json";

export function getJobsBaseDir(baseDir = join(process.cwd(), "tmp", "jobs")): string {
  return resolve(baseDir);
}

export function getJobPaths(jobId: string, baseDir?: string): Job {
  if (!/^job_[a-f0-9-]+$/i.test(jobId)) {
    throw new Error("Invalid job id.");
  }

  const root = getJobsBaseDir(baseDir);
  const dir = resolve(root, jobId);

  if (!dir.startsWith(root)) {
    throw new Error("Invalid job path.");
  }

  return { id: jobId, dir };
}

export async function createJob(baseDir?: string): Promise<Job> {
  const root = getJobsBaseDir(baseDir);
  await mkdir(root, { recursive: true });

  const job = getJobPaths(`job_${randomUUID()}`, root);
  await mkdir(job.dir, { recursive: false });
  return job;
}

export async function writeJobMetadata(job: Job, metadata: JobMetadata): Promise<void> {
  await writeFile(join(job.dir, metadataFilename), JSON.stringify(metadata, null, 2), "utf8");
}

export async function readJobMetadata(jobId: string, baseDir?: string): Promise<JobMetadata | null> {
  const job = getJobPaths(jobId, baseDir);

  try {
    const contents = await readFile(join(job.dir, metadataFilename), "utf8");
    return JSON.parse(contents) as JobMetadata;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}
