import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { CardCatalogue } from "../types";
import { imageUrl } from "../lib/cardAssets";

const TOKEN = /\{(kw|el):([^}]+)\}([\s\S]*?)\{\/\1\}|\{icon:([^}]+)\}/g;

interface KeywordTip {
  id: string;
  left: number;
  top: number;
}

export function RichText({
  text,
  catalogue,
  plain = false,
}: {
  text: string;
  catalogue: CardCatalogue;
  plain?: boolean;
}) {
  const [tip, setTip] = useState<KeywordTip | null>(null);
  const keyword = tip ? catalogue.keywords?.find((item) => item.id === tip.id) : undefined;
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const [, type, id, inner, iconId] = match;
    if (iconId) {
      nodes.push(<img key={key++} className="rich-icon" src={imageUrl(`img/elements/${iconId}.webp`)} alt="" />);
    } else if (type === "el") {
      const color = catalogue.elements.find((item) => item.id === id)?.color;
      nodes.push(<span key={key++} style={color ? { color } : undefined}>{inner}</span>);
    } else {
      const item = catalogue.keywords?.find((entry) => entry.id === id);
      if (!item || plain) {
        nodes.push(<span key={key++}>{inner}</span>);
      } else {
        nodes.push(
          <span
            key={key++}
            className="rich-keyword"
            tabIndex={0}
            style={item.decoration?.color ? { color: item.decoration.color } : undefined}
            onMouseEnter={(event) => showTip(event.currentTarget, id)}
            onFocus={(event) => showTip(event.currentTarget, id)}
            onMouseLeave={() => setTip(null)}
            onBlur={() => setTip(null)}
          >
            {inner}
          </span>,
        );
      }
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));

  function showTip(element: HTMLElement, id: string) {
    const rect = element.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 12);
    const above = rect.bottom + 150 > window.innerHeight;
    setTip({ id, left, top: above ? Math.max(12, rect.top - 140) : rect.bottom + 8 });
  }

  return (
    <>
      {nodes}
      {keyword && tip && createPortal(
        <div
          className="game-card-interaction-tooltip rich-keyword-tooltip"
          role="tooltip"
          style={{ left: tip.left, top: tip.top, borderColor: keyword.decoration?.color }}
        >
          <strong style={keyword.decoration?.color ? { color: keyword.decoration.color } : undefined}>
            {keyword.title}
          </strong>
          <span>
            <RichText text={keyword.descriptionRich ?? keyword.description} catalogue={catalogue} plain />
          </span>
        </div>,
        document.body,
      )}
    </>
  );
}
