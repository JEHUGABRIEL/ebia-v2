import { useApp } from "../context/AppContext";
import { LogOut, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props { open: boolean; onClose: () => void; }

export default function LogoutModal({ open, onClose }: Props) {
  const { logout } = useApp();
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
    }}>
      <div style={{
        width: "100%", maxWidth: "380px", borderRadius: "20px",
        background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden",
        animation: "fadeUp 0.2s ease both",
      }}>
        {/* Top accent line */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, var(--amber), var(--gold))" }} />

        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(232,96,26,0.12)", border: "1px solid rgba(232,96,26,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LogOut size={17} style={{ color: "var(--amber)" }} />
            </div>
            <div>
              <h2 className="bebas" style={{ fontSize: "22px", color: "var(--text)", letterSpacing: "0.05em", lineHeight: 1 }}>{t("logoutModal.title")}</h2>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>{t("logoutModal.subtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "background 0.15s, color 0.15s", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
          ><X size={15} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.65, marginBottom: "24px" }}>
            {t("logoutModal.description")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button onClick={() => { logout(); onClose(); }} style={{
              width: "100%", padding: "15px", borderRadius: "12px", border: "none", cursor: "pointer",
              background: "var(--amber)", color: "#fff",
              fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em",
              transition: "box-shadow 0.2s, transform 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,96,26,0.45)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >{t("logoutModal.logout")}</button>

            <button onClick={onClose} style={{
              width: "100%", padding: "14px", borderRadius: "12px", cursor: "pointer",
              background: "transparent", border: "1px solid rgba(240,235,227,0.1)", color: "var(--muted)",
              fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
              transition: "background 0.15s, color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.05)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.25)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.1)"; }}
            >{t("logoutModal.cancel")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
