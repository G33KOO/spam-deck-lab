import { useEffect, useState } from "react";
import type { CardCatalogue, CardData, AppView } from "../../types";
import { CardTile } from "../../components/cards/CardTile";
import { DataNotice, LoadingState, PageHeader, SearchIcon } from "../../components/ui";
import { imageUrl } from "../../lib/cardAssets";
import { useTranslation } from "../../i18n/LanguageContext";
import type { DeckCardSlot } from "../../hooks/useDeck";

export interface BuildCardOption {
  slug?: string;
  label: string;
}

export interface BuildSlot {
    options: BuildCardOption[];
    noteKey?: "meta.talentOneCavalry" | "meta.cavalryTalent" | "meta.talentOneMandatory";
}

export interface CommunityBuild {
    id: string;
    slots: BuildSlot[];
    noteKey?: "meta.build.08.note";
}

const communityBuilds: CommunityBuild[] = [
    {
      id: "01",
      slots: [
        { options: [{ slug: "melodie_des_divinites", label: "Mélodie" }] },
        { options: [{ slug: "rob_laventurier", label: "Rob" }] },
        { options: [{ slug: "oisillons_de_midas", label: "Oisillon" }] },
        {
          options: [
            { slug: "yotaru_gardefeuille", label: "Yotaru" },
            { slug: "fleur_de_vie", label: "Fleur de Vie" },
          ],
        },
      ],
    },
    {
      id: "02",
      slots: [
        { options: [{ slug: "blaze", label: "Blaze" }] },
        { options: [{ slug: "zayd", label: "Zayd" }] },
        { options: [{ slug: "astry", label: "Astry" }] },
        { options: [{ slug: "aidan", label: "Aigan" }] },
    ],
    },
    {
      id: "03",
      slots: [
        { options: [{ slug: "princesse_meridia", label: "Meridia" }] },
        { options: [{ slug: "zombie_floral", label: "Zombie" }] },
        {
          options: [
            { slug: "murmures_du_corail_noir", label: "Murmures" },
            { slug: "fleurmarine", label: "Marine (Fleurmarine)" },
            { slug: "lame_de_la_foret", label: "Lame de la forêt" },
            { label: "Tismo" },
          ],
        },
        { options: [{ slug: "girafe_florale", label: "Girafe" }] },
      ],
    },
    {
      id: "04",
      slots: [
        { options: [{ slug: "vladislaus", label: "Vlad" }] },
        { options: [{ slug: "paguroniyx", label: "Pagu" }] },
        { options: [{ slug: "esprit_ombre", label: "Starter ténèbre" }] },
        { options: [{ slug: "codex_des_maux_ancestraux", label: "Codex ténèbre" }] },
      ],
    },
    {
      id: "05",
      slots: [
        { options: [{ slug: "tisseuse_de_mots", label: "Tisseuse" }] },
        { options: [{ slug: "yotaru_gardefeuille", label: "Yotaru" }] },
        { options: [{ slug: "lueur_despoir", label: "Machin d’espoir" }] },
        { options: [{ slug: "lames_en_peine", label: "Lames en peine" }] },
      ],
    },
    {
      id: "06",
      slots: [
        { options: [{ slug: "lueur_despoir", label: "Lueur d’espoir" }] },
        { options: [{ slug: "gardien_vert", label: "Gardien vert" }] },
        { options: [{ slug: "codex_des_sorts_lumineux", label: "Codex lumière" }] },
        { options: [{ slug: "luminaire_abyssal", label: "Luminaire abyssal" }] },
      ],
    },
    {
      id: "07",
      slots: [
        { options: [{ slug: "ephial", label: "Ephial" }], noteKey: "meta.talentOneCavalry" },
        { options: [{ slug: "esprit_ombre", label: "Starter ombre" }], noteKey: "meta.cavalryTalent" },
        { options: [{ slug: "esprit_lumiere", label: "Starter lumière" }], noteKey: "meta.cavalryTalent" },
        { options: [{ slug: "cornu_mythologique", label: "Cornu mythologique" }] },
      ],
    },
    {
      id: "08",
      noteKey: "meta.build.08.note",
      slots: [
        { options: [{ slug: "cornu_mythologique", label: "Cornu mythologique" }] },
        { options: [{ slug: "dragon_de_la_cite_infernale", label: "Dragosaure" }], noteKey: "meta.talentOneMandatory" },
        { options: [{ slug: "dragon_ciel", label: "Dragon Ciel" }] },
        { options: [{ slug: "lepine_damour", label: "Épine d’Amour" }] },
      ],
    },
    {
      id: "09",
      slots: [
        { options: [{ slug: "croqueur_de_fruits_verdoyant", label: "Croqueur" }] },
        { options: [{ slug: "lepine_damour", label: "Épine d’Amour" }] },
        { options: [{ slug: "sanglier_dore", label: "Sanglier doré" }] },
        { options: [{ slug: "commando_gerz", label: "Commando" }] },
      ],
    },
    {
      id: "10",
      slots: [
        { options: [{ slug: "keria", label: "Ikaria" }] },
        { options: [{ slug: "veilleur_nocturne", label: "Veilleur" }] },
        {
          options: [
            { slug: "codex_des_maux_ancestraux", label: "Codex ténèbres" },
            { slug: "codex_des_sorts_lumineux", label: "Codex lumière" },
          ],
        },
        { options: [{ slug: "devoreur_de_faune", label: "Dévoreur de faune" }] },
      ],
    },
    {
      id: "11",
      slots: [
        { options: [{ slug: "esprit_lumiere", label: "Esprit lumière" }] },
        { options: [{ slug: "oisillons_de_midas", label: "Oisillon" }] },
        { options: [{ slug: "codex_des_sorts_lumineux", label: "Codex lumière" }] },
        { options: [{ slug: "rongeur_nuageux", label: "Rongeur" }] },
      ],
    },
    {
      id: "12",
      slots: [
        { options: [{ slug: "le_heraut_des_cendres", label: "Héraut des cendres" }] },
        { options: [{ slug: "raffteru", label: "Raffteru" }] },
        { options: [{ slug: "commando_gerz", label: "Commando" }] },
        { options: [{ slug: "maitre_thronebeur", label: "Maître Thronebéur" }] },
      ],
    },
];

