import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getArtists, getTracks, searchTracks, getTrendingTracks, getRetroTracks,
  getDiscoverArtists, getDiscoverTracks, canonGenre,
  type DiscoverArtist, type DiscoverMode,
} from "../lib/api";
import { filterFeedByQuery } from "../lib/preferences";
import { MapPin, Search, CheckCircle, Pause, Music2, Clock, Headphones, Mic2, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";

type TrackFilter = "all" | "trending" | "new" | "retro";

/**
 * Forme normalisée d'un titre affiché dans la liste (catalogue ou flux
 * personnalisé) — le lecteur et la ligne n'ont besoin que de ces champs.
 */
type RowTrack = {
  id: string; title: string; genre: string; duration_s: number;
  plays_count: number; likes_count: number;
  artist_name?: string; artist_id?: string; artist_avatar?: string;
  audioUrl?: string; coverUrl?: string; createdAt?: string;
};

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* Libellé court du mode de personnalisation en cours. */
const MODE_LABEL: Record<DiscoverMode | "catalog", string> = {
  explicit: "Selon vos genres musicaux",
  implicit: "Adapté à vos écoutes et à votre activité",
  none: "Découverte du jour — mélangée pour vous",
  catalog: "Catalogue complet",
};

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, playTrack, currentTrack, isPlaying } = useApp();
  const [artists, setArtists] = useState<DiscoverArtist[]>([]);
  const [tracks, setTracks] = useState<RowTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [searching, setSearching] = useState(false);
  /* Personnalisation */
  const [artistsMode, setArtistsMode] = useState<DiscoverMode | "catalog">("catalog");
  const [tracksMode, setTracksMode] = useState<DiscoverMode | "catalog">("catalog");
  const [prefGenres, setPrefGenres] = useState<string[]>([]);

  /* Restreint la personnalisation aux auditeurs connectés. */
  const personalized = !!user && user.role !== "artist" && user.role !== "admin";

  /* ── Chargement du flux d'artistes personnalisé ── */
  const loadArtistsFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (personalized) {
        const res = await getDiscoverArtists();
        setArtists(res.data);
        setArtistsMode(res.mode);
        setPrefGenres(res.genres);
      } else {
        const res = await getArtists();
        setArtists(res.data.map(a => ({
          id: a.id, slug: a.slug, name: a.name, genre: a.genre, city: a.city,
          avatar_url: a.avatar_url, cover_url: a.cover_url, verified: a.verified,
          plays_count: a.plays_count, followers_count: a.followers_count,
        })));
        setArtistsMode("catalog");
        setPrefGenres([]);
      }
    } catch {
      /* Repli : catalogue public en cas d'échec */
      const res = await getArtists().catch(() => ({ data: [] }));
      setArtists(res.data.map(a => ({
        id: a.id, slug: a.slug, name: a.name, genre: a.genre, city: a.city,
        avatar_url: a.avatar_url, cover_url: a.cover_url, verified: a.verified,
        plays_count: a.plays_count, followers_count: a.followers_count,
      })));
      setArtistsMode("catalog");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [personalized]);

  /* ── Chargement du flux de titres ── */
  const toRow = (d: {
    id: string; title: string; genre: string; duration_s: number;
    plays_count: number; likes_count: number;
    artist_name?: string | null; artist_id?: string | null; artist_avatar?: string | null;
    audio_url?: string | null; cover_url?: string | null; createdAt?: string | null;
  }): RowTrack => ({
    id: d.id, title: d.title, genre: d.genre, duration_s: d.duration_s,
    plays_count: d.plays_count, likes_count: d.likes_count,
    artist_name: d.artist_name ?? undefined,
    artist_id: d.artist_id ?? undefined,
    artist_avatar: d.artist_avatar ?? undefined,
    audioUrl: d.audio_url ?? undefined,
    coverUrl: d.cover_url ?? undefined,
    createdAt: d.createdAt ?? undefined,
  });

  const loadTracksFeed = useCallback(async (silent = false) => {
    if (!silent) setSearching(true);
    try {
      if (personalized) {
        const res = await getDiscoverTracks();
        setTracks(res.data.map(toRow));
        setTracksMode(res.mode);
        if (res.genres.length) setPrefGenres(res.genres);
      } else {
        const res = await getTracks();
        setTracks(res.data.map(toRow));
        setTracksMode("catalog");
      }
    } catch {
      const res = await getTracks().catch(() => ({ data: [] }));
      setTracks(res.data.map(toRow));
      setTracksMode("catalog");
    } finally {
      if (!silent) setSearching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalized]);

  /* ── Chargement du catalogue complet (tendances / nouveautés / rétro) ── */
  const loadCatalogTracks = useCallback(async (filter: TrackFilter) => {
    setSearching(true);
    setTracksMode("catalog");
    try {
      let data: RowTrack[] = [];
      if (filter === "trending") {
        const res = await getTrendingTracks(50);
        data = (Array.isArray(res) ? res : []).map(toRow);
      } else if (filter === "retro") {
        const res = await getRetroTracks(50);
        data = (Array.isArray(res) ? res : []).map(toRow);
      } else if (filter === "new") {
        const res = await getTracks();
        data = (res.data || []).map(toRow).sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      } else {
        await loadTracksFeed(true);
        return;
      }
      setTracks(data);
    } catch {
      setTracks([]);
    } finally {
      setSearching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTracksFeed]);

  // Search tracks by query (catalogue complet)
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { loadCatalogTracks(trackFilter); return; }
    setSearching(true);
    try {
      const results = await searchTracks(q, 50);
      setTracks(results.map(toRow));
    } catch {
      setTracks([]);
    } finally {
      setSearching(false);
    }
  }, [loadCatalogTracks, trackFilter]);

  /* ── Chargement initial : artistes + titres ── */
  useEffect(() => {
    loadArtistsFeed();
    loadCatalogTracks(trackFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search when typing (filtre les artistes côté client, cherche les titres côté serveur)
  useEffect(() => {
    if (search.length >= 2) {
      const timer = setTimeout(() => doSearch(search), 300);
      return () => clearTimeout(timer);
    }
    loadCatalogTracks(trackFilter);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload tracks when filter changes
  useEffect(() => {
    if (search.length >= 2) return; // don't override search results
    loadCatalogTracks(trackFilter);
  }, [trackFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── L'activité (une écoute) affine le feed implicite/aléatoire ── */
  const lastPlayedRef = { id: currentTrack?.id };
  useEffect(() => {
    if (!personalized) return;
    if (!currentTrack?.id) return;
    if (artistsMode === "explicit" && tracksMode === "explicit") return;
    // Rafraîchit discrètement les flux non explicites après une écoute.
    loadArtistsFeed(true);
    loadTracksFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPlayedRef.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const feedGenres = prefGenres.length > 0
    ? prefGenres
    : Array.from(new Set([...artists.map(a => a.genre), ...tracks.map(t => t.genre)].filter(Boolean)));

  const filteredArtists = filterFeedByQuery(artists, search, genre);
  const filteredTracks = filterFeedByQuery(tracks, "", genre);

  const showArtistModeBanner = personalized && artistsMode !== "catalog";
  const showTrackModeBanner = personalized && trackFilter === "all" && search.length < 2 && tracksMode !== "catalog";

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

        {/* ── SEARCH ── */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ position: "relative", minWidth: "280px", maxWidth: "480px" }}>
            <Search size={15} style={{
              position: "absolute", left: "16px", top: "50%",
              transform: "translateY(-50%)", color: "var(--muted)",
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("explore.searchAllPlaceholder")}
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

        {/* ── GENRE FILTERS (genres présents dans les flux affichés) ── */}
        {feedGenres.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "40px" }}>
            {feedGenres.map(g => {
              const sel = genre !== null && canonGenre(genre) === canonGenre(g);
              return (
                <button key={g} onClick={() => setGenre(sel ? null : g)} style={{
                  padding: "8px 18px", borderRadius: "99px", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em",
                  border: `1px solid ${sel ? "var(--amber)" : "rgba(240,235,227,0.1)"}`,
                  background: sel ? "rgba(232,96,26,0.15)" : "transparent",
                  color: sel ? "var(--amber)" : "var(--muted)",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { if (!sel) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.25)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; } }}
                  onMouseLeave={e => { if (!sel) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.1)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; } }}
                >{g}</button>
              );
            })}
          </div>
        )}

        {/* ══════════ SECTION ARTISTES ══════════ */}
        <div style={{ marginBottom: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>
              <Headphones size={19} style={{ color: "var(--amber)" }} /> {t("explore.tabArtists")}
            </h2>
            {!loading && (
              <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                {t("explore.artistCount", { count: filteredArtists.length, defaultValue: filteredArtists.length + " artistes" })}
              </p>
            )}
          </div>

          {showArtistModeBanner && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "18px", padding: "10px 16px", borderRadius: "12px",
              background: "rgba(232,96,26,0.06)", border: "1px solid rgba(232,96,26,0.15)",
              color: "var(--amber)", fontSize: "12.5px", fontWeight: 600,
            }}>
              <Sparkles size={14} style={{ flexShrink: 0 }} />
              <span>
                {MODE_LABEL[artistsMode]}{artistsMode === "explicit" && prefGenres.length > 0
                  ? ` — ${prefGenres.join(", ")}`
                  : ""}
              </span>
            </div>
          )}

          {loading ? (
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
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div className="bebas" style={{ fontSize: "28px", color: "var(--muted)" }}>{t("explore.noArtists")}</div>
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
          )}
        </div>

        {/* ── CTA: Devenir artiste ── */}
        <div style={{
          marginBottom: "56px", padding: "40px 48px",
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

        {/* ══════════ SECTION TITRES ══════════ */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>
              <Music2 size={19} style={{ color: "var(--amber)" }} /> {t("explore.tabTracks")}
            </h2>
            {!searching && (
              <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                {t("explore.trackCount", { count: filteredTracks.length, defaultValue: filteredTracks.length + " titres" })}
              </p>
            )}
          </div>

          {/* Track filters (trending/new/retro) */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {([
              { key: "all" as TrackFilter, label: "Pour vous", icon: "🎯" },
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
                onMouseEnter={e => { if (trackFilter !== f.key) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.25)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; } }}
                onMouseLeave={e => { if (trackFilter !== f.key) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.1)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; } }}
              >{f.icon} {f.label}</button>
            ))}
          </div>

          {showTrackModeBanner && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "18px", padding: "10px 16px", borderRadius: "12px",
              background: "rgba(232,96,26,0.06)", border: "1px solid rgba(232,96,26,0.15)",
              color: "var(--amber)", fontSize: "12.5px", fontWeight: 600,
            }}>
              <Sparkles size={14} style={{ flexShrink: 0 }} />
              <span>{MODE_LABEL[tracksMode]}</span>
            </div>
          )}

          {searching ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                border: "3px solid rgba(232,96,26,0.2)", borderTopColor: "var(--amber)",
                animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
              }} />
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>{t("explore.searching")}</p>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
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
                    onClick={() => playTrack({
                      id: track.id, title: track.title,
                      artist: track.artist_name || "",
                      audioUrl: track.audioUrl || "",
                      coverUrl: track.coverUrl,
                      duration: track.duration_s,
                    }, filteredTracks.map(rt => ({
                      id: rt.id, title: rt.title, artist: rt.artist_name || "",
                      audioUrl: rt.audioUrl || "", coverUrl: rt.coverUrl, duration: rt.duration_s,
                    })))}
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
                      }}>{track.artist_name || "Artiste inconnu"}</p>
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
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
