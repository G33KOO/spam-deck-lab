export type AppView = "overview" | "cards" | "builder" | "saved" | "meta" | "tips";
export type CardSortOption = "number" | "name" | "hp" | "spamton";

export interface CardData {
  id: string;
  slug: string;
  number: number;
  name: string;
  element: string;
  rarity: string;
  spamton: number;
  hp: number;
  resistances: Record<string, number>;
  artwork: {
    file: string;
    small: string;
    tiny: string;
    artist?: {
      name?: string;
      link?: string;
    };
  };
  abilities?: Array<{
    id: string;
    name: string;
    effect: string;
    cooldown?: number;
    precision?: number;
    critChance?: number;
    critMultiplier?: number;
  }>;
  skills?: Array<{
    id: string;
    name: string;
    effect: string;
    rarity?: string;
    icon?: string;
  }>;
  talents?: Array<{
    id: string;
    name: string;
    effect: string;
    slot?: number;
  }>;
  lore?: {
    species?: string;
    region?: string;
    era?: string;
    text?: string;
  } | null;
  styles?: string[];
}

export interface GameElement {
  id: string;
  name: string;
  order: number;
  icon: string;
  color: string;
}

export interface GameRarity {
  id: string;
  name: string;
  order: number;
  textColor?: string | null;
  gem?: string;
}

export interface CardStyleData {
  id: string;
  alternative: boolean;
  renamesCard: boolean;
  artist?: {
    name?: string;
    link?: string;
  } | null;
}

export interface CardCatalogue {
  version: string;
  language: string;
  generatedAt: string;
  terms: string;
  elements: GameElement[];
  rarities: GameRarity[];
  styles: CardStyleData[];
  cards: CardData[];
}

export interface CatalogueIndex {
  latest: string;
  cards: string;
}
