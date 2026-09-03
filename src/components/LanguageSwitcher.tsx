import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.substring(0, 2) || "fr";

  const toggle = () => {
    i18n.changeLanguage(current === "fr" ? "en" : "fr");
  };

  return (
    <button
      onClick={toggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "6px 10px", borderRadius: "99px",
        background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.1)",
        color: "var(--muted)", fontSize: "12px", fontWeight: 600,
        cursor: "pointer", transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(240,235,227,0.1)"; e.currentTarget.style.color = "var(--text)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(240,235,227,0.06)"; e.currentTarget.style.color = "var(--muted)"; }}
      title={current === "fr" ? "Switch to English" : "Passer en français"}
    >
      <Globe size={13} />
      {current === "fr" ? "EN" : "FR"}
    </button>
  );
}
