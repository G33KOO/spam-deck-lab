import { useMemo } from "react";
import type { CardCatalogue } from "../../types";
import type { DeckCardSlot } from "../../hooks/useDeck";
import { useTranslation } from "../../i18n/LanguageContext";

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function DeckInsights({
  catalogue,
  deckCards,
}: {
  catalogue: CardCatalogue;
  deckCards: DeckCardSlot[];
}) {
  const { language, t } = useTranslation();
  const numberFormat = new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 1,
  });
  const percentFormat = new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 0,
  });

  const stats = useMemo(() => {
    const activeCards = deckCards.map((slot) => slot.card);
    const cards = catalogue.cards;
    const attacks = activeCards.flatMap((card) => card.abilities ?? []);
    const accuracyValues = attacks
      .map((ability) => ability.precision)
      .filter((value): value is number => Number.isFinite(value));
    const cooldownValues = attacks
      .map((ability) => ability.cooldown)
      .filter((value): value is number => Number.isFinite(value));
    const criticalAttacks = attacks.filter((ability) =>
      Number.isFinite(ability.critChance) && Number.isFinite(ability.critMultiplier),
    );
    const vulnerabilities = activeCards.flatMap((card) =>
      catalogue.elements.flatMap((element) => {
        const value = card.resistances[element.id];
        if (!Number.isFinite(value)) return [];
        const baseline = average(cards
          .map((catalogueCard) => catalogueCard.resistances[element.id])
          .filter((resistance): resistance is number => Number.isFinite(resistance)));
        const difference = value - baseline;
        return difference < -2 ? [{ cardName: card.name, element: element.name, value, difference }] : [];
      }),
    ).sort((a, b) => a.difference - b.difference).slice(0, 4);
    const hpAverage = average(activeCards.map((card) => card.hp));
    const catalogueHpAverage = average(cards.map((card) => card.hp));
    const spamtonTotal = activeCards.reduce((sum, card) => sum + card.spamton, 0);
    const catalogueSpamtonAverage = average(cards.map((card) => card.spamton));
    const elementStats = catalogue.elements.map((element) => {
      const deckValues = activeCards
        .map((card) => card.resistances[element.id])
        .filter((value): value is number => Number.isFinite(value));
      const catalogueValues = cards
        .map((card) => card.resistances[element.id])
        .filter((value): value is number => Number.isFinite(value));
      const deckAverage = average(deckValues);
      const catalogueAverage = average(catalogueValues);
      return {
        id: element.id,
        name: element.name,
        value: deckAverage,
        difference: deckAverage - catalogueAverage,
        coverage: deckValues.length,
      };
    }).filter((element) => element.coverage > 0);
    const resistanceGaps = [...elementStats].sort((a, b) => a.difference - b.difference);
    const hpPercentile = cards.length
      ? Math.round((cards.filter((card) => card.hp <= hpAverage).length / cards.length) * 100)
      : 0;

    return {
      activeCards,
      attackCount: attacks.length,
      averageAccuracy: average(accuracyValues),
      accuracyCount: accuracyValues.length,
      averageCooldown: average(cooldownValues),
      cooldownCount: cooldownValues.length,
      criticalAttackCount: criticalAttacks.length,
      averageCritChance: average(criticalAttacks
        .map((ability) => ability.critChance)
        .filter((value): value is number => Number.isFinite(value))),
      averageCritMultiplier: average(criticalAttacks
        .map((ability) => ability.critMultiplier)
        .filter((value): value is number => Number.isFinite(value))),
      averageCritBonus: average(criticalAttacks.map((ability) =>
        (ability.critChance ?? 0) / 100 * ((ability.critMultiplier ?? 1) - 1) * 100,
      )),
      vulnerabilities,
      hpTotal: activeCards.reduce((sum, card) => sum + card.hp, 0),
      hpAverage,
      catalogueHpAverage,
      hpDifference: hpAverage - catalogueHpAverage,
      hpPercentile,
      spamtonTotal,
      catalogueSpamtonAverage,
      spamtonDifference: activeCards.length
        ? spamtonTotal - catalogueSpamtonAverage * activeCards.length
        : 0,
      elementStats,
      resistanceGaps,
    };
  }, [catalogue, deckCards]);

  const compare = (difference: number, baseline: number) => {
    if (Math.abs(difference) < Math.max(1, baseline * 0.03)) return "even";
    return difference > 0 ? "above" : "below";
  };

  const hpComparison = compare(stats.hpDifference, stats.catalogueHpAverage);
  const spamtonComparison = compare(stats.spamtonDifference, stats.catalogueSpamtonAverage * stats.activeCards.length);
  const comparisonLabel = (comparison: "above" | "below" | "even") => t(
    comparison === "above"
      ? "builder.insight.above"
      : comparison === "below"
        ? "builder.insight.below"
        : "builder.insight.even",
  );
  const lowestResistance = stats.resistanceGaps[0];
  const highestResistance = stats.resistanceGaps[stats.resistanceGaps.length - 1];
  const resistanceScale = Math.max(1, ...stats.elementStats.map((item) => item.value));

  const recommendations: string[] = [];
  if (stats.activeCards.length < 4) recommendations.push(t("builder.insight.tipSlots", { count: 4 - stats.activeCards.length }));
  if (stats.hpDifference < -stats.catalogueHpAverage * 0.05) recommendations.push(t("builder.insight.tipHp"));
  if (stats.spamtonDifference < -stats.catalogueSpamtonAverage * Math.max(1, stats.activeCards.length) * 0.05) {
    recommendations.push(t("builder.insight.tipSpamton"));
  }
  if (lowestResistance && lowestResistance.difference < -2) {
    recommendations.push(t("builder.insight.tipResistance", { element: lowestResistance.name }));
  }
  if (!recommendations.length && stats.activeCards.length) recommendations.push(t("builder.insight.tipBalanced"));

  return (
    <section className="deck-insights" aria-labelledby="deck-insights-title">
      <header className="deck-insights-header">
        <div>
          <span className="eyebrow"><span /> {t("builder.insight.eyebrow")}</span>
          <h2 id="deck-insights-title">{t("builder.insight.title")}</h2>
          <p>{t("builder.insight.description")}</p>
        </div>
        <span className="deck-insights-note">{t("builder.insight.basis")}</span>
      </header>

      {!stats.activeCards.length ? (
        <div className="deck-insights-empty">{t("builder.insight.empty")}</div>
      ) : (
        <>
          <div className="deck-insight-metrics">
            <article className="deck-insight-metric">
              <span>{t("builder.insight.spamton")}</span>
              <strong>{numberFormat.format(stats.spamtonTotal)}</strong>
              <small>{t("builder.insight.perTurn")} · {comparisonLabel(spamtonComparison)}</small>
              <small>{t("builder.insight.vsExpected", { value: numberFormat.format(stats.catalogueSpamtonAverage * stats.activeCards.length) })}</small>
            </article>
            <article className="deck-insight-metric">
              <span>{t("builder.insight.averageHp")}</span>
              <strong>{numberFormat.format(stats.hpAverage)}</strong>
              <small>{t("builder.insight.vsGameAverage", { comparison: comparisonLabel(hpComparison), value: numberFormat.format(stats.catalogueHpAverage) })}</small>
              <small>{t("builder.insight.totalHp", { value: numberFormat.format(stats.hpTotal) })}</small>
              <small>{t("builder.insight.hpPercentile", { value: percentFormat.format(stats.hpPercentile) })}</small>
            </article>
          </div>

          <div className="deck-insight-extra-grid">
            <section className="deck-insight-block">
              <h3>{t("builder.insight.attackRhythm")}</h3>
              <p>{t("builder.insight.attackRhythmDescription")}</p>
              <div className="deck-insight-stat-pair">
                <div>
                  <span>{t("builder.insight.averageAccuracy")}</span>
                  <strong>{stats.accuracyCount ? `${numberFormat.format(stats.averageAccuracy)}%` : "—"}</strong>
                </div>
                <div>
                  <span>{t("builder.insight.averageCooldown")}</span>
                  <strong>{stats.cooldownCount ? numberFormat.format(stats.averageCooldown) : "—"}</strong>
                </div>
              </div>
              <small className="deck-insight-supporting">{t("builder.insight.attackDataCount", { count: stats.attackCount })}</small>
            </section>

            <section className="deck-insight-block">
              <h3>{t("builder.insight.criticalPotential")}</h3>
              <p>{t("builder.insight.criticalDescription")}</p>
              {stats.criticalAttackCount ? (
                <>
                  <div className="deck-insight-stat-pair">
                    <div>
                      <span>{t("builder.insight.averageCritChance")}</span>
                      <strong>{numberFormat.format(stats.averageCritChance)}%</strong>
                    </div>
                    <div>
                      <span>{t("builder.insight.averageCritMultiplier")}</span>
                      <strong>×{numberFormat.format(stats.averageCritMultiplier)}</strong>
                    </div>
                  </div>
                  <small className="deck-insight-supporting">
                    {t("builder.insight.averageCritBonus", { value: numberFormat.format(stats.averageCritBonus) })}
                  </small>
                </>
              ) : (
                <div className="deck-insight-no-data">{t("builder.insight.noCriticalData")}</div>
              )}
            </section>

            <section className="deck-insight-block deck-insight-vulnerabilities">
              <h3>{t("builder.insight.cardVulnerabilities")}</h3>
              <p>{t("builder.insight.vulnerabilityDescription")}</p>
              {stats.vulnerabilities.length ? (
                <ul>
                  {stats.vulnerabilities.map((entry) => (
                    <li key={`${entry.cardName}-${entry.element}`}>
                      <strong>{entry.cardName}</strong>
                      <span>{entry.element}</span>
                      <small>{numberFormat.format(entry.value)}% · {t("builder.insight.resistanceDelta", {
                        value: `${numberFormat.format(entry.difference)}`,
                      })}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="deck-insight-no-data">{t("builder.insight.noVulnerability")}</div>
              )}
            </section>
          </div>

          <div className="deck-insight-columns">
            <section className="deck-insight-block">
              <h3>{t("builder.insight.resistances")}</h3>
              <p>{t("builder.insight.resistanceDescription")}</p>
              <div className="deck-resistance-list">
                {stats.elementStats.map((element) => (
                  <div className="deck-resistance-row" key={element.id}>
                    <span>{element.name}</span>
                    <div className="deck-resistance-track" aria-hidden="true">
                      <i style={{ width: `${Math.min(100, (element.value / resistanceScale) * 100)}%` }} />
                    </div>
                    <strong className={element.difference < -2 ? "below" : element.difference > 2 ? "above" : ""}>
                      {numberFormat.format(element.value)}%
                    </strong>
                    <small>{t("builder.insight.resistanceDelta", { value: `${element.difference > 0 ? "+" : ""}${numberFormat.format(element.difference)}` })}</small>
                  </div>
                ))}
              </div>
              {lowestResistance && highestResistance && (
                <div className="deck-resistance-summary">
                  <span><i className="weakness-dot" />{t("builder.insight.weakest", { element: lowestResistance.name })}</span>
                  <span><i className="strength-dot" />{t("builder.insight.strongest", { element: highestResistance.name })}</span>
                </div>
              )}
            </section>

            <section className="deck-insight-block deck-insight-guidance">
              <h3>{t("builder.insight.guidance")}</h3>
              <ul>
                {recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
              </ul>
            </section>
          </div>
          <p className="deck-insights-footnote">{t("builder.insight.footnote")}</p>
        </>
      )}
    </section>
  );
}
