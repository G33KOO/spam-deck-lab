import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import type { CardData } from "../../types";
import { imageUrl } from "../../lib/cardAssets";
import { useTranslation } from "../../i18n/LanguageContext";
import "./GameCardFace.css";

interface TooltipMeta {
  label: string;
  icon?: string;
}

export function GameCardFace({
  card,
  elementLabel,
  abilityHoverOnly = false,
}: {
  card: CardData;
  elementLabel: string;
  abilityHoverOnly?: boolean;
}) {
  const [hoverInfo, setHoverInfo] = useState<{
    title: string;
    effect: string;
    meta?: TooltipMeta[];
    left: number;
    top: number;
    centerY: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const dismissTimer = useRef<number | null>(null);
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
        ability.cooldown !== undefined
          ? { label: t("card.cooldown", { count: ability.cooldown }) }
          : undefined,
        ability.precision !== undefined
          ? { label: t("card.precision", { count: ability.precision }) }
          : undefined,
        ability.critChance !== undefined
          ? { label: t("card.critChance", { count: ability.critChance }) }
          : undefined,
        ability.critMultiplier !== undefined
          ? { label: t("card.critMultiplier", { count: ability.critMultiplier }) }
          : undefined,
      ].filter((item): item is TooltipMeta => item !== undefined),
    })),
    ...(card.skills ?? []).map((skill) => ({
      kind: "passive" as const,
      id: skill.id,
      name: skill.name,
      effect: skill.effect,
      rarity: skill.rarity ?? "common",
      meta: [{
        label: skill.rarity
          ? t("card.passiveRarity", { rarity: rarityNameForCard(skill.rarity, language) })
          : t("card.passiveSkill"),
      }],
    })),
  ].slice(0, 3);

  useEffect(() => () => {
    if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);
  }, []);

  useLayoutEffect(() => {
    if (!hoverInfo || !tooltipRef.current) return;
    const margin = 12;
    const height = tooltipRef.current.offsetHeight;
    const top = Math.min(
      Math.max(margin, hoverInfo.centerY - height / 2),
      window.innerHeight - height - margin,
    );
    if (top !== hoverInfo.top) {
      setHoverInfo((current) => current ? { ...current, top } : current);
    }
  }, [hoverInfo]);

  function showHoverInfo(
    event: ReactMouseEvent<HTMLElement>,
    info: { title: string; effect: string; meta?: TooltipMeta[] },
  ) {
    if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);

    const anchor = event.currentTarget.closest(".collection-card")?.getBoundingClientRect()
      ?? event.currentTarget.getBoundingClientRect();
    const margin = 12;
    const gap = 12;
    const width = Math.min(340, window.innerWidth - margin * 2);
    const height = Math.min(235, window.innerHeight - margin * 2);
    let left = anchor.right + gap;
    if (left + width > window.innerWidth - margin) {
      left = anchor.left - width - gap;
    }
    if (left < margin) {
      left = Math.min(
        Math.max(margin, anchor.left + (anchor.width - width) / 2),
        window.innerWidth - width - margin,
      );
    }
    const top = Math.min(
      Math.max(margin, anchor.top + (anchor.height - height) / 2),
      window.innerHeight - height - margin,
    );
    setHoverInfo({ ...info, left, top, centerY: anchor.top + anchor.height / 2 });
  }

  function scheduleTooltipDismissal() {
    if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);
    dismissTimer.current = window.setTimeout(() => setHoverInfo(null), 140);
  }

  function keepTooltipVisible() {
    if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current);
  }

  return (
    <div className={`game-card-face ${abilityHoverOnly ? "ability-hover-only" : ""}`}>
      <div className="game-card-clip">
        <img className="game-card-artwork" src={imageUrl(card.artwork.small)} alt="" loading="lazy" />
        <img className="game-card-frame" src={imageUrl(`img/frame/body-${card.element}.webp`)} alt="" />
        <span className="game-card-header-shade" />
      </div>
      <span
        className="game-card-element-zone"
        onMouseEnter={abilityHoverOnly ? undefined : (event) => showHoverInfo(event, {
            title: t("card.element", { name: elementLabel }),
            effect: t("card.elementDescription"),
            meta: [{ label: t("card.resistance", { name: elementLabel, value: resistance }) }],
          })}
        onMouseLeave={abilityHoverOnly ? undefined : scheduleTooltipDismissal}
      >
        <img className="game-card-element" src={imageUrl(`img/elements/${card.element}.webp`)} alt="" />
      </span>
      <span className="game-card-name">{card.name}</span>
      {rows.map((row, index) => (
        <div
          className={`game-card-row game-card-row-${row.kind}`}
          key={`${row.kind}-${row.id}-${index}`}
          style={{ top: `${((759 + index * 148) / 1375) * 100}%` }}
          onMouseEnter={(event) => showHoverInfo(event, {
            title: `${t(row.kind === "attack" ? "card.attack" : "card.passive")} · ${row.name}`,
            effect: row.effect,
            meta: row.meta,
          })}
          onMouseLeave={scheduleTooltipDismissal}
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
        onMouseEnter={abilityHoverOnly ? undefined : (event) => showHoverInfo(event, {
            title: t("card.spamton"),
            effect: t("card.spamtonHelp"),
            meta: [{ label: t("card.perTurn", { count: card.spamton }) }],
          })}
        onMouseLeave={abilityHoverOnly ? undefined : scheduleTooltipDismissal}
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
        createPortal(
          <div
            className="game-card-interaction-tooltip"
            role="tooltip"
            ref={tooltipRef}
            style={{ left: hoverInfo.left, top: hoverInfo.top }}
            onMouseEnter={keepTooltipVisible}
            onMouseLeave={scheduleTooltipDismissal}
          >
            <strong>{hoverInfo.title}</strong>
            <span>{hoverInfo.effect}</span>
            {hoverInfo.meta && hoverInfo.meta.length > 0 && (
              <div className="game-card-interaction-tooltip-meta">
                {hoverInfo.meta.map((item, index) => (
                  <small key={`${item.label}-${index}`}>
                    {item.icon && <img src={imageUrl(item.icon)} alt="" />}
                    {item.label}
                  </small>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )
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
