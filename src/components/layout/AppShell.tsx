import type { ReactNode } from "react";
import type { AppView } from "../../types";
import { useTranslation } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";

type NavLabelKey = "shell.overview" | "shell.cardLibrary" | "shell.deckBuilder" | "shell.savedDecks" | "shell.matches" | "shell.metaWatch" | "shell.tips" | "shell.tox";
type NavItem = { id: AppView; labelKey: NavLabelKey; index: string };

const navigationGroups: Array<{ labelKey: "shell.workspace" | "shell.account"; items: NavItem[] }> = [
  {
    labelKey: "shell.workspace",
    items: [
      { id: "overview", labelKey: "shell.overview", index: "01" },
      { id: "cards", labelKey: "shell.cardLibrary", index: "02" },
      { id: "tox", labelKey: "shell.tox", index: "03" },
      { id: "builder", labelKey: "shell.deckBuilder", index: "04" },
      { id: "meta", labelKey: "shell.metaWatch", index: "05" },
      { id: "tips", labelKey: "shell.tips", index: "06" },
    ],
  },
  {
    labelKey: "shell.account",
    items: [
      { id: "saved", labelKey: "shell.savedDecks", index: "01" },
      { id: "matches", labelKey: "shell.matches", index: "02" },
    ],
  },
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
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

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
          <button
            type="button"
            className="theme-toggle"
            role="switch"
            aria-checked={isLight}
            aria-label={t(isLight ? "theme.toDark" : "theme.toLight")}
            title={t(isLight ? "theme.toDark" : "theme.toLight")}
            onClick={toggleTheme}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isLight ? (
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </>
              )}
            </svg>
          </button>
          <span className="live-indicator"><i /> {t("shell.live")}</span>
          <a className="steam-link" href="https://store.steampowered.com/app/2902720/SPAM/" target="_blank" rel="noreferrer">
            <span className="steam-dot">↗</span> {t("shell.steam")}
          </a>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          {navigationGroups.map((group) => (
            <nav
              key={group.labelKey}
              className="nav-group"
              aria-labelledby={`nav-label-${group.labelKey}`}
            >
              <div className="sidebar-label" id={`nav-label-${group.labelKey}`}>{t(group.labelKey)}</div>
              <div className="side-nav">
                {group.items.map((item) => (
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
              </div>
            </nav>
          ))}
          <div className="sidebar-spacer" />
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
