import type { CardCatalogue, CardData } from "../../types";
import { CardTile } from "../../components/cards/CardTile";
import { DataNotice, LoadingState, PageHeader, SearchIcon } from "../../components/ui";

export function DeckBuilder({
  catalogue,
  error,
  cards,
  deckCards,
  deckCount,
  search,
  setSearch,
  searchInputRef,
  onChangeDeck,
  onSelectCard,
  copied,
  copyError,
  shareCopied,
  shareError,
  shareUrl,
  deckName,
  setDeckName,
  onCopy,
  onShare,
  elementName,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  cards: CardData[];
  deckCards: Array<{ card: CardData; count: number }>;
  deckCount: number;
  search: string;
  setSearch: (value: string) => void;
  searchInputRef: { current: HTMLInputElement | null };
  onChangeDeck: (card: CardData, amount: number) => void;
  onSelectCard: (card: CardData) => void;
  copied: boolean;
  copyError: string;
  shareCopied: boolean;
  shareError: string;
  shareUrl: string;
  deckName: string;
  setDeckName: (value: string) => void;
  onCopy: () => void;
  onShare: () => void;
  elementName: (id: string) => string;
}) {
  return (
    <>
      <PageHeader
        eyebrow="PLAN YOUR LINEUP"
        title="Deck builder"
        description="Add cards from the catalogue, tune your lineup, and copy your build to share."
      />
      <DataNotice error={error} />
      {copyError && <div className="notice error-notice" role="alert"><strong>Could not copy deck.</strong> {copyError}</div>}
      {shareError && <div className="notice error-notice" role="alert"><strong>Could not share deck.</strong> {shareError}</div>}
      {!catalogue && !error ? <LoadingState /> : catalogue && (
        <>
          <div className="builder-layout">
            <section className="deck-panel">
              <div className="deck-panel-top">
                <div className="deck-heading-copy">
                  <div className="eyebrow"><span /> YOUR BUILD</div>
                  <input
                    className="deck-title-input"
                    value={deckName}
                    onChange={(event) => setDeckName(event.target.value)}
                    aria-label="Deck name"
                    maxLength={60}
                  />
                  <p className="deck-subtitle">A work in progress. Make it yours.</p>
                </div>
                <div className="deck-header-actions">
                  <button className="deck-menu" onClick={onShare} title="Copy a link to this deck">{shareCopied ? "LINK COPIED ✓" : "SHARE LINK ↗"}</button>
                  <button className="deck-menu" onClick={onCopy} title="Copy deck list">{copied ? "LIST COPIED ✓" : "COPY LIST ↗"}</button>
                </div>
              </div>
              <div className="deck-meter">
                <div><strong>{String(deckCount).padStart(2, "0")}</strong><span>CARDS ADDED</span></div>
                <span className="meter-caption">NO OFFICIAL DECK LIMIT SET</span>
              </div>
              {deckCards.length ? (
                <div className="deck-card-grid">
                  {deckCards.map(({ card, count }) => (
                    <CardTile
                      key={card.id}
                      card={card}
                      elementLabel={elementName(card.element)}
                      onSelect={() => onSelectCard(card)}
                      onAdd={() => onChangeDeck(card, 1)}
                      onRemove={() => onChangeDeck(card, -1)}
                      quantity={count}
                      deckMode
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-deck">
                  <span className="empty-card-icon">＋</span>
                  <strong>Your deck starts here</strong>
                  <p>Choose cards from the collection below to begin building.</p>
                </div>
              )}
              <div className="deck-panel-bottom">
                <span><i className="tiny-live" /> CURRENT SESSION ONLY</span>
                <button onClick={onShare}>{shareCopied ? "LINK COPIED" : "SHARE DECK"} <span>↗</span></button>
              </div>
              {shareUrl && (
                <label className="share-link-preview">
                  <span>SHARE URL</span>
                  <input
                    aria-label="Share URL"
                    readOnly
                    value={shareUrl}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </label>
              )}
            </section>

            <section className="builder-pool">
              <div className="builder-section-heading">
                <div><span className="eyebrow"><span /> COLLECTION</span><h2>Choose your cards</h2></div>
                <span className="pool-count">{cards.length} CARDS</span>
              </div>
              <label className="search-field builder-search">
                <SearchIcon />
                <input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a card..." aria-label="Find a card" />
                <kbd>/</kbd>
              </label>
              <div className="builder-card-grid">
                {cards.map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    elementLabel={elementName(card.element)}
                    onSelect={() => onSelectCard(card)}
                    onAdd={() => onChangeDeck(card, 1)}
                    quantity={deckCards.find((item) => item.card.id === card.id)?.count ?? 0}
                  />
                ))}
                {!cards.length && <div className="empty-state"><span>⌕</span><h3>No matching cards</h3><p>Try a different search.</p></div>}
              </div>
            </section>
          </div>
          <p className="builder-footnote">Deck rules and copy limits may change in-game. This tool does not enforce unverified rules.</p>
        </>
      )}
    </>
  );
}
