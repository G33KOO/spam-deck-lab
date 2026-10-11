export function formatUpdateDate(value: string, locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function styleLabel(styleId: string): string {
  return styleId
    .replace(/^cardstyle-/, "")
    .replace(/alternativeart/gi, "alternative art")
    .replace(/fullart/gi, "full art")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
