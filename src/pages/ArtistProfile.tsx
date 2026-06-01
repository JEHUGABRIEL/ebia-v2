import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getArtist, toggleLike, type Artist } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Play, Heart, MapPin, ArrowLeft, CheckCircle, Headphones, Pause, ListPlus, Headphones as HeadphonesIcon } from "lucide-react";

export default function ArtistProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const { user, playTrack, addToQueue, setShowLoginModal, currentTrack, isPlaying } = useApp();

  useEffect(() => {
    if (!slug) return;
    getArtist(slug).then(a => {
      setArtist(a);
      // Initialiser les compteurs depuis la BD
      const lc: Record<string, number> = {};
      const pc: Record<string, number> = {};
      a.tracks?.forEach(t => {
        lc[t.id] = (t as any).likes_count ?? 0;
        pc[t.id] = (t as any).plays_count ?? 0;
      });
      setLikeCounts(lc);
      setPlayCounts(pc);
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleFollow = () => {
    if (!user) { setShowLoginModal(true); return; }
    setFollowed(f => !f);
  };

  const makeQueue = () => (artist?.tracks ?? []).map(t => ({
    id: t.id, title: t.title, artist: artist!.name,
    audioUrl: "", coverUrl: artist!.avatar_url,
    playsCount: playCounts[t.id], likesCount: likeCounts[t.id],
  }));

  const handlePlay = (trackId: string) => {
    if (!artist?.tracks) return;
    const track = artist.tracks.find(t => t.id === trackId);
    if (!track) return;
    playTrack({ id: track.id, title: track.title, artist: artist.name, audioUrl: "", coverUrl: artist.avatar_url }, makeQueue());
    // Mise à jour optimiste des écoutes
    setPlayCounts(p => ({ ...p, [trackId]: (p[trackId] ?? 0) + 1 }));
  };

  const handleAddToQueue = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!artist?.tracks) return;
    const track = artist.tracks.find(t => t.id === trackId);
    if (!track) return;
    addToQueue({ id: track.id, title: track.title, artist: artist.name, audioUrl: "", coverUrl: artist.avatar_url });
  };

  const handleLike = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!user) { setShowLoginModal(true); return; }
    const wasLiked = likedTracks.has(trackId);
    // Mise à jour optimiste
    setLikedTracks(s => { const n = new Set(s); wasLiked ? n.delete(trackId) : n.add(trackId); return n; });
    setLikeCounts(c => ({ ...c, [trackId]: Math.max(0, (c[trackId] ?? 0) + (wasLiked ? -1 : 1)) }));
    try {
      const res = await toggleLike(trackId);
      setLikeCounts(c => ({ ...c, [trackId]: res.likes_count }));
    } catch {
      // Revenir en arrière si erreur
      setLikedTracks(s => { const n = new Set(s); wasLiked ? n.add(trackId) : n.delete(trackId); return n; });
      setLikeCounts(c => ({ ...c, [trackId]: Math.max(0, (c[trackId] ?? 0) + (wasLiked ? 1 : -1)) }));
    }
  };

  const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="bebas" style={{ fontSize: "28px", color: "var(--amber)" }}>Chargement...</div>
    </div>
  );

  if (!artist) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="bebas" style={{ fontSize: "28px", color: "var(--muted)" }}>Artiste introuvable</div>
    </div>
  );

  const totalPlays = Object.values(playCounts).reduce((a, b) => a + b, 0) || artist.plays_count || 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO ── */}
      <div style={{ position: "relative", height: "75vh", minHeight: "520px", overflow: "hidden" }}>
        {artist.cover_url || artist.avatar_url ? (
          <img src={artist.cover_url || artist.avatar_url} alt={artist.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(232,96,26,0.3), var(--bg))" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,8,0.25) 0%, rgba(8,8,8,0.5) 50%, rgba(8,8,8,0.98) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 80%, rgba(232,96,26,0.12), transparent 60%)", pointerEvents: "none" }} />

        <Link to="/explore" style={{ position: "absolute", top: "88px", left: "48px", display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "99px", background: "rgba(8,8,8,0.6)", border: "1px solid rgba(240,235,227,0.15)", color: "var(--muted)", textDecoration: "none", fontSize: "13px", fontWeight: 600, backdropFilter: "blur(8px)", transition: "color 0.15s", zIndex: 2 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
          <ArrowLeft size={14} /> Retour
        </Link>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 48px 48px", zIndex: 2 }}>
          <div style={{ maxWidth: "1360px", margin: "0 auto" }}>
            {artist.verified && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                <CheckCircle size={14} style={{ color: "var(--amber)" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--amber)" }}>Artiste certifié</span>
              </div>
            )}
            <h1 className="bebas" style={{ fontSize: "clamp(56px, 10vw, 120px)", color: "#fff", lineHeight: 0.9, marginBottom: "20px", letterSpacing: "0.02em" }}>{artist.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber)" }}>{artist.genre}</span>
              <span style={{ color: "rgba(240,235,227,0.2)", fontSize: "16px" }}>·</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(240,235,227,0.5)" }}>
                <MapPin size={12} /> {artist.city}, RCA
              </div>
              <span style={{ color: "rgba(240,235,227,0.2)", fontSize: "16px" }}>·</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(240,235,227,0.5)" }}>
                <Headphones size={12} /> {Number(totalPlays).toLocaleString("fr-FR")} écoutes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "40px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
          {artist.tracks && artist.tracks.length > 0 && (
            <button onClick={() => handlePlay(artist.tracks![0].id)} style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--amber)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.15s, box-shadow 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,96,26,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              <Play size={20} fill="white" color="white" style={{ marginLeft: "2px" }} />
            </button>
          )}
          <button onClick={handleFollow} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "99px", cursor: "pointer", fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: `1.5px solid ${followed ? "var(--amber)" : "rgba(240,235,227,0.25)"}`, background: followed ? "rgba(232,96,26,0.12)" : "transparent", color: followed ? "var(--amber)" : "var(--muted)", transition: "all 0.2s" }}
            onMouseEnter={e => { if (!followed) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.5)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}}
            onMouseLeave={e => { if (!followed) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.25)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}}>
            <Heart size={15} fill={followed ? "currentColor" : "none"} />
            {followed ? "Suivi" : "Suivre"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "48px", alignItems: "start" }}>

          {/* LEFT — Tracklist */}
          <div>
            <h2 className="bebas" style={{ fontSize: "28px", color: "var(--text)", marginBottom: "20px", letterSpacing: "0.05em" }}>Titres</h2>
            {!artist.tracks?.length ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div className="bebas" style={{ fontSize: "24px", color: "var(--muted)" }}>Aucun titre disponible</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "0 16px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ width: "28px", textAlign: "center" }}>#</span>
                  <span style={{ flex: 1 }}>Titre</span>
                  <span style={{ width: "60px", textAlign: "right" }}>Écoutes</span>
                  <span style={{ width: "40px", textAlign: "right" }}>❤</span>
                  <span style={{ width: "36px", textAlign: "right" }}>Durée</span>
                </div>

                {artist.tracks.map((track, i) => {
                  const isActive  = currentTrack?.id === track.id;
                  const isHovered = hoveredTrack === track.id;
                  const liked     = likedTracks.has(track.id);

                  return (
                    <div key={track.id}
                      onMouseEnter={() => setHoveredTrack(track.id)}
                      onMouseLeave={() => setHoveredTrack(null)}
                      onClick={() => handlePlay(track.id)}
                      style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", background: isActive ? "rgba(232,96,26,0.08)" : isHovered ? "rgba(240,235,227,0.04)" : "transparent", transition: "background 0.15s" }}>

                      {/* # / Play */}
                      <div style={{ width: "28px", textAlign: "center", flexShrink: 0 }}>
                        {isHovered || isActive ? (
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isActive ? "var(--amber)" : "rgba(240,235,227,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                            {isActive && isPlaying ? <Pause size={11} fill="white" color="white" /> : <Play size={11} fill={isActive ? "white" : "var(--text)"} color={isActive ? "white" : "var(--text)"} style={{ marginLeft: "1px" }} />}
                          </div>
                        ) : (
                          <span style={{ fontSize: "13px", color: isActive ? "var(--amber)" : "var(--muted)", fontWeight: 600 }}>{i + 1}</span>
                        )}
                      </div>

                      {/* Titre */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: isActive ? "var(--amber)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{track.title}</p>
                        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>{track.genre}</p>
                      </div>

                      {/* Écoutes */}
                      <div style={{ width: "60px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                        {isHovered ? (
                          <button onClick={e => handleAddToQueue(e, track.id)} title="Ajouter à la file" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "2px", display: "flex", transition: "color 0.15s" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
                            <ListPlus size={15} />
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                            {Number(playCounts[track.id] ?? 0).toLocaleString("fr-FR")}
                          </span>
                        )}
                      </div>

                      {/* Like */}
                      <div style={{ width: "40px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                        <button onClick={e => handleLike(e, track.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", color: liked ? "var(--amber)" : "var(--muted)", transition: "color 0.15s", padding: "2px" }}
                          onMouseEnter={e => { if (!liked) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                          onMouseLeave={e => { if (!liked) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
                          <Heart size={13} fill={liked ? "currentColor" : "none"} />
                        </button>
                        <span style={{ fontSize: "11px", color: "var(--muted)", minWidth: "12px", textAlign: "right" }}>
                          {likeCounts[track.id] > 0 ? likeCounts[track.id] : ""}
                        </span>
                      </div>

                      {/* Durée */}
                      <span style={{ fontSize: "13px", color: "var(--muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0, width: "36px", textAlign: "right" }}>
                        {fmtDuration(track.duration_s)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT — Stats + Bio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ padding: "24px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "20px" }}>Statistiques</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Écoutes totales", value: Number(totalPlays).toLocaleString("fr-FR") },
                  { label: "Titres", value: String(artist.tracks?.length || 0) },
                  { label: "Genre", value: artist.genre || "—" },
                  { label: "Ville", value: artist.city || "—" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--muted)" }}>{s.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {artist.bio && (
              <div style={{ padding: "24px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "14px" }}>À propos</h3>
                <p style={{ fontSize: "14px", color: "rgba(240,235,227,0.55)", lineHeight: 1.75 }}>{artist.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
