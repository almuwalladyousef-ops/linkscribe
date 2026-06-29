import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Job } from "@/lib/jobs/types";
import type { TranscriptSegment } from "./types";
import type { CommandRunner } from "./runCommand";
import { runCommand, UserFacingError } from "./runCommand";

type WhisperJson = {
  segments?: Array<{
    start?: number;
    end?: number;
    text?: string;
  }>;
};

export async function transcribeAudio(
  mediaPath: string,
  job: Job,
  runner: CommandRunner = runCommand,
  env: NodeJS.ProcessEnv = process.env,
): Promise<TranscriptSegment[]> {
  const model = env.LINKSCRIBE_WHISPER_MODEL || "base";
  const whisperCommand = await resolveWhisperCommand(env);

  try {
    await runner(whisperCommand, [
      mediaPath,
      "--model",
      model,
      "--output_format",
      "json",
      "--output_dir",
      job.dir,
    ]);

    const jsonPath = await findWhisperJson(job.dir);
    if (!jsonPath) {
      throw new UserFacingError("Transcription finished, but no transcript JSON was created.");
    }

    return parseWhisperJson(await readFile(jsonPath, "utf8"));
  } catch (error) {
    if (error instanceof UserFacingError) {
      throw error;
    }

    throw new UserFacingError("Transcription failed. Check that local Whisper is installed.");
  }
}

export async function resolveWhisperCommand(env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const configured = env.LINKSCRIBE_WHISPER_COMMAND?.trim();
  if (configured) {
    return configured;
  }

  const home = env.HOME;
  if (!home) {
    return "whisper";
  }

  const pythonRoot = join(home, "Library", "Python");
  try {
    const versions = await readdir(pythonRoot);

    for (const version of versions.sort().reverse()) {
      const candidate = join(pythonRoot, version, "bin", "whisper");
      if (await fileExists(candidate)) {
        return candidate;
      }
    }
  } catch {
    return "whisper";
  }

  return "whisper";
}

export function parseWhisperJson(contents: string): TranscriptSegment[] {
  const parsed = JSON.parse(contents) as WhisperJson;

  return (parsed.segments ?? [])
    .map((segment) => ({
      startSeconds: Number(segment.start ?? 0),
      endSeconds: Number(segment.end ?? segment.start ?? 0),
      text: String(segment.text ?? "").trim(),
    }))
    .filter((segment) => segment.text.length > 0);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findWhisperJson(dir: string): Promise<string | null> {
  const entries = await readdir(dir);
  const json = entries.find((entry) => entry.endsWith(".json") && entry !== "job.json");
  return json ? join(dir, json) : null;
}
