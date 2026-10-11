import { useEffect, useRef, useState } from "react";
import type { CardData, AppView, CardSortOption } from "./types";
import { CardDetails } from "./components/cards/CardDetails";
import { AppShell } from "./components/layout/AppShell";
import { CardLibrary } from "./features/cards/CardLibrary";
import { DeckBuilder } from "./features/deck-builder/DeckBuilder";
import { MetaWatch } from "./features/meta/MetaWatch";
import { Overview } from "./features/overview/Overview";
import { useCardCatalogue } from "./hooks/useCardCatalogue";
import { useCardFilters } from "./hooks/useCardFilters";
import { useDeck } from "./hooks/useDeck";

function App() {
  const { catalogue, error: loadError } = useCardCatalogue();
  const [activeView, setActiveView] = useState<AppView>(() =>
    new URLSearchParams(window.location.search).has("deck") ? "builder" : "overview",
  );
  const [search, setSearch] = useState("");
  const [selectedElement, setSelectedElement] = useState("all");
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [sort, setSort] = useState<CardSortOption>("number");
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    deck,
    deckName,
    setDeckName,
    deckCards,
    deckCount,
    changeDeck,
    addAlternative,
    selectAlternative,
    removeAlternative,
    deckNotice,
    copied,
    copyError,
    copyDeck,
    shareCopied,
    shareError,
    shareUrl,
    shareDeck,
  } = useDeck(catalogue);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.key !== "/" ||
        selectedCard ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (target instanceof HTMLElement &&
          (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)))
      ) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [selectedCard]);

  const filteredCards = useCardFilters(catalogue, search, selectedElement, selectedRarity, sort);
  const elementName = (id: string) =>
    catalogue?.elements.find((element) => element.id === id)?.name ?? id;
  const rarityName = (id: string) =>
    catalogue?.rarities.find((rarity) => rarity.id === id)?.name ?? id;

  function resetFilters() {
    setSearch("");
    setSelectedElement("all");
    setSelectedRarity("all");
    setSort("number");
  }

  const cardAlreadyInDeck = selectedCard
    ? deckCards.some((slot) =>
      slot.card.id === selectedCard.id ||
      slot.alternatives.some((option) => option.id === selectedCard.id),
    )
    : false;

  return (
    <div className="app-shell">
      <AppShell activeView={activeView} deckCount={deckCount} onNavigate={setActiveView}>
        {activeView === "overview" && (
          <Overview
            catalogue={catalogue}
            error={loadError}
            elementName={elementName}
            onNavigate={setActiveView}
            onSelectCard={setSelectedCard}
            onAddCard={(card) => changeDeck(card, 1)}
            deck={deck}
            deckCount={deckCount}
          />
        )}
        {activeView === "cards" && (
          <CardLibrary
            catalogue={catalogue}
            error={loadError}
            cards={filteredCards}
            search={search}
            setSearch={setSearch}
            searchInputRef={searchInputRef}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            selectedRarity={selectedRarity}
            setSelectedRarity={setSelectedRarity}
            sort={sort}
            setSort={setSort}
            onSelectCard={setSelectedCard}
            onReset={resetFilters}
            onNavigate={setActiveView}
            elementName={elementName}
          />
        )}
        {activeView === "builder" && (
          <DeckBuilder
            catalogue={catalogue}
            error={loadError}
            cards={filteredCards}
            deckCards={deckCards}
            deckCount={deckCount}
            deckNotice={deckNotice}
            search={search}
            setSearch={setSearch}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            selectedRarity={selectedRarity}
            setSelectedRarity={setSelectedRarity}
            sort={sort}
            setSort={setSort}
            onReset={resetFilters}
            searchInputRef={searchInputRef}
            onChangeDeck={changeDeck}
            onAddAlternative={addAlternative}
            onSelectAlternative={selectAlternative}
            onRemoveAlternative={removeAlternative}
            onSelectCard={setSelectedCard}
            copied={copied}
            copyError={copyError}
            shareCopied={shareCopied}
            shareError={shareError}
            shareUrl={shareUrl}
            deckName={deckName}
            setDeckName={setDeckName}
            onCopy={copyDeck}
            onShare={shareDeck}
            elementName={elementName}
          />
        )}
        {activeView === "meta" && (
          <MetaWatch
            catalogue={catalogue}
            error={loadError}
            onNavigate={setActiveView}
            onSelectCard={setSelectedCard}
            onAddCards={(cards) => cards.forEach((card) => changeDeck(card, 1))}
            deckCards={deckCards}
            deckCount={deckCount}
            elementName={elementName}
          />
        )}
      </AppShell>

      {selectedCard && catalogue && (
        <CardDetails
          card={selectedCard}
          catalogue={catalogue}
          elementName={elementName}
          rarityName={rarityName}
          deckCount={deck[selectedCard.id] ?? 0}
          canAddCard={!cardAlreadyInDeck && deckCount < 4}
          cardAlreadyInDeck={cardAlreadyInDeck}
          onClose={() => setSelectedCard(null)}
          onAdd={() => changeDeck(selectedCard, 1)}
        />
      )}
    </div>
  );
}

export default App;
