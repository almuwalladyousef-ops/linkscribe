---
node_type: Note
summary: Built initial LinkScribe web app
---

# 2026-06-29 — Initial Build

## Changes

- `package.json` — Next.js app scripts and dependencies with Vitest and Playwright dev tooling (was: didn't exist)
- `app/page.tsx` — LinkScribe app entry rendering the transcription tool (was: didn't exist)
- `app/layout.tsx` — Next.js root layout and metadata (was: didn't exist)
- `app/globals.css` — responsive utility-focused LinkScribe styling (was: didn't exist)
- `components/` — input, preview, status, transcript, downloads, and app shell components (was: didn't exist)
- `lib/validation/videoUrl.ts` — URL validation for http and https video links (was: didn't exist)
- `lib/preview/getPreviewSource.ts` — best-effort YouTube/direct video preview source resolver (was: didn't exist)
- `lib/transcribe/` — media download, local Whisper transcription, transcript formatting, command runner, and process pipeline modules (was: didn't exist)
- `lib/jobs/` — temporary job folder, metadata, cleanup, and file lookup helpers (was: didn't exist)
- `app/api/transcribe/route.ts` — transcription API route with user-facing validation and error handling (was: didn't exist)
- `app/api/jobs/[jobId]/transcript/route.ts` — current-job transcript download route (was: didn't exist)
- `app/api/jobs/[jobId]/media/route.ts` — current-job media download route (was: didn't exist)
- `tests/` — Vitest coverage for validation, preview, transcript formatting, jobs, and API behavior (was: didn't exist)
- `README.md` — local setup, run, and verification instructions (was: didn't exist)
- `decision: transcription engine` — first implementation uses local `whisper` CLI behind `lib/transcribe/transcribeAudio.ts` (was: local/free engine undecided)
- `verification: unit tests` — `npm test` passes with 14 tests across 5 files (was: no tests)
- `verification: production build` — `npm run build` passes (was: no build)
- `verification: browser QA` — Playwright fallback verified desktop/mobile render, no mobile horizontal overflow, empty URL error, YouTube preview iframe, and disabled pre-transcript actions (was: no browser verification)
- `local dependency status` — `yt-dlp` and `ffmpeg` installed, `whisper` missing from PATH (was: unchecked)

## Connected To

- [[03 Projects/LinkScribe/sessions/00 Sessions]]
