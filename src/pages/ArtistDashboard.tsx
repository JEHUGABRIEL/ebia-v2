import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Home, Music2, Upload, BarChart2, Settings, LogOut,
  Play, Pause, Trash2, Eye, Heart, Headphones, TrendingUp,
  Camera, Plus, Mic2, Lock, Crown, Zap, Menu, X as XIcon
} from "lucide-react";
import LogoutModal from "../components/LogoutModal";
import EbiaLogo from "../components/EbiaLogo";
import UploadTrackModal from "../components/UploadTrackModal";
import {
  getMyArtistProfile, getMyTracks, getMyStats, deleteMyTrack,
  updateMyArtistProfile, uploadArtistImage,
  type MyArtistProfile, type MyTrack, type ArtistStats
} from "../lib/api";
import ReleaseScheduler from "../components/ReleaseScheduler";
import AlbumSection from "../components/AlbumSection";
import EnhancedStats from "../components/EnhancedStats";

type Section = "accueil" | "titres" | "albums" | "profil" | "stats" | "parametres";

const FREE_LIMIT = 5;
const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const GENRES = ["Afro-Pop","Afro-Folk","Hip-Hop","Afro-Trap","Jazz / Blues","Gospel","Soukous","R&B","Traditionnel","Soul","Afro-Beat"];

const TRACK_STATUS_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  published: { label: "Publié", color: "#4caf82", bg: "rgba(76,175,130,0.12)", border: "rgba(76,175,130,0.25)" },
  pending_review: { label: "En attente", color: "var(--amber)", bg: "rgba(232,96,26,0.12)", border: "rgba(232,96,26,0.3)" },
  rejected: { label: "Rejeté", color: "#f08080", bg: "rgba(220,50,50,0.1)", border: "rgba(220,50,50,0.25)" },
  draft: { label: "Brouillon", color: "var(--muted)", bg: "rgba(240,235,227,0.06)", border: "var(--border)" },
};

interface FreeBannerProps { isFreeTierFull: boolean; freeSlotsLeft: number; publishedCount: number; }

