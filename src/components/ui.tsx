import type { ReactNode } from "react";

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
  if (error) {
    return (
      <div className="notice error-notice" role="alert">
        <strong>Card data is unavailable.</strong> {error} Check your connection or refresh to try again.
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
  return (
    <div className="loading-state" role="status">
      <span className="loading-spinner" />
      <strong>Syncing the SpamDex</strong>
      <p>Fetching the latest official card data...</p>
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
