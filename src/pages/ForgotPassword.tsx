import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Send } from "lucide-react";
import EbiaLogo from "../components/EbiaLogo";
import { forgotPassword } from "../lib/api";

function normalizeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/network|fetch|connexion|ERR_/i.test(msg))
    return "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
  if (/timeout|trop de temps/i.test(msg))
    return "Le serveur met trop de temps à répondre. Réessayez.";
  return msg || "Une erreur est survenue. Réessayez.";
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) { setError("Veuillez renseigner votre adresse email."); return; }
    setLoading(true); setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (e: unknown) {
      setError(normalizeError(e));
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (sent) return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <div style={{
        width: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "40px 28px",
      }}>
        <div style={{ width: "100%", maxWidth: "380px", animation: "fadeIn 0.4s ease" }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, var(--amber), #d97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(232,96,26,0.3)" }}>
              <EbiaLogo size={24} />
            </div>
            <span className="bebas" style={{ fontSize: "20px", color: "var(--text)", letterSpacing: "0.12em" }}>E-BIA</span>
          </div>

          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%", margin: "0 auto 20px",
              background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle size={32} style={{ color: "#22c55e" }} />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)", marginBottom: "10px" }}>Email envoyé</h2>
            <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.6, maxWidth: "300px", margin: "0 auto" }}>
              Si un compte existe avec l'adresse <strong style={{ color: "var(--text)" }}>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          <div style={{
            padding: "14px 16px", borderRadius: "12px", marginBottom: "28px",
            background: "rgba(240,235,227,0.04)", border: "1px solid rgba(240,235,227,0.08)",
          }}>
            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text)" }}>Astuce :</strong> Vérifiez aussi vos courriers indésirables (spam). Le lien expire dans 24 heures.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => navigate("/login")} style={{
              width: "100%", padding: "15px 24px", borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg, var(--amber) 0%, #d97706 100%)",
              color: "#fff", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" as const,
              letterSpacing: "0.08em", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(232,96,26,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "all 0.3s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(232,96,26,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,96,26,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Retour à la connexion <ArrowRight size={14} />
            </button>
            <button onClick={() => { setSent(false); setEmail(""); }} style={{
              width: "100%", padding: "14px", borderRadius: "12px",
              border: "1.5px solid rgba(240,235,227,0.08)", background: "transparent",
              color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(240,235,227,0.2)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(240,235,227,0.08)"; e.currentTarget.style.color = "var(--muted)"; }}
            >Renvoyer un autre email</button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Form state ── */
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <div style={{
        width: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "40px 28px",
      }}>
        <div style={{ width: "100%", maxWidth: "380px", animation: "fadeIn 0.3s ease" }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          <button onClick={() => navigate("/login")} style={{
            display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--muted)",
            fontSize: "13px", background: "none", border: "none", cursor: "pointer", padding: "4px 0",
            marginBottom: "32px", transition: "color 0.15s", fontWeight: 500,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
          ><ArrowLeft size={14} /> Retour à la connexion</button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, var(--amber), #d97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(232,96,26,0.3)" }}>
              <EbiaLogo size={24} />
            </div>
            <span className="bebas" style={{ fontSize: "20px", color: "var(--text)", letterSpacing: "0.12em" }}>E-BIA</span>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)", marginBottom: "6px", lineHeight: 1.2 }}>Mot de passe oublié</h2>
            <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: "16px", padding: "12px 16px", borderRadius: "10px",
              background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)",
              color: "#f08080", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                <Mail size={16} />
              </div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Adresse email"
                autoFocus
                style={{
                  width: "100%", padding: "14px 16px 14px 42px", borderRadius: "12px",
                  border: "1.5px solid rgba(240,235,227,0.08)", background: "rgba(240,235,227,0.04)",
                  color: "var(--text)", fontSize: "14px", outline: "none",
                  boxSizing: "border-box" as const, transition: "all 0.25s ease",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.background = "rgba(240,235,227,0.06)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(240,235,227,0.08)"; e.target.style.background = "rgba(240,235,227,0.04)"; }}
              />
            </div>

            <button onClick={handleSubmit} disabled={loading || !email}
              style={{
                width: "100%", padding: "15px 24px", borderRadius: "12px", border: "none",
                cursor: loading || !email ? "not-allowed" : "pointer",
                background: loading || !email ? "rgba(232,96,26,0.3)" : "linear-gradient(135deg, var(--amber) 0%, #d97706 100%)",
                color: "#fff", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" as const,
                letterSpacing: "0.08em", opacity: !email && !loading ? 0.5 : 1,
                transition: "all 0.3s ease",
                boxShadow: loading || !email ? "none" : "0 4px 16px rgba(232,96,26,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
              onMouseEnter={e => { if (!loading && email) { e.currentTarget.style.boxShadow = "0 8px 32px rgba(232,96,26,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = loading || !email ? "none" : "0 4px 16px rgba(232,96,26,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Envoi en cours...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Send size={14} /> Envoyer le lien
                </span>
              )}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              Vous vous souvenez de votre mot de passe ?{" "}
              <button onClick={() => navigate("/login")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--amber)", fontWeight: 700, fontSize: "13px", transition: "opacity 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >Se connecter</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
