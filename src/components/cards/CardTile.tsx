import type { CardData } from "../../types";
import { GameCardFace } from "./GameCardFace";
import { useTranslation } from "../../i18n/LanguageContext";

export function CardTile({
  card,
  elementLabel,
  onSelect,
  onAdd,
  onRemove,
  quantity = 0,
  deckMode = false,
  addLabel,
  addDisabled = false,
  hideAdd = false,
  showQuantityCount = true,
}: {
  card: CardData;
  elementLabel: string;
  onSelect: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  quantity?: number;
  deckMode?: boolean;
  addLabel?: string;
  addDisabled?: boolean;
  hideAdd?: boolean;
  showQuantityCount?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <article className={`collection-card element-${card.element} ${addLabel ? "collection-card-addable" : ""}`}>
      <button className="tile-art-button" onClick={onSelect} aria-label={t("card.viewDetails", { name: card.name })}>
        <div className="tile-art">
          <GameCardFace card={card} elementLabel={elementLabel} />
        </div>
      </button>
      {!hideAdd && <div className="tile-card-actions" onClick={(event) => event.stopPropagation()}>
        {deckMode ? (
          <button className="remove-deck-card" onClick={onRemove} aria-label={t("builder.removeCardLabel", { name: card.name })}>
            {t("builder.removeCard")}
          </button>
        ) : (
          <button
            className={`add-card-button ${quantity ? "has-count" : ""}`}
            onClick={(event) => { event.stopPropagation(); onAdd?.(); }}
            aria-label={t("card.addLabel", { name: card.name })}
            disabled={addDisabled}
          >
            {addLabel
              ? <>{addLabel}{showQuantityCount && quantity ? ` · ${quantity}` : ""}</>
              : showQuantityCount && quantity ? `+ ${quantity}` : "+"}
          </button>
        )}
      </div>}
    </article>
  );
}
