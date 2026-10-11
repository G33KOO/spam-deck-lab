import type { CardCatalogue } from "../../types";
import type { SavedDeck } from "../../hooks/useDeck";
import { DataNotice, LoadingState, PageHeader } from "../../components/ui";
import { imageUrl } from "../../lib/cardAssets";
import { useTranslation } from "../../i18n/LanguageContext";

export function SavedDecks({
  catalogue,
  error,
  savedDecks,
  loaded,
  storageError,
  onLoad,
  onDelete,
  onNewDeck,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  savedDecks: SavedDeck[];
  loaded: boolean;
  storageError: string;
  onLoad: (id: string) => void;
  onDelete: (id: string) => boolean;
  onNewDeck: () => void;
}) {
  const { language, t } = useTranslation();

  return (
    <>
      <PageHeader
        eyebrow={t("builder.savedDecksEyebrow")}
        title={t("shell.savedDecks")}
        description={t("builder.savedDescription")}
      />
      <DataNotice error={error} />
      {storageError && <div className="notice error-notice" role="alert">{storageError}</div>}
      {!loaded || (!catalogue && !error) ? <LoadingState /> : (
        savedDecks.length ? (
          <section className="saved-decks" aria-label={t("shell.savedDecks")}>
            <div className="saved-decks-heading">
              <span>{t(savedDecks.length === 1 ? "builder.savedOneDeck" : "builder.savedOtherDecks", { count: savedDecks.length })}</span>
              <button className="primary-button" type="button" onClick={onNewDeck}>
                {t("builder.newDeck")} <span>↗</span>
              </button>
            </div>
            <div className="saved-deck-grid">
              {savedDecks.map((savedDeck) => (
                <article className="saved-deck-card" key={savedDeck.id}>
                  <div className="saved-deck-card-header">
                    <h2>{savedDeck.name}</h2>
                    <time dateTime={savedDeck.updatedAt}>
                      {t("builder.savedAt", {
                        date: new Intl.DateTimeFormat(language, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(savedDeck.updatedAt)),
                      })}
                    </time>
                  </div>
                  <div className="saved-deck-members">
                    {savedDeck.slots.map((slot) => {
                      const card = catalogue?.cards.find((item) => item.slug === slot.selectedSlug);
                      if (!card) {
                        return <div className="saved-deck-member missing" key={slot.selectedSlug}>{slot.selectedSlug}</div>;
                      }
                      const talent = slot.talentSlot === null
                        ? undefined
                        : card.talents?.find((item, index) => (item.slot ?? index + 1) === slot.talentSlot);
                      return (
                        <div className="saved-deck-member" key={slot.selectedSlug}>
                          <img src={imageUrl(card.artwork.tiny)} alt="" loading="lazy" />
                          <span>
                            <strong>{card.name}</strong>
                            <small>
                              {talent
                                ? `${t("builder.talent")}: ${talent.name}`
                                : t(card.talents?.length ? "builder.noTalent" : "builder.noTalentDefined")}
                            </small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="saved-deck-actions">
                    <button className="primary-button" type="button" onClick={() => onLoad(savedDeck.id)}>
                      {t("builder.loadSavedDeck")} <span>↗</span>
                    </button>
                    <button
                      className="saved-deck-delete"
                      type="button"
                      aria-label={t("builder.deleteSavedDeck", { name: savedDeck.name })}
                      onClick={() => {
                        if (window.confirm(t("builder.confirmDelete", { name: savedDeck.name }))) {
                          onDelete(savedDeck.id);
                        }
                      }}
                    >
                      {t("builder.deleteSavedDeckLabel")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-state saved-decks-empty">
            <span>＋</span>
            <h3>{t("builder.savedEmptyTitle")}</h3>
            <p>{t("builder.savedEmptyText")}</p>
            <button className="primary-button" type="button" onClick={onNewDeck}>
              {t("builder.newDeck")} <span>↗</span>
            </button>
          </div>
        )
      )}
    </>
  );
}
