import { useEffect, useState } from "react";
import type { CardCatalogue, CatalogueIndex } from "../types";
import { API_ROOT } from "../lib/cardAssets";
import { useTranslation, type Language } from "../i18n/LanguageContext";

export function useCardCatalogue() {
  const { language } = useTranslation();
  const [catalogues, setCatalogues] = useState<Partial<Record<Language, CardCatalogue>>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    if (catalogues[language]) return;

    async function loadCatalogue() {
      try {
        const indexResponse = await fetch(`${API_ROOT}index.json`);
        if (!indexResponse.ok) {
          throw new Error(`Catalogue index request failed (${indexResponse.status}).`);
        }
        const index = (await indexResponse.json()) as CatalogueIndex;
        const cataloguePath = index.cards
          .replace("{version}", index.latest)
          .replace("{language}", language);
        const cardsResponse = await fetch(`${API_ROOT}${cataloguePath}`);
        if (!cardsResponse.ok) {
          throw new Error(`Card data request failed (${cardsResponse.status}).`);
        }
        const data = (await cardsResponse.json()) as CardCatalogue;
        if (
          !Array.isArray(data.cards) ||
          !data.cards.length ||
          !Array.isArray(data.elements) ||
          !data.elements.length ||
          !Array.isArray(data.rarities) ||
          !data.rarities.length ||
          !Array.isArray(data.styles)
        ) {
          throw new Error("The card data source returned an incomplete catalogue.");
        }
        if (data.language !== language) {
          throw new Error(`The card data source returned ${data.language} instead of ${language}.`);
        }
        if (data.cards.some((card) =>
          !card ||
          typeof card.id !== "string" ||
          !card.id ||
          typeof card.slug !== "string" ||
          !card.slug ||
          !Number.isSafeInteger(card.number) ||
          card.number <= 0,
        )) {
          throw new Error("The card data source returned invalid card identifiers.");
        }
        const cardNumbers = data.cards.map((card) => card.number);
        const cardIds = data.cards.map((card) => card.id);
        if (new Set(cardNumbers).size !== cardNumbers.length || new Set(cardIds).size !== cardIds.length) {
          throw new Error("The card data source returned invalid card identifiers.");
        }
        if (!cancelled) {
          setCatalogues((current) => ({ ...current, [language]: data }));
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "The official card catalogue could not be loaded.",
          );
        }
      }
    }

    void loadCatalogue();
    return () => {
      cancelled = true;
    };
  }, [catalogues, language]);

  return { catalogue: catalogues[language] ?? null, error };
}
