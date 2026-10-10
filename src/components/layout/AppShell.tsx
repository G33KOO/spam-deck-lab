import type { ReactNode } from "react";
import type { AppView } from "../../types";

const navigation: Array<{ id: AppView; label: string; index: string }> = [
  { id: "overview", label: "Overview", index: "01" },
  { id: "cards", label: "Card library", index: "02" },
  { id: "builder", label: "Deck builder", index: "03" },
  { id: "meta", label: "Meta watch", index: "04" },
];

const OFFICIAL_SPAMDEX = "https://spamgame.com/spamdex";
const OFFICIAL_TERMS = "https://spamgame.com/conditions-donnees-cartes";

export function AppShell({
  activeView,
  deckCount,
  onNavigate,
  children,
}: {
  activeView: AppView;
  deckCount: number;
  onNavigate: (view: AppView) => void;
  children: ReactNode;
}) {
  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => onNavigate("overview")} aria-label="SPAM Deck Lab home">
          <span className="brand-mark">S</span>
          <span className="brand-type">
            <strong>SPAM</strong>
            <small>DECK LAB</small>
          </span>
        </button>
        <div className="topbar-right">
          <span className="live-indicator"><i /> CARD DATA LIVE</span>
          <a className="steam-link" href="https://store.steampowered.com/app/2902720/SPAM/" target="_blank" rel="noreferrer">
            <span className="steam-dot">↗</span> PLAY ON STEAM
          </a>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-label">WORKSPACE</div>
          <nav className="side-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-index">{item.index}</span>
                <span>{item.label}</span>
                {item.id === "builder" && deckCount > 0 && (
                  <span className="nav-count">{deckCount}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-spacer" />
          <div className="sidebar-note">
            <span className="note-icon">✳</span>
            <p>Build your next<br />winning combination.</p>
            <button onClick={() => onNavigate("builder")}>OPEN DECK BUILDER <span>↗</span></button>
          </div>
          <div className="sidebar-footer">
            <span>COMMUNITY TOOL</span>
            <span>NOT AFFILIATED WITH SPAM</span>
          </div>
        </aside>

        <main className="main-content">
          <div className="content-wrap">
            {children}
            <footer className="page-footer">
              <span>SPAM DECK LAB <span className="footer-separator">/</span> BUILT FOR PLAYERS</span>
              <span>
                CARD DATA: <a href={OFFICIAL_SPAMDEX} target="_blank" rel="noreferrer">OFFICIAL SPAMDEX</a>
                <span className="footer-separator"> · </span>
                <a href={OFFICIAL_TERMS} target="_blank" rel="noreferrer">DATA TERMS</a>
              </span>
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}
