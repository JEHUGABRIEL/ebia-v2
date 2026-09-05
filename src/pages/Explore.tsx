import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTracks, searchTracks, getTrendingTracks, getRetroTracks, getDiscoverTracks,
  type DiscoverMode,
} from "../lib/api";
import { Search, Pause, Play, Music2, Clock, Mic2, ArrowRight, Sparkles, ListMusic, TrendingUp, Disc } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";

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

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Rangée de titres à défilement horizontal, avec un auto-défilement continu
 * propre à chaque section (vitesse + sens) : c'est ce qui donne à chaque
 * section de /explore une "signature" de défilement différente, en plus de
 * son animation d'entrée. Se met en pause au survol / au toucher pour ne
 * pas gêner un choix manuel, et rebondit en douceur aux extrémités.
 */
function TrackRow({
  list, isLoading, coverRadius = "12px", currentTrackId, isPlaying, onPlay,
  autoScrollSpeed = 0, autoScrollDirection = 1,
}: {
  list: RowTrack[]; isLoading: boolean; coverRadius?: string;
  currentTrackId?: string; isPlaying: boolean;
  onPlay: (track: RowTrack, list: RowTrack[]) => void;
  autoScrollSpeed?: number; autoScrollDirection?: 1 | -1;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const dirRef = useRef<1 | -1>(autoScrollDirection);

  useEffect(() => {
    if (!autoScrollSpeed || isLoading || list.length === 0 || prefersReducedMotion()) return;
    const el = scrollerRef.current;
    if (!el) return;
    dirRef.current = autoScrollDirection;
    if (autoScrollDirection === -1) el.scrollLeft = el.scrollWidth;

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current && el.scrollWidth > el.clientWidth + 1) {
        el.scrollLeft += dirRef.current * autoScrollSpeed * (dt / 16.67);
        if (el.scrollLeft <= 0) { el.scrollLeft = 0; dirRef.current = 1; }
        else if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) { el.scrollLeft = el.scrollWidth - el.clientWidth; dirRef.current = -1; }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [autoScrollSpeed, autoScrollDirection, isLoading, list.length]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  return (
    <div ref={scrollerRef}
      onMouseEnter={pause} onMouseLeave={resume}
      onPointerDown={pause} onPointerUp={resume} onPointerCancel={resume}
      style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" }}
    >
      {isLoading
        ? [...Array(6)].map((_, i) => (
          <div key={i} style={{ width: "170px", flexShrink: 0 }}>
            <div style={{ aspectRatio: "1", borderRadius: coverRadius, background: "rgba(240,235,227,0.06)", animation: "pulse 1.5s infinite", marginBottom: "10px" }} />
            <div style={{ height: "12px", width: "80%", borderRadius: "99px", background: "rgba(240,235,227,0.06)", marginBottom: "6px" }} />
            <div style={{ height: "10px", width: "50%", borderRadius: "99px", background: "rgba(240,235,227,0.04)" }} />
          </div>
        ))
        : list.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--muted)", padding: "16px 0" }}>Rien à afficher pour l'instant.</p>
        ) : list.map(track => {
          const isCurrentTrack = currentTrackId === track.id;
          const isCircular = coverRadius === "9999px";
          return (
            <div key={track.id} className="track-card" style={{ width: "170px", flexShrink: 0, cursor: "pointer" }}
              onClick={() => onPlay(track, list)}
            >
              <div style={{
                position: "relative", aspectRatio: "1", borderRadius: coverRadius, overflow: "hidden", marginBottom: "10px",
                background: "linear-gradient(135deg, rgba(232,96,26,0.18), rgba(201,147,10,0.08))",
                transition: "transform 0.3s ease",
              }}>
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Music2 size={32} style={{ color: "var(--amber)", opacity: 0.5 }} />
                  </div>
                )}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 100%)",
                }} />
                <div style={isCircular ? {
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  width: "38px", height: "38px", borderRadius: "50%",
                  background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(232,96,26,0.4)",
                } : {
                  position: "absolute", bottom: "10px", right: "10px",
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(232,96,26,0.4)",
                }}>
                  {isCurrentTrack && isPlaying
                    ? <Pause size={13} fill="white" color="white" />
                    : <Play size={13} fill="white" color="white" style={{ marginLeft: "1px" }} />}
                </div>
              </div>
              <p style={{
                fontSize: "13px", fontWeight: 700, color: isCurrentTrack ? "var(--amber)" : "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px",
              }}>{track.title}</p>
              <p style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {track.artist_name || "Artiste inconnu"}
              </p>
            </div>
          );
        })}
    </div>
  );
}

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, playTrack, currentTrack, isPlaying } = useApp();
  const [search, setSearch] = useState("");
  /* Flux "Recommandations" / "Mixés pour vous" / "Pour vous" (même algo de préférence). */
  const [recTracks, setRecTracks] = useState<RowTrack[]>([]);
  const [recMode, setRecMode] = useState<DiscoverMode | "catalog">("catalog");
  const [recGenres, setRecGenres] = useState<string[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  /* Catalogue : tendances / nouveautés / rétro — chargés une fois, indépendamment */
  const [trendingList, setTrendingList] = useState<RowTrack[]>([]);
  const [newList, setNewList] = useState<RowTrack[]>([]);
  const [retroList, setRetroList] = useState<RowTrack[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  /* Recherche (remplace les sections catalogue tant qu'une requête est active) */
  const [searchResults, setSearchResults] = useState<RowTrack[]>([]);
  const [searching, setSearching] = useState(false);

  /* Restreint la personnalisation aux auditeurs connectés. */
  const personalized = !!user && user.role !== "artist" && user.role !== "admin";

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

  /* ── Flux "Pour vous" (l'algo de préférence) : Recommandations + Mixés + section Pour vous ── */
  const loadRecommended = useCallback(async (silent = false) => {
    if (!silent) setRecLoading(true);
    try {
      const res = await getDiscoverTracks();
      setRecTracks(res.data.map(toRow));
      setRecMode(res.mode);
      setRecGenres(res.genres);
    } catch {
      try {
        const res = await getTracks({ limit: "30" });
        setRecTracks(res.data.map(toRow));
        setRecMode("catalog");
      } catch {
        setRecTracks([]);
      }
    } finally {
      if (!silent) setRecLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Catalogue : tendances / nouveautés / rétro, chargés une fois ── */
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    const [trendRes, allRes, retroRes] = await Promise.allSettled([
      getTrendingTracks(20),
      getTracks({ limit: "50" }),
      getRetroTracks(20),
    ]);
    setTrendingList(trendRes.status === "fulfilled" && Array.isArray(trendRes.value) ? trendRes.value.map(toRow) : []);
    if (allRes.status === "fulfilled") {
      const sorted = [...(allRes.value.data || [])].sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setNewList(sorted.slice(0, 20).map(toRow));
    } else {
      setNewList([]);
    }
    setRetroList(retroRes.status === "fulfilled" && Array.isArray(retroRes.value) ? retroRes.value.map(toRow) : []);
    setCatalogLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search tracks by query (catalogue complet)
  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const results = await searchTracks(q, 50);
      setSearchResults(results.map(toRow));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  /* ── Chargement initial ── */
  useEffect(() => {
    loadRecommended();
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search when typing (filtre les artistes côté client, cherche les titres côté serveur)
  useEffect(() => {
    if (search.trim().length >= 2) {
      const timer = setTimeout(() => doSearch(search.trim()), 300);
      return () => clearTimeout(timer);
    }
    setSearchResults([]);
  }, [search, doSearch]);

  /* ── L'activité (une écoute) affine le feed implicite/aléatoire ── */
  const lastPlayedRef = { id: currentTrack?.id };
  useEffect(() => {
    if (!personalized) return;
    if (!currentTrack?.id) return;
    if (recMode === "explicit") return;
    // Rafraîchit discrètement le flux non explicite après une écoute.
    loadRecommended(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPlayedRef.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSearching = search.trim().length >= 2;
  const showRecModeBanner = personalized && recMode !== "catalog";

  const toPlayable = (t: RowTrack) => ({
    id: t.id, title: t.title, artist: t.artist_name || "", audioUrl: t.audioUrl || "",
    coverUrl: t.coverUrl, duration: t.duration_s,
  });

  /**
   * "Mixés pour vous" : regroupe le flux de recommandations par genre, à la
   * manière des Daily Mix Spotify / Mix Deezer — pas d'endpoint public pour
   * parcourir les albums (seule la gestion d'albums d'un artiste existe côté
   * API), donc le regroupement se fait sur les titres.
   */
  const genreMixes = useMemo(() => {
    const byGenre = new Map<string, RowTrack[]>();
    recTracks.forEach(track => {
      const g = track.genre || "Autres";
      if (!byGenre.has(g)) byGenre.set(g, []);
      byGenre.get(g)!.push(track);
    });
    const order = recGenres.length > 0
      ? [...recGenres.filter(g => byGenre.has(g)), ...Array.from(byGenre.keys()).filter(g => !recGenres.includes(g))]
      : Array.from(byGenre.keys()).sort((a, b) => (byGenre.get(b)?.length || 0) - (byGenre.get(a)?.length || 0));
    return order
      .map(g => ({ genre: g, tracks: byGenre.get(g)! }))
      .filter(mix => mix.tracks.length >= 2)
      .slice(0, 6);
  }, [recTracks, recGenres]);

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
        <div style={{ marginBottom: "40px" }}>
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

        {isSearching ? (
          /* ══════════ RÉSULTATS DE RECHERCHE ══════════ */
          <div style={{ marginBottom: "56px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
              Résultats pour « {search.trim()} »
            </h2>
            {searching ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  border: "3px solid rgba(232,96,26,0.2)", borderTopColor: "var(--amber)",
                  animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
                }} />
                <p style={{ fontSize: "14px", color: "var(--muted)" }}>{t("explore.searching")}</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Music2 size={40} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
                <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{t("explore.noTracks")}</p>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px" }}>{t("explore.noTracksHint")}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {searchResults.map((track, idx) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <div key={track.id}
                      onClick={() => playTrack(toPlayable(track), searchResults.map(toPlayable))}
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
                      <span style={{
                        padding: "3px 10px", borderRadius: "99px",
                        background: "rgba(240,235,227,0.06)",
                        fontSize: "10px", fontWeight: 600, color: "var(--muted)",
                        whiteSpace: "nowrap",
                      }}>{track.genre}</span>
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
        ) : (
          <>
            {/* ══════════ NOUVEAUTÉS ══════════ */}
            <div className="explore-section anim-fade-up" style={{ marginBottom: "56px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
                ✨ Nouveautés
              </h2>
              <TrackRow list={newList} isLoading={catalogLoading} coverRadius="9999px"
                currentTrackId={currentTrack?.id} isPlaying={isPlaying}
                onPlay={(t, l) => playTrack(toPlayable(t), l.map(toPlayable))}
                autoScrollSpeed={0.3} autoScrollDirection={1} />
            </div>

            {/* ══════════ TENDANCES ══════════ */}
            <div className="explore-section anim-slide-left" style={{ marginBottom: "56px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
                <TrendingUp size={19} style={{ color: "var(--amber)" }} /> Tendances
              </h2>
              <TrackRow list={trendingList} isLoading={catalogLoading}
                currentTrackId={currentTrack?.id} isPlaying={isPlaying}
                onPlay={(t, l) => playTrack(toPlayable(t), l.map(toPlayable))}
                autoScrollSpeed={0.55} autoScrollDirection={-1} />
            </div>

            {/* ══════════ RECOMMANDATIONS ══════════ */}
            {(recLoading || recTracks.length > 0) && (
              <div className="explore-section anim-zoom-in" style={{ marginBottom: "56px" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
                  <Sparkles size={19} style={{ color: "var(--amber)" }} /> Recommandations
                </h2>

                {showRecModeBanner && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    marginBottom: "18px", padding: "10px 16px", borderRadius: "12px",
                    background: "rgba(232,96,26,0.06)", border: "1px solid rgba(232,96,26,0.15)",
                    color: "var(--amber)", fontSize: "12.5px", fontWeight: 600,
                  }}>
                    <Sparkles size={14} style={{ flexShrink: 0 }} />
                    <span>{MODE_LABEL[recMode]}{recMode === "explicit" && recGenres.length > 0 ? ` — ${recGenres.join(", ")}` : ""}</span>
                  </div>
                )}

                <TrackRow list={recTracks.slice(0, 14)} isLoading={recLoading}
                  currentTrackId={currentTrack?.id} isPlaying={isPlaying}
                  onPlay={(t, l) => playTrack(toPlayable(t), l.map(toPlayable))}
                  autoScrollSpeed={0.65} autoScrollDirection={1} />
              </div>
            )}

            {/* ══════════ MIXÉS POUR VOUS (playlists par genre, façon Daily Mix) ══════════ */}
            {genreMixes.length > 0 && (
              <div className="explore-section anim-slide-right" style={{ marginBottom: "56px" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
                  <ListMusic size={19} style={{ color: "var(--amber)" }} /> Mixés pour vous
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
                  {genreMixes.map(({ genre: mixGenre, tracks: mixTracks }) => {
                    const covers = mixTracks.slice(0, 4).map(t => t.coverUrl);
                    return (
                      <div key={mixGenre}
                        onClick={() => playTrack(toPlayable(mixTracks[0]), mixTracks.map(toPlayable))}
                        style={{
                          borderRadius: "16px", overflow: "hidden", cursor: "pointer",
                          background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.07)",
                          transition: "transform 0.22s ease, border-color 0.22s ease",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.25)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.07)"; }}
                      >
                        <div style={{ position: "relative", aspectRatio: "1" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", width: "100%", height: "100%" }}>
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} style={{
                                overflow: "hidden",
                                background: "linear-gradient(135deg, rgba(232,96,26,0.2), rgba(201,147,10,0.1))",
                              }}>
                                {covers[i] ? (
                                  <img src={covers[i]!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                ) : (
                                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Music2 size={20} style={{ color: "var(--amber)", opacity: 0.4 }} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div style={{
                            position: "absolute", bottom: "12px", right: "12px",
                            width: "40px", height: "40px", borderRadius: "50%",
                            background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 20px rgba(232,96,26,0.45)",
                          }}>
                            <Play size={15} fill="white" color="white" style={{ marginLeft: "1px" }} />
                          </div>
                        </div>
                        <div style={{ padding: "16px" }}>
                          <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Mix {mixGenre}</p>
                          <p style={{ fontSize: "12px", color: "var(--muted)" }}>{mixTracks.length} titres</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════ RÉTRO ══════════ */}
            <div className="explore-section anim-flip-in" style={{ marginBottom: "56px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
                <Disc size={19} style={{ color: "var(--amber)" }} /> Rétro
              </h2>
              <TrackRow list={retroList} isLoading={catalogLoading}
                currentTrackId={currentTrack?.id} isPlaying={isPlaying}
                onPlay={(t, l) => playTrack(toPlayable(t), l.map(toPlayable))}
                autoScrollSpeed={0.4} autoScrollDirection={-1} />
            </div>

            {/* ── CTA: Devenir artiste ── */}
            <div className="explore-section anim-fade-up" style={{
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
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes flipIn { from { opacity: 0; transform: perspective(800px) rotateX(-12deg); } to { opacity: 1; transform: perspective(800px) rotateX(0deg); } }

        .explore-section { animation-duration: 0.7s; animation-timing-function: ease-out; animation-fill-mode: both; }
        .anim-fade-up { animation-name: fadeUp; }
        .anim-slide-left { animation-name: slideLeft; }
        .anim-slide-right { animation-name: slideRight; }
        .anim-zoom-in { animation-name: zoomIn; animation-duration: 0.6s; }
        .anim-flip-in { animation-name: flipIn; animation-duration: 0.8s; }

        .track-card:hover > div:first-child { transform: scale(1.045); }
      `}</style>
    </div>
  );
}
