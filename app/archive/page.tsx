export default function ArchivePage() {
  return (
    <section className="utility-page">
      <header>
        <p>Archive</p>
        <h1>Current-session files only.</h1>
      </header>
      <div className="utility-panel">
        <p>
          LinkScribe keeps downloaded media and transcripts in temporary job folders while the app is running. There is
          no permanent database or saved history.
        </p>
      </div>
    </section>
  );
}
