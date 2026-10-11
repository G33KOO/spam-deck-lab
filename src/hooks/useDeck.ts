import { useEffect, useMemo, useRef, useState } from "react";
import type { CardCatalogue, CardData } from "../types";
import { useTranslation } from "../i18n/LanguageContext";

interface DeckSlotState {
  id: string;
  cardIds: string[];
  selectedCardId: string;
  selectedTalentSlot: number | null;
}

export interface DeckCardSlot {
  id: string;
  card: CardData;
  alternatives: CardData[];
  selectedTalentSlot: number | null;
  selectedTalent: NonNullable<CardData["talents"]>[number] | undefined;
}

export interface SavedDeck {
  id: string;
  name: string;
  slots: Array<{
    cardSlugs: string[];
    selectedSlug: string;
    talentSlot: number | null;
  }>;
  updatedAt: string;
}

export interface ActionFeedback {
  message: string;
  error: boolean;
  revision: number;
}

const SAVED_DECKS_STORAGE_KEY = "spam-deck-lab:saved-decks:v1";

function getTalentSlot(
  talent: NonNullable<CardData["talents"]>[number],
  index: number,
) {
  return talent.slot ?? index + 1;
}

function isSavedDeck(value: unknown): value is SavedDeck {
  if (!value || typeof value !== "object") return false;
  const deck = value as Partial<SavedDeck>;
  if (
    typeof deck.id !== "string" ||
    typeof deck.name !== "string" ||
    deck.name.length > 60 ||
    typeof deck.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(deck.updatedAt)) ||
    !Array.isArray(deck.slots) ||
    deck.slots.length < 1 ||
    deck.slots.length > 4
  ) return false;

  const usedSlugs = new Set<string>();
  return deck.slots.every((slot) => {
    if (
      !slot ||
      !Array.isArray(slot.cardSlugs) ||
      slot.cardSlugs.length < 1 ||
      slot.cardSlugs.length > 127 ||
      typeof slot.selectedSlug !== "string" ||
      (slot.talentSlot !== null && (!Number.isSafeInteger(slot.talentSlot) || slot.talentSlot < 1)) ||
      !slot.cardSlugs.includes(slot.selectedSlug) ||
      slot.cardSlugs.some((slug) => typeof slug !== "string" || !slug || usedSlugs.has(slug))
    ) return false;
    slot.cardSlugs.forEach((slug) => usedSlugs.add(slug));
    return true;
  });
}

