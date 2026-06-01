import { useState, useEffect } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, List, X, Music2, ChevronDown, ChevronUp,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Player() {
  const {
    currentTrack, isPlaying, togglePlay, nextTrack, prevTrack,
    queue, queueIndex, isShuffle, toggleShuffle, playTrack,
    stopTrack, audioEl,
  } = useApp();

  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [volume, setVolume]       = useState(1);
  const [muted, setMuted]         = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  // Écouter les événements de l'élément audio du contexte
  useEffect(() => {
    const audio = audioEl.current;
    if (!audio) return;
    setProgress(0);
    setDuration(0);
    const onTime = () => setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, [currentTrack]);

  // Synchroniser le volume avec l'élément audio
  useEffect(() => {
    const audio = audioEl.current;
    if (audio) audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const seek = (pct: number) => {
    const audio = audioEl.current;
    if (audio && audio.duration) {
      audio.currentTime = pct * audio.duration;
      setProgress(pct * 100);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const currentTime = (progress * duration) / 100;

  if (!currentTrack) return null;

  const Cover = ({ size }: { size: number }) =>
    currentTrack.coverUrl ? (
      <img src={currentTrack.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <Music2 size={size} style={{ color: "var(--amber)" }} />
    );

  const ProgressBar = ({ height, maxW }: { height: number; maxW?: string }) => (
    <div style={{ width: "100%", maxWidth: maxW }}>
      <div
        style={{ height, background: "rgba(240,235,227,0.1)", borderRadius: height, cursor: "pointer", position: "relative" }}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - rect.left) / rect.width);
        }}
      >
        <div style={{ height: "100%", width: `${progress}%`, background: "var(--amber)", borderRadius: height, position: "relative", transition: "width 0.1s linear" }}>
          <div style={{ position: "absolute", right: height === 3 ? -5 : -6, top: "50%", transform: "translateY(-50%)", width: height === 3 ? 10 : 12, height: height === 3 ? 10 : 12, borderRadius: "50%", background: "#fff", boxShadow: "0 0 0 2px var(--amber)" }} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── LECTEUR PLEIN ÉCRAN ── */}
      {expanded && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(8,8,8,0.97)", backdropFilter: "blur(40px)",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "0 24px 40px",
          animation: "fadeUp 0.25s ease both",
        }}>
          {/* Barre du haut */}
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 12px" }}>
            <button onClick={() => setExpanded(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "6px", display: "flex" }}>
              <ChevronDown size={28} />
            </button>
            <span style={{ fontSize: "12px", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>En lecture</span>
            <button onClick={() => { stopTrack(); setExpanded(false); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "6px", display: "flex" }}>
              <X size={22} />
            </button>
          </div>

          {/* Pochette */}
          <div style={{
            width: "min(300px, 80vw)", height: "min(300px, 80vw)",
            borderRadius: "20px", overflow: "hidden", flexShrink: 0,
            background: "rgba(232,96,26,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
            margin: "8px 0 32px",
          }}>
            <Cover size={64} />
          </div>

          {/* Titre & artiste */}
          <div style={{ textAlign: "center", marginBottom: "24px", width: "100%", maxWidth: "340px" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentTrack.title}
            </p>
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>{currentTrack.artist}</p>
          </div>

          {/* Barre de progression */}
          <div style={{ width: "100%", maxWidth: "360px", marginBottom: "8px" }}>
            <ProgressBar height={4} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>{fmt(currentTime)}</span>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>{fmt(duration)}</span>
            </div>
          </div>

          {/* Contrôles */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", margin: "20px 0" }}>
            <button onClick={toggleShuffle} style={{ background: "none", border: "none", cursor: "pointer", color: isShuffle ? "var(--amber)" : "var(--muted)", position: "relative" }}>
              <Shuffle size={22} />
              {isShuffle && <span style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: "var(--amber)" }} />}
            </button>
            <button onClick={prevTrack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}><SkipBack size={30} fill="currentColor" /></button>
            <button onClick={togglePlay} style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--amber)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(232,96,26,0.45)" }}>
              {isPlaying ? <Pause size={26} color="white" fill="white" /> : <Play size={26} color="white" fill="white" style={{ marginLeft: "3px" }} />}
            </button>
            <button onClick={nextTrack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}><SkipForward size={30} fill="currentColor" /></button>
            <button onClick={() => setMuted(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
          </div>

          {/* Volume */}
          <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
            onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
            style={{ width: "220px", accentColor: "var(--amber)" }}
          />
        </div>
      )}

      {/* ── FILE D'ATTENTE ── */}
      {showQueue && (
        <div style={{
          position: "fixed", bottom: "72px", right: "16px", zIndex: 49,
          width: "340px", maxHeight: "420px",
          background: "rgba(17,17,17,0.97)", border: "1px solid rgba(240,235,227,0.1)",
          borderRadius: "16px", overflow: "hidden",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
          animation: "fadeUp 0.2s ease both",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(240,235,227,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>File d'attente</p>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{queue.length} titre{queue.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={() => setShowQueue(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
            {queue.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>File d'attente vide</div>
            ) : queue.map((track, i) => {
              const isActive = i === queueIndex;
              return (
                <button key={track.id} onClick={() => playTrack(track, queue)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", textAlign: "left", cursor: "pointer", background: isActive ? "rgba(232,96,26,0.1)" : "transparent", border: "none", transition: "background 0.15s" }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0, overflow: "hidden", background: "rgba(232,96,26,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {track.coverUrl ? <img src={track.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Music2 size={14} style={{ color: "var(--amber)" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: isActive ? 700 : 500, color: isActive ? "var(--amber)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</p>
                  </div>
                  {isActive && (
                    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "16px", flexShrink: 0 }}>
                      {[10, 14, 8, 12].map((h, j) => (
                        <div key={j} style={{ width: "3px", borderRadius: "99px", background: "var(--amber)", height: `${h}px`, animation: isPlaying ? `pulse 0.8s ${j * 0.15}s ease-in-out infinite alternate` : "none" }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MINI PLAYER (barre du bas) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: "rgba(8,8,8,0.97)", borderTop: "1px solid rgba(240,235,227,0.08)", backdropFilter: "blur(20px)" }}>

        {/* Barre de progression */}
        <ProgressBar height={3} />

        <div className="player-inner">

          {/* Infos du titre — clic pour ouvrir le plein écran */}
          <div onClick={() => setExpanded(true)} style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0, cursor: "pointer" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: "rgba(232,96,26,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cover size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrack.title}</p>
              <p style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrack.artist}</p>
            </div>
            <ChevronUp size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          </div>

          {/* Contrôles centraux */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <button className="player-shuffle" onClick={toggleShuffle} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: isShuffle ? "rgba(232,96,26,0.15)" : "transparent", border: "none", cursor: "pointer", color: isShuffle ? "var(--amber)" : "var(--muted)", position: "relative" }}>
              <Shuffle size={16} />
              {isShuffle && <span style={{ position: "absolute", bottom: "4px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--amber)" }} />}
            </button>
            <button onClick={prevTrack} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              <SkipBack size={18} />
            </button>
            <button onClick={togglePlay} style={{ width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--amber)", border: "none", cursor: "pointer", flexShrink: 0 }}>
              {isPlaying ? <Pause size={18} color="white" fill="white" /> : <Play size={18} color="white" fill="white" style={{ marginLeft: "2px" }} />}
            </button>
            <button onClick={nextTrack} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              <SkipForward size={18} />
            </button>
          </div>

          {/* Droite — temps, volume, queue, fermer */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }} className="hidden md:flex">
            <span style={{ fontSize: "11px", color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>
            <button onClick={() => setMuted(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
              onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
              style={{ width: "72px", accentColor: "var(--amber)" }}
            />
            <button onClick={() => setShowQueue(q => !q)} style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: showQueue ? "rgba(232,96,26,0.15)" : "transparent", border: `1px solid ${showQueue ? "rgba(232,96,26,0.3)" : "transparent"}`, cursor: "pointer", color: showQueue ? "var(--amber)" : "var(--muted)" }}>
              <List size={15} />
            </button>
            <button onClick={stopTrack} title="Fermer" style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
