# LinkScribe — Implementation Plan

## Goal

Build a local-first web app where Yousef pastes a video link, previews the video when possible, transcribes it with local/free tooling, sees timestamped transcript text, copies it, and can download the current job's transcript and video without saving history.

## Product Scope

### MVP

- Paste a video URL from YouTube, Instagram, TikTok, or any other `yt-dlp` supported source.
- Show a video preview before transcription when the platform allows embedding or direct playback.
- Click **Transcribe**.
- Extract/download media through `yt-dlp`.
- Transcribe locally or with a free local transcription engine.
- Show transcript text in the browser.
- Show timestamps for when each segment was said.
- Copy the full transcript.
- Download the transcript for the current job.
- Download the video/audio file produced for the current job.
- Clean up temporary job files after a short retention window or app restart.

### Out of Scope for MVP

- Database.
- User accounts.
- Transcript history.
- Google Drive integration.
- Automatic permanent saving.
- Paid transcription API requirement.
- Desktop packaging.
- Multi-user hosting.

## Core Decisions

- **App type:** Next.js web app first.
- **Backend:** Next.js API routes running on the local machine.
- **Storage:** Temporary filesystem job folders only.
- **Persistence:** No permanent history. The user manually copies or downloads anything they want to keep.
- **Supported platforms:** Treat every URL as a `yt-dlp` input. Platform support comes from `yt-dlp`.
- **Transcription:** Local/free-first engine behind a replaceable service boundary.
- **Timestamps:** Preserve segment-level timestamps from the transcription engine and render them beside transcript lines.
- **Preview:** Best-effort only. If preview cannot be embedded or loaded, the app still transcribes.
- **Downloads:** Available for the active/current job only. No library or archive.
- **Cleanup:** Media and transcript artifacts are temporary and removed after the current job expires.

## Recommended Transcription Engine

Start with a local command-line transcription engine and keep it swappable:

- Preferred candidates: `faster-whisper`, `whisper.cpp`, or the Python `openai-whisper` package.
- The implementation should call the engine through `lib/transcribe/transcribeAudio.ts`.
- The backend should surface clear setup errors when the engine is missing.
- No paid OpenAI API key should be required for the MVP.

## Architecture

The app has one user-facing page and a small backend pipeline.

Frontend flow:

1. User pastes a URL.
2. App validates the URL format.
3. App shows a preview panel when possible.
4. User clicks **Transcribe**.
5. App shows status updates.
6. App renders timestamped transcript segments.
7. User can copy text, download transcript, or download the current job video.

Backend flow:

1. `POST /api/transcribe` receives a URL.
2. Server validates the URL.
3. Server creates a temporary job folder.
4. Server calls `yt-dlp` to fetch metadata and media.
5. Server extracts audio or downloads media in a format suitable for transcription.
6. Server calls the local transcription engine.
7. Server writes a temporary transcript file for download.
8. Server returns transcript segments and temporary download IDs.
9. Download endpoints stream files from the temporary job folder.
10. Cleanup removes expired temporary job folders.

## Folder Structure

```txt
LinkScribe/
  package.json
  next.config.ts
  tsconfig.json
  app/
    layout.tsx
    page.tsx
    globals.css
    api/
      transcribe/
        route.ts
      jobs/
        [jobId]/
          transcript/
            route.ts
          media/
            route.ts
  components/
    LinkInput.tsx
    VideoPreview.tsx
    TranscriptionStatus.tsx
    TranscriptPanel.tsx
    DownloadActions.tsx
  lib/
    jobs/
      createJob.ts
      cleanupJobs.ts
      getJobFile.ts
      types.ts
    preview/
      getPreviewSource.ts
    transcribe/
      downloadMedia.ts
      transcribeAudio.ts
      formatTranscript.ts
      types.ts
    validation/
      videoUrl.ts
  tests/
    videoUrl.test.ts
    getPreviewSource.test.ts
    formatTranscript.test.ts
    transcribe-route.test.ts
  tmp/
    .gitkeep
  README.md
```

## Key Modules

### `lib/validation/videoUrl.ts`

Responsibility:

- Accept valid `http` and `https` URLs.
- Reject empty strings, non-URLs, and unsupported protocols.
- Avoid platform-specific allowlists so `yt-dlp` can decide actual support.

### `lib/preview/getPreviewSource.ts`

Responsibility:

- Return a best-effort preview model for known embeddable URLs.
- YouTube links should become YouTube embed URLs.
- Direct media links may use native video playback.
- Unknown platforms should return an unavailable preview state rather than blocking transcription.

