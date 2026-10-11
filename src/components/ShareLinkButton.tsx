import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { buildDeckShareUrl } from "../lib/deckShare";
import type { ShareSlot } from "../lib/deckShare";

export function ShareLinkButton({
  slots,
  name,
  disabled = false,
}: {
  slots: ShareSlot[];
  name?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copyLink() {
    let next: "copied" | "failed" = "copied";
    try {
      await navigator.clipboard.writeText(buildDeckShareUrl(slots, name));
    } catch {
      next = "failed";
    }
    setStatus(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 2500);
  }

  const label = t(status === "copied" ? "share.copied" : status === "failed" ? "share.failed" : "share.copyLink");

  return (
    <button
      type="button"
      className={`share-link-button ${status}`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={() => void copyLink()}
    >
      {status === "copied" ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
          <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
        </svg>
      )}
      <span className="sr-only" role="status">{status === "idle" ? "" : label}</span>
    </button>
  );
}
