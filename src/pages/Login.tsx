import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Eye, EyeOff, Music2, ArrowLeft, Check, Upload, AlertCircle } from "lucide-react";
import { registerListener, registerArtist, getArtists, type Artist } from "../lib/api";

/* ── Données onboarding auditeur ── */
const GENRES = [
  { id: "afro-pop", label: "Afro-Pop", emoji: "🎵" },
  { id: "hiphop", label: "Hip-Hop", emoji: "🎤" },
  { id: "afro-folk", label: "Afro-Folk", emoji: "🪘" },
  { id: "afro-trap", label: "Afro-Trap", emoji: "🔥" },
  { id: "jazz", label: "Jazz", emoji: "🎷" },
  { id: "gospel", label: "Gospel", emoji: "✝️" },
  { id: "soukous", label: "Soukous", emoji: "💃" },
  { id: "traditionnel", label: "Traditionnel", emoji: "🌍" },
  { id: "rnb", label: "R&B", emoji: "🎶" },
  { id: "soul", label: "Soul", emoji: "🎼" },
  { id: "afrobeat", label: "Afro-Beat", emoji: "🥁" },
  { id: "ndombolo", label: "Ndombolo", emoji: "🕺" },
];

const ARTIST_GENRES = [
  "Afro-Pop", "Afro-Folk", "Hip-Hop", "Afro-Trap",
  "Jazz / Blues", "Gospel", "Soukous", "R&B", "Traditionnel", "Soul", "Afro-Beat",
];

/* ── Carousel ── */
const SLIDES = [
  { img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=1200&fit=crop", tag: "Scène centrafricaine", title: "La musique de chez nous,\npour le monde entier.", sub: "Découvrez les artistes qui font vibrer la RCA" },
  { img: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=900&h=1200&fit=crop", tag: "Artiste en vedette", title: "Idylle Mamba", sub: "Ambassadrice de la musique centrafricaine" },
  { img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&h=1200&fit=crop", tag: "E-Bia Platform", title: "19 artistes. 54 titres.\n100% gratuit.", sub: "La première plateforme dédiée à la RCA" },
  { img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&h=1200&fit=crop", tag: "Live & Concerts", title: "Vivez la musique\ncentrafricaine en direct.", sub: "Concerts, événements et sessions exclusives" },
];

function Carousel() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [anim, setAnim] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setPrev(cur); setAnim(true);
      setTimeout(() => { setCur(c => (c + 1) % SLIDES.length); setPrev(null); setAnim(false); }, 600);
    }, 5000);
    return () => clearInterval(t);
  }, [cur]);
  const goTo = (i: number) => {
    if (i === cur || anim) return;
    setPrev(cur); setAnim(true);
    setTimeout(() => { setCur(i); setPrev(null); setAnim(false); }, 600);
  };
  return (
    <div style={{ width: "50%", flexShrink: 0, position: "relative", overflow: "hidden", background: "#050505" }} className="hidden md:block">
      {SLIDES.map((s, i) => {
        const isA = i === cur, isP = i === prev;
        let tx = "translateX(100%)";
        if (isA) tx = "translateX(0)";
        if (isP && anim) tx = "translateX(-100%)";
        if (!isA && !isP) tx = "translateX(100%)";
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transform: tx, transition: (isA || isP) ? "transform 0.65s cubic-bezier(0.77,0,0.18,1)" : "none", zIndex: isA ? 2 : isP ? 1 : 0 }}>
            <img src={s.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.3) 60%, rgba(5,5,5,0.15) 100%)" }} />
            <div style={{ position: "absolute", bottom: "56px", left: "48px", right: "48px", zIndex: 3 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "99px", marginBottom: "14px", background: "rgba(232,96,26,0.2)", border: "1px solid rgba(232,96,26,0.4)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--amber)" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />{s.tag}
              </div>
              <h2 className="bebas" style={{ fontSize: "34px", color: "#fff", lineHeight: 1.1, marginBottom: "10px", whiteSpace: "pre-line" }}>{s.title}</h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{s.sub}</p>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", bottom: "22px", right: "48px", display: "flex", gap: "6px", zIndex: 10 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === cur ? "22px" : "6px", height: "6px", borderRadius: "99px", background: i === cur ? "var(--amber)" : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s" }} />
        ))}
      </div>
      <span className="bebas" style={{ position: "absolute", top: "28px", right: "32px", zIndex: 10, fontSize: "12px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>E-BIA</span>
    </div>
  );
}

