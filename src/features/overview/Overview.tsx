import type { CardCatalogue, CardData, AppView } from "../../types";
import { GameCardFace } from "../../components/cards/GameCardFace";
import { CardTile } from "../../components/cards/CardTile";
import { DataNotice, Stat } from "../../components/ui";
import { formatUpdateDate } from "../../lib/cardFormatting";
import { useTranslation } from "../../i18n/LanguageContext";

export function Overview({
  catalogue,
  error,
  elementName,
  onNavigate,
  onSelectCard,
  onAddCard,
  deck,
  deckCount,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  elementName: (id: string) => string;
  onNavigate: (view: AppView) => void;
  onSelectCard: (card: CardData) => void;
  onAddCard: (card: CardData) => void;
  deck: Record<string, number>;
  deckCount: number;
}) {
  const { language, t } = useTranslation();
  const featured = catalogue?.cards.slice(0, 4) ?? [];
  const [headline, headlineEmphasis = ""] = t("overview.headline").split("|");
  const [collectionTitle, collectionEmphasis = ""] = t("overview.collectionTitle").split("|");
  const [deckTitle, deckEmphasis = ""] = t("overview.makeDeck").split("|");

  return (
    <>
      <div className="hero">
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span /> {t("overview.eyebrow")}</div>
          <h1>{headline}<br /><em>{headlineEmphasis}</em></h1>
          <p>{t("overview.description")}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onNavigate("cards")}>{t("overview.explore")} <span>↗</span></button>
            <button className="text-button" onClick={() => onNavigate("builder")}>{t("overview.build")} <span>→</span></button>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-stamp">SPAM<br /><small>DECK LAB</small></div>
          <span className="art-spark spark-one">✳</span>
          <span className="art-spark spark-two">✦</span>
          <span className="art-spark spark-three">✳</span>
          <div className="hero-card hero-card-back">
            {featured[1] && <GameCardFace card={featured[1]} elementLabel={elementName(featured[1].element)} />}
          </div>
          <div className="hero-card hero-card-front">
            {featured[0] && <GameCardFace card={featured[0]} elementLabel={elementName(featured[0].element)} />}
          </div>
          <div className="floating-tag"><span>✦</span> SPAMDEX<br /><small>{t("overview.eyebrow")}</small></div>
        </div>
        <div className="hero-index">01 <span>/</span> 04</div>
      </div>

      <DataNotice error={error} />

      <section className="stats-row" aria-label={t("overview.statsLabel")}>
        <Stat value={catalogue ? String(catalogue.cards.length).padStart(3, "0") : "—"} label={t("overview.cards")} />
        <Stat value={catalogue ? String(catalogue.elements.length).padStart(2, "0") : "—"} label={t("overview.elements")} />
        <Stat value={catalogue ? String(catalogue.rarities.length).padStart(2, "0") : "—"} label={t("overview.rarities")} />
        <div className="stat-item update-stat">
          <strong>{catalogue ? formatUpdateDate(catalogue.generatedAt, language) : "…"}</strong>
          <span>{t("overview.latest")} <i className="tiny-live" /></span>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span /> {t("overview.collectionEyebrow")}</div>
            <h2>{collectionTitle}<em>{collectionEmphasis}</em></h2>
          </div>
          <button className="underlined-link" onClick={() => onNavigate("cards")}>{t("overview.viewAll")} <span>↗</span></button>
        </div>
        <div className="featured-grid">
          {catalogue ? featured.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              elementLabel={elementName(card.element)}
              onSelect={() => onSelectCard(card)}
              onAdd={() => onAddCard(card)}
              quantity={deck[card.id] ?? 0}
              addDisabled={Boolean(deck[card.id]) || deckCount >= 4}
            />
          )) : Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-card" />)}
        </div>
      </section>

      <section className="bottom-cta">
        <div className="cta-mark">✳</div>
        <div>
          <div className="eyebrow">{t("overview.nextMove")}</div>
          <h2>{deckTitle}<em>{deckEmphasis}</em></h2>
          <p>{t("overview.makeDeckDescription")}</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("builder")}>{t("overview.openBuilder")} <span>↗</span></button>
      </section>
    </>
  );
}
