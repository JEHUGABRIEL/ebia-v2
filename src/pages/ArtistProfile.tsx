import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getArtist, toggleLike, type Artist } from "../lib/api";
import { useApp } from "../context/AppContext";
import {
  Play, Heart, MapPin, ArrowLeft, CheckCircle,
  Headphones, Pause, ListPlus, Disc3, Share2, MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";

/* ── Types ── */
type Track = NonNullable<Artist["tracks"]>[number];

/* ── Helpers ── */
const fmtDuration = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const fmtCount = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : n.toLocaleString("fr-FR");

/* ── Stat card ── */
function StatCard({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "6px",
      padding: "16px", borderRadius: "12px",
      background: "rgba(240,235,227,0.04)",
      border: "1px solid var(--border)",
      transition: "border-color 0.2s, background 0.2s",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(232,96,26,0.2)";
        e.currentTarget.style.background = "rgba(232,96,26,0.06)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "rgba(240,235,227,0.04)";
      }}
    >
      <div style={{ color: "var(--amber)", display: "flex", alignItems: "center", gap: "6px" }}>
        {icon}
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
          {label}
        </span>
      </div>
      <span className="bebas" style={{ fontSize: "28px", color: "var(--text)", lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

/* ── Track row ── */
function TrackRow({
  track, index, isActive, isPlaying: playing, isHovered,
  liked, playCount, likeCount,
  onPlay, onLike, onAddToQueue,
  onHover, onLeave,
}: {
  track: Track; index: number; isActive: boolean; isPlaying: boolean; isHovered: boolean;
  liked: boolean; playCount: number; likeCount: number;
  onPlay: () => void; onLike: (e: React.MouseEvent) => void;
  onAddToQueue: (e: React.MouseEvent) => void;
  onHover: () => void; onLeave: () => void;
}) {
  const showPlayControl = isHovered || isActive;

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onPlay}
      style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr 80px 56px 44px",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        borderRadius: "10px",
        cursor: "pointer",
        background: isActive ? "rgba(232,96,26,0.1)" : isHovered ? "rgba(240,235,227,0.04)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Index / Play control */}
      <div style={{ width: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {showPlayControl ? (
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: isActive ? "var(--amber)" : "rgba(240,235,227,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}>
            {isActive && playing
              ? <Pause size={12} fill="white" color="white" />
              : <Play size={12} fill={isActive ? "white" : "var(--text)"} color={isActive ? "white" : "var(--text)"} style={{ marginLeft: "1px" }} />
            }
          </div>
        ) : (
          <span style={{
            fontSize: "13px", fontWeight: 600,
            color: isActive ? "var(--amber)" : "var(--muted)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {index + 1}
          </span>
        )}
      </div>

      {/* Title + genre */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: "14px", fontWeight: 700,
          color: isActive ? "var(--amber)" : "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: "2px",
        }}>
          {track.title}
        </p>
        <p style={{
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase" as const, color: "var(--muted)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.genre}
        </p>
      </div>

      {/* Plays + queue */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
        {isHovered ? (
          <button
            onClick={onAddToQueue}
            title="Ajouter à la file"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted)", padding: "4px", display: "flex",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
          >
            <ListPlus size={14} />
          </button>
        ) : (
          <span style={{ fontSize: "11px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
            {fmtCount(playCount)}
          </span>
        )}
      </div>

      {/* Like */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
        <button
          onClick={onLike}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center",
            color: liked ? "var(--amber)" : "var(--muted)",
            transition: "color 0.15s", padding: "4px",
          }}
          onMouseEnter={e => { if (!liked) e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={e => { if (!liked) e.currentTarget.style.color = "var(--muted)"; }}
        >
          <Heart size={13} fill={liked ? "currentColor" : "none"} />
        </button>
        <span style={{ fontSize: "10px", color: "var(--muted)", minWidth: "10px", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>
          {likeCount > 0 ? fmtCount(likeCount) : ""}
        </span>
      </div>

      {/* Duration */}
      <span style={{
        fontSize: "12px", color: "var(--muted)",
        fontVariantNumeric: "tabular-nums", textAlign: "right" as const,
        flexShrink: 0,
      }}>
        {fmtDuration(track.duration_s)}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════ */
/*  MAIN COMPONENT                             */
/* ════════════════════════════════════════════ */
export default function ArtistProfile() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const { user, playTrack, addToQueue, setShowLoginModal, currentTrack, isPlaying } = useApp();

  /* ── Fetch artist ── */
  useEffect(() => {
    if (!slug) return;
    getArtist(slug)
      .then(a => {
        setArtist(a);
        const lc: Record<string, number> = {};
        const pc: Record<string, number> = {};
        a.tracks?.forEach(t => {
          lc[t.id] = t.likes_count ?? 0;
          pc[t.id] = t.plays_count ?? 0;
        });
        setLikeCounts(lc);
        setPlayCounts(pc);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Handlers ── */
  const handleFollow = () => {
    if (!user) { setShowLoginModal(true); return; }
    setFollowed(f => !f);
  };

  const makeQueue = useCallback(() =>
    (artist?.tracks ?? []).map(t => ({
      id: t.id, title: t.title, artist: artist!.name,
      audioUrl: "", coverUrl: artist!.avatar_url,
      playsCount: playCounts[t.id], likesCount: likeCounts[t.id],
    })), [artist, playCounts, likeCounts]);

  const handlePlay = useCallback((trackId: string) => {
    if (!artist?.tracks) return;
    const track = artist.tracks.find(t => t.id === trackId);
    if (!track) return;
    playTrack(
      { id: track.id, title: track.title, artist: artist.name, audioUrl: "", coverUrl: artist.avatar_url },
      makeQueue(),
    );
    setPlayCounts(p => ({ ...p, [trackId]: (p[trackId] ?? 0) + 1 }));
  }, [artist, makeQueue, playTrack]);

  const handleAddToQueue = useCallback((e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!artist?.tracks) return;
    const track = artist.tracks.find(t => t.id === trackId);
    if (!track) return;
    addToQueue({ id: track.id, title: track.title, artist: artist.name, audioUrl: "", coverUrl: artist.avatar_url });
  }, [artist, addToQueue]);

  const handleLike = useCallback(async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!user) { setShowLoginModal(true); return; }
    const wasLiked = likedTracks.has(trackId);
    setLikedTracks(s => { const n = new Set(s); wasLiked ? n.delete(trackId) : n.add(trackId); return n; });
    setLikeCounts(c => ({ ...c, [trackId]: Math.max(0, (c[trackId] ?? 0) + (wasLiked ? -1 : 1)) }));
    try {
      const res = await toggleLike(trackId);
      setLikeCounts(c => ({ ...c, [trackId]: res.likes_count }));
    } catch {
      setLikedTracks(s => { const n = new Set(s); wasLiked ? n.add(trackId) : n.delete(trackId); return n; });
      setLikeCounts(c => ({ ...c, [trackId]: Math.max(0, (c[trackId] ?? 0) + (wasLiked ? 1 : -1)) }));
    }
  }, [user, likedTracks]);

  /* ── Loading / Error ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <Disc3 size={32} style={{ color: "var(--amber)", animation: "spin 1.2s linear infinite" }} />
        <span className="bebas" style={{ fontSize: "18px", color: "var(--muted)", letterSpacing: "0.15em" }}>{t("artistProfile.loading")}</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!artist) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <div className="bebas" style={{ fontSize: "48px", color: "var(--muted)", marginBottom: "12px" }}>404</div>
        <p style={{ fontSize: "14px", color: "var(--muted)" }}>{t("artistProfile.notFound")}</p>
        <Link to="/explore" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          marginTop: "24px", padding: "10px 24px", borderRadius: "99px",
          background: "var(--amber)", color: "#fff", fontSize: "13px", fontWeight: 700,
          textDecoration: "none", transition: "opacity 0.15s",
        }}>
          <ArrowLeft size={14} /> {t("artistProfile.backToExplore")}
        </Link>
      </div>
    </div>
  );

  const totalPlays = Object.values(playCounts).reduce((a, b) => a + b, 0) || artist.plays_count || 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ═══ HERO ═══ */}
      <div style={{ position: "relative", height: "70vh", minHeight: "480px", overflow: "hidden" }}>
        {/* Background image */}
        {artist.cover_url || artist.avatar_url ? (
          <img
            src={artist.cover_url || artist.avatar_url}
            alt={artist.name}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 30%",
              filter: "brightness(0.55) saturate(1.2)",
              transition: "transform 8s ease-out",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(232,96,26,0.25) 0%, rgba(201,147,10,0.08) 50%, var(--bg) 100%)",
          }} />
        )}

        {/* Overlays */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,8,0.15) 0%, rgba(8,8,8,0.4) 45%, rgba(8,8,8,0.97) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 70%, rgba(232,96,26,0.1), transparent 65%)", pointerEvents: "none" }} />

        {/* Back button */}
        <Link to="/explore" style={{
          position: "absolute", top: "88px", left: "48px",
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 16px", borderRadius: "99px",
          background: "rgba(8,8,8,0.5)", border: "1px solid rgba(240,235,227,0.12)",
          color: "var(--muted)", textDecoration: "none", fontSize: "13px", fontWeight: 600,
          backdropFilter: "blur(12px)", transition: "all 0.2s", zIndex: 2,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "rgba(240,235,227,0.25)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "rgba(240,235,227,0.12)"; }}
        >
          <ArrowLeft size={14} /> {t("artistProfile.back")}
        </Link>

        {/* Hero content */}
        <div className="fade-up" style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "0 48px 48px", zIndex: 2,
        }}>
          <div style={{ maxWidth: "1360px", margin: "0 auto" }}>
            {/* Verified */}
            {artist.verified && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                <CheckCircle size={14} style={{ color: "var(--amber)" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--amber)" }}>
                  {t("artistProfile.certified")}
                </span>
              </div>
            )}

            {/* Name */}
            <h1 className="bebas" style={{
              fontSize: "clamp(52px, 9vw, 110px)",
              color: "#fff", lineHeight: 0.88,
              marginBottom: "20px", letterSpacing: "0.02em",
            }}>
              {artist.name}
            </h1>

            {/* Meta row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Genre pill */}
              <span style={{
                display: "inline-flex", alignItems: "center",
                padding: "5px 14px", borderRadius: "99px",
                background: "rgba(232,96,26,0.15)", border: "1px solid rgba(232,96,26,0.3)",
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase" as const, color: "var(--amber)",
              }}>
                {artist.genre}
              </span>

              <span style={{ color: "rgba(240,235,227,0.15)", fontSize: "14px" }}>|</span>

              {/* City */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(240,235,227,0.5)" }}>
                <MapPin size={12} /> {artist.city}, RCA
              </div>

              <span style={{ color: "rgba(240,235,227,0.15)", fontSize: "14px" }}>|</span>

              {/* Plays */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(240,235,227,0.5)" }}>
                <Headphones size={12} /> {fmtCount(totalPlays)} écoutes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="fade-up-2" style={{ maxWidth: "1360px", margin: "0 auto", padding: "40px 48px 0" }}>

        {/* Action bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          {/* Play all */}
          {artist.tracks && artist.tracks.length > 0 && (
            <button
              onClick={() => handlePlay(artist.tracks![0].id)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 28px", borderRadius: "99px",
                background: "var(--amber)", border: "none", cursor: "pointer",
                color: "#fff", fontSize: "13px", fontWeight: 700,
                letterSpacing: "0.04em", textTransform: "uppercase" as const,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(232,96,26,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <Play size={16} fill="white" color="white" style={{ marginLeft: "1px" }} />
              Écouter tout
            </button>
          )}

          {/* Follow */}
          <button
            onClick={handleFollow}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "99px", cursor: "pointer",
              fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              border: `1.5px solid ${followed ? "var(--amber)" : "rgba(240,235,227,0.15)"}`,
              background: followed ? "rgba(232,96,26,0.12)" : "transparent",
              color: followed ? "var(--amber)" : "var(--muted)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              if (!followed) { e.currentTarget.style.borderColor = "rgba(240,235,227,0.4)"; e.currentTarget.style.color = "var(--text)"; }
            }}
            onMouseLeave={e => {
              if (!followed) { e.currentTarget.style.borderColor = "rgba(240,235,227,0.15)"; e.currentTarget.style.color = "var(--muted)"; }
            }}
          >
            <Heart size={14} fill={followed ? "currentColor" : "none"} />
            {followed ? t("artistProfile.following") : t("artistProfile.follow")}
          </button>

          {/* Message (artist-to-artist only) */}
          {user && (user.role === "artist" || user.role === "admin") && artist?.user_id && user.id !== artist.user_id && (
            <button
              onClick={() => navigate(`/messages?to=${artist.user_id}`)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 20px", borderRadius: "99px", cursor: "pointer",
                fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                border: "1.5px solid rgba(240,235,227,0.15)",
                background: "transparent",
                color: "var(--muted)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(240,235,227,0.4)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(240,235,227,0.15)"; e.currentTarget.style.color = "var(--muted)"; }}
            >
              <MessageSquare size={14} />
              Message
            </button>
          )}

          {/* Share */}
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "12px 18px", borderRadius: "99px", cursor: "pointer",
              fontSize: "12px", fontWeight: 600,
              border: "1px solid rgba(240,235,227,0.1)",
              background: "transparent", color: "var(--muted)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(240,235,227,0.25)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(240,235,227,0.1)"; e.currentTarget.style.color = "var(--muted)"; }}
          >
            <Share2 size={13} /> Partager
          </button>
        </div>

        {/* ═══ Grid: Tracks + Sidebar ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "48px", alignItems: "start" }}>

          {/* ── LEFT: Tracklist ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 className="bebas" style={{ fontSize: "26px", color: "var(--text)", letterSpacing: "0.05em" }}>
                {t("artistProfile.tracks")}
              </h2>
              {artist.tracks && artist.tracks.length > 0 && (
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {artist.tracks.length} titre{artist.tracks.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {!artist.tracks?.length ? (
              <div style={{
                textAlign: "center", padding: "60px 24px",
                borderRadius: "16px", border: "1px dashed rgba(240,235,227,0.1)",
              }}>
                <Disc3 size={40} style={{ color: "var(--muted)", opacity: 0.4, marginBottom: "16px" }} />
                <div className="bebas" style={{ fontSize: "22px", color: "var(--muted)" }}>{t("artistProfile.noTracks")}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Column headers */}
                <div style={{
                  display: "grid", gridTemplateColumns: "36px 1fr 80px 56px 44px",
                  alignItems: "center", gap: "12px",
                  padding: "0 16px 12px", fontSize: "10px", fontWeight: 700,
                  letterSpacing: "0.15em", textTransform: "uppercase" as const,
                  color: "var(--muted)", borderBottom: "1px solid var(--border)",
                }}>
                  <span style={{ textAlign: "center" }}>#</span>
                  <span>Titre</span>
                  <span style={{ textAlign: "right" }}>Écoutes</span>
                  <span style={{ textAlign: "right" }}>❤</span>
                  <span style={{ textAlign: "right" }}>Durée</span>
                </div>

                {/* Track rows */}
                {artist.tracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    isActive={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    isHovered={hoveredTrack === track.id}
                    liked={likedTracks.has(track.id)}
                    playCount={playCounts[track.id] ?? 0}
                    likeCount={likeCounts[track.id] ?? 0}
                    onPlay={() => handlePlay(track.id)}
                    onLike={e => handleLike(e, track.id)}
                    onAddToQueue={e => handleAddToQueue(e, track.id)}
                    onHover={() => setHoveredTrack(track.id)}
                    onLeave={() => setHoveredTrack(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "100px" }}>
            {/* Stats grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
            }}>
              <StatCard icon={<Headphones size={13} />} label="Écoutes" value={fmtCount(totalPlays)} />
              <StatCard icon={<Heart size={13} />} label="Titres" value={String(artist.tracks?.length || 0)} />
              <StatCard icon={<MapPin size={13} />} label="Ville" value={artist.city || "—"} />
              <StatCard icon={<Disc3 size={13} />} label="Genre" value={artist.genre || "—"} />
            </div>

            {/* Bio */}
            {artist.bio && (
              <div style={{
                padding: "24px", borderRadius: "16px",
                background: "rgba(240,235,227,0.03)",
                border: "1px solid var(--border)",
              }}>
                <h3 style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
                  textTransform: "uppercase" as const, color: "var(--muted)",
                  marginBottom: "14px",
                }}>
                  {t("artistProfile.about")}
                </h3>
                <p style={{
                  fontSize: "14px", color: "rgba(240,235,227,0.55)",
                  lineHeight: 1.75, whiteSpace: "pre-line",
                }}>
                  {artist.bio}
                </p>
              </div>
            )}

            {/* Quick links */}
            <div style={{
              padding: "20px", borderRadius: "16px",
              background: "rgba(240,235,227,0.03)",
              border: "1px solid var(--border)",
            }}>
              <h3 style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
                textTransform: "uppercase" as const, color: "var(--muted)",
                marginBottom: "14px",
              }}>
                {t("artistProfile.links")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link to="/explore" style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 14px", borderRadius: "10px",
                  background: "rgba(240,235,227,0.04)",
                  color: "var(--muted)", textDecoration: "none",
                  fontSize: "13px", fontWeight: 600,
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(240,235,227,0.08)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(240,235,227,0.04)"; e.currentTarget.style.color = "var(--muted)"; }}
                >
                  <ArrowLeft size={14} /> Explorer d'autres artistes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
