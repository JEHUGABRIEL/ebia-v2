import { useState, useRef, useEffect } from "react";
import { Play, Pause, Radio as RadioIcon, Volume2, VolumeX, Loader } from "lucide-react";

const STATIONS = [
  {
    id: "ndeke-luka",
    name: "Radio Ndeke Luka",
    freq: "100.9 FM",
    desc: "La radio la plus écoutée de RCA — info, débats, musique",
    lang: "Français / Sango",
    logo: "🎙️",
    color: "#E8601A",
    streamUrl: "https://stream.radiondekeluka.org/live",
    fallback: "https://stream-176.zeno.fm/qdqc4u7fmrhvv",
  },
  {
    id: "guira-fm",
    name: "Guira FM",
    freq: "93.3 FM",
    desc: "Radio de la MINUSCA — paix, réconciliation, culture",
    lang: "Français / Sango",
    logo: "📻",
    color: "#2196F3",
    streamUrl: "https://stream.zeno.fm/guirafm",
    fallback: "https://cast1.torontocast.com:2060/stream",
  },
  {
    id: "radio-lengo-songo",
    name: "Radio Lengo Songo",
    freq: "98.9 FM",
    desc: "Musique centrafricaine et programmes culturels",
    lang: "Sango / Français",
    logo: "🎵",
    color: "#4CAF50",
    streamUrl: "https://stream.zeno.fm/lengosongo",
    fallback: null,
  },
  {
    id: "radio-notre-dame",
    name: "Radio Notre Dame",
    freq: "103.3 FM",
    desc: "Radio catholique de Bangui",
    lang: "Français / Sango",
    logo: "✝️",
    color: "#9C27B0",
    streamUrl: "https://stream.zeno.fm/notredamebangui",
    fallback: null,
  },
  {
    id: "rca-fm",
    name: "Radio Centrafrique",
    freq: "106.9 FM",
    desc: "Radio nationale officielle de la République Centrafricaine",
    lang: "Français / Sango",
    logo: "🇨🇫",
    color: "#C9930A",
    streamUrl: "https://stream.zeno.fm/radiocentrafrique",
    fallback: null,
  },
  {
    id: "rjdh",
    name: "RJDH",
    freq: "100.5 FM",
    desc: "Radio Jeunesse pour la Démocratie et les Droits de l'Homme",
    lang: "Français",
    logo: "⚖️",
    color: "#F44336",
    streamUrl: "https://stream.zeno.fm/rjdh-bangui",
    fallback: null,
  },
];

type StationStatus = "idle" | "loading" | "playing" | "error";

