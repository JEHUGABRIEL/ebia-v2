import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getArtists, getTracks, searchTracks, getTrendingTracks, getRetroTracks, type Artist, type Track } from "../lib/api";
import { MapPin, Search, CheckCircle, Pause, Music2, Clock, Headphones, Mic2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";

type Tab = "artists" | "tracks";
type TrackFilter = "all" | "trending" | "new" | "retro";

const GENRES = [
  "Afro-Pop", "Hip-Hop", "Afro-Trap", "Gospel", "Soukous",
  "R&B", "Jazz", "Afro-Folk", "Traditionnel", "Afro-Beat", "Ndombolo",
];

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying } = useApp();
  const [tab, setTab] = useState<Tab>("artists");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getArtists().then(r => setArtists(r.data)).finally(() => setLoading(false));
  }, []);

  // Load tracks based on filter
  const loadTracks = useCallback(async (filter: TrackFilter) => {
    setSearching(true);
    try {
      let data: Track[] = [];
      if (filter === "trending") {
        const res = await getTrendingTracks(50);
        data = Array.isArray(res) ? res : [];
      } else if (filter === "retro") {
        const res = await getRetroTracks(50);
        data = Array.isArray(res) ? res : [];
      } else if (filter === "new") {
        const res = await getTracks();
        data = (res.data || []).sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      } else {
        const res = await getTracks();
        data = res.data || [];
      }
      setTracks(data);
    } catch {
      setTracks([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Search tracks by query
  const doSearch = useCallback(async (q: string) => {
    if (tab !== "tracks") return;
    if (q.length < 2) { loadTracks(trackFilter); return; }
    setSearching(true);
    try {
      const results = await searchTracks(q, 50);
      setTracks(results);
    } catch {
      setTracks([]);
    } finally {
      setSearching(false);
    }
  }, [tab, loadTracks, trackFilter]);

  // When switching to tracks tab, load tracks
  useEffect(() => {
    if (tab !== "tracks") return;
    if (search.length >= 2) {
      const timer = setTimeout(() => doSearch(search), 300);
      return () => clearTimeout(timer);
    }
    loadTracks(trackFilter);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search when typing
  useEffect(() => {
    if (tab !== "tracks") return;
    if (search.length >= 2) {
      const timer = setTimeout(() => doSearch(search), 300);
      return () => clearTimeout(timer);
    }
    loadTracks(trackFilter);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload tracks when filter changes
  useEffect(() => {
    if (tab !== "tracks") return;
    if (search.length >= 2) return; // don't override search results
    loadTracks(trackFilter);
  }, [trackFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredArtists = artists.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.genre || "").toLowerCase().includes(search.toLowerCase());
    const matchGenre = !genre || (a.genre || "") === genre;
    return matchSearch && matchGenre;
  });

  const filteredTracks = tracks.filter(t => {
    const matchGenre = !genre || t.genre === genre;
    return matchGenre;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        paddingTop: "120px", paddingBottom: "48px",
        maxWidth: "1360px", margin: "0 auto", padding: "120px 24px 48px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-20%", right: "-15%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,96,26,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em",
            color: "var(--amber)", textTransform: "uppercase", marginBottom: "12px",
          }}>
            {t("explore.tag")}
          </div>
          <h1 className="bebas" style={{
            fontSize: "clamp(48px, 8vw, 96px)", color: "var(--text)",
            lineHeight: 0.92, marginBottom: "12px",
          }}>
            {t("explore.title")}
          </h1>
          <p style={{ fontSize: "15px", color: "var(--muted)", maxWidth: "500px" }}>
            {t("explore.subtitle")}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>

        {/* ── TABS + SEARCH ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "16px", marginBottom: "24px", flexWrap: "wrap",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "14px", background: "rgba(240,235,227,0.04)" }}>
            {([
              { key: "artists" as Tab, icon: Headphones, label: t("explore.tabArtists") },
              { key: "tracks" as Tab, icon: Music2, label: t("explore.tabTracks") },
            ]).map(item => (
              <button key={item.key} onClick={() => { setTab(item.key); setSearch(""); setGenre("Tous"); setTrackFilter("all"); }} style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 20px", borderRadius: "10px",
                background: tab === item.key ? "rgba(232,96,26,0.15)" : "transparent",
                color: tab === item.key ? "var(--amber)" : "var(--muted)",
                fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
                transition: "all 0.2s",
              }}>
                <item.icon size={15} /> {item.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", minWidth: "280px", maxWidth: "380px", flex: 1 }}>
            <Search size={15} style={{
              position: "absolute", left: "16px", top: "50%",
              transform: "translateY(-50%)", color: "var(--muted)",
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === "artists" ? t("explore.searchPlaceholder") : t("explore.searchTracksPlaceholder")}
              style={{
                width: "100%", padding: "14px 18px 14px 44px", borderRadius: "99px",
                background: "rgba(240,235,227,0.05)", border: "1px solid rgba(240,235,227,0.1)",
                color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(232,96,26,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(240,235,227,0.1)")}
            />
          </div>
        </div>

        {/* ── TRACK FILTERS (trending/new/retro) ── */}
        {tab === "tracks" && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            {([
              { key: "all" as TrackFilter, label: "Tous", icon: "🎵" },
              { key: "trending" as TrackFilter, label: "Tendances", icon: "🔥" },
              { key: "new" as TrackFilter, label: "Nouveautés", icon: "✨" },
              { key: "retro" as TrackFilter, label: "Rétro", icon: "💿" },
            ]).map(f => (
              <button key={f.key} onClick={() => { setTrackFilter(f.key); setSearch(""); }} style={{
                padding: "8px 18px", borderRadius: "99px", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em",
                border: `1px solid ${trackFilter === f.key ? "var(--amber)" : "rgba(240,235,227,0.1)"}`,
                background: trackFilter === f.key ? "rgba(232,96,26,0.15)" : "transparent",
                color: trackFilter === f.key ? "var(--amber)" : "var(--muted)",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { if (trackFilter !== f.key) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.25)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}}
                onMouseLeave={e => { if (trackFilter !== f.key) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.1)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}}
              >{f.icon} {f.label}</button>
            ))}
          </div>
        )}

        {/* ── GENRE FILTERS ── */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenre(genre === g ? null : g)} style={{
              padding: "8px 18px", borderRadius: "99px", cursor: "pointer",
              fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em",
              border: `1px solid ${genre === g ? "var(--amber)" : "rgba(240,235,227,0.1)"}`,
              background: genre === g ? "rgba(232,96,26,0.15)" : "transparent",
              color: genre === g ? "var(--amber)" : "var(--muted)",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (genre !== g) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.25)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}}
              onMouseLeave={e => { if (genre !== g) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.1)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}}
            >{g}</button>
          ))}
        </div>

        {/* ── COUNT ── */}
        {!loading && (
          <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "24px" }}>
            {tab === "artists"
              ? t("explore.artistCount", { count: filteredArtists.length, defaultValue: filteredArtists.length + " artistes" })
              : t("explore.trackCount", { count: filteredTracks.length, defaultValue: filteredTracks.length + " titres" })
            }
          </p>
        )}

        {/* ── ARTISTS GRID ── */}
        {tab === "artists" && (
          loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ borderRadius: "16px", overflow: "hidden", background: "rgba(240,235,227,0.04)" }}>
                  <div style={{ aspectRatio: "1", background: "rgba(240,235,227,0.06)", animation: "pulse 1.5s infinite" }} />
                  <div style={{ padding: "16px" }}>
                    <div style={{ height: "14px", borderRadius: "99px", background: "rgba(240,235,227,0.06)", marginBottom: "8px" }} />
                    <div style={{ height: "11px", width: "60%", borderRadius: "99px", background: "rgba(240,235,227,0.04)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArtists.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="bebas" style={{ fontSize: "32px", color: "var(--muted)" }}>{t("explore.noArtists")}</div>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "8px" }}>{t("explore.noArtistsHint")}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
              {filteredArtists.map((artist) => (
                <Link key={artist.id} to={`/artist/${artist.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    borderRadius: "16px", overflow: "hidden",
                    background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.07)",
                    transition: "transform 0.22s ease, border-color 0.22s ease", cursor: "pointer",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.25)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.07)"; }}
                  >
                    <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative" }}>
                      {artist.avatar_url ? (
                        <img src={artist.avatar_url} alt={artist.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"} />
                      ) : (
                        <div style={{
                          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: "linear-gradient(135deg, rgba(232,96,26,0.2), rgba(201,147,10,0.1))",
                        }}>
                          <span className="bebas" style={{ fontSize: "64px", color: "var(--amber)", opacity: 0.6 }}>{artist.name[0]}</span>
                        </div>
                      )}
                      {artist.verified && (
                        <div style={{
                          position: "absolute", top: "10px", right: "10px", width: "26px", height: "26px",
                          borderRadius: "50%", background: "rgba(8,8,8,0.75)", display: "flex",
                          alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)",
                        }}>
                          <CheckCircle size={14} style={{ color: "var(--amber)" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "16px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.name}</p>
                      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.genre}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={10} style={{ color: "var(--muted)", flexShrink: 0 }} />
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>{artist.city}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* ── CTA: Devenir artiste ── */}
        {tab === "artists" && (
          <div style={{
            marginTop: "48px", marginBottom: "48px", padding: "40px 48px",
            borderRadius: "20px", background: "linear-gradient(135deg, rgba(232,96,26,0.08), rgba(201,147,10,0.04))",
            border: "1px solid rgba(232,96,26,0.15)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px",
                background: "rgba(232,96,26,0.15)", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Mic2 size={26} style={{ color: "var(--amber)" }} />
              </div>
              <div>
                <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>
                  Vous êtes artiste ?
                </p>
                <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "420px" }}>
                  Publiez votre musique, touchez des milliers d'auditeurs et construisez votre communauté en RCA.
                </p>
              </div>
            </div>
            <button onClick={() => navigate("/login")} style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px", borderRadius: "99px",
              background: "var(--amber)", color: "#fff",
              fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer",
              transition: "box-shadow 0.2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,96,26,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              Devenir artiste <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── TRACKS LIST ── */}
        {tab === "tracks" && (
          searching ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                border: "3px solid rgba(232,96,26,0.2)", borderTopColor: "var(--amber)",
                animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
              }} />
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>{t("explore.searching")}</p>
            </div>
          ) : search.length < 2 && trackFilter === "all" ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Search size={40} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
              <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--muted)" }}>{t("explore.typeToSearch")}</p>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px" }}>{t("explore.typeToSearchHint")}</p>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Music2 size={40} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
              <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{t("explore.noTracks")}</p>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px" }}>{t("explore.noTracksHint")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {filteredTracks.map((track, idx) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                return (
                  <div key={track.id}
                    onClick={() => playTrack({ id: track.id, title: track.title, artist: (track as Record<string, unknown> & { artistName?: string }).artistName || "", audioUrl: (track as Record<string, unknown> & { audioUrl?: string }).audioUrl || "", duration: track.duration_s })}
                    style={{
                      display: "grid", gridTemplateColumns: "48px 1fr auto auto",
                      gap: "16px", alignItems: "center",
                      padding: "12px 16px", borderRadius: "12px",
                      background: isCurrentTrack ? "rgba(232,96,26,0.08)" : "transparent",
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (!isCurrentTrack) (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"; }}
                    onMouseLeave={e => { if (!isCurrentTrack) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Number / Play */}
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "8px",
                      background: isCurrentTrack ? "rgba(232,96,26,0.15)" : "rgba(240,235,227,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {isCurrentTrack && isPlaying ? (
                        <Pause size={14} style={{ color: "var(--amber)" }} />
                      ) : (
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>{idx + 1}</span>
                      )}
                    </div>

                    {/* Title + Artist */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: "14px", fontWeight: 600,
                        color: isCurrentTrack ? "var(--amber)" : "var(--text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{track.title}</p>
                      <p style={{
                        fontSize: "12px", color: "var(--muted)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{(track as Record<string, unknown> & { artist_name?: string }).artist_name || "Artiste inconnu"}</p>
                    </div>

                    {/* Genre badge */}
                    <span style={{
                      padding: "3px 10px", borderRadius: "99px",
                      background: "rgba(240,235,227,0.06)",
                      fontSize: "10px", fontWeight: 600, color: "var(--muted)",
                      whiteSpace: "nowrap",
                    }}>{track.genre}</span>

                    {/* Duration */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Clock size={12} style={{ color: "var(--muted)" }} />
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>{fmtDur(track.duration_s)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
