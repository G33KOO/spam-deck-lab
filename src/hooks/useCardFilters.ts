import { useMemo } from "react";
import type { CardCatalogue, CardSortOption } from "../types";

export function useCardFilters(
  catalogue: CardCatalogue | null,
  search: string,
  selectedElement: string,
  selectedRarity: string,
  sort: CardSortOption,
) {
  return useMemo(() => {
    if (!catalogue) return [];

    const query = search.trim().toLocaleLowerCase();
    const filtered = catalogue.cards.filter((card) => {
      const matchesSearch =
        !query ||
        [
          card.name,
          card.element,
          card.rarity,
          ...(card.abilities ?? []).flatMap((ability) => [ability.name, ability.effect]),
          ...(card.skills ?? []).map((skill) => skill.name),
          ...(card.talents ?? []).map((talent) => talent.name),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query);

      return (
        matchesSearch &&
        (selectedElement === "all" || card.element === selectedElement) &&
        (selectedRarity === "all" || card.rarity === selectedRarity)
      );
    });

    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "hp") return b.hp - a.hp;
      if (sort === "spamton") return a.spamton - b.spamton;
      return a.number - b.number;
    });
  }, [catalogue, search, selectedElement, selectedRarity, sort]);
}
