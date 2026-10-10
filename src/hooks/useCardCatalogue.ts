import { useEffect, useState } from "react";
import type { CardCatalogue, CatalogueIndex } from "../types";
import { API_ROOT } from "../lib/cardAssets";

export function useCardCatalogue() {
  const [catalogue, setCatalogue] = useState<CardCatalogue | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      try {
        const indexResponse = await fetch(`${API_ROOT}index.json`);
        if (!indexResponse.ok) {
          throw new Error(`Catalogue index request failed (${indexResponse.status}).`);
        }
        const index = (await indexResponse.json()) as CatalogueIndex;
        const cataloguePath = index.cards
          .replace("{version}", index.latest)
          .replace("{language}", "en");
        const cardsResponse = await fetch(`${API_ROOT}${cataloguePath}`);
        if (!cardsResponse.ok) {
          throw new Error(`Card data request failed (${cardsResponse.status}).`);
        }
        const data = (await cardsResponse.json()) as CardCatalogue;
        if (
          !data.cards?.length ||
          !data.elements?.length ||
          !data.rarities?.length ||
          !Array.isArray(data.styles)
        ) {
          throw new Error("The card data source returned an incomplete catalogue.");
        }
        if (!cancelled) setCatalogue(data);
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
  }, []);

  return { catalogue, error };
}
