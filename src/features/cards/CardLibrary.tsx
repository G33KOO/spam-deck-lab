import type { CardCatalogue, CardData, AppView, CardSortOption } from "../../types";
import { CardTile } from "../../components/cards/CardTile";
import { DataNotice, LoadingState, PageHeader, SearchIcon } from "../../components/ui";
import { useTranslation } from "../../i18n/LanguageContext";

export function CardLibrary({
  catalogue,
  error,
  cards,
  search,
  setSearch,
  searchInputRef,
  selectedElement,
  setSelectedElement,
  selectedRarity,
  setSelectedRarity,
  sort,
  setSort,
  onSelectCard,
  onReset,
  onNavigate,
  elementName,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  cards: CardData[];
  search: string;
  setSearch: (value: string) => void;
  searchInputRef: { current: HTMLInputElement | null };
  selectedElement: string;
  setSelectedElement: (value: string) => void;
  selectedRarity: string;
  setSelectedRarity: (value: string) => void;
  sort: CardSortOption;
  setSort: (value: CardSortOption) => void;
  onSelectCard: (card: CardData) => void;
  onReset: () => void;
  onNavigate: (view: AppView) => void;
  elementName: (id: string) => string;
}) {
  const { t } = useTranslation();
  const hasFilters = Boolean(search || selectedElement !== "all" || selectedRarity !== "all" || sort !== "number");

  return (
    <>
      <PageHeader
        eyebrow={t("library.eyebrow")}
        title={t("library.title")}
        description={t("library.description")}
        action={{ label: t("library.buildDeck"), onClick: () => onNavigate("builder") }}
      />
      <DataNotice error={error} />
      {!catalogue && !error ? <LoadingState /> : catalogue && (
        <>
          <div className="filter-panel">
            <label className="search-field">
              <SearchIcon />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                ref={searchInputRef}
                placeholder={t("library.searchPlaceholder")}
                aria-label={t("library.searchLabel")}
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
          <div className="results-line">
            <span><strong>{cards.length}</strong> {t("filter.resultsOf", { total: catalogue.cards.length })}</span>
            {hasFilters && (
              <button onClick={onReset}>{t("filter.clear")} <span>×</span></button>
            )}
            <span className="catalogue-version">{t("filter.dataset", { version: catalogue.version })} <i className="tiny-live" /></span>
          </div>
          {cards.length ? (
            <div className="card-grid">
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
          ) : <div className="empty-state"><span>⌕</span><h3>{t("filter.noCards")}</h3><p>{t("filter.tryDifferent")}</p></div>}
        </>
      )}
    </>
  );
}
