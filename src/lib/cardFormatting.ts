export function formatUpdateDate(value: string, locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function styleLabel(styleId: string, locale = "en"): string {
  const label = styleId
    .replace(/^cardstyle-/, "")
    .replace(/alternativeart/gi, "alternative art")
    .replace(/fullart/gi, "full art")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  if (locale !== "fr") return label;
  return label
    .replace(/\bAlternative Art\b/g, "Art alternatif")
    .replace(/\bFull Art\b/g, "Illustration complète")
    .replace(/\bElementary\b/g, "Élémentaire");
}
