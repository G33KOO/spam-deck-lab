import { useState } from "react";
import type { CardData } from "../../types";
import { imageUrl } from "../../lib/cardAssets";
import { useTranslation } from "../../i18n/LanguageContext";
import "./GameCardFace.css";

export function GameCardFace({ card, elementLabel }: { card: CardData; elementLabel: string }) {
  const [hoverInfo, setHoverInfo] = useState<{ title: string; effect: string; meta?: string } | null>(null);
  const { language, t } = useTranslation();
  const resist = card.resistances[card.element];
  const resistance = resist === undefined ? t("card.notListed") : `${resist}%`;
  const rows = [
    ...(card.abilities ?? []).map((ability) => ({
      kind: "attack" as const,
      id: ability.id,
      name: ability.name,
      effect: ability.effect,
      cooldown: ability.cooldown,
      meta: [
      ability.cooldown !== undefined ? t("card.cooldown", { count: ability.cooldown }) : "",
      ability.precision !== undefined ? t("card.precision", { count: ability.precision }) : "",
      ability.critChance !== undefined ? t("card.critChance", { count: ability.critChance }) : "",
      ].filter(Boolean).join(" · "),
    })),
    ...(card.skills ?? []).map((skill) => ({
      kind: "passive" as const,
      id: skill.id,
      name: skill.name,
      effect: skill.effect,
      rarity: skill.rarity ?? "common",
      meta: skill.rarity ? t("card.passiveRarity", { rarity: rarityNameForCard(skill.rarity, language) }) : t("card.passiveSkill"),
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
        title={`${t("card.element", { name: elementLabel })}. ${t("card.resistance", { name: elementLabel, value: resistance })}.`}
        onMouseEnter={() => setHoverInfo({
          title: t("card.element", { name: elementLabel }),
          effect: t("card.elementDescription"),
          meta: t("card.resistance", { name: elementLabel, value: resistance }),
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
            title: `${t(row.kind === "attack" ? "card.attack" : "card.passive")} · ${row.name}`,
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
        title={t("card.spamtonTitle", { count: card.spamton })}
        onMouseEnter={() => setHoverInfo({
          title: t("card.spamton"),
          effect: t("card.spamtonHelp"),
          meta: t("card.perTurn", { count: card.spamton }),
        })}
      >
        <img src={imageUrl("img/frame/spamton.webp")} alt="" />
        <strong>{card.spamton}</strong>
      </div>
      <img
        className="game-card-rarity"
        src={imageUrl(`img/frame/rarity-${card.rarity}.webp`)}
        alt=""
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

export function rarityNameForCard(rarity: string, language: "fr" | "en" = "en"): string {
  const names = language === "fr"
    ? { common: "commun", rare: "rare", epic: "épique", legendary: "légendaire", divine: "divin" }
    : { common: "common", rare: "rare", epic: "epic", legendary: "legendary", divine: "divine" };
  return names[rarity.toLowerCase() as keyof typeof names] ?? rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
