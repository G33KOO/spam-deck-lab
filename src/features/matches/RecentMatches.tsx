import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { CardCatalogue, CardData } from "../../types";
import { CardTile } from "../../components/cards/CardTile";
import { ShareLinkButton } from "../../components/ShareLinkButton";
import { DataNotice, LoadingState, PageHeader } from "../../components/ui";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  clearStoredMatches,
  loadStoredMatches,
  mergeMatches,
  parseReplayIndex,
  readReplayAccountId,
  storeMatches,
} from "../../lib/replays";
import type { MatchRecord, PlayerInfo } from "../../lib/replays";
import {
  clearReplayHandle,
  loadReplayHandle,
  readReplayHandle,
  saveReplayHandle,
} from "../../lib/replayHandle";
import type { ReplayFileHandle } from "../../lib/replayHandle";

const MAX_INDEX_BYTES = 2_000_000;
const REPLAY_PATH = "%USERPROFILE%\\AppData\\LocalLow\\Ticroco\\Spam\\replays\\api.crocodyle.fr";
const ACCOUNT_STORAGE_KEY = "spam-deck-lab:replay-account:v1";
const EXAMPLE_ACCOUNT_ID = "826e2cec-e4f6-49c6-8134-ef01670b7164";
const ACCOUNT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function loadAccountId() {
  try {
    return window.localStorage.getItem(ACCOUNT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="match-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function RecentMatches({
  catalogue,
  error,
  elementName,
  onSelectCard,
  onOpenDeck,
  onSaveDeck,
  onNotify,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  elementName: (id: string) => string;
  onSelectCard: (card: CardData) => void;
  onOpenDeck: (name: string, cards: CardData[]) => void;
  onSaveDeck: (name: string, cards: CardData[]) => void;
  onNotify: (message: string, error?: boolean) => void;
}) {
  const { t, language } = useTranslation();
  const [matches, setMatches] = useState<MatchRecord[]>(loadStoredMatches);
  const [refreshing, setRefreshing] = useState(false);
  const [importOpen, setImportOpen] = useState(() => loadStoredMatches().length === 0);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [accountId, setAccountId] = useState(loadAccountId);
  const [hasHandle, setHasHandle] = useState(false);
  const [pathCopied, setPathCopied] = useState(false);
  const accountValid = ACCOUNT_ID_PATTERN.test(accountId.trim());
  const displayedPath = accountValid ? `${REPLAY_PATH}\\${accountId.trim()}\\index.json` : REPLAY_PATH;
  const inputRef = useRef<HTMLInputElement>(null);
  const locale = language === "fr" ? "fr-FR" : "en-GB";

  useEffect(() => {
    void loadReplayHandle().then((handle) => setHasHandle(handle !== null));
  }, []);

  async function importFile(file: File | undefined, handle?: ReplayFileHandle, announce = true): Promise<{ total: number; added: number } | null> {
    if (!file) return null;
    if (file.size > MAX_INDEX_BYTES) {
      setMessage({ text: t("matches.importInvalid"), error: true });
      return null;
    }
    const text = await file.text();
    const parsed = parseReplayIndex(text);
    if (!parsed) {
      setMessage({ text: t("matches.importInvalid"), error: true });
      return null;
    }
    const known = new Set(matches.map((match) => match.id));
    const added = parsed.filter((match) => !known.has(match.id)).length;
    const merged = mergeMatches(matches, parsed);
    setMatches(merged);
    const saved = storeMatches(merged);
    setMessage(announce || !saved
      ? {
        text: t(saved ? "matches.imported" : "matches.importedNotSaved", { count: parsed.length }),
        error: !saved,
      }
      : null);

    const importedAccountId = readReplayAccountId(text);
    if (importedAccountId) {
      setAccountId(importedAccountId);
      try {
        window.localStorage.setItem(ACCOUNT_STORAGE_KEY, importedAccountId);
      } catch {
        // Remembering the account id is optional.
      }
    }
    if (handle) {
      await saveReplayHandle(handle);
      setHasHandle(true);
    }
    return { total: parsed.length, added };
  }

  async function refreshMatches() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const handle = await loadReplayHandle();
      const file = handle ? await readReplayHandle(handle) : null;
      const result = file ? await importFile(file, undefined, false) : null;
      if (result) {
        onNotify(t(result.added ? "matches.refreshedNew" : "matches.refreshedNone", { count: result.added }));
      } else {
        await chooseFile();
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function copyPath() {
    const copied = await navigator.clipboard?.writeText(displayedPath).then(() => true, () => false) ?? false;
    setPathCopied(copied);
    window.setTimeout(() => setPathCopied(false), 2000);
  }

  async function chooseFile() {
    const id = accountId.trim();
    if (accountValid) {
      try {
        window.localStorage.setItem(ACCOUNT_STORAGE_KEY, id);
      } catch {
        // Remembering the id is optional.
      }
    }

    const picker = (window as unknown as {
      showOpenFilePicker?: (options: object) => Promise<ReplayFileHandle[]>;
    }).showOpenFilePicker;
    if (!picker) {
      inputRef.current?.click();
      return;
    }
    try {
      // The id makes the browser reopen the dialog in the last folder used for this picker.
      const [handle] = await picker({
        id: "spam-replay-index",
        startIn: "documents",
        types: [{ description: "index.json", accept: { "application/json": [".json"] } }],
      });
      await importFile(await handle.getFile(), handle);
    } catch (pickerError) {
      if (!(pickerError instanceof DOMException && pickerError.name === "AbortError")) {
        inputRef.current?.click();
      }
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    void importFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void importFile(event.dataTransfer.files[0]);
  }

  function clearMatches() {
    clearStoredMatches();
    void clearReplayHandle();
    setHasHandle(false);
    setMatches([]);
    setMessage(null);
    setImportOpen(true);
    onNotify(t("matches.cleared"));
  }

  function resolveCards(ids: string[]) {
    return ids
      .map((id) => catalogue?.cards.find((card) => card.id === id))
      .filter((card): card is CardData => card !== undefined);
  }

  function renderPlayer(title: string, player: PlayerInfo | null) {
    if (!player) return null;
    return (
      <section className="match-detail-group" aria-label={title}>
        <h3>{title}</h3>
        <dl>
          <DetailRow label={t("matches.detailName")} value={player.name} />
          <DetailRow label={t("matches.detailStars")} value={player.stars?.toLocaleString(locale) ?? null} />
          <DetailRow label={t("matches.detailRank")} value={player.rank ? `#${player.rank.toLocaleString(locale)}` : null} />
        </dl>
      </section>
    );
  }

  function renderDetails(match: MatchRecord) {
    const details = match.details;
    const formatDate = (iso: string) =>
      new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "medium" });
    return (
      <details className="match-details">
        <summary>{t("matches.details")}</summary>
        {details ? (
          <div className="match-details-body">
            <section className="match-detail-group" aria-label={t("matches.detailGame")}>
              <h3>{t("matches.detailGame")}</h3>
              <dl>
                <DetailRow label={t("matches.detailResult")} value={t(`matches.${match.result}`)} />
                <DetailRow label={t("matches.detailStart")} value={formatDate(match.startUtc)} />
                <DetailRow label={t("matches.detailEnd")} value={details.endUtc ? formatDate(details.endUtc) : null} />
                <DetailRow label={t("matches.detailDuration")} value={formatDuration(match.durationMs)} />
                <DetailRow label={t("matches.detailTurns")} value={details.turnCount} />
                <DetailRow label={t("matches.detailLevel")} value={details.level} />
                <DetailRow label={t("matches.detailTeam")} value={details.teamId !== null && details.teamId >= 0 ? details.teamId : null} />
              </dl>
            </section>
            {renderPlayer(t("matches.detailMe"), details.me)}
            {renderPlayer(t("matches.detailOpponent"), details.opponent)}
            {renderPlayer(t("matches.detailAlly"), details.ally)}
          </div>
        ) : (
          <p className="match-details-missing">{t("matches.detailsMissing")}</p>
        )}
      </details>
    );
  }

  function renderDeck(match: MatchRecord, side: "mine" | "opponent") {
    const ids = side === "mine" ? match.myCardIds : match.opponentCardIds;
    const cards = resolveCards(ids);
    const label = side === "mine" ? t("matches.myDeck") : t("matches.opponentDeck");
    const deckName = (side === "mine"
      ? t("matches.myDeckName", { date: new Date(match.startUtc).toLocaleDateString(locale) })
      : t("matches.opponentDeckName", { name: match.opponentName || t("matches.unknownOpponent") })
    ).slice(0, 60);

    return (
      <section className={`match-deck match-deck-${side}`} aria-label={label}>
        <div className="match-deck-heading">
          <strong>{label}</strong>
          <div className="match-deck-actions">
            <ShareLinkButton
              name={deckName}
              disabled={!cards.length}
              slots={cards.map((card) => ({ cards: [card], talentSlot: null }))}
            />
            <button type="button" className="match-action" disabled={!cards.length} onClick={() => onOpenDeck(deckName, cards)}>
              {t("matches.open")} <span aria-hidden="true">↗</span>
            </button>
            <button type="button" className="match-action" disabled={!cards.length} onClick={() => onSaveDeck(deckName, cards)}>
              {t("matches.save")}
            </button>
          </div>
        </div>
        <div className="match-deck-cards">
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              elementLabel={elementName(card.element)}
              onSelect={() => onSelectCard(card)}
              hideAdd
            />
          ))}
        </div>
        {cards.length < ids.length && <p className="match-missing">{t("matches.missingCards")}</p>}
      </section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t("matches.eyebrow")}
        title={t("matches.title")}
        description={t("matches.description")}
      />
      <DataNotice error={error} />
      {!catalogue && !error ? <LoadingState /> : catalogue && (
        <>
          {matches.length > 0 && (
            <div className="match-toolbar">
              {(hasHandle || accountValid) && (
                <button
                  type="button"
                  className="match-action"
                  disabled={refreshing}
                  aria-busy={refreshing}
                  onClick={() => void refreshMatches()}
                >
                  <span className={`match-refresh-icon ${refreshing ? "spinning" : ""}`} aria-hidden="true">↻</span>
                  {" "}{t(refreshing ? "matches.refreshing" : "matches.refresh")}
                </button>
              )}
              <button type="button" className="match-action" onClick={clearMatches}>
                {t("matches.clear")}
              </button>
            </div>
          )}
          <details
            className="match-import-details"
            open={importOpen}
            onToggle={(event) => setImportOpen(event.currentTarget.open)}
          >
            <summary>{t("matches.importTitle")}</summary>
          <div
            className={`match-import ${dragging ? "dragging" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div>
              <p>{t("matches.importHelp")}</p>
              <ol className="match-steps">
                <li>{t("matches.step1")}</li>
                <li>{t("matches.step2")}</li>
                <li>{t("matches.step3")}</li>
                <li>{t("matches.step4")}</li>
              </ol>
              <label className="match-account-field">
                <span>{t("matches.accountLabel")}</span>
                <input
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  placeholder={EXAMPLE_ACCOUNT_ID}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={accountId.trim() !== "" && !accountValid}
                />
              </label>
              <div className="match-path-row">
                <code>{displayedPath}</code>
                <button type="button" className="match-action" onClick={() => void copyPath()}>
                  {pathCopied ? `${t("matches.pathCopiedShort")} ✓` : t("matches.copyPath")}
                </button>
              </div>
              <p className="match-privacy">✳ {t("matches.privacy")}</p>
            </div>
            <div className="match-import-actions">
              <button type="button" className="primary-button" onClick={() => void chooseFile()}>
                {t("matches.choose")} <span>↗</span>
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={onInputChange}
            />
          </div>
          </details>
          {message && (
            <p className={`match-message ${message.error ? "error" : ""}`} role={message.error ? "alert" : "status"}>
              {message.text}
            </p>
          )}

          {matches.length > 0 ? (
            <div className="match-list">
              {matches.map((match) => (
                <article className={`match-card match-${match.result}`} key={match.id}>
                  <header className="match-header">
                    <span className="match-result">{t(`matches.${match.result}`)}</span>
                    <div className="match-meta">
                      <strong>
                        {t("matches.versus", { name: match.opponentName || t("matches.unknownOpponent") })}
                        {match.opponentIsAi && <em> · {t("matches.ai")}</em>}
                      </strong>
                      <span>
                        {new Date(match.startUtc).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                        {" · "}{formatDuration(match.durationMs)}
                        {" · "}{t("matches.mode", { mode: match.gameMode })}
                        {match.opponentStars !== null && ` · ★ ${match.opponentStars}`}
                      </span>
                    </div>
                  </header>
                  <div className="match-decks">
                    {renderDeck(match, "mine")}
                    {renderDeck(match, "opponent")}
                  </div>
                  {renderDetails(match)}
                </article>
              ))}
            </div>
          ) : (
            <div className="match-empty" role="status">
              <span aria-hidden="true">✳</span>
              <strong>{t("matches.emptyTitle")}</strong>
              <p>{t("matches.emptyText")}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
