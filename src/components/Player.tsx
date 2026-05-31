import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, List, X, Music2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Player() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, queue, queueIndex, isShuffle, toggleShuffle, playTrack } = useApp();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const currentTime = (progress * duration) / 100;

  if (!currentTrack) return null;

  return (
    <>
      <audio id="ebia-player" src={currentTrack.audioUrl}
        onTimeUpdate={e => { const a = e.currentTarget; setProgress((a.currentTime / (a.duration || 1)) * 100); }}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={nextTrack}
        autoPlay={isPlaying}
        ref={el => { if (el) el.volume = muted ? 0 : volume; }}
      />

      {/* ── QUEUE PANEL ── */}
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
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(240,235,227,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>File d'attente</p>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{queue.length} titre{queue.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={() => setShowQueue(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}>
              <X size={16} />
            </button>
          </div>

          {/* Tracks */}
          <div style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
            {queue.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                File d'attente vide
              </div>
            ) : (
              queue.map((track, i) => {
                const isActive = i === queueIndex;
                return (
                  <button key={track.id} onClick={() => playTrack(track, queue)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 12px", borderRadius: "10px", textAlign: "left", cursor: "pointer",
                      background: isActive ? "rgba(232,96,26,0.1)" : "transparent",
                      border: "none", transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Cover / num */}
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0, overflow: "hidden", background: "rgba(232,96,26,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {track.coverUrl
                        ? <img src={track.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <Music2 size={14} style={{ color: "var(--amber)" }} />
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: isActive ? 700 : 500, color: isActive ? "var(--amber)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.title}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.artist}
                      </p>
                    </div>

                    {/* Playing indicator */}
                    {isActive && (
                      <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "16px", flexShrink: 0 }}>
                        {[10, 14, 8, 12].map((h, j) => (
                          <div key={j} style={{ width: "3px", borderRadius: "99px", background: "var(--amber)", height: `${h}px`, animation: isPlaying ? `pulse 0.8s ${j * 0.15}s ease-in-out infinite alternate` : "none" }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── PLAYER BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: "rgba(8,8,8,0.97)", borderTop: "1px solid rgba(240,235,227,0.08)", backdropFilter: "blur(20px)" }}>

        {/* Progress bar */}
        <div style={{ height: "3px", cursor: "pointer", background: "rgba(240,235,227,0.08)", position: "relative" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const audio = document.querySelector("audio#ebia-player") as HTMLAudioElement;
            if (audio) { audio.currentTime = pct * audio.duration; setProgress(pct * 100); }
          }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--amber)", position: "relative", transition: "width 0.1s linear" }}>
            <div style={{ position: "absolute", right: "-5px", top: "50%", transform: "translateY(-50%)", width: "10px", height: "10px", borderRadius: "50%", background: "#fff", boxShadow: "0 0 0 2px var(--amber)" }} />
          </div>
        </div>

        <div className="player-inner">

          {/* Track info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: "rgba(232,96,26,0.15)" }}>
              {currentTrack.coverUrl
                ? <img src={currentTrack.coverUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Music2 size={18} style={{ color: "var(--amber)" }} /></div>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrack.title}</p>
              <p style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls — center */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* Shuffle */}
            <button className="player-shuffle" onClick={toggleShuffle} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: isShuffle ? "rgba(232,96,26,0.15)" : "transparent", border: "none", cursor: "pointer", color: isShuffle ? "var(--amber)" : "var(--muted)", transition: "all 0.15s", position: "relative" }}>
              <Shuffle size={16} />
              {isShuffle && <span style={{ position: "absolute", bottom: "4px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--amber)" }} />}
            </button>

            <button onClick={prevTrack} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
              <SkipBack size={18} />
            </button>

            <button onClick={togglePlay} style={{ width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--amber)", border: "none", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(232,96,26,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              {isPlaying ? <Pause size={18} color="white" fill="white" /> : <Play size={18} color="white" fill="white" style={{ marginLeft: "2px" }} />}
            </button>

            <button onClick={nextTrack} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
              <SkipForward size={18} />
            </button>
          </div>

          {/* Right — time + volume + queue */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }} className="hidden md:flex">
            <span style={{ fontSize: "11px", color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>

            <button onClick={() => setMuted(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
              onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
              style={{ width: "72px", accentColor: "var(--amber)" }} />

            {/* Queue toggle */}
            <button onClick={() => setShowQueue(q => !q)} style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: showQueue ? "rgba(232,96,26,0.15)" : "transparent", border: `1px solid ${showQueue ? "rgba(232,96,26,0.3)" : "transparent"}`, cursor: "pointer", color: showQueue ? "var(--amber)" : "var(--muted)", transition: "all 0.15s" }}>
              <List size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