### `lib/transcribe/downloadMedia.ts`

Responsibility:

- Call `yt-dlp`.
- Fetch metadata.
- Download the media or extract audio into the job folder.
- Return local file paths and display metadata.
- Convert command failures into clear user-facing errors.

### `lib/transcribe/transcribeAudio.ts`

Responsibility:

- Call the configured local transcription engine.
- Return normalized transcript segments:

```ts
type TranscriptSegment = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};
```

### `lib/transcribe/formatTranscript.ts`

Responsibility:

- Convert segments into copyable and downloadable text.
- Include timestamps by default:

```txt
[00:00:12 - 00:00:17] This is the spoken text.
```

### `lib/jobs/*`

Responsibility:

- Create unique temporary job folders.
- Track current job artifacts on disk.
- Stream temporary files for downloads.
- Delete expired jobs.

## UI Direction

LinkScribe should open directly as the tool, not a landing page.

Layout:

```txt
LinkScribe

[ Paste video link                                      ] [Transcribe]

Video preview
--------------------------------------------------------
Embedded video or direct preview when available
If unavailable: compact "Preview unavailable" state
--------------------------------------------------------

Status line

Transcript
--------------------------------------------------------
[00:00:12 - 00:00:17] Segment text...
[00:00:18 - 00:00:24] Segment text...
--------------------------------------------------------

[Copy transcript] [Download transcript] [Download video]
```

Design principles:

- Quiet, utility-focused interface.
- No marketing hero.
- No account or navigation chrome.
- Clear error messages.
- Stable controls with no layout shift.
- Copy and download actions stay disabled until a transcript/job exists.
- Preview failure never prevents transcription.

## Error Handling

The app should show plain, actionable errors:

- Missing or invalid URL.
- `yt-dlp` is not installed.
- Local transcription engine is not installed.
- Platform/video is unsupported by `yt-dlp`.
- Video is private, deleted, region-restricted, or login-gated.
- Download failed.
- Transcription failed.
- Temporary file expired before download.

Errors should avoid stack traces in the UI. Server logs can keep technical detail.

## Testing Plan

Use test-driven development for implementation.

Unit tests:

- URL validation accepts `http` and `https`.
- URL validation rejects empty, invalid, and non-web protocols.
- Preview source maps YouTube URLs to embed URLs.
- Preview source returns unavailable state for unknown URLs.
- Transcript formatter includes timestamps.
- Transcript formatter handles empty transcript.
- API route maps dependency failures to user-facing errors.

Integration/manual verification:

- Run the app locally.
- Paste a YouTube URL.
- Confirm preview appears if embeddable.
- Start transcription.
- Confirm transcript appears with timestamps.
- Confirm copy button copies transcript text.
- Confirm transcript download returns a `.txt` file.
- Confirm video download streams the current job media.
- Confirm unsupported/private URLs show clear errors.
- Confirm temp files are cleaned up according to the retention policy.

Required verification before completion:

- `npm test`
- `npm run build`
- Browser verification with Playwright or the in-app browser against the local app.

## Build Order

1. Scaffold the Next.js TypeScript app.
2. Add package scripts for test, build, lint, and dev.
3. Add URL validation tests.
4. Implement URL validation.
5. Add preview source tests.
6. Implement preview source parsing.
7. Add transcript formatting tests.
8. Implement transcript formatting.
9. Add job folder helpers and tests.
10. Implement temporary job folder creation and lookup.
11. Add backend command wrapper tests with mocked command execution boundaries.
12. Implement `yt-dlp` media download wrapper.
13. Implement local transcription wrapper.
14. Implement `POST /api/transcribe`.
15. Implement transcript and media download routes.
16. Build the frontend input, preview, status, transcript, and action components.
17. Wire frontend state to the API.
18. Add setup instructions to `README.md`.
19. Run tests and build.
20. Run browser verification.

## Setup Requirements for Yousef's Machine

The app will need these installed locally:

- Node.js.
- `yt-dlp`.
- A local Whisper-compatible transcription engine.
- `ffmpeg`, if required by the chosen transcription/download path.

The README should include exact install commands for macOS.

## Session Rules

- Follow this plan unless Yousef changes scope.
- Use TDD for implementation work.
- Use systematic debugging for failures.
- Verify before claiming completion.
- Do not add database, auth, Drive sync, or permanent history unless explicitly requested.
- At the end of every meaningful session, tell Yousef what decisions/files are worth saving and ask whether to write a session summary.