function FreeBanner({ isFreeTierFull, freeSlotsLeft, publishedCount }: FreeBannerProps) {
  return (
    <div style={{ padding: "14px 18px", borderRadius: "12px", background: isFreeTierFull ? "rgba(220,50,50,0.07)" : "rgba(232,96,26,0.07)", border: `1px solid ${isFreeTierFull ? "rgba(220,50,50,0.2)" : "rgba(232,96,26,0.2)"}`, marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {isFreeTierFull ? <Lock size={15} style={{ color: "#f08080", flexShrink: 0 }} /> : <Music2 size={15} style={{ color: "var(--amber)", flexShrink: 0 }} />}
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>
            {isFreeTierFull ? "Limite gratuite atteinte" : `${freeSlotsLeft} titre${freeSlotsLeft > 1 ? "s" : ""} gratuit${freeSlotsLeft > 1 ? "s" : ""} restant${freeSlotsLeft > 1 ? "s" : ""}`}
          </p>
          <p style={{ fontSize: "11px", color: "var(--muted)" }}>
            {publishedCount}/{FREE_LIMIT} titres publiés gratuitement
          </p>
        </div>
      </div>
      {isFreeTierFull && (
        <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Crown size={12} /> Passer Pro
        </button>
      )}
    </div>
  );
}

interface StatCardProps { icon: typeof Headphones; label: string; value: string; color: string; }

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div style={{ padding: "22px 20px", borderRadius: "14px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)", transition: "border-color 0.2s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${color}35`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1, marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

interface SidebarNavButtonProps { icon: typeof Home; label: string; onClick: () => void; active: boolean; badge?: "plus" | "lock"; }

function SidebarNavButton({ icon: Icon, label, onClick, active, badge }: SidebarNavButtonProps) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: "12px",
      padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
      background: active ? "rgba(232,96,26,0.1)" : "transparent",
      border: "none", color: active ? "var(--text)" : "var(--muted)",
      transition: "all 0.15s", textAlign: "left",
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
      <Icon size={17} style={{ color: active ? "var(--amber)" : "inherit", flexShrink: 0 }} />
      <span style={{ fontWeight: 600, fontSize: "13px" }}>{label}</span>
      {badge === "plus" && (
        <span style={{ marginLeft: "auto", width: "17px", height: "17px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Plus size={10} color="white" />
        </span>
      )}
      {badge === "lock" && <Lock size={11} style={{ marginLeft: "auto", color: "var(--muted)", flexShrink: 0 }} />}
    </button>
  );
}

export default function ArtistDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [section, setSection] = useState<Section>("accueil");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; trackId: string | null; trackTitle: string }>({ open: false, trackId: null, trackTitle: "" });

  /* Data */
  const [profile, setProfile] = useState<MyArtistProfile | null>(null);
  const [tracks, setTracks] = useState<MyTrack[]>([]);
  const [stats, setStats] = useState<ArtistStats | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  // dataError géré par bandeau backend

  /* Profil edit */
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverImgPreview, setCoverImgPreview] = useState<string | null>(null);
  const [avatarPending, setAvatarPending] = useState(false);
  const [coverPending, setCoverPending] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverImgRef = useRef<HTMLInputElement>(null);

  /* Chargement données */
  const loadProfile = useCallback(() => {
    setLoadingProfile(true);
    getMyArtistProfile()
      .then(p => { setProfile(p); setEditName(p.name || p.stage_name || ""); setEditCity(p.city || ""); setEditGenre(p.genre || ""); setEditBio(p.bio || ""); })
      .catch(() => {
        /* Backend pas encore prêt — fallback sur données Keycloak */
        setProfile(null);
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const loadTracks = useCallback(() => {
    setLoadingTracks(true);
    getMyTracks()
      .then(r => setTracks(r.data))
      .catch(() => setTracks([]))
      .finally(() => setLoadingTracks(false));
  }, []);

  const loadStats = useCallback(() => {
    setLoadingStats(true);
    getMyStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => { loadProfile(); loadTracks(); loadStats(); }, [loadProfile, loadTracks, loadStats]);

  /* Calculs */
  const publishedCount = tracks.filter(t => t.status === "published").length;
  const freeSlotsLeft = FREE_LIMIT - (profile?.free_tracks_used ?? publishedCount);
  const isFreeTierFull = freeSlotsLeft <= 0;

  /* Supprimer titre */
  const confirmDelete = async () => {
    if (!deleteModal.trackId) return;
    try {
      await deleteMyTrack(deleteModal.trackId);
      setDeleteModal({ open: false, trackId: null, trackTitle: "" });
      loadTracks(); loadStats(); loadProfile();
    } catch { alert("Erreur lors de la suppression"); }
  };

  /* Sauvegarder profil — les modifications passent par une validation admin avant d'être publiées */
  const saveProfile = async () => {
    setSavingProfile(true); setSaveMsg("");
    try {
      const res = await updateMyArtistProfile({ name: editName, city: editCity, genre: editGenre, bio: editBio });
      setSaveMsg(res.pending_changes ? "Modifications envoyées, en attente de validation par l'équipe E-BIA ⏳" : "Profil sauvegardé ✓");
      setTimeout(() => setSaveMsg(""), 5000);
      loadProfile();
    } catch (e: unknown) { setSaveMsg(e instanceof Error ? e.message : "Erreur de sauvegarde"); }
    finally { setSavingProfile(false); }
  };

  /* Upload images profil — aperçu local immédiat, mais l'image publique ne change qu'après validation admin */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setAvatarPreview(ev.target?.result as string); r.readAsDataURL(f);
    try { await uploadArtistImage("avatar", f); setAvatarPending(true); } catch { /* preview reste */ }
  };
  const handleCoverImgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setCoverImgPreview(ev.target?.result as string); r.readAsDataURL(f);
    try { await uploadArtistImage("cover", f); setCoverPending(true); } catch { /* preview reste */ }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: "10px",
    border: "1.5px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)",
    color: "var(--text)", fontSize: "14px", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };
  const fa = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "var(--amber)");
  const fb = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "rgba(240,235,227,0.1)");

  const navItems: { key: string; icon: typeof Home; label: string; onClick: () => void; active: boolean; badge?: "plus" | "lock" }[] = [
    { key: "accueil", icon: Home, label: "Accueil", onClick: () => setSection("accueil"), active: section === "accueil" },
    { key: "titres", icon: Music2, label: "Mes titres", onClick: () => setSection("titres"), active: section === "titres" },
    { key: "albums", icon: Music2, label: "Mes albums", onClick: () => setSection("albums"), active: section === "albums" },
    { key: "upload", icon: Upload, label: "Uploader", onClick: () => setUploadOpen(true), active: false, badge: isFreeTierFull ? "lock" : "plus" },
    { key: "stats", icon: BarChart2, label: "Statistiques", onClick: () => setSection("stats"), active: section === "stats" },
    { key: "profil", icon: Mic2, label: "Mon profil", onClick: () => setSection("profil"), active: section === "profil" },
    { key: "parametres", icon: Settings, label: "Paramètres", onClick: () => setSection("parametres"), active: section === "parametres" },
  ];

  const maxMonthlyPlays = stats ? Math.max(...stats.monthly.map(m => m.plays), 1) : 1;

  if (!user) return null;

  const sidebarContent = (onNav?: () => void) => (
    <>
      <div style={{ padding: "16px 12px 8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Music2 size={14} color="white" />
        </div>
        <div>
          <span className="bebas" style={{ fontSize: "15px", color: "var(--text)", letterSpacing: "0.1em", display: "block", lineHeight: 1 }}>E-BIA</span>
          <span style={{ fontSize: "9px", color: "var(--amber)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Espace Artiste</span>
        </div>
      </div>

      <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "8px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {navItems.map(item => (
          <SidebarNavButton key={item.key} icon={item.icon} label={item.label} onClick={() => { item.onClick(); onNav?.(); }} active={item.active} badge={item.badge} />
        ))}

        <button onClick={() => { navigate("/artist/" + (profile?.slug ?? "")); onNav?.(); }} style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", background: "transparent", border: "1px solid rgba(240,235,227,0.07)", color: "var(--muted)", transition: "all 0.15s", textAlign: "left", width: "100%" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.3)"; (e.currentTarget as HTMLElement).style.color = "var(--amber)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
          <Eye size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12px", fontWeight: 600 }}>Voir mon profil</span>
        </button>

        <button onClick={() => { navigate("/me"); onNav?.(); }} style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", background: "transparent", border: "1px solid rgba(240,235,227,0.07)", color: "var(--muted)", transition: "all 0.15s", textAlign: "left", width: "100%" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(76,175,130,0.35)"; (e.currentTarget as HTMLElement).style.color = "#4caf82"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
          <Headphones size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12px", fontWeight: 600 }}>Passer en auditeur</span>
        </button>

        {/* Profil bas */}
        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, overflow: "hidden" }}>
              {avatarPreview || profile?.avatar_url
                ? <img src={avatarPreview || profile?.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff" }}>{user.displayName?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.stage_name || user.displayName}</p>
              <p style={{ fontSize: "10px", color: "var(--amber)", fontWeight: 600 }}>
                {profile?.plan === "pro" ? "⭐ Pro" : "Artiste · Gratuit"}
              </p>
            </div>
            <button onClick={() => setLogoutOpen(true)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", borderRadius: "6px", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.background = "none"; }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>

      {/* ── SIDEBAR desktop ── */}
      <aside className="sidebar-dashboard" style={{ flexDirection: "column", gap: "8px", padding: "8px", background: "#000", overflow: "hidden" }}>
        {sidebarContent()}
      </aside>

      {/* ── DRAWER mobile ── */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      )}
      <div style={{ position: "fixed", top: 0, left: mobileMenuOpen ? 0 : "-260px", width: "260px", height: "100vh", zIndex: 91, background: "#000", display: "flex", flexDirection: "column", gap: "8px", padding: "8px", transition: "left 0.25s ease", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 4px 0" }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}>
            <XIcon size={20} />
          </button>
        </div>
        {sidebarContent(() => setMobileMenuOpen(false))}
      </div>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, overflowY: "auto", background: section === "accueil" ? "linear-gradient(180deg, #1a0800 0%, var(--bg) 300px)" : "var(--bg)" }}>
        {/* Barre mobile top avec hamburger */}
        <div className="sidebar-dashboard-mobile-bar" style={{ alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#000", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", padding: "4px", display: "flex" }}>
            <Menu size={22} />
          </button>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <EbiaLogo size={22} />
            <span className="bebas" style={{ fontSize: "14px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
          </Link>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            {avatarPreview || profile?.avatar_url
              ? <img src={avatarPreview || profile?.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff" }}>{user.displayName?.[0]?.toUpperCase()}</div>
            }
          </div>
        </div>
        <div className="dashboard-main" style={{ padding: "36px 40px", maxWidth: "1680px", margin: "0 auto" }}>

          {/* Bandeau profil artiste non trouvé */}
          {!loadingProfile && !loadingTracks && !profile && (
            <div style={{ padding: "12px 18px", borderRadius: "12px", background: "rgba(201,147,10,0.07)", border: "1px solid rgba(201,147,10,0.2)", color: "rgba(240,235,227,0.6)", fontSize: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
              Profil artiste introuvable — votre compte est en cours de configuration ou la connexion est instable.
              <button onClick={() => { loadProfile(); loadTracks(); loadStats(); }} style={{ marginLeft: "auto", background: "none", border: "1px solid rgba(201,147,10,0.3)", borderRadius: "6px", color: "var(--gold)", cursor: "pointer", fontWeight: 600, fontSize: "11px", padding: "3px 10px" }}>Réessayer</button>
            </div>
          )}

          {/* ── ACCUEIL ── */}
          {section === "accueil" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--amber)", textTransform: "uppercase", marginBottom: "6px" }}>Tableau de bord</p>
                  <h1 className="bebas" style={{ fontSize: "44px", color: "var(--text)", lineHeight: 1 }}>
                    Bonjour, {profile?.stage_name || user.displayName?.split(" ")[0]}
                  </h1>
                </div>
                <button onClick={() => setUploadOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", borderRadius: "99px", background: isFreeTierFull ? "rgba(240,235,227,0.08)" : "var(--amber)", border: "none", color: isFreeTierFull ? "var(--muted)" : "#fff", fontSize: "12px", fontWeight: 700, cursor: isFreeTierFull ? "not-allowed" : "pointer", flexShrink: 0, transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => { if (!isFreeTierFull) (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(232,96,26,0.4)"; }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                  {isFreeTierFull ? <Lock size={13} /> : <Upload size={13} />}
                  {isFreeTierFull ? "Plan Pro requis" : "Uploader un titre"}
                </button>
              </div>

              <FreeBanner isFreeTierFull={isFreeTierFull} freeSlotsLeft={freeSlotsLeft} publishedCount={publishedCount} />

              {/* Stats cards */}
              {loadingStats ? (
                <div className="dash-stats-grid">
                  {[...Array(4)].map((_, i) => <div key={i} style={{ height: "120px", borderRadius: "14px", background: "rgba(240,235,227,0.04)", animation: "pulse 1.5s infinite" }} />)}
                </div>
              ) : stats ? (
                <div className="dash-stats-grid">
                  <StatCard icon={Headphones} label="Écoutes totales" value={fmtNum(stats.total_plays)} color="var(--amber)" />
                  <StatCard icon={Heart} label="Likes" value={fmtNum(stats.total_likes)} color="#e25c5c" />
                  <StatCard icon={Music2} label="Titres publiés" value={String(stats.tracks_published)} color="var(--gold)" />
                  <StatCard icon={TrendingUp} label="Abonnés" value={fmtNum(stats.total_followers)} color="#4caf82" />
                </div>
              ) : null}

              {/* Chart + top tracks */}
              {stats && (
                <div className="dash-two-col">
                  <div style={{ padding: "24px", borderRadius: "14px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>Écoutes / mois</p>
                        <p style={{ fontSize: "11px", color: "var(--muted)" }}>6 derniers mois</p>
                      </div>
                      <span className="bebas" style={{ fontSize: "26px", color: "var(--amber)" }}>{fmtNum(stats.total_plays)}</span>
                    </div>
                    {stats.monthly.length === 0
                      ? <p style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>Pas encore de données</p>
                      : (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "110px" }}>
                          {stats.monthly.map((m, i) => {
                            const h = (m.plays / maxMonthlyPlays) * 100;
                            const isLast = i === stats.monthly.length - 1;
                            return (
                              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                                {isLast && <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--amber)" }}>{fmtNum(m.plays)}</span>}
                                <div style={{ width: "100%", borderRadius: "5px 5px 0 0", background: isLast ? "var(--amber)" : "rgba(240,235,227,0.1)", height: `${h || 2}%`, transition: "height 0.4s ease" }} />
                                <span style={{ fontSize: "10px", fontWeight: 600, color: isLast ? "var(--text)" : "var(--muted)" }}>{m.month}</span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    }
                  </div>

                  <div style={{ padding: "24px", borderRadius: "14px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>Top titres</p>
                    {tracks.filter(t => t.status === "published").length === 0
                      ? <p style={{ color: "var(--muted)", fontSize: "13px" }}>Aucun titre publié</p>
                      : tracks.filter(t => t.status === "published").sort((a, b) => b.plays_count - a.plays_count).slice(0, 4).map((t, idx) => (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: idx < 3 ? "1px solid rgba(240,235,227,0.04)" : "none" }}>
                          <span className="bebas" style={{ fontSize: "16px", color: idx === 0 ? "var(--amber)" : "var(--muted)", width: "18px", textAlign: "center" }}>{idx + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                            <p style={{ fontSize: "10px", color: "var(--muted)" }}>{fmtNum(t.plays_count)} écoutes</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MES TITRES ── */}
          {section === "titres" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1 }}>Mes titres</h1>
                  {!loadingTracks && <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{publishedCount} publié{publishedCount !== 1 ? "s" : ""} · {tracks.filter(t => t.status === "pending_review").length} en attente · {tracks.filter(t => t.status === "draft").length} brouillon</p>}
                </div>
                <button onClick={() => setUploadOpen(true)} disabled={isFreeTierFull} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "99px", background: isFreeTierFull ? "rgba(240,235,227,0.06)" : "var(--amber)", border: "none", color: isFreeTierFull ? "var(--muted)" : "#fff", fontSize: "12px", fontWeight: 700, cursor: isFreeTierFull ? "not-allowed" : "pointer" }}>
                  {isFreeTierFull ? <Lock size={12} /> : <Plus size={12} />} Nouveau titre
                </button>
              </div>

              <FreeBanner isFreeTierFull={isFreeTierFull} freeSlotsLeft={freeSlotsLeft} publishedCount={publishedCount} />

              {loadingTracks ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[...Array(3)].map((_, i) => <div key={i} style={{ height: "56px", borderRadius: "10px", background: "rgba(240,235,227,0.04)", animation: "pulse 1.5s infinite" }} />)}
                </div>
              ) : tracks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div className="bebas" style={{ fontSize: "22px", color: "var(--muted)", marginBottom: "8px" }}>Aucun titre encore</div>
                  <button onClick={() => setUploadOpen(true)} style={{ padding: "10px 20px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Uploader mon premier titre</button>
                </div>
              ) : (
                <>
                  <div className="dash-track-row" style={{ display: "flex", alignItems: "center", padding: "0 16px 10px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ width: "28px" }}>#</span>
                    <span style={{ flex: 1 }}>Titre</span>
                    <span style={{ width: "72px", textAlign: "right" }}>Écoutes</span>
                    <span className="dash-track-secondary" style={{ width: "56px", textAlign: "right" }}>Likes</span>
                    <span className="dash-track-secondary" style={{ width: "52px", textAlign: "right" }}>Durée</span>
                    <span style={{ width: "80px", textAlign: "right" }}>Statut</span>
                    <span style={{ width: "32px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                    {tracks.map((track) => (
                      <div key={track.id} className="dash-track-row" style={{ display: "flex", alignItems: "center", padding: "11px 16px", borderRadius: "10px", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <div style={{ width: "28px", flexShrink: 0 }}>
                          <button onClick={() => setPlayingId(playingId === track.id ? null : track.id)} style={{ background: "none", border: "none", cursor: "pointer", color: playingId === track.id ? "var(--amber)" : "var(--muted)", padding: 0, transition: "color 0.15s" }}>
                            {playingId === track.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                          </button>
                        </div>

                        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                          {track.album_cover_url && <img src={track.album_cover_url} alt="" style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />}
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: playingId === track.id ? "var(--amber)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{track.genre}{track.album_name ? ` · ${track.album_name}` : ""}</p>
                          </div>
                        </div>

                        <span style={{ width: "72px", textAlign: "right", fontSize: "13px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{fmtNum(track.plays_count)}</span>
                        <span className="dash-track-secondary" style={{ width: "56px", textAlign: "right", fontSize: "13px", color: "var(--muted)" }}>{fmtNum(track.likes_count)}</span>
                        <span className="dash-track-secondary" style={{ width: "52px", textAlign: "right", fontSize: "13px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{fmtDur(track.duration_s)}</span>

                        <div style={{ width: "80px", display: "flex", justifyContent: "flex-end" }}>
                          {(() => {
                            const s = TRACK_STATUS_STYLES[track.status] ?? TRACK_STATUS_STYLES.draft;
                            return (
                              <span title={track.status === "rejected" ? track.rejection_reason : undefined}
                                style={{ padding: "4px 9px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, cursor: track.status === "rejected" && track.rejection_reason ? "help" : "default" }}>
                                {s.label}
                              </span>
                            );
                          })()}
                        </div>

                        <button onClick={() => setDeleteModal({ open: true, trackId: track.id, trackTitle: track.title })} style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "all 0.15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(220,50,50,0.1)"; (e.currentTarget as HTMLElement).style.color = "#f08080"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── SORTIES PROGRAMMÉES ── */}
          {section === "titres" && tracks.length > 0 && (
            <div style={{ marginTop: "32px" }}>
              <ReleaseScheduler tracks={tracks} onScheduled={loadTracks} />
            </div>
          )}

          {/* ── MES ALBUMS ── */}
          {section === "albums" && (
            <AlbumSection tracks={tracks} />
          )}

          {/* ── STATS ── */}
          {section === "stats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1 }}>Statistiques</h1>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>Données en temps réel depuis la base</p>
              </div>

              {loadingStats ? (
                <div style={{ height: "200px", borderRadius: "16px", background: "rgba(240,235,227,0.04)", animation: "pulse 1.5s infinite" }} />
              ) : !stats ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>Impossible de charger les statistiques</p>
              ) : (
                <>
                  {/* KPIs */}
                  <div className="dash-kpi-grid">
                    {[
                      { label: "Total écoutes", value: fmtNum(stats.total_plays), color: "var(--amber)" },
                      { label: "Total likes", value: fmtNum(stats.total_likes), color: "#e25c5c" },
                      { label: "Abonnés", value: fmtNum(stats.total_followers), color: "#4caf82" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "24px", borderRadius: "14px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)", textAlign: "center" }}>
                        <div className="bebas" style={{ fontSize: "48px", color: s.color, lineHeight: 1, marginBottom: "4px" }}>{s.value}</div>
                        <div style={{ fontSize: "12px", color: "var(--muted)" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div style={{ padding: "28px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "24px" }}>Évolution des écoutes</p>
                    {stats.monthly.length === 0
                      ? <p style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>Pas encore de données mensuelles</p>
                      : (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "150px" }}>
                          {stats.monthly.map((m, i) => {
                            const h = (m.plays / maxMonthlyPlays) * 100;
                            const isLast = i === stats.monthly.length - 1;
                            return (
                              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: isLast ? "var(--amber)" : "var(--muted)" }}>{fmtNum(m.plays)}</span>
                                <div style={{ width: "100%", borderRadius: "7px 7px 0 0", background: isLast ? "var(--amber)" : "rgba(240,235,227,0.1)", height: `${h || 2}%`, transition: "height 0.5s ease" }} />
                                <span style={{ fontSize: "12px", fontWeight: 600, color: isLast ? "var(--text)" : "var(--muted)" }}>{m.month}</span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    }
                  </div>

                  {/* Par titre */}
                  {tracks.filter(t => t.status === "published").length > 0 && (
                    <div style={{ padding: "24px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>Performance par titre</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {tracks.filter(t => t.status === "published").sort((a, b) => b.plays_count - a.plays_count).map(t => {
                          const maxP = Math.max(...tracks.map(x => x.plays_count), 1);
                          return (
                            <div key={t.id}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{t.title}</p>
                                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{fmtNum(t.plays_count)} écoutes · {fmtNum(t.likes_count)} likes</span>
                              </div>
                              <div style={{ height: "5px", borderRadius: "99px", background: "rgba(240,235,227,0.07)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${(t.plays_count / maxP) * 100}%`, background: "var(--amber)", borderRadius: "99px" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Analytics */}
                  <div style={{ marginTop: "24px" }}>
                    <EnhancedStats />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PROFIL ── */}
          {section === "profil" && (
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h1 className="bebas" style={{ fontSize: "42px", color: "var(--text)", marginBottom: "6px" }}>Mon profil artiste</h1>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "28px" }}>Visible publiquement sur votre page E-Bia</p>

              {loadingProfile
                ? <div style={{ height: "300px", borderRadius: "16px", background: "rgba(240,235,227,0.04)", animation: "pulse 1.5s infinite" }} />
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                    {/* Cover + Avatar */}
                    <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border)" }}>
                      <div style={{ position: "relative", height: "180px", background: coverImgPreview || profile?.cover_url ? "transparent" : "linear-gradient(135deg, rgba(232,96,26,0.2), rgba(201,147,10,0.1))", cursor: "pointer" }} onClick={() => coverImgRef.current?.click()}>
                        {(coverImgPreview || profile?.cover_url) && <img src={coverImgPreview || profile?.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "99px", background: "rgba(8,8,8,0.65)", color: "var(--text)", fontSize: "11px", fontWeight: 600 }}>
                            <Camera size={12} /> Changer la bannière
                          </div>
                        </div>
                        <input ref={coverImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverImgChange} />
                      </div>
                      <div style={{ padding: "0 24px 24px", background: "rgba(240,235,227,0.02)" }}>
                        <div style={{ position: "relative", width: "80px", height: "80px", marginTop: "-40px" }}>
                          <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", border: "3px solid var(--bg)" }}>
                            {avatarPreview || profile?.avatar_url
                              ? <img src={avatarPreview || profile?.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, color: "#fff" }}>{user.displayName?.[0]?.toUpperCase()}</div>
                            }
                          </div>
                          <button onClick={() => avatarRef.current?.click()} style={{ position: "absolute", bottom: "2px", right: "2px", width: "26px", height: "26px", borderRadius: "50%", background: "var(--amber)", border: "2px solid var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Camera size={9} color="white" />
                          </button>
                          <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                        </div>
                        {(avatarPending || coverPending) && (
                          <p style={{ fontSize: "11px", color: "var(--amber)", fontWeight: 600, marginTop: "8px" }}>
                            ⏳ {avatarPending && coverPending ? "Photo de profil et bannière" : avatarPending ? "Photo de profil" : "Bannière"} en attente de validation par l'équipe E-BIA — l'aperçu ci-dessus n'est visible que par vous tant que non validé.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Champs */}
                    <div style={{ padding: "26px 28px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                      {saveMsg && <div style={{ padding: "10px 12px", borderRadius: "8px", background: saveMsg.includes("Erreur") ? "rgba(220,50,50,0.08)" : "rgba(76,175,130,0.1)", border: `1px solid ${saveMsg.includes("Erreur") ? "rgba(220,50,50,0.2)" : "rgba(76,175,130,0.25)"}`, color: saveMsg.includes("Erreur") ? "#f08080" : "#4caf82", fontSize: "12px", marginBottom: "16px" }}>{saveMsg}</div>}

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                          { label: "Nom d'artiste / Nom de scène", val: editName, set: setEditName, ph: "Votre nom de scène" },
                          { label: "Ville", val: editCity, set: setEditCity, ph: "Ex: Bangui" },
                        ].map(f => (
                          <div key={f.label}>
                            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>{f.label}</label>
                            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inp} onFocus={fa} onBlur={fb} />
                          </div>
                        ))}

                        <div>
                          <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Genre musical</label>
                          <select value={editGenre} onChange={e => setEditGenre(e.target.value)} style={{ ...inp, appearance: "none" as const }} onFocus={fa} onBlur={fb}>
                            <option value="">Choisir un genre</option>
                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Biographie</label>
                          <textarea value={editBio ?? ""} onChange={e => setEditBio(e.target.value)} placeholder="Parlez de vous à vos auditeurs..." rows={4}
                            style={{ ...inp, resize: "none" } as React.CSSProperties}
                            onFocus={fa as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                            onBlur={fb as unknown as React.FocusEventHandler<HTMLTextAreaElement>} />
                        </div>

                        <button onClick={saveProfile} disabled={savingProfile} style={{ alignSelf: "flex-start", padding: "11px 22px", borderRadius: "99px", background: savingProfile ? "rgba(232,96,26,0.4)" : "var(--amber)", border: "none", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: savingProfile ? "not-allowed" : "pointer", transition: "box-shadow 0.2s" }}
                          onMouseEnter={e => { if (!savingProfile) (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(232,96,26,0.4)"; }}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                          {savingProfile ? "Sauvegarde…" : "Sauvegarder les modifications"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }
            </div>
          )}

          {/* ── PARAMÈTRES ── */}
          {section === "parametres" && (
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h1 className="bebas" style={{ fontSize: "42px", color: "var(--text)", marginBottom: "28px" }}>Paramètres</h1>
              <div className="dash-settings-grid">
                {/* Colonne gauche : Compte */}
                <div style={{ padding: "28px 32px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                  <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)", marginBottom: "20px" }}>Compte</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[{ label: "Email", value: user.email, disabled: true }].map(f => (
                      <div key={f.label}>
                        <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: "6px" }}>{f.label}</label>
                        <input defaultValue={f.value ?? ""} disabled={f.disabled} style={{ ...inp, color: "var(--muted)", background: "rgba(240,235,227,0.02)", fontSize: "15px" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colonne droite : Plan + Déconnexion */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ padding: "24px", borderRadius: "16px", background: "rgba(232,96,26,0.05)", border: "1px solid rgba(232,96,26,0.2)" }}>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Plan actuel</p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--amber)", marginBottom: "4px" }}>{profile?.plan === "pro" ? "⭐ Pro" : "Gratuit"}</p>
                    <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                      {profile?.plan === "pro" ? "Titres illimités, analytics avancés" : `${profile?.free_tracks_used ?? publishedCount}/${FREE_LIMIT} titres utilisés`}
                    </p>
                    {profile?.plan !== "pro" && (
                      <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                        <Crown size={14} /> Passer Pro
                      </button>
                    )}
                  </div>

                  <button onClick={() => setLogoutOpen(true)} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "rgba(220,50,50,0.06)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontWeight: 700, fontSize: "13px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,50,50,0.12)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,50,50,0.06)"}>
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
      <UploadTrackModal
        open={uploadOpen}
        isFreeTierFull={isFreeTierFull}
        freeSlotsLeft={freeSlotsLeft}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => { loadTracks(); loadStats(); loadProfile(); }}
        onViewTracks={() => { setUploadOpen(false); setSection("titres"); }}
      />

      {/* ── MODAL SUPPRESSION TITRE ── */}
      {deleteModal.open && (
        <div onClick={e => e.target === e.currentTarget && setDeleteModal({ open: false, trackId: null, trackTitle: "" })}
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
          <div style={{ width: "100%", maxWidth: "380px", borderRadius: "20px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "fadeUp 0.2s ease both" }}>
            <div style={{ height: "3px", background: "linear-gradient(90deg, #dc3232, #e05c5c)" }} />
            <div style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(220,50,50,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Trash2 size={17} style={{ color: "#f08080" }} />
                </div>
                <div>
                  <h2 className="bebas" style={{ fontSize: "20px", color: "var(--text)", lineHeight: 1 }}>Supprimer le titre</h2>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>Action irréversible</p>
                </div>
              </div>
              <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.65, marginBottom: "24px" }}>
                Vous êtes sur le point de supprimer <strong style={{ color: "var(--text)" }}>"{deleteModal.trackTitle}"</strong>. Le fichier audio sera définitivement supprimé.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={confirmDelete} style={{ flex: 1, padding: "14px", borderRadius: "11px", background: "rgba(220,50,50,0.85)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(220,50,50,0.45)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                  Supprimer
                </button>
                <button onClick={() => setDeleteModal({ open: false, trackId: null, trackTitle: "" })} style={{ flex: 1, padding: "14px", borderRadius: "11px", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
