import { useEffect } from "react";
import type { CardCatalogue, CardData } from "../../types";
import { imageUrl } from "../../lib/cardAssets";
import { formatUpdateDate, styleLabel } from "../../lib/cardFormatting";
import { DetailGroup } from "../ui";

export function CardDetails({
  card,
  catalogue,
  elementName,
  rarityName,
  deckCount,
  onClose,
  onAdd,
}: {
  card: CardData;
  catalogue: CardCatalogue;
  elementName: (id: string) => string;
  rarityName: (id: string) => string;
  deckCount: number;
  onClose: () => void;
  onAdd: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="card-modal" role="dialog" aria-modal="true" aria-labelledby="card-modal-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close card details">×</button>
        <div className={`modal-art element-${card.element}`}>
          <img src={imageUrl(card.artwork.file)} alt={card.name} />
          <span className="modal-card-number">SPAMDEX / #{String(card.number).padStart(3, "0")}</span>
        </div>
        <div className="modal-content">
          <div className="eyebrow"><span /> {elementName(card.element).toUpperCase()} · {rarityName(card.rarity).toUpperCase()}</div>
          <h2 id="card-modal-title">{card.name}</h2>
          {card.lore?.text && (
            <div className="card-lore">
              <p>{card.lore.text}</p>
              <div className="lore-tags">
                {card.lore.species && <span>{card.lore.species}</span>}
                {card.lore.region && <span>{card.lore.region}</span>}
                {card.lore.era && <span>{card.lore.era}</span>}
              </div>
            </div>
          )}
          <div className="detail-stat-grid">
            <div><span>HEALTH</span><strong>{card.hp.toLocaleString()} <small>HP</small></strong></div>
            <div><span>SPAMTON</span><strong>{card.spamton}</strong></div>
            <div><span>ELEMENT</span><strong>{elementName(card.element)}</strong></div>
          </div>

          {!!card.abilities?.length && (
            <DetailGroup title="ABILITIES" count={card.abilities.length}>
              {card.abilities.map((ability) => (
                <div className="detail-entry" key={ability.id}>
                  <div className="detail-entry-heading"><strong>{ability.name}</strong>{ability.cooldown !== undefined && <span>COOLDOWN {ability.cooldown}</span>}</div>
                  <p>{ability.effect}</p>
                  {(ability.precision !== undefined || ability.critChance !== undefined) && (
                    <small className="ability-stats">
                      {ability.precision !== undefined && `${ability.precision}% precision`}
                      {ability.precision !== undefined && ability.critChance !== undefined && " · "}
                      {ability.critChance !== undefined && `${ability.critChance}% crit chance`}
                    </small>
                  )}
                </div>
              ))}
            </DetailGroup>
          )}
          {!!card.skills?.length && (
            <DetailGroup title="SKILLS" count={card.skills.length}>
              {card.skills.map((skill) => (
                <div className="detail-entry" key={skill.id}>
                  <div className="detail-entry-heading"><strong>{skill.name}</strong>{skill.rarity && <span>{rarityName(skill.rarity).toUpperCase()}</span>}</div>
                  <p>{skill.effect}</p>
                </div>
              ))}
            </DetailGroup>
          )}
          {!!card.talents?.length && (
            <DetailGroup title="TALENTS" count={card.talents.length}>
              {card.talents.map((talent) => (
                <div className="detail-entry" key={talent.id}>
                  <div className="detail-entry-heading"><strong>{talent.name}</strong>{talent.slot !== undefined && <span>SLOT {talent.slot}</span>}</div>
                  <p>{talent.effect}</p>
                </div>
              ))}
            </DetailGroup>
          )}
          {!!card.styles?.length && (
            <DetailGroup title="CARD STYLES" count={card.styles.length}>
              <div className="style-chip-list">
                {card.styles.map((styleId) => {
                  const style = catalogue.styles.find((item) => item.id === styleId);
                  return (
                    <span className="style-chip" key={styleId}>
                      {styleLabel(styleId)}
                      {style?.alternative && <small>ALT</small>}
                    </span>
                  );
                })}
              </div>
            </DetailGroup>
          )}
          <DetailGroup title="RESISTANCES" count={Object.keys(card.resistances).length}>
            <div className="resistance-grid">
              {Object.entries(card.resistances).map(([element, resistance]) => (
                <div key={element}><span className={`element-dot ${element}`} />{elementName(element)}<strong>{resistance}%</strong></div>
              ))}
            </div>
          </DetailGroup>
          <div className="modal-credit">
            <span>ARTIST</span>
            {card.artwork.artist?.link ? (
              <a href={card.artwork.artist.link} target="_blank" rel="noreferrer">{card.artwork.artist.name ?? "View artist"} ↗</a>
            ) : <strong>{card.artwork.artist?.name ?? "Not listed"}</strong>}
            <small>Data v{catalogue.version} · {formatUpdateDate(catalogue.generatedAt)}</small>
          </div>
          <button className="primary-button modal-add" onClick={onAdd}>
            {deckCount ? `ADD ANOTHER · ${deckCount} IN DECK` : "ADD TO DECK"} <span>+</span>
          </button>
        </div>
      </section>
    </div>
  );
}
