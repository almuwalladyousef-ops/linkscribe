"use client";

import { FormEvent, useMemo, useState } from "react";
import { DownloadActions } from "./DownloadActions";
import { LinkInput } from "./LinkInput";
import { TranscriptPanel } from "./TranscriptPanel";
import { TranscriptionStatus } from "./TranscriptionStatus";
import { VideoPreview } from "./VideoPreview";
import { getPreviewSource } from "@/lib/preview/getPreviewSource";
import type { TranscriptSegment } from "@/lib/transcribe/types";
import { validateVideoUrl } from "@/lib/validation/videoUrl";

type TranscribeResponse = {
  jobId: string;
  title: string;
  segments: TranscriptSegment[];
  transcriptText: string;
  downloads: {
    transcript: string;
    media: string;
  };
};

type RequestState = "idle" | "working" | "ready" | "error";

export function LinkScribeApp() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<RequestState>("idle");
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TranscribeResponse | null>(null);

  const preview = useMemo(() => getPreviewSource(url), [url]);
  const displayedPreview = result
    ? ({
        kind: "video" as const,
        src: `${result.downloads.media}?inline=1`,
        label: "Downloaded video preview",
        aspect: preview.kind === "unavailable" ? "landscape" : preview.aspect,
      })
    : preview;
  const canSubmit = state !== "working";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateVideoUrl(url);
    if (!validation.ok) {
      setState("error");
      setStatus("Check the link");
      setError(validation.error);
      return;
    }

    setState("working");
    setStatus("Downloading and transcribing");
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: validation.url }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Transcription failed.");
      }

      setResult(body as TranscribeResponse);
      setState("ready");
      setStatus("Ready");
    } catch (caughtError) {
      setState("error");
      setStatus("Could not transcribe");
      setError(caughtError instanceof Error ? caughtError.message : "Transcription failed.");
    }
  }

  return (
    <section className="app-shell">
      <header className="topbar">
        <div>
          <h1>LinkScribe</h1>
          <p>Paste a video link and get a timestamped transcript.</p>
        </div>
      </header>

      <LinkInput
        value={url}
        disabled={!canSubmit}
        onChange={setUrl}
        onSubmit={handleSubmit}
      />

      <section className="workspace" aria-label="Transcription workspace">
        <VideoPreview preview={displayedPreview} />

        <div className="transcript-column">
          <TranscriptPanel segments={result?.segments ?? []} transcriptText={result?.transcriptText ?? ""} />
          <DownloadActions result={result} />
          <TranscriptionStatus state={state} message={status} error={error} />
        </div>
      </section>
    </section>
  );
}
