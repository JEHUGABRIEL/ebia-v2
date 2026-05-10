import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Player() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack } = useApp();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

  if (!currentTrack) return null;

  const currentTime = progress * duration / 100;

  return (
    <>
      <audio id="ebia-player" src={currentTrack.audioUrl}
        onTimeUpdate={e => { const a = e.currentTarget; setProgress(a.currentTime/(a.duration||1)*100); }}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={nextTrack}
        autoPlay={isPlaying}
        ref={el => { if (el) el.volume = muted ? 0 : volume; }}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 player-blur"
        style={{ background: "rgba(13,13,13,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Progress bar */}
        <div className="h-1 cursor-pointer group"
          style={{ background: "rgba(255,255,255,0.1)" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const audio = document.querySelector("audio#ebia-player") as HTMLAudioElement;
            if (audio) { audio.currentTime = pct * audio.duration; setProgress(pct * 100); }
          }}>
          <div className="h-full transition-all relative"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #FF6B35, #FFD700)" }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 h-18 flex items-center gap-4 py-3">
          {/* Track info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
              style={{ background: "rgba(255,107,53,0.2)" }}>
              {currentTrack.coverUrl
                ? <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center bebas text-xl" style={{ color: "#FF6B35" }}>E</div>
              }
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-white truncate">{currentTrack.title}</p>
              <p className="text-xs text-zinc-500 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button onClick={prevTrack} className="text-zinc-500 hover:text-white transition-colors"><SkipBack size={20} /></button>
            <button onClick={togglePlay}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
              {isPlaying
                ? <Pause size={20} className="text-black" />
                : <Play size={20} className="text-black ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="text-zinc-500 hover:text-white transition-colors"><SkipForward size={20} /></button>
          </div>

          {/* Time + Volume */}
          <div className="flex-1 hidden md:flex justify-end items-center gap-4">
            <span className="text-zinc-600 text-xs tabular-nums">{fmt(currentTime)} / {fmt(duration)}</span>
            <button onClick={() => setMuted(m => !m)} className="text-zinc-500 hover:text-white transition-colors">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input type="range" min="0" max="1" step="0.1" value={muted ? 0 : volume}
              onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
              className="w-20 accent-orange-500" />
          </div>
        </div>
      </div>
    </>
  );
}
