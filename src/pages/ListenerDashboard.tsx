import { useState, useRef, useEffect } from "react";
import { useApp, type DownloadableTrack } from "../context/AppContext";
import { useNavigate, Link } from "react-router-dom";
import { Home, Search, Library, Heart, Users, Settings, Plus, ChevronRight, LogOut, Camera, Mic2, Music2, Loader, Menu, X as XIcon, Download, DownloadCloud, CheckCircle2, Trash2, WifiOff, Star, Upload, BarChart2, Mic, DollarSign, TrendingUp } from "lucide-react";
import LogoutModal from "../components/LogoutModal";
import EbiaLogo from "../components/EbiaLogo";
import { getArtists, getTracks, getMyArtistProfile, updateProfile, uploadUserAvatar, becomeArtist, type Artist } from "../lib/api";
import { daysLeft, type OfflineTrack } from "../lib/offline";

type Section = "accueil" | "recherche" | "bibliotheque" | "favoris" | "suivis" | "parametres" | "decouvrir" | "telechargements";

const MOCK_ARTISTS = [
  { id: "1", name: "Idylle Mamba", genre: "Afro-Folk", slug: "idylle-mamba", avatar: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=200" },
  { id: "2", name: "Cool Fawa", genre: "Hip-Hop", slug: "cool-fawa", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" },
  { id: "3", name: "Ley Kartel", genre: "Afro-Pop", slug: "ley-kartel", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200" },
  { id: "4", name: "KT Pop", genre: "Pop", slug: "kt-pop", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200" },
  { id: "5", name: "Mansdou", genre: "Afro-Trap", slug: "mansdou", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
];
const MOCK_FAVORITES = [
  { id: "1", title: "One Africa", artist: "Cool Fawa", duration: "4:20" },
  { id: "2", title: "Faro Faro", artist: "Idylle Mamba", duration: "3:55" },
  { id: "3", title: "Regal", artist: "Mansdou", duration: "3:30" },
  { id: "4", title: "Mawa", artist: "Ley Kartel", duration: "4:10" },
];
const GENRES = [
  { label: "Afro-Pop", bg: "#7B2200" }, { label: "Hip-Hop", bg: "#3B1A5C" },
  { label: "Afro-Trap", bg: "#5C3000" }, { label: "Folk", bg: "#0F3D22" },
  { label: "Jazz", bg: "#0F2A40" }, { label: "Urbain", bg: "#2A0F40" },
  { label: "Gospel", bg: "#40280F" }, { label: "Traditionnel", bg: "#0F2E1A" },
];

export default function ListenerDashboard() {
  const { user, updateUser, downloadedIds, downloadingIds, downloadProgress, downloadTrack, removeDownload, getDownloadedTracks, networkQuality, playTrack } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("accueil");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState((user as Record<string, unknown> & { phone?: string })?.phone ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [artistModalOpen, setArtistModalOpen] = useState(false);
  const [artistStep, setArtistStep] = useState(1);
  const [artistStageName, setArtistStageName] = useState("");
  const [artistGenre, setArtistGenre] = useState("");
  const [artistCity, setArtistCity] = useState("");
  const [artistCreating, setArtistCreating] = useState(false);
  const [artistError, setArtistError] = useState("");
  const [realArtists, setRealArtists] = useState<Artist[]>([]);
  const [newTracks, setNewTracks] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasArtistProfile, setHasArtistProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrack[]>([]);
  const [popularTracks, setPopularTracks] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getArtists().then(r => setRealArtists(r.data)).catch(() => {});
    /* Titres les plus joués — grille d'accueil */
    getTracks({ limit: "6" }).then(r => setPopularTracks(r.data)).catch(() => {});
    /* Nouveautés du mois — scroll horizontal */
    getTracks({ new_this_month: "true", limit: "12" }).then(r => setNewTracks(r.data)).catch(() => {});
    getMyArtistProfile().then(() => setHasArtistProfile(true)).catch(() => setHasArtistProfile(false));
  }, []);

  /* Rafraîchir la liste hors-ligne quand on entre dans la section */
  useEffect(() => {
    if (section === "telechargements") {
      getDownloadedTracks().then(setOfflineTracks).catch(() => {});
    }
  }, [section, downloadedIds]);

  if (!user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const payload: { display_name?: string; avatar_url?: string; phone?: string } = {};
      if (displayName.trim() && displayName !== user?.displayName) payload.display_name = displayName.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (selectedFile) {
        const uploaded = await uploadUserAvatar(selectedFile);
        payload.avatar_url = uploaded.url;
      }
      if (!Object.keys(payload).length) { setProfileMsg("Aucune modification."); setProfileSaving(false); return; }
      const res = await updateProfile(payload);
      localStorage.setItem("ebia_token", res.access_token);
      updateUser({ displayName: res.user.display_name, avatarUrl: res.user.avatar_url ?? undefined });
      setAvatarUrl(res.user.avatar_url ?? null);
      setSelectedFile(null);
      setProfileMsg("Profil mis à jour ✓");
    } catch {
      setProfileMsg("Erreur lors de la sauvegarde.");
    } finally {
      setProfileSaving(false);
    }
  };

  const navLinks: { id: Section; icon: typeof Home; label: string; badge?: number }[] = [
    { id: "accueil", icon: Home, label: "Accueil" },
    { id: "recherche", icon: Search, label: "Rechercher" },
    { id: "bibliotheque", icon: Library, label: "Bibliothèque" },
    { id: "telechargements", icon: Download, label: "Téléchargements", badge: downloadedIds.size || undefined },
  ];
  const libLinks: { id: Section; icon: typeof Heart; label: string; color: string }[] = [
    { id: "favoris", icon: Heart, label: "Titres favoris", color: "var(--amber)" },
    { id: "suivis", icon: Users, label: "Artistes suivis", color: "var(--gold)" },
    { id: "parametres", icon: Settings, label: "Paramètres", color: "var(--muted)" },
  ];

  const AvatarBlock = ({ size = 64, withEdit = false }: { size?: number; withEdit?: boolean }) => (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, color: "#fff" }}>
          {user.displayName?.[0]?.toUpperCase()}
        </div>
      )}
      {withEdit && (
        <>
          <button onClick={() => fileInputRef.current?.click()} style={{
            position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", borderRadius: "50%",
            background: "var(--amber)", border: "2px solid var(--bg)", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <Camera size={12} color="white" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </>
      )}
    </div>
  );

  const sidebarContent = (onNav?: () => void) => (
    <>
      <div style={{ padding: "16px 12px 8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <EbiaLogo size={28} />
          <span className="bebas" style={{ fontSize: "16px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
        </Link>
      </div>
      <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "8px" }}>
        {navLinks.map(l => (
          <button key={l.id} onClick={() => { setSection(l.id as Section); onNav?.(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", cursor: "pointer", background: section === l.id ? "rgba(232,96,26,0.1)" : "transparent", border: "none", color: section === l.id ? "var(--text)" : "var(--muted)", transition: "all 0.15s", textAlign: "left" }}>
            <l.icon size={18} style={{ color: section === l.id ? "var(--amber)" : "inherit", flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: "13px", flex: 1 }}>{l.label}</span>
            {l.badge ? (
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "99px", background: "var(--amber)", color: "#fff" }}>{l.badge}</span>
            ) : null}
          </button>
        ))}
        {/* Indicateur réseau */}
        {networkQuality !== "high" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", margin: "4px 0 0", borderRadius: "8px", background: networkQuality === "offline" ? "rgba(220,50,50,0.08)" : "rgba(201,147,10,0.08)" }}>
            {networkQuality === "offline"
              ? <WifiOff size={11} style={{ color: "#f08080", flexShrink: 0 }} />
              : <WifiOff size={11} style={{ color: "var(--gold)", flexShrink: 0 }} />
            }
            <span style={{ fontSize: "10px", color: networkQuality === "offline" ? "#f08080" : "var(--gold)", fontWeight: 600 }}>
              {networkQuality === "offline" ? "Hors connexion" : "Réseau lent"}
            </span>
          </div>
        )}
      </div>
      <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "14px 12px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", padding: "0 4px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Bibliothèque</span>
          <Plus size={15} style={{ color: "var(--muted)", cursor: "pointer" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {libLinks.map(l => (
            <button key={l.id} onClick={() => { setSection(l.id); onNav?.(); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", cursor: "pointer", background: section === l.id ? "rgba(240,235,227,0.04)" : "transparent", border: "none", textAlign: "left", transition: "background 0.15s" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0, background: `${l.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <l.icon size={14} style={{ color: l.color }} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>{l.label}</p>
                <p style={{ fontSize: "10px", color: "var(--muted)" }}>Playlist</p>
              </div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px" }}>
            <AvatarBlock size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName}</p>
              <p style={{ fontSize: "10px", color: "var(--muted)" }}>Auditeur</p>
            </div>
            <button onClick={() => setLogoutOpen(true)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", borderRadius: "6px" }}>
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
      <main style={{ flex: 1, overflowY: "auto", background: section === "accueil" ? "linear-gradient(180deg, #1C0C04 0%, var(--bg) 320px)" : "var(--bg)" }}>
        {/* Barre mobile top avec hamburger */}
        <div className="sidebar-dashboard-mobile-bar" style={{ alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#000", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", padding: "4px", display: "flex" }}>
            <Menu size={22} />
          </button>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <EbiaLogo size={22} />
            <span className="bebas" style={{ fontSize: "14px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
          </Link>
          <AvatarBlock size={28} />
        </div>
        <div className="dashboard-main" style={{ padding: "32px 48px", maxWidth: "1680px", margin: "0 auto" }}>

          {/* ── ACCUEIL ── */}
          {section === "accueil" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              {/* Greeting */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <h1 className="bebas" style={{ fontSize: "44px", color: "var(--text)", lineHeight: 1, marginBottom: "4px" }}>
                    {greeting}, {user.displayName?.split(" ")[0]}
                  </h1>
                  <p style={{ fontSize: "13px", color: "var(--muted)" }}>Que voulez-vous écouter aujourd'hui ?</p>
                </div>
                {/* CTA artiste */}
                {(user.role === "artist" || hasArtistProfile) ? (
                  <button onClick={() => navigate("/artist-dashboard")} style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, padding: "10px 18px", borderRadius: "99px", cursor: "pointer", border: "1px solid rgba(232,96,26,0.35)", background: "rgba(232,96,26,0.08)", color: "var(--amber)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", transition: "all 0.2s" }}>
                    <Mic2 size={14} /> Accéder au portail artiste
                  </button>
                ) : (
                  <button onClick={() => setArtistModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, padding: "10px 18px", borderRadius: "99px", cursor: "pointer", border: "1px solid rgba(232,96,26,0.35)", background: "rgba(232,96,26,0.08)", color: "var(--amber)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", transition: "all 0.2s" }}>
                    <Mic2 size={14} /> Devenir artiste
                  </button>
                )}
              </div>

              {/* Titres populaires (données réelles) */}
              {popularTracks.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {popularTracks.map(track => {
                    const cover = track.album_cover_url || track.artist_avatar;
                    const dl: DownloadableTrack = { id: track.id, title: track.title, artist: track.artist_name, genre: track.genre || "", duration_s: track.duration_s || 0, coverUrl: cover };
                    const dlDone = downloadedIds.has(track.id);
                    const dlLoading = downloadingIds.has(track.id);
                    return (
                      <div key={track.id}
                        style={{ display: "flex", alignItems: "center", borderRadius: "8px", overflow: "hidden", textAlign: "left", background: "rgba(240,235,227,0.06)", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.1)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"}>
                        <div onClick={() => playTrack({ id: track.id, title: track.title, artist: track.artist_name, audioUrl: track.file_path, coverUrl: cover })}
                          style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, cursor: "pointer" }}>
                          {cover
                            ? <img src={cover} alt={track.title} style={{ width: "52px", height: "52px", objectFit: "cover", flexShrink: 0 }} />
                            : <div style={{ width: "52px", height: "52px", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Music2 size={20} color="white" /></div>
                          }
                          <div style={{ flex: 1, minWidth: 0, padding: "0 12px" }}>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist_name}</p>
                          </div>
                        </div>
                        {/* Bouton download */}
                        <button
                          onClick={e => { e.stopPropagation(); if (!dlDone && !dlLoading) downloadTrack(dl); }}
                          title={dlDone ? "Déjà téléchargé" : dlLoading ? "Téléchargement..." : "Télécharger hors-ligne"}
                          style={{
                            width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, marginRight: "6px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: dlDone ? "rgba(76,175,130,0.12)" : dlLoading ? "rgba(232,96,26,0.12)" : "transparent",
                            border: "none", cursor: dlDone ? "default" : "pointer",
                            color: dlDone ? "#4caf82" : dlLoading ? "var(--amber)" : "var(--muted)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { if (!dlDone && !dlLoading) (e.currentTarget as HTMLElement).style.color = "var(--amber)"; }}
                          onMouseLeave={e => { if (!dlDone && !dlLoading) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                        >
                          {dlLoading
                            ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} />
                            : dlDone
                              ? <CheckCircle2 size={13} />
                              : <DownloadCloud size={13} />
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Artistes */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                  <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)" }}>Artistes populaires</h2>
                  <button onClick={() => navigate("/explore")} style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}
                  >Tout afficher</button>
                </div>
                <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" }}>
                  {(realArtists.length > 0 ? realArtists : []).slice(0, 10).map(artist => (
                    <button key={artist.id} onClick={() => navigate(`/artist/${artist.slug}`)} style={{ flexShrink: 0, width: "100px", padding: "10px 6px", borderRadius: "12px", textAlign: "center", background: "transparent", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      {artist.avatar_url
                        ? <img src={artist.avatar_url} alt={artist.name} style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", display: "block", marginBottom: "8px" }} />
                        : <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px", fontSize: "36px", fontWeight: 800, color: "#fff" }}>{artist.name[0]}</div>
                      }
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.name}</p>
                      <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.genre}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nouveautés */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                  <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)" }}>Nouveautés E-Bia</h2>
                  <button onClick={() => setSection("decouvrir")} style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}
                  >Tout afficher</button>
                </div>
                {newTracks.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>Aucune nouveauté ce mois-ci.</p>
                ) : (
                  <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" }}>
                    {newTracks.map(track => {
                      const cover = track.album_cover_url || track.artist_avatar;
                      const dl: DownloadableTrack = { id: track.id, title: track.title, artist: track.artist_name, genre: track.genre, duration_s: track.duration_s, coverUrl: cover };
                      const dlDone = downloadedIds.has(track.id);
                      const dlPct  = downloadProgress[track.id] ?? 0;
                      const dlLoading = downloadingIds.has(track.id);
                      return (
                        <div key={track.id} style={{ flexShrink: 0, width: "120px", borderRadius: "12px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)", overflow: "hidden" }}>

                          {/* ── Pochette + overlay download ── */}
                          <div style={{ position: "relative" }}>
                            <div onClick={() => playTrack({ id: track.id, title: track.title, artist: track.artist_name, audioUrl: track.file_path, coverUrl: cover })} style={{ cursor: "pointer" }}>
                              {cover
                                ? <img src={cover} alt={track.title} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                                : <div style={{ width: "100%", aspectRatio: "1", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center" }}><Music2 size={28} color="white" /></div>
                              }
                            </div>

                            {/* Bouton download — overlay en bas à droite, taille tactile */}
                            <button
                              onClick={e => { e.stopPropagation(); if (!dlDone && !dlLoading) downloadTrack(dl); }}
                              title={dlDone ? "Déjà téléchargé" : "Télécharger hors-ligne"}
                              style={{
                                position: "absolute", bottom: "6px", right: "6px",
                                width: "36px", height: "36px", borderRadius: "50%",
                                background: dlDone ? "rgba(76,175,130,0.85)" : "rgba(8,8,8,0.72)",
                                backdropFilter: "blur(6px)",
                                border: "none", cursor: dlDone ? "default" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "transform 0.15s, background 0.15s",
                              }}
                              onMouseEnter={e => { if (!dlDone) (e.currentTarget as HTMLElement).style.transform = "scale(1.12)"; }}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                            >
                              {dlLoading
                                ? <Loader size={15} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
                                : <Download size={15} color={dlDone ? "#fff" : "var(--amber)"} />
                              }
                            </button>

                            {/* Barre de progression (superposée en bas de la pochette) */}
                            {dlLoading && (
                              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "rgba(0,0,0,0.4)" }}>
                                <div style={{ height: "100%", width: `${dlPct}%`, background: "var(--amber)", transition: "width 0.3s" }} />
                              </div>
                            )}
                          </div>

                          {/* ── Texte ── */}
                          <div onClick={() => playTrack({ id: track.id, title: track.title, artist: track.artist_name, audioUrl: track.file_path, coverUrl: cover })} style={{ padding: "8px 10px 10px", cursor: "pointer" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                            <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist_name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DÉCOUVRIR ── */}
          {section === "decouvrir" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => setSection("accueil")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600 }}>← Retour</button>
                <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)" }}>Découvrir</h1>
              </div>

              {/* Artistes les plus populaires ce mois */}
              <div>
                <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)", marginBottom: "18px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><TrendingUp size={18} style={{ color: "var(--amber)" }} /> Artistes les plus écoutés</span></h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[...realArtists].sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0)).slice(0, 10).map((artist, i) => (
                    <button key={artist.id} onClick={() => navigate(`/artist/${artist.slug}`)} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 14px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", width: "20px", textAlign: "center" }}>{i + 1}</span>
                      {artist.avatar_url
                        ? <img src={artist.avatar_url} alt={artist.name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff" }}>{artist.name[0]}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.name}</p>
                        <p style={{ fontSize: "12px", color: "var(--muted)" }}>{artist.genre}</p>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>{Number(artist.plays_count || 0).toLocaleString("fr-FR")} écoutes</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nouveautés ce mois */}
              <div>
                <h2 className="bebas" style={{ fontSize: "24px", color: "var(--text)", marginBottom: "18px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><Star size={18} style={{ color: "var(--amber)" }} /> Nouveautés du mois</span></h2>
                {newTracks.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>Aucune nouveauté ce mois-ci.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "14px" }}>
                    {newTracks.map(track => (
                      <button key={track.id} style={{ padding: "14px", borderRadius: "12px", textAlign: "left", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.2)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                        {track.album_cover_url || track.artist_avatar
                          ? <img src={track.album_cover_url || track.artist_avatar} alt={track.title} style={{ width: "100%", aspectRatio: "1", borderRadius: "8px", objectFit: "cover", display: "block", marginBottom: "10px" }} />
                          : <div style={{ width: "100%", aspectRatio: "1", borderRadius: "8px", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}><Music2 size={28} color="white" /></div>
                        }
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                        <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>{track.artist_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── RECHERCHE ── */}
          {section === "recherche" && (
            <div>
              <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", marginBottom: "22px" }}>Rechercher</h1>
              <div style={{ position: "relative", marginBottom: "32px" }}>
                <Search size={15} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Artistes, titres, genres..." style={{ width: "100%", padding: "13px 18px 13px 44px", borderRadius: "99px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "14px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" as const }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(232,96,26,0.4)"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />
              </div>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>Parcourir les genres</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                {GENRES.map(g => (
                  <button key={g.label} onClick={() => navigate("/explore")} style={{ padding: "22px 18px", borderRadius: "12px", textAlign: "left", fontWeight: 700, fontSize: "14px", color: "#fff", background: g.bg, border: "none", cursor: "pointer", transition: "filter 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = "brightness(1.2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = "brightness(1)"}
                  >{g.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* ── BIBLIOTHÈQUE ── */}
          {section === "bibliotheque" && (
            <div>
              <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", marginBottom: "22px" }}>Ma bibliothèque</h1>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[{ label: "Titres favoris", count: MOCK_FAVORITES.length, icon: Heart, color: "var(--amber)", id: "favoris" as Section }, { label: "Artistes suivis", count: MOCK_ARTISTS.length, icon: Users, color: "var(--gold)", id: "suivis" as Section }].map(item => (
                  <button key={item.label} onClick={() => setSection(item.id)} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "12px", textAlign: "left", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.03)"}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "10px", flexShrink: 0, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <item.icon size={20} style={{ color: item.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{item.label}</p>
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{item.count} éléments</p>
                    </div>
                    <ChevronRight size={15} style={{ color: "var(--muted)" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── FAVORIS ── */}
          {section === "favoris" && (
            <div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "28px", padding: "36px", borderRadius: "16px", marginBottom: "28px", background: "linear-gradient(135deg, rgba(232,96,26,0.15), transparent)" }}>
                <div style={{ width: "120px", height: "120px", borderRadius: "14px", flexShrink: 0, background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart size={44} color="white" fill="white" />
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>Playlist</p>
                  <h1 className="bebas" style={{ fontSize: "44px", color: "var(--text)", lineHeight: 1, marginBottom: "6px" }}>Titres favoris</h1>
                  <p style={{ fontSize: "13px", color: "var(--muted)" }}>{user.displayName} · {MOCK_FAVORITES.length} titres</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "0 14px 10px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ width: "22px", textAlign: "center" }}>#</span><span style={{ flex: 1 }}>Titre</span><span>Durée</span>
                </div>
                {MOCK_FAVORITES.map((track, i) => (
                  <div key={track.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 14px", borderRadius: "8px", transition: "background 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <span style={{ width: "22px", textAlign: "center", fontSize: "12px", color: "var(--muted)" }}>{i + 1}</span>
                    <div style={{ width: "34px", height: "34px", borderRadius: "6px", flexShrink: 0, background: "rgba(232,96,26,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Music2 size={13} style={{ color: "var(--amber)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                      <p style={{ fontSize: "11px", color: "var(--muted)" }}>{track.artist}</p>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{track.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUIVIS ── */}
          {section === "suivis" && (
            <div>
              <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", marginBottom: "24px" }}>Artistes suivis</h1>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
                {MOCK_ARTISTS.map(artist => (
                  <button key={artist.id} onClick={() => navigate(`/artist/${artist.slug}`)} style={{ padding: "14px 10px", borderRadius: "12px", textAlign: "center", background: "transparent", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <img src={artist.avatar} alt={artist.name} style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto 10px" }} />
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>{artist.name}</p>
                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>Artiste</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PARAMÈTRES ── */}
          {section === "parametres" && (
            <div style={{ maxWidth: "1100px" }}>
              <h1 className="bebas" style={{ fontSize: "48px", color: "var(--text)", marginBottom: "36px" }}>Paramètres</h1>

              {/* Row 1: Photo + Compte | Préférences */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
                {/* Left: Photo + Compte stacked */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                  {/* Photo de profil */}
                  <div style={{ padding: "36px", borderRadius: "18px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                    <h2 className="bebas" style={{ fontSize: "26px", color: "var(--text)", marginBottom: "24px" }}>Photo de profil</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                      <AvatarBlock size={90} withEdit={true} />
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
                          {avatarUrl ? "Photo mise à jour ✓" : "Ajouter une photo"}
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "14px" }}>JPG, PNG ou GIF · max 5 Mo</p>
                        <button onClick={() => fileInputRef.current?.click()} style={{ padding: "10px 20px", borderRadius: "10px", background: "rgba(240,235,227,0.07)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.12)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.07)"}>
                          {avatarUrl ? "Changer la photo" : "Choisir une photo"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Compte */}
                  <div style={{ padding: "36px", borderRadius: "18px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                    <h2 className="bebas" style={{ fontSize: "26px", color: "var(--text)", marginBottom: "24px" }}>Compte</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>Nom</label>
                        <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ width: "100%", padding: "14px 18px", borderRadius: "12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "15px", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>Email</label>
                        <input value={user.email} disabled style={{ width: "100%", padding: "14px 18px", borderRadius: "12px", background: "rgba(240,235,227,0.02)", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "15px", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>Téléphone</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={"+236 70 12 34 56"} style={{ width: "100%", padding: "14px 18px", borderRadius: "12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "15px", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <button onClick={handleSaveProfile} disabled={profileSaving} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 28px", borderRadius: "99px", background: "var(--amber)", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: profileSaving ? "default" : "pointer", opacity: profileSaving ? 0.7 : 1 }}>
                          {profileSaving ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Enregistrement…</> : "Sauvegarder"}
                        </button>
                        {profileMsg && <span style={{ fontSize: "13px", color: profileMsg.includes("✓") ? "#4caf82" : "#f08080" }}>{profileMsg}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Préférences (compact) */}
                <div style={{ padding: "28px", borderRadius: "18px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)", alignSelf: "start", position: "sticky", top: "20px" }}>
                  <h2 className="bebas" style={{ fontSize: "22px", color: "var(--text)", marginBottom: "24px" }}>Préférences</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {[{ label: "Notifications", desc: "Nouvelles sorties des artistes suivis", on: true }, { label: "Qualité audio haute", desc: "Utilise plus de données mobiles", on: false }, { label: "Lecture automatique", desc: "Continuer avec des titres similaires", on: false }].map(s => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{s.label}</p>
                          <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>{s.desc}</p>
                        </div>
                        <div style={{ width: "40px", height: "22px", borderRadius: "99px", cursor: "pointer", background: s.on ? "var(--amber)" : "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "2px", justifyContent: s.on ? "flex-end" : "flex-start", transition: "background 0.2s", flexShrink: 0 }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Devenir artiste / Portail */}
              <div style={{ padding: "28px 36px", borderRadius: "18px", background: "rgba(232,96,26,0.06)", border: "1px solid rgba(232,96,26,0.2)", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                  <div>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                      {(user.role === "artist" || hasArtistProfile) ? "Votre espace artiste" : "Vous êtes artiste ?"}
                    </p>
                    <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                      {(user.role === "artist" || hasArtistProfile) ? "Gérez vos titres et consultez vos statistiques" : "Publiez votre musique et touchez des milliers d'auditeurs"}
                    </p>
                  </div>
                  {(user.role === "artist" || hasArtistProfile) ? (
                    <button onClick={() => navigate("/artist-dashboard")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                      <Mic2 size={15} /> Accéder au portail artiste
                    </button>
                  ) : (
                    <button onClick={() => setArtistModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "99px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                      <Mic2 size={15} /> Devenir artiste
                    </button>
                  )}
                </div>
              </div>

              {/* Déconnexion */}
              <button onClick={() => setLogoutOpen(true)} style={{ width: "100%", padding: "18px", borderRadius: "14px", background: "rgba(220,50,50,0.06)", border: "1px solid rgba(220,50,50,0.2)", color: "#f08080", fontWeight: 700, fontSize: "14px", cursor: "pointer", transition: "background 0.15s", textTransform: "uppercase", letterSpacing: "0.08em" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,50,50,0.12)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,50,50,0.06)"}>
                Se déconnecter
              </button>
            </div>
          )}
          {/* ── TÉLÉCHARGEMENTS ── */}
          {section === "telechargements" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1 }}>Téléchargements</h1>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>Écoutez hors-ligne · expire après {7} jours</p>
              </div>

              {networkQuality === "offline" && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "10px", background: "rgba(76,175,130,0.08)", border: "1px solid rgba(76,175,130,0.2)", marginBottom: "20px" }}>
                  <WifiOff size={14} style={{ color: "#4caf82", flexShrink: 0 }} />
                  <p style={{ fontSize: "12px", color: "#4caf82", fontWeight: 600 }}>Mode hors-ligne — lecture depuis les fichiers téléchargés</p>
                </div>
              )}

              {offlineTracks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 0" }}>
                  <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "rgba(240,235,227,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Download size={28} style={{ color: "var(--muted)" }} />
                  </div>
                  <p className="bebas" style={{ fontSize: "20px", color: "var(--muted)", marginBottom: "8px" }}>Aucun titre téléchargé</p>
                  <p style={{ fontSize: "13px", color: "var(--muted)", maxWidth: "320px", margin: "0 auto", lineHeight: 1.6 }}>
                    Téléchargez des titres depuis l'accueil pour les écouter sans connexion. Ils expirent après 7 jours.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "0 14px 10px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ flex: 1 }}>Titre</span>
                    <span style={{ width: "80px", textAlign: "center" }}>Expire dans</span>
                    <span style={{ width: "32px" }} />
                  </div>
                  {offlineTracks.map(track => {
                    const days = daysLeft(track);
                    return (
                      <div key={track.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 14px", borderRadius: "10px", transition: "background 0.15s", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0, overflow: "hidden", background: "rgba(232,96,26,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={() => {
                            const blobUrl = URL.createObjectURL(track.audioBlob);
                            playTrack({ id: track.id, title: track.title, artist: track.artist, audioUrl: blobUrl, coverUrl: track.coverUrl });
                          }}>
                          {track.coverUrl
                            ? <img src={track.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <Music2 size={14} style={{ color: "var(--amber)" }} />
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }} onClick={() => {
                          const blobUrl = URL.createObjectURL(track.audioBlob);
                          playTrack({ id: track.id, title: track.title, artist: track.artist, audioUrl: blobUrl, coverUrl: track.coverUrl });
                        }}>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{track.artist} · {track.genre}</p>
                        </div>
                        <div style={{ width: "80px", textAlign: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: days <= 1 ? "#f08080" : days <= 3 ? "var(--gold)" : "#4caf82" }}>
                            {days === 0 ? "Aujourd'hui" : `${days}j`}
                          </span>
                        </div>
                        <button onClick={() => removeDownload(track.id).then(() => setOfflineTracks(t => t.filter(x => x.id !== track.id)))}
                          title="Supprimer le téléchargement"
                          style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "all 0.15s", flexShrink: 0 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(220,50,50,0.1)"; (e.currentTarget as HTMLElement).style.color = "#f08080"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />

      {/* ── MODAL DEVENIR ARTISTE ── */}
      {artistModalOpen && (
        <div onClick={e => e.target === e.currentTarget && setArtistModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
          <div style={{ width: "100%", maxWidth: "440px", borderRadius: "20px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "fadeUp 0.2s ease both" }}>
            <div style={{ height: "3px", background: "linear-gradient(90deg, var(--amber), var(--gold))" }} />

            {artistStep === 1 && (
              <div style={{ padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(232,96,26,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mic2 size={16} style={{ color: "var(--amber)" }} />
                    </div>
                    <div>
                      <h2 className="bebas" style={{ fontSize: "20px", color: "var(--text)", lineHeight: 1 }}>Devenir artiste</h2>
                      <p style={{ fontSize: "11px", color: "var(--muted)" }}>Étape 1 sur 2</p>
                    </div>
                  </div>
                  <button onClick={() => { setArtistModalOpen(false); setArtistStep(1); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(232,96,26,0.06)", border: "1px solid rgba(232,96,26,0.15)", marginBottom: "20px" }}>
                  <p style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600, marginBottom: "8px" }}>Avec un compte artiste, vous pouvez :</p>
                  {[{text: "Publier vos titres et albums", icon: Upload}, {text: "Accéder à vos statistiques d'écoute", icon: BarChart2}, {text: "Créer votre profil artiste officiel", icon: Mic}, {text: "Recevoir vos revenus de streaming", icon: DollarSign}].map((b, i) => (
                    <p key={i} style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}><b.icon size={13} style={{ color: "var(--amber)" }} /> {b.text}</p>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setArtistStep(2)} style={{ flex: 1, padding: "14px", borderRadius: "11px", background: "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Continuer →
                  </button>
                  <button onClick={() => { setArtistModalOpen(false); setArtistStep(1); }} style={{ padding: "14px 18px", borderRadius: "11px", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {artistStep === 2 && (
              <div style={{ padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                  <div>
                    <h2 className="bebas" style={{ fontSize: "20px", color: "var(--text)", lineHeight: 1 }}>Votre nom d'artiste</h2>
                    <p style={{ fontSize: "11px", color: "var(--muted)" }}>Étape 2 sur 2</p>
                  </div>
                  <button onClick={() => { setArtistModalOpen(false); setArtistStep(1); setArtistError(""); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {artistError && <p style={{ fontSize: "12px", color: "#f08080", padding: "8px 12px", borderRadius: "8px", background: "rgba(240,80,80,0.08)", border: "1px solid rgba(240,80,80,0.2)" }}>{artistError}</p>}
                  {[
                    { label: "Nom d'artiste", ph: "Ex: Idylle Mamba", val: artistStageName, set: setArtistStageName },
                    { label: "Genre musical", ph: "Ex: Afro-Folk, Hip-Hop...", val: artistGenre, set: setArtistGenre },
                    { label: "Ville", ph: "Ex: Bangui", val: artistCity, set: setArtistCity },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>{f.label}</label>
                      <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s" }}
                        onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(232,96,26,0.5)"}
                        onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button onClick={() => setArtistStep(1)} style={{ padding: "13px 16px", borderRadius: "10px", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>← Retour</button>
                    <button disabled={artistCreating || !artistStageName.trim()} onClick={async () => {
                      setArtistCreating(true); setArtistError("");
                      try {
                        const res = await becomeArtist({ stage_name: artistStageName.trim(), genre: artistGenre.trim(), city: artistCity.trim() });
                        localStorage.setItem("ebia_token", res.access_token);
                        updateUser({ role: "artist" });
                        setHasArtistProfile(true);
                        setArtistModalOpen(false); setArtistStep(1);
                        navigate("/artist-dashboard");
                      } catch (e: unknown) {
                        setArtistError(e instanceof Error ? e.message : "Erreur de création");
                      } finally { setArtistCreating(false); }
                    }} style={{ flex: 1, padding: "13px", borderRadius: "10px", background: artistCreating || !artistStageName.trim() ? "rgba(232,96,26,0.4)" : "var(--amber)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: artistCreating || !artistStageName.trim() ? "not-allowed" : "pointer", letterSpacing: "0.06em", textTransform: "uppercase", opacity: artistCreating ? 0.7 : 1 }}>
                      {artistCreating ? "Création…" : "Créer mon profil artiste"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
