import type { CardCatalogue, CardData, AppView } from "../../types";
import { CardTile } from "../../components/cards/CardTile";
import { DataNotice, LoadingState, PageHeader } from "../../components/ui";
import { useTranslation } from "../../i18n/LanguageContext";

export function StrategyTips({
  catalogue,
  error,
  elementName,
  onNavigate,
  onSelectCard,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  elementName: (id: string) => string;
  onNavigate: (view: AppView) => void;
  onSelectCard: (card: CardData) => void;
}) {
  const { t } = useTranslation();
  const melody = catalogue?.cards.find((card) => card.slug === "melodie_des_divinites");

  return (
    <>
      <PageHeader
        eyebrow={t("tips.eyebrow")}
        title={t("tips.title")}
        description={t("tips.description")}
        action={{ label: t("tips.browseCards"), onClick: () => onNavigate("cards") }}
      />
      <DataNotice error={error} />
      {!catalogue && !error ? <LoadingState /> : catalogue && (
        <section className="strategy-tip-list" aria-label={t("tips.title")}>
          <article className="strategy-tip">
            <div className="strategy-tip-copy">
              <div className="eyebrow"><span />{t("tips.damage.category")}</div>
              <h2>{t("tips.damage.title")}</h2>
              <p>{t("tips.damage.text")}</p>
              <div className="strategy-tip-principle">
                <strong>{t("tips.damage.takeawayLabel")}</strong>
                <span>{t("tips.damage.takeaway")}</span>
              </div>
            </div>
            {melody && (
              <div className="strategy-tip-card">
                <CardTile
                  card={melody}
                  elementLabel={elementName(melody.element)}
                  onSelect={() => onSelectCard(melody)}
                  hideAdd
                />
              </div>
            )}
          </article>
          <article className="strategy-tip strategy-tip-single">
            <div className="tip-icon" aria-hidden="true">✳</div>
            <div className="strategy-tip-copy">
              <div className="eyebrow"><span />{t("tips.survival.category")}</div>
              <h2>{t("tips.survival.title")}</h2>
              <p>{t("tips.survival.text")}</p>
            </div>
          </article>
        </section>
      )}
    </>
  );
}
