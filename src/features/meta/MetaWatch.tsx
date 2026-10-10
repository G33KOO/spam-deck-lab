import { useState } from "react";
import type { CardCatalogue, CardData, AppView } from "../../types";
import { GameCardFace } from "../../components/cards/GameCardFace";
import { DataNotice, LoadingState, PageHeader } from "../../components/ui";
import { imageUrl } from "../../lib/cardAssets";

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
  title: string;
  description: string;
  slots: BuildSlot[];
  notes?: string[];
}

const communityBuilds: CommunityBuild[] = [
  {
    id: "01",
    title: "Divine song",
    description: "Four-card lineup idea · choose a flex for the last slot.",
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
    title: "Blaze lineup",
    description: "A funny Aigan pick—still needs the right talent.",
    slots: [
      { options: [{ slug: "blaze", label: "Blaze" }] },
      { options: [{ slug: "zayd", label: "Zayd" }] },
      { options: [{ slug: "astry", label: "Astry" }] },
      { options: [{ label: "Aigan (not found in the current catalogue)" }] },
    ],
  },
  {
    id: "03",
    title: "Full DPS",
    description: "Damage-focused lineup with a flexible third slot.",
    slots: [
      { options: [{ slug: "princesse_meridia", label: "Meridia" }] },
      { options: [{ slug: "zombie_floral", label: "Zombie" }] },
      {
        options: [
          { slug: "murmures_du_corail_noir", label: "Murmures" },
          { slug: "fleurmarine", label: "Marine (Fleurmarine)" },
          { label: "Tismo (not found in the current catalogue)" },
        ],
      },
      { options: [{ slug: "girafe_florale", label: "Girafe" }] },
      {
        options: [{ slug: "lame_de_la_foret", label: "Lame de la forêt" }],
        optional: true,
      },
    ],
    notes: ["Lame de la forêt is an optional extra to try."],
  },
  {
    id: "04",
    title: "Darkness lineup",
    description: "A dark-element idea; two references need to be identified.",
    slots: [
      { options: [{ slug: "vladislaus", label: "Vlad" }] },
      { options: [{ slug: "paguroniyx", label: "Pagu" }] },
      { options: [{ label: "Starter ténèbre (not found in the current catalogue)" }] },
      { options: [{ label: "Codex ténèbre (not found in the current catalogue)" }] },
    ],
  },
];

const communityTips = [
  {
    title: "Prioriser les dégâts bruts",
    category: "BUILD · DÉGÂTS",
    text: "Sur les monstres comme Mélodie, qui ont peu de dégâts de base, le bonus élémentaire apporte peu. Mieux vaut d’abord augmenter les dégâts de base, puis les chances et multiplicateurs de critique.",
    relatedSlug: "melodie_des_divinites",
    relatedLabel: "Voir Mélodie",
  },
];

