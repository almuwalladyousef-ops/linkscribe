import { readFile } from "node:fs/promises";
import { getJobFile } from "@/lib/jobs/getJobFile";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> | { jobId: string } },
): Promise<Response> {
  const { jobId } = await context.params;
  const file = await getJobFile(jobId, "transcript");

  if (!file) {
    return Response.json({ error: "Transcript download expired." }, { status: 404 });
  }

  const contents = await readFile(file.path);

  return new Response(contents, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    },
  });
}
