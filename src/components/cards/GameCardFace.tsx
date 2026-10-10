import { useState } from "react";
import type { CardData } from "../../types";
import { imageUrl } from "../../lib/cardAssets";
import "./GameCardFace.css";

export function GameCardFace({ card, elementLabel }: { card: CardData; elementLabel: string }) {
  const [hoverInfo, setHoverInfo] = useState<{ title: string; effect: string; meta?: string } | null>(null);
  const resist = card.resistances[card.element];
  const rows = [
    ...(card.abilities ?? []).map((ability) => ({
      kind: "attack" as const,
      id: ability.id,
      name: ability.name,
      effect: ability.effect,
      cooldown: ability.cooldown,
      meta: [
        ability.cooldown !== undefined ? `Cooldown ${ability.cooldown}` : "",
        ability.precision !== undefined ? `${ability.precision}% precision` : "",
        ability.critChance !== undefined ? `${ability.critChance}% crit chance` : "",
      ].filter(Boolean).join(" · "),
    })),
    ...(card.skills ?? []).map((skill) => ({
      kind: "passive" as const,
      id: skill.id,
      name: skill.name,
      effect: skill.effect,
      rarity: skill.rarity ?? "common",
      meta: skill.rarity ? `${rarityNameForCard(skill.rarity)} passive` : "Passive skill",
    })),
  ].slice(0, 3);

  return (
    <div className="game-card-face" onMouseLeave={() => setHoverInfo(null)}>
      <div className="game-card-clip">
        <img className="game-card-artwork" src={imageUrl(card.artwork.small)} alt="" loading="lazy" />
        <img className="game-card-frame" src={imageUrl(`img/frame/body-${card.element}.webp`)} alt="" />
        <span className="game-card-header-shade" />
      </div>
      <span
        className="game-card-element-zone"
        title={`Element: ${elementLabel}. Card resistance to ${elementLabel}: ${resist === undefined ? "not listed" : `${resist}%`}.`}
        onMouseEnter={() => setHoverInfo({
          title: `ELEMENT · ${elementLabel}`,
          effect: "Elemental type used by this card.",
          meta: `This card's resistance to ${elementLabel}: ${resist === undefined ? "not listed" : `${resist}%`}`,
        })}
      >
        <img className="game-card-element" src={imageUrl(`img/elements/${card.element}.webp`)} alt="" />
      </span>
      <span className="game-card-name">{card.name}</span>
      {rows.map((row, index) => (
        <div
          className={`game-card-row game-card-row-${row.kind}`}
          key={`${row.kind}-${row.id}-${index}`}
          style={{ top: `${((759 + index * 148) / 1375) * 100}%` }}
          title={`${row.name}: ${row.effect}`}
          onMouseEnter={() => setHoverInfo({
            title: `${row.kind === "attack" ? "ATTACK" : "PASSIVE"} · ${row.name}`,
            effect: row.effect,
            meta: row.meta,
          })}
        >
          {row.kind === "attack" ? (
            <>
              <img className="game-card-ability-bar" src={imageUrl("img/frame/ability-bar.webp")} alt="" />
              {row.cooldown !== undefined && (
                <>
                  <img className="game-card-cooldown" src={imageUrl("img/frame/cooldown.webp")} alt="" />
                  <span className="game-card-cooldown-text">{row.cooldown}</span>
                </>
              )}
              <span className="game-card-row-name">{row.name}</span>
            </>
          ) : (
            <>
              <span
                className="game-card-skill-line game-card-skill-line-left"
                style={{ backgroundImage: `url("${imageUrl(`img/frame/skill-line-${row.rarity}.webp`)}")` }}
              />
              <span
                className="game-card-skill-line game-card-skill-line-right"
                style={{ backgroundImage: `url("${imageUrl(`img/frame/skill-line-${row.rarity}.webp`)}")` }}
              />
              <span className="game-card-row-name">{row.name}</span>
            </>
          )}
        </div>
      ))}
      <div className="game-card-hp">{card.hp.toLocaleString()}/{card.hp.toLocaleString()}</div>
      <div
        className="game-card-spamton"
        title={`${card.spamton} Spamton gained each turn.`}
        onMouseEnter={() => setHoverInfo({
          title: "SPAMTON",
          effect: "Nombre de Spamtons gagnés à chaque tour.",
          meta: `${card.spamton} par tour`,
        })}
      >
        <img src={imageUrl("img/frame/spamton.webp")} alt="" />
        <strong>{card.spamton}</strong>
      </div>
      <img
        className="game-card-rarity"
        src={imageUrl(`img/frame/rarity-${card.rarity}.webp`)}
        alt={card.rarity}
      />
      {hoverInfo && (
        <div className="game-card-interaction-tooltip" aria-live="polite">
          <strong>{hoverInfo.title}</strong>
          <span>{hoverInfo.effect}</span>
          {hoverInfo.meta && <small>{hoverInfo.meta}</small>}
        </div>
      )}
    </div>
  );
}

export function rarityNameForCard(rarity: string): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
