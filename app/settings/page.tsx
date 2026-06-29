export default function SettingsPage() {
  return (
    <section className="utility-page">
      <header>
        <p>Settings</p>
        <h1>Local tools and cookies.</h1>
      </header>
      <div className="utility-panel settings-grid">
        <div>
          <span>Whisper</span>
          <strong>LINKSCRIBE_WHISPER_COMMAND</strong>
          <p>Optional override when the `whisper` command is not on your shell path.</p>
        </div>
        <div>
          <span>Model</span>
          <strong>LINKSCRIBE_WHISPER_MODEL</strong>
          <p>Defaults to `base`; set another local Whisper model if you want.</p>
        </div>
        <div>
          <span>Login-gated videos</span>
          <strong>LINKSCRIBE_YTDLP_COOKIES_FROM_BROWSER</strong>
          <p>Use `chrome` or `safari` when Instagram, TikTok, or another site needs browser cookies.</p>
        </div>
      </div>
    </section>
  );
}
