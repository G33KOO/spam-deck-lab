import type { CardData } from "../../types";
import { GameCardFace } from "./GameCardFace";

export function CardTile({
  card,
  elementLabel,
  onSelect,
  onAdd,
  onRemove,
  quantity,
  deckMode = false,
}: {
  card: CardData;
  elementLabel: string;
  onSelect: () => void;
  onAdd: () => void;
  onRemove?: () => void;
  quantity: number;
  deckMode?: boolean;
}) {
  return (
    <article className={`collection-card element-${card.element}`}>
      <button className="tile-art-button" onClick={onSelect} aria-label={`View ${card.name} details`}>
        <div className="tile-art">
          <GameCardFace card={card} elementLabel={elementLabel} />
        </div>
      </button>
      <div className="tile-card-actions" onClick={(event) => event.stopPropagation()}>
        {deckMode ? (
          <div className="quantity-stepper">
            <button onClick={onRemove} aria-label={`Remove one ${card.name}`}>−</button>
            <span>{quantity}</span>
            <button onClick={onAdd} aria-label={`Add one ${card.name}`}>+</button>
          </div>
        ) : (
          <button
            className={`add-card-button ${quantity ? "has-count" : ""}`}
            onClick={(event) => { event.stopPropagation(); onAdd(); }}
            aria-label={`Add ${card.name} to deck`}
          >
            {quantity ? `+ ${quantity}` : "+"}
          </button>
        )}
      </div>
    </article>
  );
}
