"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const navItems = [
  { href: "/linkscribe", label: "LinkScribe", shortcut: "⌘1" },
  { href: "/archive", label: "Archive", shortcut: "⌘2" },
  { href: "/settings", label: "Settings", shortcut: "⌘," },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth < 780;
      setIsMobile(mobile);
      if (mobile) setNavOpen(false);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;

      if (event.key === "b") {
        event.preventDefault();
        setNavOpen((open) => !open);
      }
      if (event.key === "1") {
        event.preventDefault();
        router.push("/linkscribe");
      }
      if (event.key === "2") {
        event.preventDefault();
        router.push("/archive");
      }
      if (event.key === ",") {
        event.preventDefault();
        router.push("/settings");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div
      className="app-frame"
      style={{
        gridTemplateColumns: isMobile ? "1fr" : navOpen ? "232px minmax(0, 1fr)" : "0 minmax(0, 1fr)",
      }}
    >
      <aside className={`sidebar ${navOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Link href="/linkscribe" aria-label="Open LinkScribe">
            <strong>LinkScribe</strong>
            <span>local transcript desk</span>
          </Link>
          <button type="button" onClick={() => setNavOpen(false)} aria-label="Close sidebar" title="Close sidebar">
            {sidebarIcon}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link className={active ? "active" : ""} href={item.href} key={item.href}>
                <span>{item.label}</span>
                <kbd>{item.shortcut}</kbd>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <span>Source</span>
          <strong>yt-dlp + Whisper</strong>
        </div>
      </aside>

      {isMobile && navOpen ? (
        <button className="mobile-scrim" type="button" onClick={() => setNavOpen(false)} aria-label="Close sidebar" />
      ) : null}

      <button
        className={`nav-reopen ${!navOpen ? "visible" : ""}`}
        type="button"
        onClick={() => setNavOpen(true)}
        aria-label="Open sidebar"
        title="Open sidebar"
      >
        {sidebarIcon}
      </button>

      <main className="app-scroll">{children}</main>
    </div>
  );
}

const sidebarIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-13Zm5 14v-15"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);
