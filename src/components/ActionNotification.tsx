import { useEffect, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";

export function ActionNotification({
  message,
  error = false,
  revision,
}: {
  message: string;
  error?: boolean;
  revision: number;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 10_000);
    return () => window.clearTimeout(timer);
  }, [message, revision]);

  if (!visible || !message) return null;
  return (
    <div
      className={`action-notification${error ? " error" : ""}`}
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
    >
      <span className="action-notification-icon" aria-hidden="true">{error ? "!" : "✓"}</span>
      <span>{message}</span>
      <button
        type="button"
        aria-label={t("ui.dismissNotification")}
        onClick={() => setVisible(false)}
      >
        ×
      </button>
    </div>
  );
}
