import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  Eye, EyeOff, ArrowLeft, Check, Upload, AlertCircle,
  Headphones, Mic, Music2, Drum, Flame, Wind, Cross,
  Globe, Radio, Sparkles, Disc, CircleDot,
  Mail, Lock, User, Phone, MapPin, FileText, ArrowRight,
  CalendarDays, Shield, Wallet
} from "lucide-react";
import EbiaLogo from "../components/EbiaLogo";
import { registerListener, registerArtist, getArtists, canonGenre, type Artist } from "../lib/api";
import { computeWizardArtists } from "../lib/preferences";
import { useTranslation } from "react-i18next";

/* ── Données onboarding auditeur ── */
const GENRES = [
  { id: "afro-pop", label: "Afro-Pop", Icon: Music2 },
  { id: "hiphop", label: "Hip-Hop", Icon: Mic },
  { id: "afro-folk", label: "Afro-Folk", Icon: Drum },
  { id: "afro-trap", label: "Afro-Trap", Icon: Flame },
  { id: "jazz", label: "Jazz", Icon: Wind },
  { id: "gospel", label: "Gospel", Icon: Cross },
  { id: "soukous", label: "Soukous", Icon: Disc },
  { id: "traditionnel", label: "Traditionnel", Icon: Globe },
  { id: "rnb", label: "R&B", Icon: Radio },
  { id: "soul", label: "Soul", Icon: Sparkles },
  { id: "afrobeat", label: "Afro-Beat", Icon: CircleDot },
  { id: "ndombolo", label: "Ndombolo", Icon: Disc },
];

const ARTIST_GENRES = [
  "Afro-Pop", "Afro-Folk", "Hip-Hop", "Afro-Trap",
  "Jazz / Blues", "Gospel", "Soukous", "R&B", "Traditionnel", "Soul", "Afro-Beat",
];

/* ── Carousel ── */
const SLIDES = [
  { img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=1200&fit=crop", tag: "Scène centrafricaine", title: "La musique de chez nous,\npour le monde entier.", sub: "Découvrez les artistes qui font vibrer la RCA" },
  { img: "http://localhost/ebia-audio/images/artists/idylle-mamba/avatar.jpg", tag: "Artiste en vedette", title: "Idylle Mamba", sub: "Ambassadrice de la musique centrafricaine" },
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

/* ── Reusable components ── */

const StepBar = ({ current, total }: { current: number; total: number }) => (
  <div style={{ marginBottom: "28px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--amber)", textTransform: "uppercase" }}>Étape {current} sur {total}</span>
      <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500 }}>{Math.round((current / total) * 100)}%</span>
    </div>
    <div style={{ height: "4px", background: "rgba(240,235,227,0.07)", borderRadius: "99px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${(current / total) * 100}%`, background: "linear-gradient(90deg, var(--amber), var(--gold))", borderRadius: "99px", transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  </div>
);

const FormInput = ({
  icon: Icon, type = "text", value, onChange, placeholder, onKeyDown, style: extraStyle, rightElement
}: {
  icon: React.ElementType; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; onKeyDown?: (e: React.KeyboardEvent) => void; style?: React.CSSProperties;
  rightElement?: React.ReactNode;
}) => (
  <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
      <Icon size={16} />
    </div>
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
      style={{
        width: "100%", padding: "14px 16px 14px 42px", borderRadius: "12px",
        border: "1.5px solid rgba(240,235,227,0.08)", background: "rgba(240,235,227,0.04)",
        color: "var(--text)", fontSize: "14px", outline: "none",
        boxSizing: "border-box" as const, transition: "all 0.25s ease",
        ...extraStyle,
      }}
      onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.background = "rgba(240,235,227,0.06)"; }}
      onBlur={e => { e.target.style.borderColor = "rgba(240,235,227,0.08)"; e.target.style.background = "rgba(240,235,227,0.04)"; }}
    />
    {rightElement}
  </div>
);

