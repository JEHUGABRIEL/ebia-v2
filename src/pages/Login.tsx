import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Eye, EyeOff, Music2, ArrowLeft } from "lucide-react";
import keycloak from "../lib/keycloak";

export default function Login() {
  const { user, authReady } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"listener" | "artist">("listener");

  useEffect(() => {
    if (authReady && user) navigate(user.role === "artist" || user.role === "admin" ? "/artist-dashboard" : "/me");
  }, [authReady, user]);

  const handleLogin = async () => {
    if (!email || !password) { setError("Remplissez tous les champs"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost/api/v1/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Email ou mot de passe incorrect"); return; }
      keycloak.login({ loginHint: email, redirectUri: window.location.origin + "/me" });
    } catch { setError("Erreur réseau. Réessayez."); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password || !firstName) { setError("Remplissez tous les champs"); return; }
    if (password.length < 8) { setError("Minimum 8 caractères"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost/api/v1/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName, role }),
      });
      const data = await res.json();
      if (res.status === 409) { setError("Email déjà utilisé."); return; }
      if (!res.ok) { setError(data.error || "Erreur création compte."); return; }
      keycloak.login({ loginHint: email, redirectUri: window.location.origin + (role === "artist" ? "/artist-dashboard" : "/me") });
    } catch { setError("Erreur réseau. Réessayez."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D0D0D" }}>

      {/* ── GAUCHE : Branding ── */}
      <div style={{
        flex: 1, display: "none", flexDirection: "column", justifyContent: "space-between",
        padding: "48px", background: "linear-gradient(135deg, #1a0800 0%, #0D0D0D 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden"
      }} className="md:flex">
        {/* Blobs */}
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.25), transparent)", top: "-100px", left: "-100px" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,190,0.2), transparent)", bottom: "100px", right: "-50px" }} />

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1, textDecoration: "none" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #FF6B35, #FFD700)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Music2 size={22} color="#000" />
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#fff", letterSpacing: 2 }}>E-BIA</span>
        </Link>

        {/* Texte central */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
            La pulsation<br />
            <span style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              musicale
            </span><br />
            de la RCA
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.7, maxWidth: 340 }}>
            Découvrez, écoutez et soutenez les artistes centrafricains qui définissent la musique de demain.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 32, position: "relative", zIndex: 1 }}>
          {[["19", "Artistes"], ["54", "Titres"], ["100%", "Gratuit"]].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#FF6B35" }}>{v}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DROITE : Formulaire ── */}
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 48px", overflowY: "auto" }}
        className="md:w-[520px]">

        {/* Retour mobile */}
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", marginBottom: 40 }}
          className="md:hidden">
          <ArrowLeft size={14} /> Retour
        </Link>

        {/* Logo mobile */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }} className="md:hidden">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #FF6B35, #FFD700)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Music2 size={18} color="#000" />
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "#fff" }}>E-BIA</span>
        </div>

        {/* Titre */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            {isLogin ? "Bon retour 👋" : "Créer un compte"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            {isLogin ? "Connectez-vous pour accéder à E-Bia" : "Rejoignez des milliers d'auditeurs centrafricains"}
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {["Connexion", "Inscription"].map((label, i) => (
            <button key={label} onClick={() => { setIsLogin(i === 0); setError(""); }}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 1,
                background: (i === 0) === isLogin ? "linear-gradient(135deg, #FF6B35, #FFD700)" : "transparent",
                color: (i === 0) === isLogin ? "#000" : "rgba(255,255,255,0.4)",
                transition: "all 0.2s",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)", color: "#ff6b6b", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Rôle (inscription) */}
          {!isLogin && (
            <>
              <div style={{ display: "flex", gap: 10 }}>
                {(["listener", "artist"] as const).map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    style={{
                      flex: 1, padding: "14px 0", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700,
                      border: `2px solid ${role === r ? (r === "artist" ? "#FF6B35" : "#00D46A") : "rgba(255,255,255,0.1)"}`,
                      background: role === r ? (r === "artist" ? "rgba(255,107,53,0.12)" : "rgba(0,212,106,0.1)") : "transparent",
                      color: role === r ? (r === "artist" ? "#FF6B35" : "#00D46A") : "rgba(255,255,255,0.4)",
                      transition: "all 0.2s",
                    }}>
                    {r === "listener" ? "🎧 Auditeur" : "🎤 Artiste"}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { val: firstName, set: setFirstName, ph: "Prénom" },
                  { val: lastName, set: setLastName, ph: "Nom" },
                ].map(({ val, set, ph }) => (
                  <input key={ph} type="text" value={val} onChange={e => set(e.target.value)}
                    placeholder={ph}
                    style={{ width: "100%", padding: "16px 18px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                    onFocus={e => e.target.style.borderColor = "#FF6B35"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
                ))}
              </div>
            </>
          )}

          {/* Email */}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Adresse email" autoComplete="email"
            style={{ padding: "18px 20px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 15, outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#FF6B35"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />

          {/* Mot de passe */}
          <div style={{ position: "relative" }}>
            <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (isLogin ? handleLogin() : handleRegister())}
              placeholder={isLogin ? "Mot de passe" : "Mot de passe (min. 8 caractères)"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={{ width: "100%", padding: "18px 56px 18px 20px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#FF6B35"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            <button onClick={() => setShowPwd(p => !p)}
              style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Bouton principal */}
          <button onClick={isLogin ? handleLogin : handleRegister} disabled={loading}
            style={{
              marginTop: 4, padding: "20px", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "rgba(255,107,53,0.4)" : "linear-gradient(135deg, #FF6B35, #FFD700)",
              color: "#000", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2,
              transition: "all 0.2s", opacity: loading ? 0.7 : 1,
            }}>
            {loading ? "Chargement..." : isLogin ? "Se connecter →" : `Créer mon compte →`}
          </button>

          {/* Switch */}
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "8px 0 0" }}>
            {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6B35", fontWeight: 700, fontSize: 13 }}>
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "8px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          <Link to="/"
            style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13, textDecoration: "none" }}>
            Continuer sans compte →
          </Link>
        </div>
      </div>
    </div>
  );
}
