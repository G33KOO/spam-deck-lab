import type { ReactNode } from "react";
import type { AppView } from "../../types";
import { useTranslation } from "../../i18n/LanguageContext";

const navigation: Array<{ id: AppView; labelKey: "shell.overview" | "shell.cardLibrary" | "shell.deckBuilder" | "shell.savedDecks" | "shell.metaWatch" | "shell.tips"; index: string }> = [
  { id: "overview", labelKey: "shell.overview", index: "01" },
  { id: "cards", labelKey: "shell.cardLibrary", index: "02" },
  { id: "builder", labelKey: "shell.deckBuilder", index: "03" },
  { id: "saved", labelKey: "shell.savedDecks", index: "04" },
  { id: "meta", labelKey: "shell.metaWatch", index: "05" },
  { id: "tips", labelKey: "shell.tips", index: "06" },
];

const OFFICIAL_SPAMDEX = "https://spamgame.com/spamdex";
const OFFICIAL_TERMS = "https://spamgame.com/conditions-donnees-cartes";

export function AppShell({
  activeView,
  deckCount,
  savedDeckCount,
  savedDecksLoaded,
  onNavigate,
  children,
}: {
  activeView: AppView;
  deckCount: number;
  savedDeckCount: number;
  savedDecksLoaded: boolean;
  onNavigate: (view: AppView) => void;
  children: ReactNode;
}) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => onNavigate("overview")} aria-label={t("shell.home")}>
          <span className="brand-mark">S</span>
          <span className="brand-type">
            <strong>SPAM</strong>
            <small>DECK LAB</small>
          </span>
        </button>
        <div className="topbar-right">
          <div className="language-switch" role="group" aria-label={t("language.label")}>
            <button aria-label={t("language.french")} aria-pressed={language === "fr"} onClick={() => setLanguage("fr")}>FR</button>
            <button aria-label={t("language.english")} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
          </div>
          <span className="live-indicator"><i /> {t("shell.live")}</span>
          <a className="steam-link" href="https://store.steampowered.com/app/2902720/SPAM/" target="_blank" rel="noreferrer">
            <span className="steam-dot">↗</span> {t("shell.steam")}
          </a>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-label">{t("shell.workspace")}</div>
          <nav className="side-nav" aria-label={t("shell.mainNavigation")}>
            {navigation.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-index">{item.index}</span>
                <span>{t(item.labelKey)}</span>
                {item.id === "builder" && deckCount > 0 && (
                  <span className="nav-count">{deckCount}</span>
                )}
                {item.id === "saved" && savedDecksLoaded && (
                  <span className="nav-count" aria-label={t("shell.savedDeckCount", { count: savedDeckCount })}>
                    {savedDeckCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-spacer" />
          <div className="sidebar-note">
            <span className="note-icon">✳</span>
            <p>{t("shell.sidebarPrompt")}</p>
            <button onClick={() => onNavigate("builder")}>{t("shell.openBuilder")} <span>↗</span></button>
          </div>
          <div className="sidebar-footer">
            <span>{t("shell.communityTool")}</span>
            <span>{t("shell.disclaimer")}</span>
          </div>
        </aside>

        <main className="main-content">
          <div className="content-wrap">
            {children}
            <footer className="page-footer">
              <span>SPAM DECK LAB <span className="footer-separator">/</span> {t("shell.footer")}</span>
              <span>
                {t("shell.cardData")}: <a href={OFFICIAL_SPAMDEX} target="_blank" rel="noreferrer">{t("shell.officialSpamdex")}</a>
                <span className="footer-separator"> · </span>
                <a href={OFFICIAL_TERMS} target="_blank" rel="noreferrer">{t("shell.dataTerms")}</a>
              </span>
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}
