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
  const [saveErrorType, setSaveErrorType] = useState<"empty" | "storage" | null>(null);
  const [deckSaved, setDeckSaved] = useState(false);
  const [currentSavedDeckId, setCurrentSavedDeckId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [shareError, setShareError] = useState("");
  const [deckNotice, setDeckNotice] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const sharedDeckLoaded = useRef(false);
  const nextSlotId = useRef(0);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(SAVED_DECKS_STORAGE_KEY);
      if (storedValue) {
        const parsed: unknown = JSON.parse(storedValue);
        if (!Array.isArray(parsed) || !parsed.every(isSavedDeck)) {
          setStorageErrorType("invalid");
          return;
        }
        setSavedDecks(parsed);
      }
    } catch {
      setStorageErrorType("storage");
    } finally {
      setSavedDecksLoaded(true);
    }
  }, []);

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
      setShareError(t("builder.sharedEmpty"));
      return;
    }

    if (!/^\d{0,4}$/.test(sharedTalents)) {
      setShareError(t("builder.sharedInvalid", { entry: `t=${sharedTalents}` }));
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
          setShareError(t("builder.sharedInvalid", { entry }));
          return;
        }
      }

      const validOptionCards = optionCards.filter((card): card is CardData => card !== undefined);
      if (!selectedCard || validOptionCards.length !== optionCards.length) {
        setShareError(t("builder.sharedInvalid", { entry }));
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
        setShareError(t("builder.sharedInvalid", { entry: `t=${talentCode}` }));
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
    setDeckSaved(false);
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
    setSaveErrorType(null);
    setDeckSaved(false);
    if (!deckCards.length) {
      setSaveErrorType("empty");
      return false;
    }
    if (!savedDecksLoaded || storageErrorType) {
      setSaveErrorType("storage");
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
      setSaveErrorType("storage");
      return false;
    }
    setCurrentSavedDeckId(id);
    setDeckSaved(true);
    return true;
  }

  function loadSavedDeck(id: string): boolean {
    setSaveErrorType(null);
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
    setDeckSaved(false);
    setShareError("");
    return true;
  }

  function deleteSavedDeck(id: string): boolean {
    if (storageErrorType || !savedDecksLoaded) {
      setStorageErrorType("storage");
      return false;
    }
    const nextDecks = savedDecks.filter((savedDeck) => savedDeck.id !== id);
    if (!persistSavedDecks(nextDecks)) return false;
    if (currentSavedDeckId === id) setCurrentSavedDeckId(null);
    return true;
  }

  function startNewDeck() {
    setSlots([]);
    setDeckName("Untitled deck");
    setCurrentSavedDeckId(null);
    setDeckSaved(false);
    setSaveErrorType(null);
    setShareError("");
    setShareUrl("");
  }

  function changeDeck(card: CardData, amount: number) {
    setDeckSaved(false);
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
    setDeckSaved(false);
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
    setDeckSaved(false);
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
    setDeckSaved(false);
    setSlots((current) => current.map((slot) =>
      slot.id === slotId && slot.cardIds.includes(cardId)
        ? { ...slot, selectedCardId: cardId, selectedTalentSlot: null }
        : slot,
    ));
  }

  function selectTalent(slotId: string, talentSlot: number | null) {
    setDeckSaved(false);
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
    setDeckSaved(false);
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
        const selectedTalent = deckCards.find((slot) => slot.card.id === card.id)?.selectedTalent;
        const talentText = selectedTalent ? ` · ${t("builder.talent")}: ${selectedTalent.name}` : "";
        return `${card.name} (#${card.number})${talentText}${alternativesText}`;
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
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareError(t("builder.clipboardError"));
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
    saveError: saveErrorType
      ? t(saveErrorType === "empty" ? "builder.saveEmpty" : "builder.storageError")
      : "",
    deckSaved,
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
    copyError,
    copyDeck,
    shareCopied,
    shareError,
    deckNotice,
    shareUrl,
    shareDeck,
  };
}
