import { readJobMetadata } from "./createJob";

export type JobFileKind = "media" | "transcript";

export async function getJobFile(
  jobId: string,
  kind: JobFileKind,
): Promise<{ path: string; filename: string } | null> {
  const metadata = await readJobMetadata(jobId);

  if (!metadata) {
    return null;
  }

  if (kind === "media") {
    return {
      path: metadata.mediaPath,
      filename: metadata.mediaFilename,
    };
  }

  return {
    path: metadata.transcriptPath,
    filename: metadata.transcriptFilename,
  };
}
