import { useEffect, useState } from "react";
import type { CardCatalogue, CardData, CardSortOption } from "../../types";
import type { DeckCardSlot } from "../../hooks/useDeck";
import { CardTile } from "../../components/cards/CardTile";
import { DataNotice, LoadingState, PageHeader, SearchIcon } from "../../components/ui";
import { useTranslation } from "../../i18n/LanguageContext";
import { DeckInsights } from "./DeckInsights";

export function DeckBuilder({
  catalogue,
  error,
  cards,
  deckCards,
  deckCount,
  search,
  setSearch,
  selectedElement,
  setSelectedElement,
  selectedRarity,
  setSelectedRarity,
  sort,
  setSort,
  onReset,
  searchInputRef,
  onChangeDeck,
  onAddAlternative,
  onSelectAlternative,
  onSelectTalent,
  onRemoveAlternative,
  onSelectCard,
  copied,
  shareCopied,
  shareUrl,
  deckName,
  setDeckName,
  onSave,
  onCopy,
  onShare,
  elementName,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  cards: CardData[];
  deckCards: DeckCardSlot[];
  deckCount: number;
  search: string;
  setSearch: (value: string) => void;
  selectedElement: string;
  setSelectedElement: (value: string) => void;
  selectedRarity: string;
  setSelectedRarity: (value: string) => void;
  sort: CardSortOption;
  setSort: (value: CardSortOption) => void;
  onReset: () => void;
  searchInputRef: { current: HTMLInputElement | null };
  onChangeDeck: (card: CardData, amount: number) => void;
  onAddAlternative: (slotId: string, card: CardData) => void;
  onSelectAlternative: (slotId: string, cardId: string) => void;
  onSelectTalent: (slotId: string, talentSlot: number | null) => void;
  onRemoveAlternative: (slotId: string, cardId: string) => void;
  onSelectCard: (card: CardData) => void;
  copied: boolean;
  shareCopied: boolean;
  shareUrl: string;
  deckName: string;
  setDeckName: (value: string) => void;
  onSave: () => boolean;
  onCopy: () => void;
  onShare: () => void;
  elementName: (id: string) => string;
}) {
  const { t } = useTranslation();
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [alternativeTarget, setAlternativeTarget] = useState<string | null>(null);
  const targetSlot = deckCards.find((slot) => slot.id === alternativeTarget);

  useEffect(() => {
    if (!collectionOpen) return;
    searchInputRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCollection();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [collectionOpen, searchInputRef]);

  function addSelectedCard(card: CardData) {
    if (alternativeTarget) {
      onAddAlternative(alternativeTarget, card);
      setAlternativeTarget(null);
    } else {
      onChangeDeck(card, 1);
    }
    setCollectionOpen(false);
  }

  function closeCollection() {
    setCollectionOpen(false);
    setAlternativeTarget(null);
  }

  function openCollection(slotId: string | null = null) {
    setAlternativeTarget(slotId);
    setCollectionOpen(true);
  }

  return (
    <>
      <PageHeader
        eyebrow={t("builder.eyebrow")}
        title={t("builder.title")}
        description={t("builder.description")}
      />
      <DataNotice error={error} />
      {!catalogue && !error ? <LoadingState /> : catalogue && (
        <>
          <div className="builder-layout">
            <section className="deck-panel">
              <div className="deck-panel-top">
                <div className="deck-heading-copy">
                  <div className="eyebrow"><span /> {t("builder.yourDeck")}</div>
                  <input
                    className="deck-title-input"
                    value={deckName}
                    onChange={(event) => setDeckName(event.target.value)}
                    aria-label={t("builder.deckNameLabel")}
                    maxLength={60}
                  />
                </div>
                <div className="deck-header-actions">
                  <button
                    className="deck-add-card-button"
                    type="button"
                    onClick={() => openCollection()}
                    aria-label={t("builder.openCollection")}
                  >
                    <span aria-hidden="true">＋</span>
                    {t("builder.openCollection")}
                  </button>
                  <button className="deck-menu" onClick={onSave} title={t("builder.saveDeck")}>{t("builder.saveDeck")}</button>
                  <button className="deck-menu" onClick={onShare} title={t("builder.shareLink")}>{shareCopied ? `${t("builder.linkCopied")} ✓` : `${t("builder.shareLink")} ↗`}</button>
                  <button className="deck-menu" onClick={onCopy} title={t("builder.copyList")}>{copied ? `${t("builder.listCopied")} ✓` : `${t("builder.copyList")} ↗`}</button>
                </div>
              </div>
              <div className="deck-meter">
                <div><strong>{String(deckCount).padStart(2, "0")}</strong><span>{t("builder.cardSlots")}</span></div>
              </div>
              {deckCards.length ? (
                <div className="deck-card-grid">
                  {deckCards.map(({ id, card, alternatives, selectedTalentSlot, selectedTalent }) => (
                    <div className="deck-slot" key={id}>
                      <CardTile
                        card={card}
                        elementLabel={elementName(card.element)}
                        onSelect={() => onSelectCard(card)}
                        onRemove={() => onChangeDeck(card, -1)}
                        quantity={1}
                        deckMode
                      />
                      {card.talents?.length ? (
                        <label className="deck-talent-picker">
                          <select
                            value={selectedTalentSlot ?? ""}
                            onChange={(event) => onSelectTalent(id, event.target.value ? Number(event.target.value) : null)}
                            aria-label={t("builder.selectTalent", { name: card.name })}
                          >
                            <option value="">{t("builder.noTalent")}</option>
                            {card.talents.map((talent, index) => (
                              <option key={`${talent.slot ?? index}-${talent.id}`} value={talent.slot ?? index + 1}>
                                {talent.name}
                              </option>
                            ))}
                          </select>
                          {selectedTalent?.effect && <small>{selectedTalent.effect}</small>}
                        </label>
                      ) : (
                        <div className="deck-talent-picker unavailable">
                          <span>{t("builder.talent")}</span>
                          <small>{t("builder.noTalentDefined")}</small>
                        </div>
                      )}
                      {alternatives.length > 0 && (
                        <div className="deck-slot-alternatives">
                          <span>{t("builder.options", { count: alternatives.length + 1 })}</span>
                          <button
                            className="deck-option-chip selected"
                            onClick={() => onSelectAlternative(id, card.id)}
                            aria-pressed="true"
                            aria-label={t("builder.selectOption", { name: card.name })}
                          >
                            {card.name}
                          </button>
                          {alternatives.map((option) => (
                            <span className="deck-option-wrap" key={option.id}>
                              <button
                                className="deck-option-chip"
                                onClick={() => onSelectAlternative(id, option.id)}
                                aria-pressed="false"
                                aria-label={t("builder.selectOption", { name: option.name })}
                              >
                                {option.name}
                              </button>
                              <button
                                className="remove-option"
                                onClick={() => onRemoveAlternative(id, option.id)}
                                aria-label={t("builder.removeAlternative", { name: option.name })}
                                title={t("builder.removeAlternative", { name: option.name })}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        className={`add-alternative-button ${alternativeTarget === id ? "active" : ""}`}
                        onClick={() => openCollection(alternativeTarget === id ? null : id)}
                      >
                        {t("builder.addAlternative")}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-deck">
                  <button
                    className="empty-card-icon"
                    type="button"
                    onClick={() => openCollection()}
                    aria-label={t("builder.openCollection")}
                  >
                    ＋
                  </button>
                  <strong>{t("builder.emptyTitle")}</strong>
                  <p>{t("builder.emptyText")}</p>
                </div>
              )}
              <div className="deck-panel-bottom">
                <span><i className="tiny-live" /> {t("builder.localSaved")}</span>
                <button onClick={onShare}>{shareCopied ? t("builder.linkCopied") : t("builder.shareDeck")} <span>↗</span></button>
              </div>
              {shareUrl && (
                <label className="share-link-preview">
                  <span>{t("builder.shareUrl")}</span>
                  <input
                    aria-label={t("builder.shareUrlLabel")}
                    readOnly
                    value={shareUrl}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </label>
              )}
            </section>
            {deckCards.length > 0 && <DeckInsights catalogue={catalogue} deckCards={deckCards} />}
          </div>
          {collectionOpen && (
            <div
              className="builder-collection-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget) closeCollection();
              }}
            >
              <section
                className="builder-collection-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="builder-collection-title"
              >
                <header className="builder-collection-header">
                  <div>
                    <span className="eyebrow"><span /> {t("builder.collection")}</span>
                    <h2 id="builder-collection-title">{t("builder.chooseCards")}</h2>
                  </div>
                  <button
                    className="builder-collection-close"
                    type="button"
                    onClick={closeCollection}
                    aria-label={t("builder.closeCollection")}
                  >
                    ×
                  </button>
                </header>
                {targetSlot && (
                  <div className="alternative-mode" role="status">
                    <span>{t("builder.alternativePrompt", { name: targetSlot.card.name })}</span>
                    <button onClick={() => setAlternativeTarget(null)}>{t("builder.cancel")}</button>
                  </div>
                )}
                <div className="filter-panel builder-filter-panel">
                  <label className="search-field builder-search">
                    <SearchIcon />
                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("builder.searchPlaceholder")}
                      aria-label={t("builder.searchLabel")}
                    />
                    <kbd>/</kbd>
                  </label>
                  <label className="select-field">
                    <span>{t("filter.element")}</span>
                    <select value={selectedElement} onChange={(event) => setSelectedElement(event.target.value)}>
                      <option value="all">{t("filter.allElements")}</option>
                      {catalogue.elements.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}
                    </select>
                  </label>
                  <label className="select-field">
                    <span>{t("filter.rarity")}</span>
                    <select value={selectedRarity} onChange={(event) => setSelectedRarity(event.target.value)}>
                      <option value="all">{t("filter.allRarities")}</option>
                      {catalogue.rarities.map((rarity) => <option key={rarity.id} value={rarity.id}>{rarity.name}</option>)}
                    </select>
                  </label>
                  <label className="select-field sort-field">
                    <span>{t("filter.sort")}</span>
                    <select value={sort} onChange={(event) => setSort(event.target.value as CardSortOption)}>
                      <option value="number">{t("filter.cardNumber")}</option>
                      <option value="name">{t("filter.name")}</option>
                      <option value="hp">{t("filter.highestHp")}</option>
                      <option value="spamton">{t("filter.lowestSpamton")}</option>
                    </select>
                  </label>
                </div>
                <div className="results-line builder-results-line">
                  <span><strong>{cards.length}</strong> {t("builder.results", { count: cards.length })}</span>
                  {(search || selectedElement !== "all" || selectedRarity !== "all" || sort !== "number") && (
                    <button onClick={onReset}>{t("filter.clear")} <span>×</span></button>
                  )}
                </div>
                <div className="builder-card-grid builder-modal-card-grid">
                  {cards.map((card) => {
                    const cardIsInTarget = Boolean(targetSlot && (
                      targetSlot.card.id === card.id ||
                      targetSlot.alternatives.some((option) => option.id === card.id)
                    ));
                    const cardIsInAnotherSlot = deckCards.some((slot) =>
                      slot.id !== alternativeTarget &&
                      (slot.card.id === card.id || slot.alternatives.some((option) => option.id === card.id)),
                    );
                    const cardIsInDeck = deckCards.some((slot) =>
                      slot.card.id === card.id || slot.alternatives.some((option) => option.id === card.id),
                    );
                    const addLabelKey = targetSlot
                      ? cardIsInTarget || cardIsInAnotherSlot ? "builder.alreadyInSlot" : "builder.addOption"
                      : cardIsInDeck ? "builder.alreadyInDeck" : deckCount >= 4 ? "builder.deckFull" : "builder.addToDeck";
                    return (
                      <CardTile
                        key={card.id}
                        card={card}
                        elementLabel={elementName(card.element)}
                        onSelect={() => onSelectCard(card)}
                        selectable={false}
                        onAdd={() => addSelectedCard(card)}
                        quantity={cardIsInDeck ? 1 : 0}
                        addLabel={t(addLabelKey)}
                        addDisabled={targetSlot ? cardIsInTarget || cardIsInAnotherSlot : cardIsInDeck || deckCount >= 4}
                      />
                    );
                  })}
                  {!cards.length && <div className="empty-state"><span>⌕</span><h3>{t("filter.noMatches")}</h3><p>{t("filter.trySearch")}</p></div>}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
}