export function useDeck(catalogue: CardCatalogue | null) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<DeckSlotState[]>([]);
  const [deckName, setDeckName] = useState("Untitled deck");
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [savedDecksLoaded, setSavedDecksLoaded] = useState(false);
  const [storageErrorType, setStorageErrorType] = useState<"invalid" | "storage" | null>(null);
  const [currentSavedDeckId, setCurrentSavedDeckId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const feedbackRevision = useRef(0);
  const sharedDeckLoaded = useRef(false);
  const nextSlotId = useRef(0);

  function notifyAction(message: string, error = false) {
    feedbackRevision.current += 1;
    setActionFeedback({ message, error, revision: feedbackRevision.current });
  }

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(SAVED_DECKS_STORAGE_KEY);
      if (storedValue) {
        const parsed: unknown = JSON.parse(storedValue);
        if (!Array.isArray(parsed) || !parsed.every(isSavedDeck)) {
          setStorageErrorType("invalid");
          notifyAction(t("builder.invalidSavedDecks"), true);
          return;
        }
        setSavedDecks(parsed);
      }
    } catch {
      setStorageErrorType("storage");
      notifyAction(t("builder.storageError"), true);
    } finally {
      setSavedDecksLoaded(true);
    }
  }, [t]);

  useEffect(() => {
    if (!catalogue || sharedDeckLoaded.current) return;
    sharedDeckLoaded.current = true;

    const params = new URLSearchParams(window.location.search);
    const compactDeck = params.get("d");
    const sharedDeck = compactDeck ?? params.get("deck");
    const sharedTalents = params.get("t") ?? "";
    if (sharedDeck === null) return;

    const sharedName = (params.get("n") ?? params.get("name"))?.trim();
    if (sharedName) setDeckName(sharedName.slice(0, 60));
    if (!sharedDeck) {
      notifyAction(t("builder.sharedEmpty"), true);
      return;
    }

    if (!/^\d{0,4}$/.test(sharedTalents)) {
      notifyAction(t("builder.sharedInvalid", { entry: `t=${sharedTalents}` }), true);
      return;
    }

    const nextSlots: DeckSlotState[] = [];
    let adjustedDeck = false;
    for (const [entryIndex, entry] of sharedDeck.split(",").entries()) {
      let selectedCard: CardData | undefined;
      let optionCards: Array<CardData | undefined>;
      let count = 1;

      if (compactDeck !== null) {
        optionCards = entry.split(".").map((numberCode) =>
          catalogue.cards.find((card) => card.number.toString(36) === numberCode),
        );
        selectedCard = optionCards[0];
      } else {
        const [selectedSlug, countText, optionsText, ...unexpectedParts] = entry.split("~");
        count = Number(countText);
        const optionSlugs = optionsText?.split("+") ?? [selectedSlug];
        optionCards = optionSlugs.map((slug) =>
          catalogue.cards.find((card) => card.slug === slug),
        );
        selectedCard = catalogue.cards.find((card) => card.slug === selectedSlug);
        if (
          unexpectedParts.length ||
          !Number.isSafeInteger(count) ||
          count < 1 ||
          !optionCards.some((card) => card?.id === selectedCard?.id)
        ) {
          notifyAction(t("builder.sharedInvalid", { entry }), true);
          return;
        }
      }

      const validOptionCards = optionCards.filter((card): card is CardData => card !== undefined);
      if (!selectedCard || validOptionCards.length !== optionCards.length) {
        notifyAction(t("builder.sharedInvalid", { entry }), true);
        return;
      }

      const cardIds = [...new Set(validOptionCards.map((card) => card.id))];
      if (count > 1 || cardIds.length !== optionCards.length) adjustedDeck = true;
      if (nextSlots.length >= 4) {
        adjustedDeck = true;
        continue;
      }
      if (cardIds.some((id) => nextSlots.some((slot) => slot.cardIds.includes(id)))) {
        adjustedDeck = true;
        continue;
      }
      const talentCode = sharedTalents[entryIndex];
      const selectedTalentSlot = talentCode && talentCode !== "0" ? Number(talentCode) : null;
      if (
        selectedTalentSlot !== null &&
        !selectedCard.talents?.some((talent, index) => getTalentSlot(talent, index) === selectedTalentSlot)
      ) {
        notifyAction(t("builder.sharedInvalid", { entry: `t=${talentCode}` }), true);
        return;
      }
      nextSlots.push({
        id: `slot-${nextSlotId.current++}`,
        cardIds,
        selectedCardId: selectedCard.id,
        selectedTalentSlot,
      });
    }
    if (adjustedDeck) {
      notifyAction(`${t("builder.sharedAdjusted")} ${t("builder.adjustedMessage")}`);
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
          selectedTalentSlot: slot.selectedTalentSlot,
          selectedTalent: card.talents?.find(
            (talent, index) => getTalentSlot(talent, index) === slot.selectedTalentSlot,
          ),
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

  function updateDeckName(name: string) {
    setDeckName(name);
  }

  function persistSavedDecks(nextDecks: SavedDeck[]): boolean {
    try {
      window.localStorage.setItem(SAVED_DECKS_STORAGE_KEY, JSON.stringify(nextDecks));
      setSavedDecks(nextDecks);
      setStorageErrorType(null);
      return true;
    } catch {
      setStorageErrorType("storage");
      return false;
    }
  }

  function saveCurrentDeck(): boolean {
    if (!deckCards.length) {
      notifyAction(t("builder.saveEmpty"), true);
      return false;
    }
    if (!savedDecksLoaded || storageErrorType) {
      notifyAction(t("builder.storageError"), true);
      return false;
    }

    const id = currentSavedDeckId && savedDecks.some((savedDeck) => savedDeck.id === currentSavedDeckId)
      ? currentSavedDeckId
      : crypto.randomUUID();
    const savedDeck: SavedDeck = {
      id,
      name: deckName.trim().slice(0, 60) || "Untitled deck",
      slots: deckCards.map(({ card, alternatives, selectedTalentSlot }) => ({
        cardSlugs: [card, ...alternatives].map((option) => option.slug),
        selectedSlug: card.slug,
        talentSlot: selectedTalentSlot,
      })),
      updatedAt: new Date().toISOString(),
    };
    const nextDecks = [
      savedDeck,
      ...savedDecks.filter((item) => item.id !== id),
    ];
    if (!persistSavedDecks(nextDecks)) {
      notifyAction(t("builder.storageError"), true);
      return false;
    }
    setCurrentSavedDeckId(id);
    notifyAction(t("builder.deckSaved"));
    return true;
  }

  function loadSavedDeck(id: string): boolean {
    const savedDeck = savedDecks.find((item) => item.id === id);
    if (!catalogue || !savedDeck) return false;

    const nextSlots: DeckSlotState[] = [];
    for (const savedSlot of savedDeck.slots) {
      const slotCards = savedSlot.cardSlugs.map((slug) =>
        catalogue.cards.find((card) => card.slug === slug),
      );
      const selectedCard = catalogue.cards.find((card) => card.slug === savedSlot.selectedSlug);
      if (
        !selectedCard ||
        slotCards.some((card) => !card) ||
        (savedSlot.talentSlot !== null &&
          !selectedCard.talents?.some((talent, index) =>
            getTalentSlot(talent, index) === savedSlot.talentSlot,
          ))
      ) {
        setStorageErrorType("invalid");
        notifyAction(t("builder.invalidSavedDecks"), true);
        return false;
      }
      nextSlots.push({
        id: `slot-${nextSlotId.current++}`,
        cardIds: slotCards.filter((card): card is CardData => card !== undefined).map((card) => card.id),
        selectedCardId: selectedCard.id,
        selectedTalentSlot: savedSlot.talentSlot,
      });
    }

    setSlots(nextSlots);
    setDeckName(savedDeck.name);
    setCurrentSavedDeckId(savedDeck.id);
    notifyAction(t("builder.deckLoaded"));
    return true;
  }

  function deleteSavedDeck(id: string): boolean {
    if (storageErrorType || !savedDecksLoaded) {
      setStorageErrorType("storage");
      notifyAction(t("builder.storageError"), true);
      return false;
    }
    const nextDecks = savedDecks.filter((savedDeck) => savedDeck.id !== id);
    if (!persistSavedDecks(nextDecks)) {
      notifyAction(t("builder.storageError"), true);
      return false;
    }
    if (currentSavedDeckId === id) setCurrentSavedDeckId(null);
    notifyAction(t("builder.deckDeleted"));
    return true;
  }

  function startNewDeck() {
    setSlots([]);
    setDeckName("Untitled deck");
    setCurrentSavedDeckId(null);
    setShareUrl("");
  }

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
          selectedTalentSlot: null,
        },
      ];
    });
  }

  function addDeckCards(cards: Array<{ card: CardData; talentSlot?: number }>) {
    setSlots((current) => {
      const next = [...current];
      cards.forEach(({ card, talentSlot }) => {
        if (
          next.length >= 4 ||
          next.some((slot) => slot.cardIds.includes(card.id)) ||
          (talentSlot !== undefined && !card.talents?.some(
            (talent, index) => getTalentSlot(talent, index) === talentSlot,
          ))
        ) return;
        next.push({
          id: `slot-${nextSlotId.current++}`,
          cardIds: [card.id],
          selectedCardId: card.id,
          selectedTalentSlot: talentSlot ?? null,
        });
      });
      return next;
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
        ? { ...slot, selectedCardId: cardId, selectedTalentSlot: null }
        : slot,
    ));
  }

  function selectTalent(slotId: string, talentSlot: number | null) {
    setSlots((current) => current.map((slot) => {
      if (slot.id !== slotId) return slot;
      const card = catalogue?.cards.find((item) => item.id === slot.selectedCardId);
      if (
        talentSlot !== null &&
        !card?.talents?.some((talent, index) => getTalentSlot(talent, index) === talentSlot)
      ) return slot;
      return { ...slot, selectedTalentSlot: talentSlot };
    }));
  }

  function removeAlternative(slotId: string, cardId: string) {
    setSlots((current) => current.map((slot) =>
      slot.id === slotId && slot.selectedCardId !== cardId
        ? { ...slot, cardIds: slot.cardIds.filter((id) => id !== cardId) }
        : slot,
    ));
  }

  async function copyDeck() {
    if (!deckCards.length) {
      notifyAction(t("builder.copyEmpty"), true);
      return;
    }

    const deckText = deckCards
      .map(({ card, alternatives }) => {
        const choiceNames = [card, ...alternatives].map((option) => option.name);
        const alternativesText = choiceNames.length > 1
          ? ` · ${t("builder.options", { count: choiceNames.length })}: ${choiceNames.join(" / ")}`
          : "";
        const selectedTalent = deckCards.find((slot) => slot.card.id === card.id)?.selectedTalent;
        const talentText = selectedTalent ? ` · ${t("builder.talent")}: ${selectedTalent.name}` : "";
        return `${card.name} (#${card.number})${talentText}${alternativesText}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(deckText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 10_000);
      notifyAction(t("builder.listCopied"));
    } catch {
      notifyAction(`${t("builder.copyErrorTitle")} ${t("builder.clipboardError")}`, true);
    }
  }

  async function shareDeck() {
    setShareCopied(false);
    setShareUrl("");
    if (!deckCards.length) {
      notifyAction(t("builder.shareEmpty"), true);
      return;
    }

    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "#/builder";
    url.searchParams.set(
      "d",
      deckCards
        .map(({ card, alternatives }) =>
          [card, ...alternatives].map((option) => option.number.toString(36)).join("."),
        )
        .join(","),
    );
    const talentSlots = deckCards.map(({ selectedTalentSlot }) => selectedTalentSlot ?? 0);
    if (talentSlots.some((slot) => slot > 0)) {
      url.searchParams.set("t", talentSlots.join("").replace(/0+$/, ""));
    }
    if (deckName.trim() && deckName.trim() !== "Untitled deck") {
      url.searchParams.set("n", deckName.trim());
    }
    setShareUrl(url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 10_000);
      notifyAction(t("builder.linkCopied"));
    } catch {
      notifyAction(`${t("builder.shareErrorTitle")} ${t("builder.clipboardError")}`, true);
    }
  }

  return {
    deck,
    deckName,
    setDeckName: updateDeckName,
    savedDecks,
    savedDecksLoaded,
    storageError: storageErrorType
      ? t(storageErrorType === "invalid" ? "builder.invalidSavedDecks" : "builder.storageError")
      : "",
    saveCurrentDeck,
    loadSavedDeck,
    deleteSavedDeck,
    startNewDeck,
    deckCards,
    deckCount,
    changeDeck,
    addAlternative,
    selectAlternative,
    selectTalent,
    addDeckCards,
    removeAlternative,
    copied,
    copyDeck,
    shareCopied,
    shareUrl,
    shareDeck,
    actionFeedback,
  };
}
