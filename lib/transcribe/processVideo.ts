import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cleanupExpiredJobs } from "@/lib/jobs/cleanupJobs";
import { createJob, writeJobMetadata } from "@/lib/jobs/createJob";
import { downloadMedia } from "./downloadMedia";
import { formatTranscript } from "./formatTranscript";
import { transcribeAudio } from "./transcribeAudio";
import type { TranscriptSegment } from "./types";

export type ProcessedVideo = {
  jobId: string;
  title: string;
  segments: TranscriptSegment[];
  transcriptText: string;
  downloads: {
    transcript: string;
    media: string;
  };
};

export async function processVideo(url: string): Promise<ProcessedVideo> {
  await cleanupExpiredJobs();

  const job = await createJob();
  const media = await downloadMedia(url, job);
  const segments = await transcribeAudio(media.path, job);
  const transcriptText = formatTranscript(segments);
  const transcriptPath = join(job.dir, "transcript.txt");

  await writeFile(transcriptPath, transcriptText, "utf8");
  await writeJobMetadata(job, {
    sourceUrl: url,
    title: media.title,
    mediaPath: media.path,
    mediaFilename: media.filename,
    transcriptPath,
    transcriptFilename: "transcript.txt",
    createdAt: new Date().toISOString(),
  });

  return {
    jobId: job.id,
    title: media.title,
    segments,
    transcriptText,
    downloads: {
      transcript: `/api/jobs/${job.id}/transcript`,
      media: `/api/jobs/${job.id}/media`,
    },
  };
}
