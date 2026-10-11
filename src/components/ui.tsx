import type { ReactNode } from "react";
import { useTranslation } from "../i18n/LanguageContext";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow"><span />{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <button className="primary-button" onClick={action.onClick}>{action.label} <span>↗</span></button>}
    </div>
  );
}

export function DataNotice({ error }: { error: string }) {
  const { t } = useTranslation();
  if (error) {
    const requestFailure = error.match(/^(Catalogue index|Card data) request failed \((\d+)\)\.$/);
    let summary = t("ui.loadFailed");
    if (requestFailure) {
      summary = t("ui.requestFailed", {
        resource: t(requestFailure[1] === "Catalogue index" ? "ui.catalogueIndex" : "ui.cardData"),
        status: requestFailure[2],
      });
    } else if (error === "The card data source returned an incomplete catalogue.") {
      summary = t("ui.invalidCatalogue");
    }
    return (
      <div className="notice error-notice" role="alert">
        <strong>{t("ui.dataUnavailable")}</strong> {summary} {t("ui.retryData")}
        <details>
          <summary>{t("ui.technicalDetails")}</summary>
          <code>{error}</code>
        </details>
      </div>
    );
  }
  return null;
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-item">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function DetailGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="detail-group">
      <div className="detail-group-title"><span>{title}</span><small>{String(count).padStart(2, "0")}</small></div>
      {children}
    </section>
  );
}

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <div className="loading-state" role="status">
      <span className="loading-spinner" />
      <strong>{t("ui.loadingTitle")}</strong>
      <p>{t("ui.loadingText")}</p>
    </div>
  );
}

export function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.7" cy="8.7" r="5.8" />
      <path d="m13 13 4.2 4.2" />
    </svg>
  );
}