const FormTextarea = ({
  icon: Icon, value, onChange, placeholder, rows = 3
}: {
  icon: React.ElementType; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string; rows?: number;
}) => (
  <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", left: "14px", top: "16px", color: "var(--muted)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
      <Icon size={16} />
    </div>
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{
        width: "100%", padding: "14px 16px 14px 42px", borderRadius: "12px",
        border: "1.5px solid rgba(240,235,227,0.08)", background: "rgba(240,235,227,0.04)",
        color: "var(--text)", fontSize: "14px", outline: "none", resize: "none", lineHeight: 1.6,
        boxSizing: "border-box" as const, transition: "all 0.25s ease",
        fontFamily: "inherit",
      }}
      onFocus={e => { e.target.style.borderColor = "var(--amber)"; e.target.style.background = "rgba(240,235,227,0.06)"; }}
      onBlur={e => { e.target.style.borderColor = "rgba(240,235,227,0.08)"; e.target.style.background = "rgba(240,235,227,0.04)"; }}
    />
  </div>
);

const PrimaryButton = ({
  onClick, disabled, label, loading
}: {
  onClick: () => void; disabled?: boolean; label: string; loading?: boolean;
}) => (
  <button
    onClick={onClick} disabled={disabled || loading}
    style={{
      width: "100%", padding: "15px 24px", borderRadius: "12px", border: "none",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      background: disabled || loading ? "rgba(232,96,26,0.3)" : "linear-gradient(135deg, var(--amber) 0%, #d97706 100%)",
      color: "#fff", fontSize: "13px", fontWeight: 800, textTransform: "uppercase",
      letterSpacing: "0.08em", opacity: disabled ? 0.5 : 1,
      transition: "all 0.3s ease",
      boxShadow: disabled ? "none" : "0 4px 16px rgba(232,96,26,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.boxShadow = "0 8px 32px rgba(232,96,26,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = disabled ? "none" : "0 4px 16px rgba(232,96,26,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
  >
    {loading ? (
      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        {label}
      </span>
    ) : (
      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {label} <ArrowRight size={14} />
      </span>
    )}
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </button>
);

const SecondaryButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} style={{
    padding: "15px 20px", borderRadius: "12px", border: "1.5px solid rgba(240,235,227,0.1)",
    background: "transparent", color: "var(--muted)", fontSize: "12px", fontWeight: 600,
    cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap",
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(240,235,227,0.2)"; e.currentTarget.style.color = "var(--text)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(240,235,227,0.1)"; e.currentTarget.style.color = "var(--muted)"; }}
  >{children}</button>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--muted)",
    fontSize: "13px", background: "none", border: "none", cursor: "pointer", padding: "4px 0",
    marginBottom: "24px", transition: "color 0.15s", fontWeight: 500,
  }}
    onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
    onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
  ><ArrowLeft size={14} /> Retour</button>
);

const BackLink = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--muted)",
    fontSize: "13px", textDecoration: "none", marginBottom: "32px", background: "none",
    border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s", fontWeight: 500,
  }}
    onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
    onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
  ><ArrowLeft size={14} /> Retour</button>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <div style={{
    marginBottom: "16px", padding: "12px 16px", borderRadius: "10px",
    background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)",
    color: "#f08080", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px",
  }}>
    <AlertCircle size={14} /> {message}
  </div>
);

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div style={{ marginBottom: "24px" }}>
    <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)", marginBottom: "6px", lineHeight: 1.2 }}>{title}</h2>
    <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>{subtitle}</p>
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: "7px" }}>{children}</label>
);

