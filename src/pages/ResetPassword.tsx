import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import EbiaLogo from "../components/EbiaLogo";
import { resetPassword } from "../lib/api";

function normalizeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/expired|expir/i.test(msg)) return "Ce lien a expiré. Demandez un nouveau lien de réinitialisation.";
  if (/invalid|invalide/i.test(msg)) return "Ce lien est invalide. Vérifiez l'URL dans votre email.";
  if (/network|fetch|connexion|ERR_/i.test(msg)) return "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
  if (/timeout|trop de temps/i.test(msg)) return "Le serveur met trop de temps à répondre. Réessayez.";
  return msg || "Une erreur est survenue. Réessayez.";
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const pwdValid = password.length >= 8;
  const pwdMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = pwdValid && pwdMatch && !!token;

  useEffect(() => {
    if (!token) setError("Aucun token de réinitialisation trouvé dans l'URL.");
  }, [token]);

  const handleSubmit = async () => {
    if (!token) { setError("Token manquant."); return; }
    if (!pwdValid) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    if (!pwdMatch) { setError("Les mots de passe ne correspondent pas."); return; }

    setLoading(true); setError("");
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (e: unknown) {
      setError(normalizeError(e));
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (success) return (
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
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)", marginBottom: "10px" }}>Mot de passe réinitialisé</h2>
            <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.6, maxWidth: "300px", margin: "0 auto" }}>
              Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
          </div>

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
            Se connecter <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Invalid token state ── */
  if (!token) return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <div style={{
        width: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "40px 28px",
      }}>
        <div style={{ width: "100%", maxWidth: "380px", textAlign: "center" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%", margin: "0 auto 20px",
            background: "rgba(220,50,50,0.08)", border: "2px solid rgba(220,50,50,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertCircle size={32} style={{ color: "#f08080" }} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "10px" }}>Lien invalide</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.6, marginBottom: "28px" }}>
            Ce lien de réinitialisation est invalide ou a expiré. Vérifiez l'URL dans votre email ou demandez un nouveau lien.
          </p>
          <button onClick={() => navigate("/forgot-password")} style={{
            width: "100%", padding: "15px 24px", borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg, var(--amber) 0%, #d97706 100%)",
            color: "#fff", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" as const,
            letterSpacing: "0.08em", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(232,96,26,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>Demander un nouveau lien</button>
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
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)", marginBottom: "6px", lineHeight: 1.2 }}>Nouveau mot de passe</h2>
            <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
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
            {/* New password */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: "7px" }}>
                Nouveau mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  autoFocus
                  style={{
                    width: "100%", padding: "14px 48px 14px 42px", borderRadius: "12px",
                    border: `1.5px solid ${password && !pwdValid ? "rgba(220,50,50,0.4)" : "rgba(240,235,227,0.08)"}`,
                    background: "rgba(240,235,227,0.04)", color: "var(--text)", fontSize: "14px",
                    outline: "none", boxSizing: "border-box" as const, transition: "all 0.25s ease",
                  }}
                  onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.background = "rgba(240,235,227,0.06)"; }}
                  onBlur={e => { e.target.style.borderColor = password && !pwdValid ? "rgba(220,50,50,0.4)" : "rgba(240,235,227,0.08)"; e.target.style.background = "rgba(240,235,227,0.04)"; }}
                />
                <button onClick={() => setShowPwd(p => !p)} style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px",
                  display: "flex", alignItems: "center", transition: "color 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                >{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              {password && !pwdValid && (
                <p style={{ fontSize: "11px", color: "#f08080", marginTop: "6px", paddingLeft: "4px" }}>
                  Minimum 8 caractères requis
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: "7px" }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showConfirmPwd ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="Retapez votre mot de passe"
                  style={{
                    width: "100%", padding: "14px 48px 14px 42px", borderRadius: "12px",
                    border: `1.5px solid ${confirmPassword && !pwdMatch ? "rgba(220,50,50,0.4)" : "rgba(240,235,227,0.08)"}`,
                    background: "rgba(240,235,227,0.04)", color: "var(--text)", fontSize: "14px",
                    outline: "none", boxSizing: "border-box" as const, transition: "all 0.25s ease",
                  }}
                  onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.background = "rgba(240,235,227,0.06)"; }}
                  onBlur={e => { e.target.style.borderColor = confirmPassword && !pwdMatch ? "rgba(220,50,50,0.4)" : "rgba(240,235,227,0.08)"; e.target.style.background = "rgba(240,235,227,0.04)"; }}
                />
                <button onClick={() => setShowConfirmPwd(p => !p)} style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px",
                  display: "flex", alignItems: "center", transition: "color 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                >{showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              {confirmPassword && !pwdMatch && (
                <p style={{ fontSize: "11px", color: "#f08080", marginTop: "6px", paddingLeft: "4px" }}>
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Password strength hint */}
            {password && (
              <div style={{
                padding: "10px 14px", borderRadius: "10px",
                background: pwdValid ? "rgba(34,197,94,0.06)" : "rgba(220,50,50,0.04)",
                border: `1px solid ${pwdValid ? "rgba(34,197,94,0.15)" : "rgba(220,50,50,0.1)"}`,
                display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s ease",
              }}>
                <ShieldCheck size={14} style={{ color: pwdValid ? "#22c55e" : "#f08080", flexShrink: 0 }} />
                <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>
                  {pwdValid ? "Mot de passe suffisamment sécurisé" : "Encore " + (8 - password.length) + " caractère" + (8 - password.length > 1 ? "s" : "") + " minimum"}
                </p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={!canSubmit || loading}
              style={{
                width: "100%", padding: "15px 24px", borderRadius: "12px", border: "none",
                cursor: canSubmit && !loading ? "pointer" : "not-allowed",
                background: !canSubmit || loading ? "rgba(232,96,26,0.3)" : "linear-gradient(135deg, var(--amber) 0%, #d97706 100%)",
                color: "#fff", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" as const,
                letterSpacing: "0.08em", opacity: !canSubmit && !loading ? 0.5 : 1,
                transition: "all 0.3s ease",
                boxShadow: !canSubmit || loading ? "none" : "0 4px 16px rgba(232,96,26,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                marginTop: "4px",
              }}
              onMouseEnter={e => { if (canSubmit && !loading) { e.currentTarget.style.boxShadow = "0 8px 32px rgba(232,96,26,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = !canSubmit || loading ? "none" : "0 4px 16px rgba(232,96,26,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Réinitialisation...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={14} /> Réinitialiser le mot de passe
                </span>
              )}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
