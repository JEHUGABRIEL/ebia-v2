import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getArtist, type Artist, audioUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Play, Heart, MapPin, ArrowLeft, CheckCircle, Headphones } from "lucide-react";

export default function ArtistProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const { user, playTrack, setShowLoginModal, currentTrack, isPlaying } = useApp();

  useEffect(() => {
    if (!slug) return;
    getArtist(slug).then(setArtist).finally(() => setLoading(false));
  }, [slug]);

  const handleFollow = () => {
    if (!user) { setShowLoginModal(true); return; }
    setFollowed(f => !f);
  };

  const handlePlay = (trackId: string) => {
    if (!artist?.tracks) return;
    const track = artist.tracks.find(t => t.id === trackId);
    if (!track) return;
    const queue = artist.tracks.map(t => ({
      id: t.id, title: t.title, artist: artist.name,
      audioUrl: audioUrl((t as any).file_path || t.id + ".mp3"),
      coverUrl: artist.avatar_url,
    }));
    playTrack({
      id: track.id, title: track.title, artist: artist.name,
      audioUrl: audioUrl((track as any).file_path || track.id + ".mp3"),
      coverUrl: artist.avatar_url,
    }, queue);
  };

  const colors = ["#FF6B35", "#7B2FBE", "#00D46A", "#FFD700"];
  const artistColor = colors[(artist?.name?.length || 0) % colors.length];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D0D" }}>
      <div className="bebas text-3xl" style={{ color: "#FF6B35" }}>Chargement...</div>
    </div>
  );

  if (!artist) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D0D" }}>
      <div className="bebas text-3xl text-zinc-600">Artiste introuvable</div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32" style={{ background: "#0D0D0D" }}>
      {/* Hero plein écran */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {artist.cover_url || artist.avatar_url ? (
          <img src={artist.cover_url || artist.avatar_url} alt={artist.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${artistColor}40, #0D0D0D)` }} />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(13,13,13,0.7) 60%, #0D0D0D 100%)" }} />

        {/* Color accent overlay */}
        <div className="absolute inset-0 mix-blend-color opacity-20"
          style={{ background: `radial-gradient(ellipse at 30% 50%, ${artistColor}, transparent 60%)` }} />

        {/* Back button */}
        <Link to="/explore" className="absolute top-20 left-4 p-3 rounded-2xl border transition-all hover:scale-105"
          style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.1)" }}>
          <ArrowLeft size={20} className="text-white" />
        </Link>

        {/* Artist info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            {artist.verified && (
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} style={{ color: artistColor }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: artistColor }}>Artiste certifié</span>
              </div>
            )}
            <h1 className="bebas text-6xl md:text-9xl text-white leading-none mb-4">{artist.name}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-bold uppercase tracking-widest" style={{ color: artistColor }}>{artist.genre}</span>
              <span className="text-zinc-600">·</span>
              <div className="flex items-center gap-1 text-zinc-400 text-sm"><MapPin size={12} />{artist.city}, RCA</div>
              <span className="text-zinc-600">·</span>
              <div className="flex items-center gap-1 text-zinc-400 text-sm"><Headphones size={12} />{Number(artist.plays_count).toLocaleString()} écoutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-10 mt-8">
        {/* Actions */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleFollow}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:scale-105"
            style={{
              background: followed ? artistColor : "transparent",
              border: `2px solid ${artistColor}`,
              color: followed ? "#000" : artistColor,
            }}>
            <Heart size={16} fill={followed ? "currentColor" : "none"} />
            {followed ? "Suivi" : "Suivre"}
          </button>
        </div>

        {/* Bio */}
        {artist.bio && (
          <div className="mb-8 p-6 rounded-3xl border"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-zinc-400 leading-relaxed">{artist.bio}</p>
          </div>
        )}

        {/* Tracks */}
        <h2 className="bebas text-4xl mb-4" style={{ color: artistColor }}>Titres</h2>
        {!artist.tracks?.length ? (
          <div className="text-center text-zinc-600 py-12 bebas text-2xl">Aucun titre disponible</div>
        ) : (
          <div className="space-y-2">
            {artist.tracks.map((track, i) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <button key={track.id} onClick={() => handlePlay(track.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all group hover:scale-[1.01]"
                  style={{
                    background: isActive ? `${artistColor}15` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive ? artistColor : "rgba(255,255,255,0.08)"}`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: isActive ? artistColor : "rgba(255,255,255,0.08)" }}>
                    {isActive && isPlaying ? (
                      <div className="flex gap-0.5 items-end h-4">
                        {[1,2,3].map(b => (
                          <div key={b} className="w-1 rounded-full animate-pulse" style={{ background: "#000", height: `${[12,8,10][b-1]}px`, animationDelay: `${b*0.1}s` }} />
                        ))}
                      </div>
                    ) : (
                      <span className={`text-sm font-bold ${isActive ? "text-black" : "text-zinc-500 group-hover:hidden"}`}>{i + 1}</span>
                    )}
                    <Play size={16} className="hidden group-hover:block text-zinc-400" style={{ display: isActive ? "none" : undefined }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: isActive ? artistColor : "#fff" }}>{track.title}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">{track.genre}</p>
                  </div>
                  <span className="text-zinc-600 text-sm tabular-nums">
                    {Math.floor(track.duration_s / 60)}:{String(track.duration_s % 60).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
