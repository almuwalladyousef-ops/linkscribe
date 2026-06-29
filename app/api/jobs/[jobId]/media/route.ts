import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { getJobFile } from "@/lib/jobs/getJobFile";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> | { jobId: string } },
): Promise<Response> {
  const { jobId } = await context.params;
  const file = await getJobFile(jobId, "media");

  if (!file) {
    return Response.json({ error: "Video download expired." }, { status: 404 });
  }

  const contents = await readFile(file.path);
  const inline = new URL(request.url).searchParams.get("inline") === "1";

  return new Response(contents, {
    headers: {
      "Content-Type": getMediaContentType(file.filename),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${file.filename}"`,
    },
  });
}

export function getMediaContentType(filename: string): string {
  switch (extname(filename).toLowerCase()) {
    case ".mp4":
    case ".m4v":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".mp3":
      return "audio/mpeg";
    case ".m4a":
      return "audio/mp4";
    case ".wav":
      return "audio/wav";
    default:
      return "application/octet-stream";
  }
}
