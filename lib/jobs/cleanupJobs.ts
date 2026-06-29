import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { getJobsBaseDir } from "./createJob";

const defaultMaxAgeMs = 1000 * 60 * 60 * 6;

export async function cleanupExpiredJobs(maxAgeMs = defaultMaxAgeMs): Promise<void> {
  const root = getJobsBaseDir();
  const now = Date.now();

  let entries: string[];
  try {
    entries = await readdir(root);
  } catch {
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.startsWith("job_"))
      .map(async (entry) => {
        const dir = join(root, entry);
        const details = await stat(dir);

        if (now - details.mtimeMs > maxAgeMs) {
          await rm(dir, { recursive: true, force: true });
        }
      }),
  );
}
