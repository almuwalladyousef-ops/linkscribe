---
node_type: Note
summary: Fixed Instagram auth, preview, copy, and QuickTime video downloads
---

# 2026-06-29 — Instagram Download Fixes

## Changes

- `lib/transcribe/downloadMedia.ts` — supports `LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER` and `LINKSCRIBE_YTDLP_COOKIES` for authenticated downloads (was: no cookie support)
- `lib/transcribe/downloadMedia.ts` — maps Instagram empty media and HTTP 403 failures to actionable cookie setup errors (was: raw `yt-dlp` errors)
- `lib/transcribe/downloadMedia.ts` — verifies downloaded media has a video stream with `ffprobe` (was: trusted downloaded file blindly)
- `lib/transcribe/downloadMedia.ts` — transcodes VP9/AV1 media to H.264/AAC `media-quicktime.mp4` for QuickTime compatibility (was: downloaded MP4 could play audio only in QuickTime)
- `lib/transcribe/transcribeAudio.ts` — resolves macOS user Python `whisper` executable automatically and supports `LINKSCRIBE_WHISPER_COMMAND` (was: called only `whisper` from PATH)
- `lib/preview/getPreviewSource.ts` — adds Instagram and TikTok portrait embed preview URLs (was: preview unavailable for Instagram and TikTok)
- `components/VideoPreview.tsx` — supports portrait preview aspect for Instagram and TikTok embeds (was: landscape preview only)
- `components/LinkScribeApp.tsx` — switches preview to the locally downloaded video after successful processing (was: platform embed only)
- `components/TranscriptPanel.tsx` — copies transcript text without timestamps (was: copied timestamped transcript)
- `lib/transcribe/formatTranscript.ts` — adds plain transcript formatter for copy action (was: timestamped formatter only)
- `app/api/jobs/[jobId]/media/route.ts` — supports inline media serving with correct content type (was: attachment-only octet stream)
- `tests/` — expanded coverage to 37 passing tests across 8 files (was: 14 initial tests)
- `README.md` — documents cookies, Whisper command resolution, video-stream verification, and QuickTime conversion (was: basic setup only)
- `verification: unit tests` — `npm test` passes with 37 tests across 8 files (was: fewer tests before fixes)
- `verification: production build` — `npm run build` passes (was: not rerun after fixes)
- `decision: video downloads` — downloaded videos are converted to QuickTime-compatible H.264/AAC when needed (was: raw `yt-dlp` output)

## Connected To

- [[03 Projects/LinkScribe/sessions/00 Sessions]]