const StepBar = ({ current, total }: { current: number; total: number }) => (
  <div style={{ marginBottom: "24px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--amber)", textTransform: "uppercase" }}>Étape {current} sur {total}</span>
      <span style={{ fontSize: "10px", color: "var(--muted)" }}>{Math.round((current / total) * 100)}%</span>
    </div>
    <div style={{ height: "3px", background: "rgba(240,235,227,0.07)", borderRadius: "99px" }}>
      <div style={{ height: "100%", width: `${(current / total) * 100}%`, background: "var(--amber)", borderRadius: "99px", transition: "width 0.4s ease" }} />
    </div>
  </div>
);

export default function Login() {
  const { user, authReady, loginWithCredentials } = useApp();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"listener" | "artist">("listener");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  /* Form commun */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  /* Artiste */
  const [stageName, setStageName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idType, setIdType] = useState<"cni" | "passport">("cni");
  const [idNumber, setIdNumber] = useState("");
  const [artistGenre, setArtistGenre] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);

  /* Auditeur */
  const [selGenres, setSelGenres] = useState<string[]>([]);
  const [selArtists, setSelArtists] = useState<string[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    if (authReady && user) navigate(user.role === "artist" || user.role === "admin" ? "/artist-dashboard" : "/me");
  }, [authReady, user]);

  /* Charger artistes pour l'onboarding auditeur */
  useEffect(() => {
    if (!isLogin && role === "listener" && step === 3) {
      getArtists().then(r => setArtists(r.data)).catch(() => {});
    }
  }, [isLogin, role, step]);

  const TOTAL_STEPS = role === "listener" ? 3 : 3;

  /* Validations par étape */
  const canNext1 = email && password.length >= 8 && firstName;
  const canNext2Artist = stageName && birthDate && idNumber && artistGenre && city;
  const canFinishListener = selArtists.length >= 1;

  /* Soumission */
  const handleLogin = async () => {
    if (!email || !password) { setError("Remplissez tous les champs"); return; }
    setLoading(true); setError("");
    try {
      await loginWithCredentials(email, password);
      // Redirection directe sans passer par Keycloak UI
      const token = sessionStorage.getItem("ebia_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const roles: string[] = payload.realm_access?.roles ?? [];
        navigate(roles.includes("artist") || roles.includes("admin") ? "/artist-dashboard" : "/me");
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur réseau."); }
    finally { setLoading(false); }
  };

  const handleRegisterListener = async () => {
    setLoading(true); setError("");
    try {
      await registerListener({ email, password, firstName, lastName, genres: selGenres, favoriteArtistIds: selArtists });
      // Login automatique après inscription
      await loginWithCredentials(email, password);
      navigate("/me");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur création compte."); }
    finally { setLoading(false); }
  };

  const handleRegisterArtist = async () => {
    setLoading(true); setError("");
    try {
      await registerArtist({ email, password, firstName, lastName, stageName, birthDate, idType, idNumber, genre: artistGenre, city, bio, phone });
      await loginWithCredentials(email, password);
      navigate("/artist-dashboard");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur création compte."); }
    finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: "10px",
    border: "1.5px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)",
    color: "var(--text)", fontSize: "14px", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };
  const focusAmber = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "var(--amber)");
  const blurDefault = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "rgba(240,235,227,0.1)");

  const SelBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} style={{
      flex: 1, padding: "12px 0", borderRadius: "9px", cursor: "pointer", fontSize: "13px", fontWeight: 700,
      border: `1.5px solid ${active ? "var(--amber)" : "rgba(240,235,227,0.1)"}`,
      background: active ? "rgba(232,96,26,0.1)" : "transparent",
      color: active ? "var(--amber)" : "var(--muted)", transition: "all 0.2s",
    }}>{children}</button>
  );

  const NextBtn = ({ onClick, disabled, label = "Suivant →" }: { onClick: () => void; disabled?: boolean; label?: string }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "15px", borderRadius: "11px", border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "rgba(232,96,26,0.3)" : "var(--amber)",
      color: "#fff", fontSize: "12px", fontWeight: 800, textTransform: "uppercase",
      letterSpacing: "0.1em", opacity: disabled ? 0.6 : 1, transition: "box-shadow 0.2s",
    }}
    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,96,26,0.45)"; }}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >{label}</button>
  );

  const BackBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "13px", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "28px", transition: "color 0.15s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}
    ><ArrowLeft size={13} /> Retour</button>
  );

  /* ── CONTENU ── */
  const renderContent = () => {

    /* ───── LOGIN ───── */
    if (isLogin) return (
      <>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "13px", textDecoration: "none", marginBottom: "32px" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
          <ArrowLeft size={13} /> Retour
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Music2 size={17} color="#fff" />
          </div>
          <span className="bebas" style={{ fontSize: "19px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginBottom: "5px" }}>Bon retour 👋</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Connectez-vous pour accéder à E-Bia</p>
        </div>

        <div style={{ display: "flex", background: "rgba(240,235,227,0.05)", borderRadius: "11px", padding: "4px", marginBottom: "22px", border: "1px solid rgba(240,235,227,0.07)" }}>
          {["Connexion", "Inscription"].map((l, i) => (
            <button key={l} onClick={() => { setIsLogin(i === 0); setError(""); setStep(1); }} style={{ flex: 1, padding: "10px 0", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", background: (i === 0) === isLogin ? "var(--amber)" : "transparent", color: (i === 0) === isLogin ? "#fff" : "var(--muted)", transition: "all 0.2s" }}>{l}</button>
          ))}
        </div>

        {error && <div style={{ marginBottom: "14px", padding: "11px 14px", borderRadius: "9px", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontSize: "12px" }}>⚠️ {error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Adresse email" autoComplete="email" style={inp} onFocus={focusAmber} onBlur={blurDefault} />
          <div style={{ position: "relative" }}>
            <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Mot de passe" autoComplete="current-password"
              style={{ ...inp, paddingRight: "50px" }} onFocus={focusAmber} onBlur={blurDefault} />
            <button onClick={() => setShowPwd(p => !p)} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <NextBtn onClick={handleLogin} disabled={loading} label={loading ? "Connexion..." : "Se connecter →"} />
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
            Pas encore de compte ?{" "}
            <button onClick={() => { setIsLogin(false); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--amber)", fontWeight: 700, fontSize: "12px" }}>S'inscrire</button>
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(240,235,227,0.07)" }} />
            <span style={{ color: "var(--muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em" }}>ou</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(240,235,227,0.07)" }} />
          </div>
          <Link to="/" style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", textDecoration: "none" }}>Continuer sans compte →</Link>
        </div>
      </>
    );

    /* ───── INSCRIPTION — ÉTAPE 1 (commun) ───── */
    if (step === 1) return (
      <>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "13px", textDecoration: "none", marginBottom: "28px" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
          <ArrowLeft size={13} /> Retour
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Music2 size={17} color="#fff" />
          </div>
          <span className="bebas" style={{ fontSize: "19px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
        </div>

        <StepBar current={1} total={TOTAL_STEPS} />
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "5px" }}>Créer un compte</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Je rejoins E-Bia en tant que</p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <SelBtn active={role === "listener"} onClick={() => setRole("listener")}>🎧 Auditeur</SelBtn>
          <SelBtn active={role === "artist"} onClick={() => setRole("artist")}>🎤 Artiste</SelBtn>
        </div>

        {role === "artist" && (
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(232,96,26,0.06)", border: "1px solid rgba(232,96,26,0.2)", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "rgba(240,235,227,0.6)", lineHeight: 1.6 }}>
              En tant qu'artiste, vous aurez accès à un espace de publication et à des statistiques détaillées. <strong style={{ color: "var(--amber)" }}>5 titres offerts</strong> à la création.
            </p>
          </div>
        )}

        {error && <div style={{ marginBottom: "14px", padding: "11px 14px", borderRadius: "9px", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontSize: "12px" }}>⚠️ {error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
            {[{ val: firstName, set: setFirstName, ph: "Prénom *" }, { val: lastName, set: setLastName, ph: "Nom" }].map(({ val, set, ph }) => (
              <input key={ph} type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inp} onFocus={focusAmber} onBlur={blurDefault} />
            ))}
          </div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Adresse email *" autoComplete="email" style={inp} onFocus={focusAmber} onBlur={blurDefault} />
          <div style={{ position: "relative" }}>
            <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe (min. 8 caractères) *" autoComplete="new-password"
              style={{ ...inp, paddingRight: "50px" }} onFocus={focusAmber} onBlur={blurDefault} />
            <button onClick={() => setShowPwd(p => !p)} style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <NextBtn onClick={() => { setError(""); setStep(2); }} disabled={!canNext1} />
            <button onClick={() => { setIsLogin(true); setError(""); }} style={{ padding: "15px 16px", borderRadius: "11px", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Connexion</button>
          </div>
        </div>
      </>
    );

    /* ───── ARTISTE — ÉTAPE 2 : identité légale ───── */
    if (!isLogin && role === "artist" && step === 2) return (
      <>
        <BackBtn onClick={() => { setStep(1); setError(""); }} />
        <StepBar current={2} total={3} />
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "5px" }}>Votre identité</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Informations légales — confidentielles, non affichées publiquement</p>
        </div>

        {error && <div style={{ marginBottom: "14px", padding: "11px 14px", borderRadius: "9px", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontSize: "12px" }}>⚠️ {error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Nom de scène *</label>
            <input value={stageName} onChange={e => setStageName(e.target.value)} placeholder="Ex: Idylle Mamba" style={inp} onFocus={focusAmber} onBlur={blurDefault} />
          </div>

          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Date de naissance *</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={{ ...inp, colorScheme: "dark" }} onFocus={focusAmber} onBlur={blurDefault} />
          </div>

          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Téléphone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+236 XX XX XX XX" style={inp} onFocus={focusAmber} onBlur={blurDefault} />
          </div>

          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Document d'identité *</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <SelBtn active={idType === "cni"} onClick={() => setIdType("cni")}>🪪 CNI</SelBtn>
              <SelBtn active={idType === "passport"} onClick={() => setIdType("passport")}>📘 Passeport</SelBtn>
            </div>
            <input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder={idType === "cni" ? "Numéro de CNI" : "Numéro de passeport"} style={inp} onFocus={focusAmber} onBlur={blurDefault} />
          </div>

          {/* Upload copie pièce d'identité */}
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Copie du document (optionnel)</label>
            <label style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px", cursor: "pointer",
              border: `1.5px dashed ${idFile ? "var(--amber)" : "rgba(240,235,227,0.15)"}`,
              background: idFile ? "rgba(232,96,26,0.05)" : "rgba(240,235,227,0.02)",
              color: idFile ? "var(--amber)" : "var(--muted)", fontSize: "13px", transition: "all 0.2s",
            }}>
              <Upload size={15} />
              {idFile ? idFile.name : "Télécharger une photo JPG ou PDF"}
              <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => setIdFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "9px", background: "rgba(201,147,10,0.06)", border: "1px solid rgba(201,147,10,0.18)" }}>
            <AlertCircle size={13} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "11px", color: "rgba(240,235,227,0.5)", lineHeight: 1.6 }}>Vos données sont chiffrées et ne seront jamais partagées avec des tiers.</p>
          </div>

          <NextBtn onClick={() => { setError(""); setStep(3); }} disabled={!canNext2Artist} />
        </div>
      </>
    );

    /* ───── ARTISTE — ÉTAPE 3 : infos musicales ───── */
    if (!isLogin && role === "artist" && step === 3) return (
      <>
        <BackBtn onClick={() => { setStep(2); setError(""); }} />
        <StepBar current={3} total={3} />
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "5px" }}>Votre univers musical</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Ces informations apparaîtront sur votre profil public</p>
        </div>

        {error && <div style={{ marginBottom: "14px", padding: "11px 14px", borderRadius: "9px", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontSize: "12px" }}>⚠️ {error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Genre musical principal *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {ARTIST_GENRES.map(g => {
                const sel = artistGenre === g;
                return (
                  <button key={g} onClick={() => setArtistGenre(g)} style={{
                    padding: "9px 6px", borderRadius: "9px", cursor: "pointer", fontSize: "11px", fontWeight: 700, textAlign: "center",
                    border: `1.5px solid ${sel ? "var(--amber)" : "rgba(240,235,227,0.1)"}`,
                    background: sel ? "rgba(232,96,26,0.12)" : "transparent",
                    color: sel ? "var(--amber)" : "var(--muted)", transition: "all 0.15s", position: "relative",
                  }}>
                    {sel && <Check size={9} style={{ position: "absolute", top: "4px", right: "4px", color: "var(--amber)" }} strokeWidth={3} />}
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Ville *</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Bangui" style={inp} onFocus={focusAmber} onBlur={blurDefault} />
          </div>

          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Biographie (optionnel)</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Parlez de vous à vos futurs auditeurs..." rows={3}
              style={{ ...inp, resize: "none", lineHeight: 1.6 } as React.CSSProperties}
              onFocus={focusAmber as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
              onBlur={blurDefault as unknown as React.FocusEventHandler<HTMLTextAreaElement>} />
          </div>

          <NextBtn onClick={handleRegisterArtist} disabled={loading || !artistGenre || !city}
            label={loading ? "Création du compte..." : "Créer mon compte artiste →"} />
        </div>
      </>
    );

    /* ───── AUDITEUR — ÉTAPE 2 : genres ───── */
    if (!isLogin && role === "listener" && step === 2) return (
      <>
        <BackBtn onClick={() => { setStep(1); setError(""); }} />
        <StepBar current={2} total={3} />
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "5px" }}>Tes genres préférés</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Choisis au moins 3 genres pour personnaliser ton expérience</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "24px", flex: 1 }}>
          {GENRES.map(g => {
            const sel = selGenres.includes(g.id);
            return (
              <button key={g.id} onClick={() => setSelGenres(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])} style={{
                padding: "13px 8px", borderRadius: "11px", cursor: "pointer", textAlign: "center",
                border: `1.5px solid ${sel ? "var(--amber)" : "rgba(240,235,227,0.1)"}`,
                background: sel ? "rgba(232,96,26,0.12)" : "rgba(240,235,227,0.03)",
                color: sel ? "var(--amber)" : "var(--muted)", transition: "all 0.15s", position: "relative",
              }}>
                {sel && <div style={{ position: "absolute", top: "5px", right: "5px", width: "14px", height: "14px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={9} color="white" strokeWidth={3} /></div>}
                <div style={{ fontSize: "20px", marginBottom: "5px" }}>{g.emoji}</div>
                <p style={{ fontSize: "11px", fontWeight: 700 }}>{g.label}</p>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <NextBtn onClick={() => setStep(3)} disabled={selGenres.length < 3}
            label={selGenres.length < 3 ? `Encore ${3 - selGenres.length} genre${3 - selGenres.length > 1 ? "s" : ""}` : "Suivant →"} />
          <button onClick={() => setStep(3)} style={{ padding: "15px 16px", borderRadius: "11px", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Passer</button>
        </div>
      </>
    );

    /* ───── AUDITEUR — ÉTAPE 3 : artistes ───── */
    if (!isLogin && role === "listener" && step === 3) return (
      <>
        <BackBtn onClick={() => { setStep(2); setError(""); }} />
        <StepBar current={3} total={3} />
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "5px" }}>Tes artistes préférés</h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Sélectionne au moins 1 artiste centrafricain</p>
        </div>

        {error && <div style={{ marginBottom: "12px", padding: "10px 13px", borderRadius: "9px", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontSize: "12px" }}>⚠️ {error}</div>}

        {artists.length === 0
          ? <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>Chargement des artistes…</div>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "9px", marginBottom: "20px" }}>
              {artists.map(artist => {
                const sel = selArtists.includes(artist.id);
                return (
                  <button key={artist.id} onClick={() => setSelArtists(prev => prev.includes(artist.id) ? prev.filter(x => x !== artist.id) : [...prev, artist.id])} style={{
                    padding: "12px 8px", borderRadius: "11px", cursor: "pointer", textAlign: "center",
                    border: `1.5px solid ${sel ? "var(--amber)" : "rgba(240,235,227,0.08)"}`,
                    background: sel ? "rgba(232,96,26,0.1)" : "rgba(240,235,227,0.03)",
                    transition: "all 0.15s", position: "relative",
                  }}>
                    {sel && <div style={{ position: "absolute", top: "7px", right: "7px", width: "16px", height: "16px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}><Check size={9} color="white" strokeWidth={3} /></div>}
                    <div style={{ position: "relative", width: "52px", height: "52px", margin: "0 auto 8px", borderRadius: "50%", overflow: "hidden", border: sel ? "2px solid var(--amber)" : "2px solid transparent" }}>
                      {artist.avatar_url
                        ? <img src={artist.avatar_url} alt={artist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff" }}>{artist.name[0]}</div>
                      }
                    </div>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: sel ? "var(--amber)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.name}</p>
                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{artist.genre}</p>
                  </button>
                );
              })}
            </div>
          )
        }

        <div style={{ display: "flex", gap: "8px" }}>
          <NextBtn onClick={handleRegisterListener} disabled={loading || !canFinishListener}
            label={loading ? "Création..." : !canFinishListener ? "Sélectionne 1 artiste min." : "Créer mon compte →"} />
          <button onClick={handleRegisterListener} disabled={loading} style={{ padding: "15px 16px", borderRadius: "11px", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Passer</button>
        </div>
      </>
    );

    return null;
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <div style={{ width: "50%", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 24px", overflowY: "auto", borderRight: "1px solid rgba(240,235,227,0.06)" }}>
        <div style={{ width: "100%", maxWidth: "360px" }}>
        {renderContent()}
        </div>
      </div>
      <Carousel />
    </div>
  );
}
