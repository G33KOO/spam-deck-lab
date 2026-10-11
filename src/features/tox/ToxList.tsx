import { useMemo, useState } from "react";
import type { CardCatalogue, CardData } from "../../types";
import { DataNotice, LoadingState, PageHeader, SearchIcon } from "../../components/ui";
import { RichText } from "../../components/RichText";
import { useTranslation } from "../../i18n/LanguageContext";
import { imageUrl } from "../../lib/cardAssets";

type ToxSort = "rarity" | "name" | "cards";

interface ToxEntry {
  id: string;
  name: string;
  effect: string;
  effectRich: string;
  rarity: string;
  element: string | null;
  icon?: string;
  cards: CardData[];
}

export function ToxList({
  catalogue,
  error,
  onSelectCard,
}: {
  catalogue: CardCatalogue | null;
  error: string;
  onSelectCard: (card: CardData) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("all");
  const [element, setElement] = useState("all");
  const [sort, setSort] = useState<ToxSort>("rarity");

  const entries = useMemo(() => {
    const map = new Map<string, ToxEntry>();
    for (const card of catalogue?.cards ?? []) {
      for (const skill of card.skills ?? []) {
        const entry = map.get(skill.id) ?? {
          id: skill.id,
          name: skill.name,
          effect: skill.effect,
          effectRich: skill.effectRich ?? skill.effect,
          rarity: skill.rarity ?? "common",
          element: skill.element ?? null,
          icon: skill.icon,
          cards: [],
        };
        if (!entry.cards.includes(card)) entry.cards.push(card);
        map.set(skill.id, entry);
      }
    }
    return [...map.values()];
  }, [catalogue]);

  const rarityOrder = useMemo(
    () => new Map((catalogue?.rarities ?? []).map((item) => [item.id, item.order])),
    [catalogue],
  );

  const query = search.trim().toLowerCase();
  const visible = entries
    .filter((entry) =>
      (rarity === "all" || entry.rarity === rarity) &&
      (element === "all" || entry.element === element) &&
      (!query ||
        entry.name.toLowerCase().includes(query) ||
        entry.effect.toLowerCase().includes(query) ||
        entry.cards.some((card) => card.name.toLowerCase().includes(query))),
    )
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "cards") return b.cards.length - a.cards.length || a.name.localeCompare(b.name);
      return (rarityOrder.get(a.rarity) ?? 0) - (rarityOrder.get(b.rarity) ?? 0) || a.name.localeCompare(b.name);
    });
  const hasFilters = Boolean(search || rarity !== "all" || element !== "all" || sort !== "rarity");

  function reset() {
    setSearch("");
    setRarity("all");
    setElement("all");
    setSort("rarity");
  }

  return (
    <>
      <PageHeader
        eyebrow={t("tox.eyebrow")}
        title={t("tox.title")}
        description={t("tox.description")}
      />
      <DataNotice error={error} />
      {!catalogue && !error ? <LoadingState /> : catalogue && (
        <>
          <div className="filter-panel">
            <label className="search-field">
              <SearchIcon />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("tox.searchPlaceholder")}
                aria-label={t("tox.searchLabel")}
              />
            </label>
            <label className="select-field">
              <span>{t("filter.element")}</span>
              <select value={element} onChange={(event) => setElement(event.target.value)}>
                <option value="all">{t("filter.allElements")}</option>
                {catalogue.elements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="select-field">
              <span>{t("filter.rarity")}</span>
              <select value={rarity} onChange={(event) => setRarity(event.target.value)}>
                <option value="all">{t("filter.allRarities")}</option>
                {catalogue.rarities
                  .filter((item) => entries.some((entry) => entry.rarity === item.id))
                  .map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="select-field sort-field">
              <span>{t("filter.sort")}</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as ToxSort)}>
                <option value="rarity">{t("filter.rarity")}</option>
                <option value="name">{t("filter.name")}</option>
                <option value="cards">{t("tox.sortCards")}</option>
              </select>
            </label>
          </div>
          <div className="results-line">
            <span><strong>{visible.length}</strong> {t("tox.resultsOf", { total: entries.length })}</span>
            {hasFilters && <button onClick={reset}>{t("filter.clear")} <span>×</span></button>}
            <span className="catalogue-version">{t("filter.dataset", { version: catalogue.version })} <i className="tiny-live" /></span>
          </div>
          {visible.length ? (
            <div className="tox-grid">
              {visible.map((entry) => {
                const rarityData = catalogue.rarities.find((item) => item.id === entry.rarity);
                const lineStyle = { backgroundImage: `url("${imageUrl(`img/frame/skill-line-${entry.rarity}.webp`)}")` };
                return (
                  <article key={entry.id} className={`tox-card tox-${entry.rarity}`}>
                    <div className="tox-icon">
                      {entry.icon && <img src={imageUrl(entry.icon)} alt="" loading="lazy" />}
                    </div>
                    <div className="tox-title">
                      <span className="tox-line tox-line-left" style={lineStyle} />
                      <h2>{entry.name}</h2>
                      <span className="tox-line tox-line-right" style={lineStyle} />
                    </div>
                    <span className="tox-rarity" style={rarityData?.textColor ? { color: rarityData.textColor } : undefined}>
                      {rarityData?.name ?? entry.rarity}
                    </span>
                    <p className="tox-effect">
                      <RichText text={entry.effectRich} catalogue={catalogue} />
                    </p>
                    <div className="tox-cards">
                      <strong>{t("tox.carriedBy", { count: entry.cards.length })}</strong>
                      <ul>
                        {entry.cards.map((card) => (
                          <li key={card.id}>
                            <button type="button" onClick={() => onSelectCard(card)}>
                              <img src={imageUrl(card.artwork.tiny)} alt="" loading="lazy" />
                              {card.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><span>⌕</span><h3>{t("tox.noResults")}</h3><p>{t("filter.tryDifferent")}</p></div>
          )}
        </>
      )}
    </>
  );
}
