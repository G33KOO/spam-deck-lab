import { useEffect, useMemo, useRef, useState } from "react";
import type { CardCatalogue, CardData } from "../types";
import { useTranslation } from "../i18n/LanguageContext";

interface DeckSlotState {
  id: string;
  cardIds: string[];
  selectedCardId: string;
}

export interface DeckCardSlot {
  id: string;
  card: CardData;
  alternatives: CardData[];
}

export function useDeck(catalogue: CardCatalogue | null) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<DeckSlotState[]>([]);
  const [deckName, setDeckName] = useState("Untitled deck");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [shareError, setShareError] = useState("");
  const [deckNotice, setDeckNotice] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const sharedDeckLoaded = useRef(false);
  const nextSlotId = useRef(0);

  useEffect(() => {
    if (!catalogue || sharedDeckLoaded.current) return;
    sharedDeckLoaded.current = true;

    const params = new URLSearchParams(window.location.search);
    const sharedDeck = params.get("deck");
    if (sharedDeck === null) return;

    const sharedName = params.get("name")?.trim();
    if (sharedName) setDeckName(sharedName.slice(0, 60));
    if (!sharedDeck) {
      setShareError(t("builder.sharedEmpty"));
      return;
    }

    const nextSlots: DeckSlotState[] = [];
    let adjustedDeck = false;
    for (const entry of sharedDeck.split(",")) {
      const [selectedSlug, countText, optionsText, ...unexpectedParts] = entry.split("~");
      const count = Number(countText);
      const optionSlugs = optionsText?.split("+") ?? [selectedSlug];
      const optionCards = optionSlugs.map((slug) =>
        catalogue.cards.find((card) => card.slug === slug),
      );
      const selectedCard = catalogue.cards.find((card) => card.slug === selectedSlug);
      if (
        unexpectedParts.length ||
        !selectedCard ||
        !Number.isSafeInteger(count) ||
        count < 1 ||
        optionCards.some((card) => !card) ||
        !optionCards.some((card) => card?.id === selectedCard.id)
      ) {
        setShareError(t("builder.sharedInvalid", { entry }));
        return;
      }

      const cardIds = [...new Set(optionCards.map((card) => card!.id))];
      if (count > 1 || cardIds.length !== optionCards.length) adjustedDeck = true;
      if (nextSlots.length >= 4) {
        adjustedDeck = true;
        continue;
      }
      if (cardIds.some((id) => nextSlots.some((slot) => slot.cardIds.includes(id)))) {
        adjustedDeck = true;
        continue;
      }
      nextSlots.push({
        id: `slot-${nextSlotId.current++}`,
        cardIds,
        selectedCardId: selectedCard.id,
      });
    }
    if (adjustedDeck) {
      setDeckNotice(t("builder.adjustedMessage"));
    }
    setSlots(nextSlots);
  }, [catalogue, t]);

  const deckCards = useMemo<DeckCardSlot[]>(() => {
    if (!catalogue) return [];
    return slots
      .flatMap((slot) => {
        const card = catalogue.cards.find((item) => item.id === slot.selectedCardId);
        if (!card) return [];
        return [{
          id: slot.id,
          card,
          alternatives: slot.cardIds
            .filter((id) => id !== slot.selectedCardId)
            .flatMap((id) => catalogue.cards.filter((item) => item.id === id)),
        }];
      })
      .sort((a, b) => a.card.number - b.card.number);
  }, [catalogue, slots]);

  const deck = useMemo(
    () => Object.fromEntries(deckCards.map(({ card }) => [card.id, 1])),
    [deckCards],
  );
  const deckCount = deckCards.length;

  function changeDeck(card: CardData, amount: number) {
    setSlots((current) => {
      const matching = current.find((slot) => slot.selectedCardId === card.id);
      if (amount <= 0) {
        return matching ? current.filter((slot) => slot.id !== matching.id) : current;
      }
      if (current.length >= 4 || current.some((slot) => slot.cardIds.includes(card.id))) return current;
      return [
        ...current,
        {
          id: `slot-${nextSlotId.current++}`,
          cardIds: [card.id],
          selectedCardId: card.id,
        },
      ];
    });
  }

  function addAlternative(slotId: string, card: CardData) {
    setSlots((current) => current.map((slot) => {
      if (
        slot.id !== slotId ||
        current.some((other) => other.id !== slotId && other.cardIds.includes(card.id)) ||
        slot.cardIds.includes(card.id)
      ) return slot;
      return { ...slot, cardIds: [...slot.cardIds, card.id] };
    }));
  }

  function selectAlternative(slotId: string, cardId: string) {
    setSlots((current) => current.map((slot) =>
      slot.id === slotId && slot.cardIds.includes(cardId)
        ? { ...slot, selectedCardId: cardId }
        : slot,
    ));
  }

  function removeAlternative(slotId: string, cardId: string) {
    setSlots((current) => current.map((slot) =>
      slot.id === slotId && slot.selectedCardId !== cardId
        ? { ...slot, cardIds: slot.cardIds.filter((id) => id !== cardId) }
        : slot,
    ));
  }

  async function copyDeck() {
    setCopyError("");
    if (!deckCards.length) {
      setCopyError(t("builder.copyEmpty"));
      return;
    }

    const deckText = deckCards
      .map(({ card, alternatives }) => {
        const choiceNames = [card, ...alternatives].map((option) => option.name);
        const alternativesText = choiceNames.length > 1
          ? ` · ${t("builder.options", { count: choiceNames.length })}: ${choiceNames.join(" / ")}`
          : "";
        return `${card.name} (#${card.number})${alternativesText}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(deckText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(t("builder.clipboardError"));
    }
  }

  async function shareDeck() {
    setShareError("");
    setShareCopied(false);
    setShareUrl("");
    if (!deckCards.length) {
      setShareError(t("builder.shareEmpty"));
      return;
    }

    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set(
      "deck",
      deckCards
        .map(({ card, alternatives }) => {
          const options = [card, ...alternatives].map((option) => option.slug).join("+");
          return `${card.slug}~1${alternatives.length ? `~${options}` : ""}`;
        })
        .join(","),
    );
    if (deckName.trim() && deckName.trim() !== "Untitled deck") {
      url.searchParams.set("name", deckName.trim());
    }
    setShareUrl(url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareError(t("builder.clipboardError"));
    }
  }

  return {
    deck,
    deckName,
    setDeckName,
    deckCards,
    deckCount,
    changeDeck,
    addAlternative,
    selectAlternative,
    removeAlternative,
    copied,
    copyError,
    copyDeck,
    shareCopied,
    shareError,
    deckNotice,
    shareUrl,
    shareDeck,
  };
}