export default function Radio() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, StationStatus>>({});
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const setStatus = (id: string, s: StationStatus) =>
    setStatuses(prev => ({ ...prev, [id]: s }));

  const playStation = async (station: typeof STATIONS[0]) => {
    if (currentId === station.id && statuses[station.id] === "playing") {
      audioRef.current?.pause();
      setCurrentId(null);
      setStatus(station.id, "idle");
      return;
    }

    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }

    setCurrentId(station.id);
    setStatus(station.id, "loading");

    const audio = new Audio();
    audio.volume = muted ? 0 : volume;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const tryUrl = async (url: string): Promise<boolean> => {
      return new Promise(resolve => {
        audio.src = url;
        const onPlay = () => { resolve(true); audio.removeEventListener("error", onErr); };
        const onErr = () => { resolve(false); audio.removeEventListener("playing", onPlay); };
        audio.addEventListener("playing", onPlay, { once: true });
        audio.addEventListener("error", onErr, { once: true });
        audio.play().catch(() => resolve(false));
        setTimeout(() => resolve(false), 8000);
      });
    };

    let ok = await tryUrl(station.streamUrl);
    if (!ok && station.fallback) ok = await tryUrl(station.fallback);

    if (ok) {
      setStatus(station.id, "playing");
      audio.onended = () => { setCurrentId(null); setStatus(station.id, "idle"); };
    } else {
      setStatus(station.id, "error");
      setCurrentId(null);
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0) setMuted(false);
  };

  const toggleMute = () => {
    setMuted(m => {
      const next = !m;
      if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
      return next;
    });
  };

  const currentStation = STATIONS.find(s => s.id === currentId);
  const isPlaying = currentId !== null && statuses[currentId] === "playing";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* Hero */}
      <div style={{ padding: "120px 48px 64px", maxWidth: "1360px", margin: "0 auto" }}>
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", marginBottom: "20px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--amber)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50", animation: "pulse 1.5s infinite", display: "inline-block" }} />
            En direct
          </div>
          <h1 className="bebas" style={{ fontSize: "clamp(56px, 8vw, 100px)", color: "var(--text)", lineHeight: 0.9, marginBottom: "16px" }}>
            Radios<br /><span style={{ color: "var(--amber)" }}>Centrafricaines</span>
          </h1>
          <p style={{ fontSize: "16px", color: "var(--muted)", maxWidth: "560px", lineHeight: 1.7 }}>
            Écoutez les radios les plus populaires de la République Centrafricaine, en direct depuis n'importe où dans le monde.
          </p>
        </div>

        {/* Now Playing bar */}
        {currentStation && (
          <div style={{ padding: "16px 24px", borderRadius: "14px", background: `${currentStation.color}12`, border: `1px solid ${currentStation.color}30`, marginBottom: "40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "20px" }}>
                {isPlaying ? [6,10,7,12,8].map((h, i) => (
                  <div key={i} style={{ width: "3px", borderRadius: "99px", background: currentStation.color, height: `${h}px`, animation: `pulse 0.6s ${i*0.12}s ease-in-out infinite alternate` }} />
                )) : <RadioIcon size={18} style={{ color: currentStation.color }} />}
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                  {statuses[currentId!] === "loading" ? "Connexion en cours…" : `En écoute — ${currentStation.name}`}
                </p>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>{currentStation.freq} · {currentStation.lang}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={toggleMute} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={e => handleVolume(Number(e.target.value))}
                style={{ width: "80px", accentColor: currentStation.color }} />
            </div>
          </div>
        )}

        {/* Grid stations */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {STATIONS.map(station => {
            const status = statuses[station.id] ?? "idle";
            const isActive = currentId === station.id;
            return (
              <div key={station.id} style={{
                padding: "24px", borderRadius: "16px", cursor: "pointer",
                background: isActive ? `${station.color}10` : "rgba(240,235,227,0.03)",
                border: `1px solid ${isActive ? station.color + "40" : "var(--border)"}`,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.2)"; (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.03)"; }}}
              onClick={() => playStation(station)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${station.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                      {station.logo}
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{station.name}</p>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: station.color }}>{station.freq}</p>
                    </div>
                  </div>

                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: isActive ? station.color : "rgba(240,235,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                    {status === "loading"
                      ? <Loader size={14} style={{ color: "white", animation: "spin 1s linear infinite" }} />
                      : status === "playing"
                      ? <Pause size={14} fill="white" color="white" />
                      : status === "error"
                      ? <span style={{ fontSize: "14px" }}>⚠️</span>
                      : <Play size={14} fill={isActive ? "white" : "var(--muted)"} color={isActive ? "white" : "var(--muted)"} style={{ marginLeft: "2px" }} />
                    }
                  </div>
                </div>

                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "12px" }}>{station.desc}</p>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "99px", background: `${station.color}15`, color: station.color, fontWeight: 700, letterSpacing: "0.08em" }}>
                    {station.lang}
                  </span>
                  {status === "error" && (
                    <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "99px", background: "rgba(220,50,50,0.1)", color: "#f08080", fontWeight: 600 }}>
                      Signal indisponible
                    </span>
                  )}
                  {isActive && status !== "error" && (
                    <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "99px", background: "rgba(76,175,130,0.12)", color: "#4caf82", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4caf82" }} />
                      En direct
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div style={{ marginTop: "48px", padding: "16px 20px", borderRadius: "12px", background: "rgba(201,147,10,0.06)", border: "1px solid rgba(201,147,10,0.18)" }}>
          <p style={{ fontSize: "12px", color: "rgba(240,235,227,0.5)", lineHeight: 1.7 }}>
            ⚡ Les radios sont diffusées via leurs serveurs officiels. Si une station est indisponible, elle peut être temporairement hors ligne. Vous pouvez aussi visiter{" "}
            <a href="https://www.radiondekeluka.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--amber)" }}>radiondekeluka.org</a> directement.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
