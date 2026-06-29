# LinkScribe

LinkScribe is a local-first web app for transcribing videos from links supported by `yt-dlp`.

## What It Does

- Paste a video URL.
- Preview the video when the source can be embedded or played directly.
- Download the current job's media with `yt-dlp`.
- Transcribe locally with Whisper.
- Show timestamped transcript segments.
- Copy the transcript.
- Download the transcript or current job media.

LinkScribe does not use a database, accounts, Google Drive, or permanent transcript history.

## Requirements

- Node.js
- `yt-dlp`
- `ffmpeg`
- Local Whisper command-line tool

On macOS:

```bash
brew install yt-dlp ffmpeg
python3 -m pip install -U openai-whisper
```

If the `whisper` command is installed somewhere outside your default shell path, start the app from a terminal where `whisper` works.
On macOS, LinkScribe also checks the common user Python location automatically, such as `~/Library/Python/3.9/bin/whisper`.

Optional model setting:

```bash
export LINKSCRIBE_WHISPER_MODEL=base
```

Optional command override:

```bash
export LINKSCRIBE_WHISPER_COMMAND=/Users/yousef/Library/Python/3.9/bin/whisper
```

Optional Instagram/private-post cookie settings:

```bash
export LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER=chrome
```

or:

```bash
export LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER=safari
```

Start LinkScribe from the same terminal after setting this value:

```bash
npm run dev
```

Use this when `yt-dlp` says Instagram sent an empty media response, reports `HTTP Error 403: Forbidden`, asks for `--cookies-from-browser`, or the video is accessible only while logged in. You must already be logged into that site in the selected browser, and the video must open there. As an alternative, set `LINKSCRIBE_YTDLP_COOKIES=/path/to/cookies.txt` to use a Netscape-format cookies file.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
npm test
npm run build
```

## Notes

- Platform support comes from `yt-dlp`.
- Private, deleted, region-restricted, or login-gated videos may require browser cookies.
- LinkScribe verifies that the downloaded media has a video stream before offering it as a video download.
- LinkScribe converts VP9/AV1 videos to H.264/AAC MP4 so downloads open correctly in QuickTime Player.
- Job files are temporary and stored under `tmp/jobs`.
- Downloads are for the current temporary job only.
