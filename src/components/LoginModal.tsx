import { useNavigate } from "react-router-dom";
import { Music2, X, ArrowRight, Mic2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useTranslation } from "react-i18next";

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!showLoginModal) return null;

  const go = (path: string) => { setShowLoginModal(false); navigate(path); };

  return (
    <div onClick={e => e.target === e.currentTarget && setShowLoginModal(false)}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
      <div style={{ width: "100%", maxWidth: "360px", borderRadius: "20px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "fadeUp 0.2s ease both" }}>
        <div style={{ height: "3px", background: "linear-gradient(90deg, var(--amber), var(--gold))" }} />

        <div style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Music2 size={20} color="white" />
            </div>
            <button onClick={() => setShowLoginModal(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}>
              <X size={18} />
            </button>
          </div>

          <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)", marginBottom: "6px", letterSpacing: "0.05em" }}>
            {t("loginModal.title")}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "24px", lineHeight: 1.6 }}>
            {t("loginModal.description")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => go("/login")} style={{
              width: "100%", padding: "14px", borderRadius: "11px", border: "none",
              background: "var(--amber)", color: "#fff", fontSize: "12px", fontWeight: 800,
              cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,96,26,0.45)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
            >
              {t("loginModal.login")} <ArrowRight size={14} />
            </button>

            <button onClick={() => go("/login?tab=register&role=listener")} style={{
              width: "100%", padding: "13px", borderRadius: "11px",
              background: "transparent", border: "1px solid rgba(240,235,227,0.15)",
              color: "var(--text)", fontSize: "12px", fontWeight: 700,
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              {t("loginModal.registerListener")}
            </button>

            <button onClick={() => go("/login?tab=register&role=artist")} style={{
              width: "100%", padding: "13px", borderRadius: "11px",
              background: "transparent", border: "1px solid rgba(232,96,26,0.25)",
              color: "var(--amber)", fontSize: "12px", fontWeight: 700,
              cursor: "pointer", transition: "background 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.08)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <Mic2 size={13} /> {t("loginModal.registerArtist")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
