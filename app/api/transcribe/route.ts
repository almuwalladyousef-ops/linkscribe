import { processVideo } from "@/lib/transcribe/processVideo";
import { UserFacingError } from "@/lib/transcribe/runCommand";
import { validateVideoUrl } from "@/lib/validation/videoUrl";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a video URL to transcribe." }, { status: 400 });
  }

  const url = typeof body === "object" && body && "url" in body ? String(body.url) : "";
  const validation = validateVideoUrl(url);

  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    return Response.json(await processVideo(validation.url));
  } catch (error) {
    if (error instanceof UserFacingError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return Response.json({ error: "Transcription failed." }, { status: 500 });
  }
}
