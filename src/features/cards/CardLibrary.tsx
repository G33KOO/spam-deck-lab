import type { CardCatalogue, CardData, AppView, CardSortOption } from "../../types";
import { CardTile } from "../../components/cards/CardTile";
import { DataNotice, LoadingState, PageHeader, SearchIcon } from "../../components/ui";

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
  onAddCard,
  deck,
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
  onAddCard: (card: CardData) => void;
  deck: Record<string, number>;
  onReset: () => void;
  onNavigate: (view: AppView) => void;
  elementName: (id: string) => string;
}) {
  return (
    <>
      <PageHeader
        eyebrow="THE SPAMDEX"
        title="Card library"
        description="Search the complete collection. Inspect stats, abilities, talents, and resistances."
        action={{ label: "BUILD A DECK", onClick: () => onNavigate("builder") }}
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
                placeholder="Search cards, abilities..."
                aria-label="Search cards and abilities"
              />
              <kbd>/</kbd>
            </label>
            <label className="select-field">
              <span>ELEMENT</span>
              <select value={selectedElement} onChange={(event) => setSelectedElement(event.target.value)}>
                <option value="all">All elements</option>
                {catalogue.elements.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}
              </select>
            </label>
            <label className="select-field">
              <span>RARITY</span>
              <select value={selectedRarity} onChange={(event) => setSelectedRarity(event.target.value)}>
                <option value="all">All rarities</option>
                {catalogue.rarities.map((rarity) => <option key={rarity.id} value={rarity.id}>{rarity.name}</option>)}
              </select>
            </label>
            <label className="select-field sort-field">
              <span>SORT BY</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as CardSortOption)}>
                <option value="number">Card number</option>
                <option value="name">Name</option>
                <option value="hp">Highest HP</option>
                <option value="spamton">Lowest Spamton</option>
              </select>
            </label>
          </div>
          <div className="results-line">
            <span><strong>{cards.length}</strong> OF {catalogue.cards.length} CARDS</span>
            {(search || selectedElement !== "all" || selectedRarity !== "all") && (
              <button onClick={onReset}>CLEAR FILTERS <span>×</span></button>
            )}
            <span className="catalogue-version">DATASET {catalogue.version} <i className="tiny-live" /></span>
          </div>
          {cards.length ? (
            <div className="card-grid">
              {cards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  elementLabel={elementName(card.element)}
                  onSelect={() => onSelectCard(card)}
                  onAdd={() => onAddCard(card)}
                  quantity={deck[card.id] ?? 0}
                />
              ))}
            </div>
          ) : <div className="empty-state"><span>⌕</span><h3>No cards found</h3><p>Try a different name or clear your filters.</p></div>}
        </>
      )}
    </>
  );
}
