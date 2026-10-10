import type { CardCatalogue, CardData, AppView } from "../../types";
import { GameCardFace } from "../../components/cards/GameCardFace";
import { CardTile } from "../../components/cards/CardTile";
import { DataNotice, Stat } from "../../components/ui";
import { formatUpdateDate } from "../../lib/cardFormatting";

export function Overview({
  catalogue,
  error,
  elementName,
  onNavigate,
  onSelectCard,
  onAddCard,
  deck,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  elementName: (id: string) => string;
  onNavigate: (view: AppView) => void;
  onSelectCard: (card: CardData) => void;
  onAddCard: (card: CardData) => void;
  deck: Record<string, number>;
}) {
  const featured = catalogue?.cards.slice(0, 4) ?? [];

  return (
    <>
      <div className="hero">
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span /> YOUR SPAM COMPANION</div>
          <h1>Know your cards.<br /><em>Own the match.</em></h1>
          <p>Every card, every detail, one place to plan your next move.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onNavigate("cards")}>EXPLORE THE CARDS <span>↗</span></button>
            <button className="text-button" onClick={() => onNavigate("builder")}>BUILD A DECK <span>→</span></button>
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
          <div className="floating-tag"><span>✦</span> THE SPAMDEX<br /><small>YOUR FIELD GUIDE</small></div>
        </div>
        <div className="hero-index">01 <span>/</span> 04</div>
      </div>

      <DataNotice error={error} />

      <section className="stats-row" aria-label="Catalogue overview">
        <Stat value={catalogue ? String(catalogue.cards.length).padStart(3, "0") : "—"} label="CARDS IN THE SPAMDEX" />
        <Stat value={catalogue ? String(catalogue.elements.length).padStart(2, "0") : "—"} label="ELEMENTS TO MASTER" />
        <Stat value={catalogue ? String(catalogue.rarities.length).padStart(2, "0") : "—"} label="RARITY CLASSES" />
        <div className="stat-item update-stat">
          <strong>{catalogue ? formatUpdateDate(catalogue.generatedAt) : "LOADING"}</strong>
          <span>LATEST CARD DATA <i className="tiny-live" /></span>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span /> THE COLLECTION</div>
            <h2>Start with the <em>essentials.</em></h2>
          </div>
          <button className="underlined-link" onClick={() => onNavigate("cards")}>VIEW ALL CARDS <span>↗</span></button>
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
            />
          )) : Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-card" />)}
        </div>
      </section>

      <section className="bottom-cta">
        <div className="cta-mark">✳</div>
        <div>
          <div className="eyebrow">YOUR NEXT MOVE</div>
          <h2>Make a deck <em>your own.</em></h2>
          <p>Test combinations, track your lineup, and take your build with you.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("builder")}>OPEN DECK BUILDER <span>↗</span></button>
      </section>
    </>
  );
}
