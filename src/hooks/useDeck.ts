import { useEffect, useMemo, useRef, useState } from "react";
import type { CardCatalogue, CardData } from "../types";

export function useDeck(catalogue: CardCatalogue | null) {
  const [deck, setDeck] = useState<Record<string, number>>({});
  const [deckName, setDeckName] = useState("Untitled deck");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [shareError, setShareError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const sharedDeckLoaded = useRef(false);

  useEffect(() => {
    if (!catalogue || sharedDeckLoaded.current) return;
    sharedDeckLoaded.current = true;

    const params = new URLSearchParams(window.location.search);
    const sharedDeck = params.get("deck");
    if (sharedDeck === null) return;

    const sharedName = params.get("name")?.trim();
    if (sharedName) setDeckName(sharedName.slice(0, 60));
    if (!sharedDeck) {
      setShareError("This shared deck link does not contain any card data.");
      return;
    }

    const nextDeck: Record<string, number> = {};
    for (const entry of sharedDeck.split(",")) {
      const separator = entry.lastIndexOf("~");
      const slug = entry.slice(0, separator);
      const countText = entry.slice(separator + 1);
      const count = Number(countText);
      const card = catalogue.cards.find((item) => item.slug === slug);
      if (
        separator < 1 ||
        !Number.isSafeInteger(count) ||
        count < 1 ||
        !card
      ) {
        setShareError(`This shared deck contains an invalid or unknown card entry: ${entry}`);
        return;
      }
      const total = (nextDeck[card.id] ?? 0) + count;
      if (!Number.isSafeInteger(total)) {
        setShareError(`This shared deck has an invalid quantity for ${card.name}.`);
        return;
      }
      nextDeck[card.id] = total;
    }
    setDeck(nextDeck);
  }, [catalogue]);

  const deckCards = useMemo(() => {
    if (!catalogue) return [];
    return catalogue.cards
      .filter((card) => deck[card.id])
      .map((card) => ({ card, count: deck[card.id] }))
      .sort((a, b) => a.card.number - b.card.number);
  }, [catalogue, deck]);

  const deckCount = deckCards.reduce((total, item) => total + item.count, 0);

  function changeDeck(card: CardData, amount: number) {
    setDeck((current) => {
      const nextCount = (current[card.id] ?? 0) + amount;
      const next = { ...current };
      if (nextCount <= 0) delete next[card.id];
      else next[card.id] = nextCount;
      return next;
    });
  }

  async function copyDeck() {
    setCopyError("");
    if (!deckCards.length) {
      setCopyError("Add at least one card before copying your deck.");
      return;
    }

    const deckText = deckCards
      .map(({ card, count }) => `${count}x ${card.name} (#${card.number})`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(deckText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError("Clipboard access was denied. Allow clipboard access and try again.");
    }
  }

  async function shareDeck() {
    setShareError("");
    setShareCopied(false);
    setShareUrl("");
    if (!deckCards.length) {
      setShareError("Add at least one card before sharing your deck.");
      return;
    }

    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set(
      "deck",
      deckCards.map(({ card, count }) => `${card.slug}~${count}`).join(","),
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
      setShareError("Clipboard access was denied. Allow clipboard access and try again.");
    }
  }

  return {
    deck,
    deckName,
    setDeckName,
    deckCards,
    deckCount,
    changeDeck,
    copied,
    copyError,
    copyDeck,
    shareCopied,
    shareError,
    shareUrl,
    shareDeck,
  };
}
