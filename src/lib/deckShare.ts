import type { CardData } from "../types";

export interface ShareSlot {
  /** Selected card first, then its alternatives. */
  cards: CardData[];
  talentSlot: number | null;
}

/** Builds the same link format as the builder's share button (`d`, `t`, `n` parameters). */
export function buildDeckShareUrl(slots: ShareSlot[], name?: string): string {
  const usable = slots.filter((slot) => slot.cards.length > 0).slice(0, 4);
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "#/builder";
  url.searchParams.set(
    "d",
    usable.map((slot) => slot.cards.map((card) => card.number.toString(36)).join(".")).join(","),
  );
  const talents = usable.map((slot) => slot.talentSlot ?? 0);
  if (talents.some((slot) => slot > 0)) {
    url.searchParams.set("t", talents.join("").replace(/0+$/, ""));
  }
  const cleanName = name?.trim();
  if (cleanName && cleanName !== "Untitled deck") url.searchParams.set("n", cleanName.slice(0, 60));
  return url.toString();
}