export function MetaWatch({
  catalogue,
  error,
  elementName,
  onNavigate,
  onSelectCard,
  onAddCards,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  elementName: (id: string) => string;
  onNavigate: (view: AppView) => void;
  onSelectCard: (card: CardData) => void;
  onAddCards: (cards: CardData[]) => void;
}) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [includedOptional, setIncludedOptional] = useState<Record<string, boolean>>({});

  function selectedCard(build: CommunityBuild, slotIndex: number): CardData | undefined {
    const slot = build.slots[slotIndex];
    const optionIndex = selectedOptions[`${build.id}-${slotIndex}`] ?? 0;
    const option = slot.options[optionIndex];
    return option?.slug
      ? catalogue?.cards.find((card) => card.slug === option.slug)
      : undefined;
  }

  function addBuild(build: CommunityBuild) {
    if (!catalogue) return;
    const cards = build.slots.flatMap((slot, slotIndex) => {
      if (slot.optional && !includedOptional[`${build.id}-${slotIndex}`]) return [];
      const card = selectedCard(build, slotIndex);
      return card ? [card] : [];
    });
    if (cards.length) {
      onAddCards(cards);
      onNavigate("builder");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="COMMUNITY IDEAS"
        title="Build watch"
        description="Early lineups shared by players. Browse the suggested cards, try a variation, or load the available cards into your builder."
      />
      <DataNotice error={error} />
      <div className="build-disclaimer">
        <span>COMMUNITY SUBMISSIONS · NOT RANKED</span>
        <p>These are starting ideas, not verified meta decks. Missing names stay marked until they can be matched to the official card catalogue.</p>
      </div>
      {!catalogue && !error ? <LoadingState /> : catalogue && (
        <div className="community-content">
          <div className="community-build-grid">
            {communityBuilds.map((build) => {
              const addableCount = build.slots.reduce((count, slot, slotIndex) => {
                if (slot.optional && !includedOptional[`${build.id}-${slotIndex}`]) return count;
                return count + (selectedCard(build, slotIndex) ? 1 : 0);
              }, 0);
              return (
                <article className="community-build" key={build.id}>
                  <div className="community-build-header">
                    <span className="build-number">BUILD / {build.id}</span>
                    <span className="community-tag">COMMUNITY IDEA</span>
                  </div>
                  <h2>{build.title}</h2>
                  <p className="community-build-description">{build.description}</p>
                  <div className="build-slots">
                    {build.slots.map((slot, slotIndex) => {
                      const selectedIndex = selectedOptions[`${build.id}-${slotIndex}`] ?? 0;
                      const card = selectedCard(build, slotIndex);
                      return (
                        <div className={`build-slot ${slot.optional ? "optional-slot" : ""}`} key={`${build.id}-${slotIndex}`}>
                          <div className="build-slot-heading">
                            <span>{slot.optional ? "OPTIONAL ADD" : `SLOT ${String(slotIndex + 1).padStart(2, "0")}`}</span>
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
                                <span>INCLUDE</span>
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
                                  title={optionCard ? `Select ${optionCard.name}` : option.label}
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
                                      <strong>{option.label}</strong>
                                      <small>NEEDS CARD MATCH</small>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {card && (
                            <button className="build-card-details" onClick={() => onSelectCard(card)}>
                              VIEW CARD DETAILS <span>↗</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {build.notes?.map((note) => <p className="community-build-note" key={note}>✳ {note}</p>)}
                  <button
                    className="primary-button build-add-button"
                    disabled={!addableCount}
                    onClick={() => addBuild(build)}
                  >
                    ADD {addableCount} AVAILABLE {addableCount === 1 ? "CARD" : "CARDS"} TO BUILDER <span>↗</span>
                  </button>
                </article>
              );
            })}
          </div>
          <section className="tips-section">
            <div className="tips-section-heading">
              <div>
                <div className="eyebrow"><span /> KNOW-HOW BETWEEN PLAYERS</div>
                <h2>Tips &amp; <em>tricks.</em></h2>
              </div>
              <span className="community-tag">COMMUNITY TIPS · UNVERIFIED</span>
            </div>
            <div className="community-tip-grid">
              {communityTips.map((tip) => {
                const relatedCard = catalogue.cards.find((card) => card.slug === tip.relatedSlug);
                return (
                  <article className="community-tip" key={tip.title}>
                    <div className="tip-icon" aria-hidden="true">✳</div>
                    <div className="tip-content">
                      <span className="tip-category">{tip.category}</span>
                      <h3>{tip.title}</h3>
                      <p>{tip.text}</p>
                      {relatedCard && (
                        <button className="tip-card-link" onClick={() => onSelectCard(relatedCard)}>
                          <img src={imageUrl(relatedCard.artwork.tiny)} alt="" loading="lazy" />
                          {tip.relatedLabel} <span>↗</span>
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
      <div className="meta-source-note"><span>✳</span><p>Win rates, rankings, and deck rules aren’t supplied by the card catalogue. These player-submitted combinations are presented as suggestions only.</p></div>
    </>
  );
}
