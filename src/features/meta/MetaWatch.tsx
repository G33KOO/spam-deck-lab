import { useState } from "react";
import type { CardCatalogue, CardData, AppView } from "../../types";
import { GameCardFace } from "../../components/cards/GameCardFace";
import { DataNotice, LoadingState, PageHeader } from "../../components/ui";
import { imageUrl } from "../../lib/cardAssets";
import { useTranslation } from "../../i18n/LanguageContext";
import type { DeckCardSlot } from "../../hooks/useDeck";

export interface BuildCardOption {
  slug?: string;
  label: string;
}

export interface BuildSlot {
  options: BuildCardOption[];
  optional?: boolean;
}

export interface CommunityBuild {
  id: string;
  slots: BuildSlot[];
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
      { options: [{ label: "Aigan" }] },
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
          { label: "Tismo" },
        ],
      },
      { options: [{ slug: "girafe_florale", label: "Girafe" }] },
      {
        options: [{ slug: "lame_de_la_foret", label: "Lame de la forêt" }],
        optional: true,
      },
    ],
  },
  {
    id: "04",
    slots: [
      { options: [{ slug: "vladislaus", label: "Vlad" }] },
      { options: [{ slug: "paguroniyx", label: "Pagu" }] },
      { options: [{ label: "Starter ténèbre" }] },
      { options: [{ label: "Codex ténèbre" }] },
    ],
  },
];

const communityTips = [
  {
    relatedSlug: "melodie_des_divinites",
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
  const [includedOptional, setIncludedOptional] = useState<Record<string, boolean>>({});
  const buildCopy = {
    "01": { title: t("meta.build.01.title"), description: t("meta.build.01.description") },
    "02": { title: t("meta.build.02.title"), description: t("meta.build.02.description") },
    "03": { title: t("meta.build.03.title"), description: t("meta.build.03.description") },
    "04": { title: t("meta.build.04.title"), description: t("meta.build.04.description") },
  };

  function selectedCard(build: CommunityBuild, slotIndex: number): CardData | undefined {
    const slot = build.slots[slotIndex];
    const optionIndex = selectedOptions[`${build.id}-${slotIndex}`] ?? 0;
    const option = slot.options[optionIndex];
    return option?.slug
      ? catalogue?.cards.find((card) => card.slug === option.slug)
      : undefined;
  }

  function addableCards(build: CommunityBuild) {
    const usedIds = new Set(deckCards.flatMap((slot) => [
      slot.card.id,
      ...slot.alternatives.map((card) => card.id),
    ]));
    const seenIds = new Set<string>();
    return build.slots.flatMap((slot, slotIndex) => {
      if (slot.optional && !includedOptional[`${build.id}-${slotIndex}`]) return [];
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
          <div className="community-build-grid">
            {communityBuilds.map((build) => {
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
                        <div className={`build-slot ${slot.optional ? "optional-slot" : ""}`} key={`${build.id}-${slotIndex}`}>
                          <div className="build-slot-heading">
                            <span>{slot.optional ? t("meta.optionalAdd") : t("meta.slot", { number: String(slotIndex + 1).padStart(2, "0") })}</span>
                            {slot.optional && (
                              <label className="optional-toggle">
                                <input
                                  type="checkbox"
                                  checked={Boolean(includedOptional[`${build.id}-${slotIndex}`])}
                                  onChange={(event) => setIncludedOptional((current) => ({
                                    ...current,
                                    [`${build.id}-${slotIndex}`]: event.target.checked,
                                  }))}
                                />
                                <span>{t("meta.include")}</span>
                              </label>
                            )}
                          </div>
                          <div className="build-options">
                            {slot.options.map((option, optionIndex) => {
                              const optionCard = option.slug
                                ? catalogue.cards.find((item) => item.slug === option.slug)
                                : undefined;
                              return (
                                <button
                                  className={`build-option ${selectedIndex === optionIndex ? "selected" : ""} ${!optionCard ? "unmatched" : ""}`}
                                  key={option.slug ?? option.label}
                                  onClick={() => setSelectedOptions((current) => ({
                                    ...current,
                                    [`${build.id}-${slotIndex}`]: optionIndex,
                                  }))}
                                  title={optionCard ? t("meta.selectCard", { name: optionCard.name }) : option.label}
                                >
                                  <span className="build-option-art">
                                    {optionCard ? (
                                      <GameCardFace card={optionCard} elementLabel={elementName(optionCard.element)} />
                                    ) : <span className="unmatched-icon">?</span>}
                                    {slot.options.length > 1 && (
                                      <span className="option-radio">{selectedIndex === optionIndex ? "✓" : ""}</span>
                                    )}
                                  </span>
                                  {!optionCard && (
                                    <span className="build-option-name">
                                      <strong>{t("meta.missingCard", { name: option.label })}</strong>
                                      <small>{t("meta.needsMatch")}</small>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {card && (
                            <button className="build-card-details" onClick={() => onSelectCard(card)}>
                              {t("meta.viewDetails")} <span>↗</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {build.id === "03" && <p className="community-build-note">✳ {t("meta.build.03.note")}</p>}
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
          <section className="tips-section">
            <div className="tips-section-heading">
              <div>
                <div className="eyebrow"><span /> {t("meta.knowHow")}</div>
                {(() => {
                  const [title, emphasis = ""] = t("meta.tipsTitle").split("|");
                  return <h2>{title}<em>{emphasis}</em></h2>;
                })()}
              </div>
              <span className="community-tag">{t("meta.communityTips")}</span>
            </div>
            <div className="community-tip-grid">
              {communityTips.map((tip) => {
                const relatedCard = catalogue.cards.find((card) => card.slug === tip.relatedSlug);
                return (
                  <article className="community-tip" key={tip.relatedSlug}>
                    <div className="tip-icon" aria-hidden="true">✳</div>
                    <div className="tip-content">
                      <span className="tip-category">{t("meta.tip.category")}</span>
                      <h3>{t("meta.tip.title")}</h3>
                      <p>{t("meta.tip.text")}</p>
                      {relatedCard && (
                        <button className="tip-card-link" onClick={() => onSelectCard(relatedCard)}>
                          <img src={imageUrl(relatedCard.artwork.tiny)} alt="" loading="lazy" />
                          {t("meta.tip.viewCard")} <span>↗</span>
                        </button>
                      )}
                    </div>
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