export default function Login() {
  const { user, authReady, loginWithCredentials } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const normalizeError = (e: unknown): string => {
    const msg = e instanceof Error ? e.message : String(e);
    if (/already exists|duplicate|23505|unique.*constraint/i.test(msg))
      return t("login.errorExists");
    if (/invalid.*credential|incorrect.*password|wrong.*password|identifiants/i.test(msg))
      return t("login.errorCredentials");
    if (/attente de validation|a été rejetée/i.test(msg))
      return msg;
    if (/not found|introuvable/i.test(msg))
      return t("login.errorNotFound");
    if (/network|fetch|connexion|ERR_/i.test(msg))
      return t("login.errorNetwork");
    if (/timeout|trop de temps/i.test(msg))
      return t("login.errorTimeout");
    if (/token.*invalid|token.*expire/i.test(msg))
      return t("login.errorToken");
    return t("login.errorDefault");
  };

  const [isLogin, setIsLogin] = useState((location.state as any)?.tab !== "register");
  const [role, setRole] = useState<"listener" | "artist">("listener");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  /* Form commun */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const [contactPhone, setContactPhone] = useState("");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [pendingMessage, setPendingMessage] = useState("");

  /* Auditeur */
  const [selGenres, setSelGenres] = useState<string[]>([]);
  const [selArtists, setSelArtists] = useState<string[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  /* Genres « découverts » par une sélection : leurs artistes supplémentaires sont dévoilés */
  const [revealedGenres, setRevealedGenres] = useState<Set<string>>(new Set());

  // 3 artistes max par genre au départ ; choisir un artiste dévoile le reste de son type.
  const listenerStep3Artists = computeWizardArtists<Artist>({
    artists,
    selectedGenres: selGenres,
    revealedGenres,
    initialPerGenre: 3,
  });

  useEffect(() => {
    if (authReady && user) navigate(user.role === "admin" ? "/admin" : user.role === "artist" ? "/artist-dashboard" : "/me");
  }, [authReady, user]);

  useEffect(() => {
    if (!isLogin && role === "listener" && step === 3) {
      getArtists().then(r => setArtists(r.data)).catch(() => {});
    }
  }, [isLogin, role, step]);

  const TOTAL_STEPS = 3;

  const canNext1 = email && password.length >= 8 && firstName && password === confirmPassword;
  const canNext2Artist = stageName && birthDate && idNumber && idFile;
  const canFinishListener = selArtists.length >= 1;

  const handleLogin = async () => {
    if (!email || !password) { setError("Veuillez renseigner votre email et mot de passe."); return; }
    setLoading(true); setError("");
    try {
      await loginWithCredentials(email, password);
      const token = localStorage.getItem("ebia_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const roles: string[] = payload.realm_access?.roles ?? [];
        navigate(roles.includes("admin") ? "/admin" : roles.includes("artist") ? "/artist-dashboard" : "/me");
      }
    } catch (e: unknown) { setError(normalizeError(e)); }
    finally { setLoading(false); }
  };

  const handleRegisterListener = async () => {
    setLoading(true); setError("");
    try {
      await registerListener({ email, password, firstName, lastName, genres: selGenres, favoriteArtistIds: selArtists });
      await loginWithCredentials(email, password);
      navigate("/me");
    } catch (e: unknown) { setError(normalizeError(e)); }
    finally { setLoading(false); }
  };

  const handleRegisterArtist = async () => {
    if (!idFile) { setError("La pièce d'identité est requise."); return; }
    setLoading(true); setError("");
    try {
      const res = await registerArtist({ email, password, firstName, lastName, stageName, birthDate, idType, idNumber, genre: artistGenre, city, bio, phone, contactPhone, mobileMoneyPhone }, idFile);
      setPendingMessage(res.message || "Compte créé, en attente de validation par l'équipe E-BIA.");
      setIsLogin(true); setStep(1);
    } catch (e: unknown) { setError(normalizeError(e)); }
    finally { setLoading(false); }
  };

  const SelBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} style={{
      flex: 1, padding: "14px 0", borderRadius: "11px", cursor: "pointer", fontSize: "13px", fontWeight: 700,
      border: `1.5px solid ${active ? "var(--amber)" : "rgba(240,235,227,0.08)"}`,
      background: active ? "rgba(232,96,26,0.1)" : "transparent",
      color: active ? "var(--amber)" : "var(--muted)",
      transition: "all 0.2s ease",
      boxShadow: active ? "0 2px 12px rgba(232,96,26,0.15)" : "none",
    }}>{children}</button>
  );

  const renderContent = () => {

    /* ───── LOGIN ───── */
    if (isLogin) return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <BackLink onClick={() => navigate("/")} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, var(--amber), #d97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(232,96,26,0.3)" }}>
            <EbiaLogo size={24} />
          </div>
          <span className="bebas" style={{ fontSize: "20px", color: "var(--text)", letterSpacing: "0.12em" }}>E-BIA</span>
        </div>

        <SectionTitle title="Bon retour" subtitle="Connectez-vous pour accéder à votre compte E-Bia" />

        {pendingMessage && (
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(76,175,130,0.08)", border: "1px solid rgba(76,175,130,0.25)", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: "#4caf82", fontWeight: 600 }}>{pendingMessage}</p>
          </div>
        )}
        {error && <ErrorBanner message={error} />}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormInput icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Adresse email" />
          <div style={{ position: "relative" }}>
            <FormInput icon={Lock} type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Mot de passe"
              rightElement={
                <button onClick={() => setShowPwd(p => !p)} style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px",
                  display: "flex", alignItems: "center", transition: "color 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-4px" }}>
            <button onClick={() => navigate("/forgot-password")} style={{ background: "none", border: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0, transition: "opacity 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >{t("login.forgotPassword")}</button>
          </div>

          <PrimaryButton onClick={handleLogin} disabled={loading} label={loading ? "Connexion en cours..." : "Se connecter"} />

          <div style={{ textAlign: "center", paddingTop: "8px" }}>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              {t("login.noAccount")}{" "}
              <button onClick={() => { setIsLogin(false); setError(""); setStep(1); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--amber)", fontWeight: 700, fontSize: "13px", transition: "opacity 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >S'inscrire</button>
            </p>
          </div>
        </div>
      </div>
    );

    /* ───── INSCRIPTION — ÉTAPE 1 (commun) ───── */
    if (step === 1) return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <BackLink onClick={() => navigate("/")} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, var(--amber), #d97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(232,96,26,0.3)" }}>
            <EbiaLogo size={24} />
          </div>
          <span className="bebas" style={{ fontSize: "20px", color: "var(--text)", letterSpacing: "0.12em" }}>E-BIA</span>
        </div>

        <StepBar current={1} total={TOTAL_STEPS} />
        <SectionTitle title="Créer un compte" subtitle="Rejoignez la communauté musicale centrafricaine" />

        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <SelBtn active={role === "listener"} onClick={() => setRole("listener")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <Headphones size={16} /> Auditeur
            </span>
          </SelBtn>
          <SelBtn active={role === "artist"} onClick={() => setRole("artist")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <Mic size={16} /> Artiste
            </span>
          </SelBtn>
        </div>

        {role === "artist" && (
          <div style={{
            padding: "14px 16px", borderRadius: "12px",
            background: "rgba(232,96,26,0.06)", border: "1px solid rgba(232,96,26,0.15)",
            marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px",
          }}>
            <Sparkles size={16} style={{ color: "var(--amber)", marginTop: "2px", flexShrink: 0 }} />
            <p style={{ fontSize: "12px", color: "rgba(240,235,227,0.6)", lineHeight: 1.6 }}>
              Espace de publication + statistiques détaillées. <strong style={{ color: "var(--amber)" }}>5 titres offerts</strong> à la création.
            </p>
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <FormInput icon={User} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom *" />
            <FormInput icon={User} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom" />
          </div>
          <FormInput icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Adresse email *" />
          <div style={{ position: "relative" }}>
            <FormInput icon={Lock} type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe (min. 8 caractères) *"
              rightElement={
                <button onClick={() => setShowPwd(p => !p)} style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px",
                  display: "flex", alignItems: "center",
                }}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              }
            />
          </div>
          <div style={{ position: "relative" }}>
            <FormInput icon={Lock} type={showConfirmPwd ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe *"
              style={confirmPassword && confirmPassword !== password ? { borderColor: "rgba(220,50,50,0.5)" } : undefined}
              rightElement={
                <button onClick={() => setShowConfirmPwd(p => !p)} style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px",
                  display: "flex", alignItems: "center",
                }}>{showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              }
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p style={{ fontSize: "11px", color: "#f08080", marginTop: "-6px", paddingLeft: "4px" }}>Les mots de passe ne correspondent pas</p>
          )}

          <PrimaryButton onClick={() => { setError(""); setStep(2); }} disabled={!canNext1} label="Suivant" />

          <div style={{ textAlign: "center", paddingTop: "8px" }}>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              {t("login.hasAccount")}{" "}
              <button onClick={() => { setIsLogin(true); setError(""); setStep(1); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--amber)", fontWeight: 700, fontSize: "13px", transition: "opacity 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >{t("login.tabLogin")}</button>
            </p>
          </div>
        </div>
      </div>
    );

    /* ───── ARTISTE — ÉTAPE 2 : identité légale ───── */
    if (!isLogin && role === "artist" && step === 2) return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <BackButton onClick={() => { setStep(1); setError(""); }} />
        <StepBar current={2} total={3} />
        <SectionTitle title="Votre identité" subtitle="Informations légales — confidentielles, non affichées publiquement" />

        {error && <ErrorBanner message={error} />}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <Label>Nom de scène *</Label>
            <FormInput icon={Mic} value={stageName} onChange={e => setStageName(e.target.value)} placeholder="Ex: Idylle Mamba" />
          </div>

          <div>
            <Label>Date de naissance *</Label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                <CalendarDays size={16} />
              </div>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                style={{
                  width: "100%", padding: "14px 16px 14px 42px", borderRadius: "12px",
                  border: "1.5px solid rgba(240,235,227,0.08)", background: "rgba(240,235,227,0.04)",
                  color: "var(--text)", fontSize: "14px", outline: "none",
                  boxSizing: "border-box" as const, transition: "all 0.25s ease", colorScheme: "dark",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--amber)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(240,235,227,0.08)"; }}
              />
            </div>
          </div>

          <div>
            <Label>Téléphone</Label>
            <FormInput icon={Phone} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+236 XX XX XX XX" />
          </div>

          <div>
            <Label>Téléphone de contact <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optionnel pour l'instant)</span></Label>
            <FormInput icon={Phone} type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+236 XX XX XX XX" />
          </div>

          <div>
            <Label>Numéro Mobile Money <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optionnel pour l'instant)</span></Label>
            <FormInput icon={Wallet} type="tel" value={mobileMoneyPhone} onChange={e => setMobileMoneyPhone(e.target.value)} placeholder="+236 XX XX XX XX" />
            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
              Ces deux numéros pourront être renseignés plus tard, mais seront nécessaires avant de publier votre premier titre.
            </p>
          </div>

          <div>
            <Label>Document d'identité *</Label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <SelBtn active={idType === "cni"} onClick={() => setIdType("cni")}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FileText size={13} /> CNI</span>
              </SelBtn>
              <SelBtn active={idType === "passport"} onClick={() => setIdType("passport")}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FileText size={13} /> Passeport</span>
              </SelBtn>
            </div>
            <FormInput icon={Shield} value={idNumber} onChange={e => setIdNumber(e.target.value)}
              placeholder={idType === "cni" ? "Numéro de CNI" : "Numéro de passeport"} />
          </div>

          <div>
            <Label>Copie du document *</Label>
            <label style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
              border: `1.5px dashed ${idFile ? "var(--amber)" : "rgba(240,235,227,0.12)"}`,
              background: idFile ? "rgba(232,96,26,0.05)" : "rgba(240,235,227,0.02)",
              color: idFile ? "var(--amber)" : "var(--muted)", fontSize: "13px", transition: "all 0.2s ease",
            }}>
              <Upload size={16} />
              {idFile ? idFile.name : "Télécharger une photo JPG ou PDF"}
              <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => setIdFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div style={{
            display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "10px",
            background: "rgba(201,147,10,0.05)", border: "1px solid rgba(201,147,10,0.12)",
          }}>
            <Shield size={14} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "11px", color: "rgba(240,235,227,0.5)", lineHeight: 1.6 }}>Vos données sont chiffrées et ne seront jamais partagées avec des tiers. Votre compte sera activé après validation de ce document par l'équipe E-BIA.</p>
          </div>

          <PrimaryButton onClick={() => { setError(""); setStep(3); }} disabled={!canNext2Artist} label="Suivant" />
        </div>
      </div>
    );

    /* ───── ARTISTE — ÉTAPE 3 : infos musicales ───── */
    if (!isLogin && role === "artist" && step === 3) return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <BackButton onClick={() => { setStep(2); setError(""); }} />
        <StepBar current={3} total={3} />
        <SectionTitle title="Votre univers musical" subtitle="Ces informations apparaîtront sur votre profil public" />

        {error && <ErrorBanner message={error} />}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <Label>Genre musical principal *</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {ARTIST_GENRES.map(g => {
                const sel = artistGenre === g;
                return (
                  <button key={g} onClick={() => setArtistGenre(g)} style={{
                    padding: "10px 6px", borderRadius: "10px", cursor: "pointer", fontSize: "11px", fontWeight: 700, textAlign: "center",
                    border: `1.5px solid ${sel ? "var(--amber)" : "rgba(240,235,227,0.08)"}`,
                    background: sel ? "rgba(232,96,26,0.1)" : "transparent",
                    color: sel ? "var(--amber)" : "var(--muted)", transition: "all 0.15s ease", position: "relative",
                    boxShadow: sel ? "0 2px 8px rgba(232,96,26,0.12)" : "none",
                  }}>
                    {sel && <Check size={9} style={{ position: "absolute", top: "5px", right: "5px", color: "var(--amber)" }} strokeWidth={3} />}
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Ville *</Label>
            <FormInput icon={MapPin} value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Bangui" />
          </div>

          <div>
            <Label>Biographie (optionnel)</Label>
            <FormTextarea icon={FileText} value={bio} onChange={e => setBio(e.target.value)} placeholder="Parlez de vous à vos futurs auditeurs..." />
          </div>

          <PrimaryButton onClick={handleRegisterArtist} disabled={loading || !artistGenre || !city || !idFile}
            label={loading ? "Envoi en cours..." : "Envoyer pour validation"} />
        </div>
      </div>
    );

    /* ───── AUDITEUR — ÉTAPE 2 : genres ───── */
    if (!isLogin && role === "listener" && step === 2) return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <BackButton onClick={() => { setStep(1); setError(""); }} />
        <StepBar current={2} total={3} />
        <SectionTitle title="Vos genres préférés" subtitle="Choisissez au moins 3 genres pour personnaliser votre expérience" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "28px", flex: 1 }}>
          {GENRES.map(g => {
            const sel = selGenres.includes(g.id);
            return (
              <button key={g.id} onClick={() => setSelGenres(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])} style={{
                padding: "14px 8px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
                border: `1.5px solid ${sel ? "var(--amber)" : "rgba(240,235,227,0.08)"}`,
                background: sel ? "rgba(232,96,26,0.1)" : "rgba(240,235,227,0.02)",
                color: sel ? "var(--amber)" : "var(--muted)", transition: "all 0.2s ease", position: "relative",
                boxShadow: sel ? "0 2px 12px rgba(232,96,26,0.12)" : "none",
              }}>
                {sel && <div style={{ position: "absolute", top: "6px", right: "6px", width: "16px", height: "16px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={9} color="white" strokeWidth={3} /></div>}
                <div style={{ marginBottom: "6px" }}><g.Icon size={20} style={{ color: sel ? "var(--amber)" : "var(--muted)" }} /></div>
                <p style={{ fontSize: "11px", fontWeight: 700 }}>{g.label}</p>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={() => setStep(3)} disabled={selGenres.length < 3}
              label={selGenres.length < 3 ? `Encore ${3 - selGenres.length} genre${3 - selGenres.length > 1 ? "s" : ""}` : "Suivant"} />
          </div>
          <SecondaryButton onClick={() => setStep(3)}>Passer</SecondaryButton>
        </div>
      </div>
    );

    /* ───── AUDITEUR — ÉTAPE 3 : artistes ───── */
    if (!isLogin && role === "listener" && step === 3) return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <BackButton onClick={() => { setStep(2); setError(""); }} />
        <StepBar current={3} total={3} />
        <SectionTitle title="Vos artistes préférés" subtitle="Sélectionnez au moins 1 artiste centrafricain" />

        {error && <ErrorBanner message={error} />}

        {artists.length === 0
          ? <div style={{ padding: "48px 32px", textAlign: "center", color: "var(--muted)", fontSize: "13px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", border: "3px solid rgba(240,235,227,0.1)", borderTopColor: "var(--amber)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Chargement des artistes...
            </div>
          : listenerStep3Artists.visible.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--muted)", fontSize: "13px", lineHeight: 1.7 }}>
              Aucun artiste ne correspond encore aux genres choisis. Revenez à l'étape précédente pour ajuster vos types de musique.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "24px" }}>
              {listenerStep3Artists.visible.map(artist => {
                const sel = selArtists.includes(artist.id);
                return (
                  <button key={artist.id} onClick={() => {
                    const adding = !selArtists.includes(artist.id);
                    if (adding) {
                      const key = canonGenre(artist.genre);
                      if (key) {
                        // Découverte : choisir un artiste dévoile les autres artistes du même type
                        setRevealedGenres(prev => { const next = new Set(prev); next.add(key); return next; });
                      }
                    }
                    setSelArtists(prev => prev.includes(artist.id) ? prev.filter(x => x !== artist.id) : [...prev, artist.id]);
                  }} style={{
                    padding: "14px 8px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
                    border: `1.5px solid ${sel ? "var(--amber)" : "rgba(240,235,227,0.06)"}`,
                    background: sel ? "rgba(232,96,26,0.08)" : "rgba(240,235,227,0.02)",
                    transition: "all 0.2s ease", position: "relative",
                    boxShadow: sel ? "0 2px 12px rgba(232,96,26,0.12)" : "none",
                  }}>
                    {sel && <div style={{ position: "absolute", top: "8px", right: "8px", width: "18px", height: "18px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}><Check size={10} color="white" strokeWidth={3} /></div>}
                    <div style={{ position: "relative", width: "56px", height: "56px", margin: "0 auto 10px", borderRadius: "50%", overflow: "hidden", border: sel ? "2.5px solid var(--amber)" : "2.5px solid rgba(240,235,227,0.06)", transition: "border-color 0.2s" }}>
                      {artist.avatar_url
                        ? <img src={artist.avatar_url} alt={artist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "18px" }}>{artist.name[0]}</div>
                      }
                    </div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: sel ? "var(--amber)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.name}</p>
                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "3px" }}>{artist.genre}</p>
                  </button>
                );
              })}
            </div>
          )
        }

        {listenerStep3Artists.hidden > 0 && (
          <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", margin: "-12px 0 18px", lineHeight: 1.6 }}>
            ✨ Sélectionnez un artiste pour découvrir les autres artistes du même genre
            ({listenerStep3Artists.hidden} encore à découvrir).
          </p>
        )}
        {selArtists.length > 0 && (
          <p style={{ fontSize: "12px", color: "rgba(232,96,26,0.9)", textAlign: "center", margin: "-12px 0 18px", fontWeight: 600 }}>
            {selArtists.length} artiste{selArtists.length > 1 ? "s" : ""} sélectionné{selArtists.length > 1 ? "s" : ""}
          </p>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={handleRegisterListener} disabled={loading || !canFinishListener}
              label={loading ? "Création..." : !canFinishListener ? "Sélectionnez 1 artiste min." : "Créer mon compte"} />
          </div>
          <SecondaryButton onClick={handleRegisterListener}>Passer</SecondaryButton>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <div className="login-form-panel" style={{
        width: "50%", flexShrink: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "40px 28px",
        overflowY: "auto", borderRight: "1px solid rgba(240,235,227,0.04)",
      }}>
        <div style={{
          width: "100%", maxWidth: "400px",
          padding: "36px 32px", borderRadius: "20px",
          border: "1px solid rgba(240,235,227,0.06)",
          background: "rgba(240,235,227,0.025)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(240,235,227,0.04)",
          backdropFilter: "blur(12px)",
        }}>
          {renderContent()}
        </div>
      </div>
      <Carousel />
    </div>
  );
}