export function MetaWatch({
  catalogue,
  error,
  elementName,
  onNavigate,
  onSelectCard,
  onAddCards,
  deckCards,
  deckCount,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  elementName: (id: string) => string;
  onNavigate: (view: AppView) => void;
  onSelectCard: (card: CardData) => void;
  onAddCards: (cards: CardData[]) => void;
  deckCards: DeckCardSlot[];
  deckCount: number;
}) {
  const { t } = useTranslation();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [activeAlternatives, setActiveAlternatives] = useState<{ buildId: string; slotIndex: number } | null>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState("all");
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [sort, setSort] = useState<"default" | "name" | "hp" | "spamton">("default");
  const buildCopy = {
    "01": { title: t("meta.build.01.title"), description: t("meta.build.01.description") },
    "02": { title: t("meta.build.02.title"), description: t("meta.build.02.description") },
    "03": { title: t("meta.build.03.title"), description: t("meta.build.03.description") },
    "04": { title: t("meta.build.04.title"), description: t("meta.build.04.description") },
    "05": { title: t("meta.build.05.title"), description: t("meta.build.05.description") },
    "06": { title: t("meta.build.06.title"), description: t("meta.build.06.description") },
    "07": { title: t("meta.build.07.title"), description: t("meta.build.07.description") },
    "08": { title: t("meta.build.08.title"), description: t("meta.build.08.description") },
    "09": { title: t("meta.build.09.title"), description: t("meta.build.09.description") },
    "10": { title: t("meta.build.10.title"), description: t("meta.build.10.description") },
    "11": { title: t("meta.build.11.title"), description: t("meta.build.11.description") },
    "12": { title: t("meta.build.12.title"), description: t("meta.build.12.description") },
  };

  function selectedCard(build: CommunityBuild, slotIndex: number): CardData | undefined {
    const slot = build.slots[slotIndex];
    const optionIndex = selectedOptions[`${build.id}-${slotIndex}`] ?? 0;
    const option = slot.options[optionIndex];
    return option?.slug
      ? catalogue?.cards.find((card) => card.slug === option.slug)
      : undefined;
  }

  function slotCards(build: CommunityBuild, slotIndex: number): CardData[] {
    const slot = build.slots[slotIndex];
    return slot.options.flatMap((option) => {
      const card = option.slug
        ? catalogue?.cards.find((item) => item.slug === option.slug)
        : undefined;
      return card ? [card] : [];
    });
  }

  function addableCards(build: CommunityBuild) {
    const usedIds = new Set(deckCards.flatMap((slot) => [
      slot.card.id,
      ...slot.alternatives.map((card) => card.id),
    ]));
    const seenIds = new Set<string>();
    return build.slots.flatMap((_, slotIndex) => {
      const card = selectedCard(build, slotIndex);
      if (!card || usedIds.has(card.id) || seenIds.has(card.id)) return [];
      seenIds.add(card.id);
      return [card];
    }).slice(0, Math.max(0, 4 - deckCount));
  }

  function addBuild(build: CommunityBuild) {
    if (!catalogue) return;
    const cards = addableCards(build);
    if (cards.length) {
      onAddCards(cards);
      onNavigate("builder");
    }
  }

  useEffect(() => {
    if (!activeAlternatives) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveAlternatives(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeAlternatives]);

  function toggleCardFilter(cardId: string) {
    setSelectedCardIds((current) => current.includes(cardId)
      ? current.filter((id) => id !== cardId)
      : [...current, cardId]);
    setCardSearch("");
  }

  function resetDeckFilters() {
    setCardSearch("");
    setSelectedCardIds([]);
    setSelectedElement("all");
    setSelectedRarity("all");
    setSort("default");
  }

  const normalizedCardSearch = cardSearch.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const cardSuggestions = catalogue && normalizedCardSearch
    ? catalogue.cards
      .filter((card) => `${card.name} ${card.slug}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedCardSearch))
      .slice(0, 8)
    : [];
  const visibleBuilds = catalogue
    ? communityBuilds.filter((build) => {
      const cards = build.slots.flatMap((_, slotIndex) => slotCards(build, slotIndex));
      const cardMatches = !selectedCardIds.length || selectedCardIds.some((id) => cards.some((card) => card.id === id));
      const elementMatches = selectedElement === "all" || cards.some((card) => card.element === selectedElement);
      const rarityMatches = selectedRarity === "all" || cards.some((card) => card.rarity === selectedRarity);
      return cardMatches && elementMatches && rarityMatches;
    })
    : communityBuilds;

  if (sort !== "default" && catalogue) {
    visibleBuilds.sort((left, right) => {
      if (sort === "name") {
        return buildCopy[left.id as keyof typeof buildCopy].title
          .localeCompare(buildCopy[right.id as keyof typeof buildCopy].title);
      }
      const getAverage = (build: CommunityBuild, key: "hp" | "spamton") => {
        const cards = build.slots.flatMap((_, slotIndex) => {
          const card = selectedCard(build, slotIndex);
          return card ? [card] : [];
        });
        return cards.length ? cards.reduce((sum, card) => sum + card[key], 0) / cards.length : 0;
      };
      return sort === "hp"
        ? getAverage(right, "hp") - getAverage(left, "hp")
        : getAverage(left, "spamton") - getAverage(right, "spamton");
    });
  }

  const activeBuild = activeAlternatives
    ? communityBuilds.find((build) => build.id === activeAlternatives.buildId)
    : undefined;
  const activeSlot = activeBuild?.slots[activeAlternatives?.slotIndex ?? -1];
  const activeSelectedIndex = activeAlternatives
    ? selectedOptions[`${activeAlternatives.buildId}-${activeAlternatives.slotIndex}`] ?? 0
    : 0;

  return (
    <>
      <PageHeader
        eyebrow={t("meta.eyebrow")}
        title={t("meta.title")}
        description={t("meta.description")}
      />
      <DataNotice error={error} />
      <div className="build-disclaimer">
        <span>{t("meta.disclaimerTitle")}</span>
        <p>{t("meta.disclaimerText")}</p>
      </div>
      {!catalogue && !error ? <LoadingState /> : catalogue && (
        <div className="community-content">
          <section className="meta-deck-filter-section" aria-label={t("meta.filters")}>
            <div className="meta-deck-filters">
              <div className="meta-card-picker">
                <label className="search-field">
                  <SearchIcon />
                  <input
                    value={cardSearch}
                    onChange={(event) => setCardSearch(event.target.value)}
                    placeholder={t("meta.searchCardsPlaceholder")}
                    aria-label={t("meta.searchCards")}
                    aria-autocomplete="list"
                    aria-expanded={cardSuggestions.length > 0}
                  />
                  <kbd>/</kbd>
                </label>
                {cardSuggestions.length > 0 && (
                  <div className="meta-card-suggestions" role="listbox" aria-label={t("meta.searchCards")}>
                    {cardSuggestions.map((card) => {
                      const isSelected = selectedCardIds.includes(card.id);
                      return (
                        <button
                          key={card.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className="meta-card-suggestion"
                          onClick={() => toggleCardFilter(card.id)}
                        >
                          <img src={imageUrl(card.artwork.tiny)} alt="" loading="lazy" />
                          <span>
                            <strong>{card.name}</strong>
                            <small>{elementName(card.element)} · {card.rarity}</small>
                          </span>
                          <i aria-hidden="true">{isSelected ? "✓" : "+"}</i>
                        </button>
                      );
                    })}
                  </div>
                )}
                {normalizedCardSearch.length > 0 && cardSuggestions.length === 0 && (
                  <p className="meta-card-no-results">{t("meta.noCardMatches")}</p>
                )}
              </div>
              <label className="select-field">
                <span>{t("filter.element")}</span>
                <select value={selectedElement} onChange={(event) => setSelectedElement(event.target.value)}>
                  <option value="all">{t("filter.allElements")}</option>
                  {catalogue.elements.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}
                </select>
              </label>
              <label className="select-field">
                <span>{t("filter.rarity")}</span>
                <select value={selectedRarity} onChange={(event) => setSelectedRarity(event.target.value)}>
                  <option value="all">{t("filter.allRarities")}</option>
                  {catalogue.rarities.map((rarity) => <option key={rarity.id} value={rarity.id}>{rarity.name}</option>)}
                </select>
              </label>
              <label className="select-field sort-field">
                <span>{t("filter.sort")}</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
                  <option value="default">{t("meta.sort.default")}</option>
                  <option value="name">{t("filter.name")}</option>
                  <option value="hp">{t("meta.sort.highestHp")}</option>
                  <option value="spamton">{t("meta.sort.lowestSpamton")}</option>
                </select>
              </label>
            </div>
            <div className="meta-filter-footer">
              <div className="meta-selected-card-filters">
                {selectedCardIds.length > 0 && (
                  <>
                    <span className="meta-card-match-hint">{t("meta.cardsMatchAny")}</span>
                    {selectedCardIds.flatMap((id) => {
                      const card = catalogue.cards.find((item) => item.id === id);
                      return card ? (
                        <button
                          type="button"
                          key={id}
                          className="meta-selected-card-chip"
                          onClick={() => toggleCardFilter(id)}
                          aria-label={t("meta.removeCardFilter", { name: card.name })}
                        >
                          {card.name} <span aria-hidden="true">×</span>
                        </button>
                      ) : [];
                    })}
                  </>
                )}
              </div>
              <div className="meta-filter-results">
                <span><strong>{visibleBuilds.length}</strong> {t(visibleBuilds.length === 1 ? "meta.deckResultsOne" : "meta.deckResultsMany", { count: visibleBuilds.length })}</span>
                {(selectedCardIds.length > 0 || selectedElement !== "all" || selectedRarity !== "all" || sort !== "default" || cardSearch) && (
                  <button type="button" onClick={resetDeckFilters}>{t("filter.clear")} <span>×</span></button>
                )}
              </div>
            </div>
          </section>
          {visibleBuilds.length > 0 ? (
          <div className="community-build-grid">
            {visibleBuilds.map((build) => {
              const addableCount = addableCards(build).length;
              return (
                <article className="community-build" key={build.id}>
                  <div className="community-build-header">
                    <span className="build-number">{t("meta.buildLabel", { number: build.id })}</span>
                    <span className="community-tag">{t("meta.communityIdea")}</span>
                  </div>
                  <h2>{buildCopy[build.id as keyof typeof buildCopy].title}</h2>
                  <p className="community-build-description">{buildCopy[build.id as keyof typeof buildCopy].description}</p>
                  <div className="build-slots">
                    {build.slots.map((slot, slotIndex) => {
                      const selectedIndex = selectedOptions[`${build.id}-${slotIndex}`] ?? 0;
                      const card = selectedCard(build, slotIndex);
                      return (
                        <div className="build-slot" key={`${build.id}-${slotIndex}`}>
                          <div className="build-slot-heading">
                            <span>{t("meta.slot", { number: String(slotIndex + 1).padStart(2, "0") })}</span>
                          </div>
                          <div className={`build-slot-card-choice ${card ? "" : "unmatched"}`}>
                            {card ? (
                              <CardTile
                                card={card}
                                elementLabel={elementName(card.element)}
                                onSelect={() => onSelectCard(card)}
                                hideAdd
                              />
                            ) : (
                              <div className="build-unmatched-card" role="status">
                                <span aria-hidden="true">?</span>
                                <strong>{slot.options[selectedIndex]?.label}</strong>
                                <small>{t("meta.needsMatch")}</small>
                              </div>
                            )}
                          </div>
                          {slot.options.length > 1 && (
                            <button
                              className="show-alternatives-button"
                              type="button"
                              aria-label={t("meta.showAlternatives")}
                              onClick={() => setActiveAlternatives({ buildId: build.id, slotIndex })}
                            >
                              {t("meta.showAlternatives")}
                            </button>
                          )}
                          {slot.noteKey && <p className="build-slot-note">{t(slot.noteKey)}</p>}
                        </div>
                      );
                    })}
                  </div>
                  {build.noteKey && <p className="community-build-note">✳ {t(build.noteKey)}</p>}
                  <button
                    className="primary-button build-add-button"
                    disabled={!addableCount}
                    onClick={() => addBuild(build)}
                  >
                    {t(addableCount === 1 ? "meta.addAvailableOne" : "meta.addAvailableMany", { count: addableCount })} <span>↗</span>
                  </button>
                </article>
              );
            })}
          </div>
          ) : (
            <div className="empty-state meta-empty-state">
              <span>⌕</span>
              <h3>{t("meta.noDecks")}</h3>
              <p>{t("meta.adjustFilters")}</p>
              <button type="button" onClick={resetDeckFilters}>{t("filter.clear")}</button>
            </div>
          )}
        </div>
      )}
      {activeAlternatives && activeBuild && activeSlot && catalogue && (
        <div className="alternatives-modal-backdrop" onClick={() => setActiveAlternatives(null)}>
          <section
            className="alternatives-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alternatives-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alternatives-modal-header">
              <div>
                <div className="eyebrow"><span />{t("meta.alternativesEyebrow")}</div>
                <h2 id="alternatives-modal-title">{t("meta.alternativesTitle")}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setActiveAlternatives(null)}
                aria-label={t("meta.closeAlternatives")}
              >
                ×
              </button>
            </div>
            <div className="alternatives-modal-grid">
              {activeSlot.options.map((option, optionIndex) => {
                const card = option.slug
                  ? catalogue.cards.find((item) => item.slug === option.slug)
                  : undefined;
                const isSelected = activeSelectedIndex === optionIndex;
                return (
                  <article className={`alternative-option ${isSelected ? "selected" : ""}`} key={option.slug ?? option.label}>
                    {card ? (
                      <CardTile
                        card={card}
                        elementLabel={elementName(card.element)}
                        onSelect={() => {
                          setActiveAlternatives(null);
                          onSelectCard(card);
                        }}
                        hideAdd
                      />
                    ) : (
                      <div className="build-unmatched-card" role="status">
                        <span aria-hidden="true">?</span>
                        <strong>{option.label}</strong>
                        <small>{t("meta.needsMatch")}</small>
                      </div>
                    )}
                    <button
                      type="button"
                      className="build-option-select"
                      disabled={!card}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedOptions((current) => ({
                          ...current,
                          [`${activeBuild.id}-${activeAlternatives.slotIndex}`]: optionIndex,
                        }));
                        setActiveAlternatives(null);
                      }}
                    >
                      {t("meta.selectCard", { name: card?.name ?? option.label })}
                      <span aria-hidden="true">{isSelected ? "✓" : "○"}</span>
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
      <div className="meta-source-note"><span>✳</span><p>{t("meta.sourceNote")}</p></div>
    </>
  );
}
