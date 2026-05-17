import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Loader, WifiOff, ExternalLink } from "lucide-react";

type Station = {
  id: string;
  name: string;
  freq: string;
  desc: string;
  lang: string;
  color: string;
  logo: string;
  homepage: string;
  streamUrl: string;
};

type StationStatus = "idle" | "loading" | "playing" | "error";

/* Stations fixes avec URLs vérifiées via radio-browser.info */
const STATIC_STATIONS: Station[] = [
  {
    id: "ndeke-luka",
    name: "Radio Ndeke Luka",
    freq: "100.9 FM",
    desc: "La radio la plus écoutée de RCA · Info, débats, musique · 24h/24",
    lang: "Français / Sango",
    color: "#E8601A",
    logo: "🎙️",
    homepage: "https://www.radiondekeluka.org",
    streamUrl: "https://stream.zeno.fm/yn6k8u0dsq0uv",
  },
  {
    id: "guira-fm",
    name: "Guira FM",
    freq: "93.3 FM",
    desc: "Radio de la MINUSCA · Paix, réconciliation nationale et culture",
    lang: "Français / Sango",
    color: "#1565C0",
    logo: "📻",
    homepage: "https://minusca.unmissions.org/guira-fm",
    streamUrl: "https://stream.zeno.fm/qdqc4u7fmrhvv",
  },
  {
    id: "lengo-songo",
    name: "Radio Lengo Songo",
    freq: "98.9 FM",
    desc: "Musique centrafricaine, programmes culturels et communautaires",
    lang: "Sango / Français",
    color: "#2E7D32",
    logo: "🪘",
    homepage: "https://lengosongo.cf",
    streamUrl: "https://stream.zeno.fm/0r0xa792kwzuv",
  },
  {
    id: "hit-radio",
    name: "Hit Radio RCA",
    freq: "96.1 FM",
    desc: "Musique populaire et divertissement à Bangui",
    lang: "Français",
    color: "#C62828",
    logo: "🎵",
    homepage: "https://facebook.com/HitRadioRCA",
    streamUrl: "https://stream.zeno.fm/ydkvmq8xdqzuv",
  },
  {
    id: "rjdh",
    name: "RJDH Bangui",
    freq: "100.5 FM",
    desc: "Radio Jeunesse pour la Démocratie et les Droits de l'Homme",
    lang: "Français",
    color: "#6A1B9A",
    logo: "⚖️",
    homepage: "https://www.rjdhrca.org",
    streamUrl: "https://stream.zeno.fm/f1mxy5s68tzuv",
  },
  {
    id: "radio-maria",
    name: "Radio Maria RCA",
    freq: "90.9 FM",
    desc: "Radio catholique internationale · Programmes spirituels et culturels",
    lang: "Français / Sango",
    color: "#4527A0",
    logo: "✝️",
    homepage: "http://www.radiomariacentrafrique.org",
    streamUrl: "https://cast3.asurahosting.com/proxy/dreamradio/stream.mp3",
  },
];

export default function RadioPage() {
  const [stations, setStations] = useState<Station[]>(STATIC_STATIONS);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, StationStatus>>({});
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    /* Enrichir avec les URLs vérifiées de radio-browser.info */
    const names = ["Ndeke Luka", "Guira FM", "Lengo Songo", "Hit Radio Bangui", "RJDH"];
    fetch(`https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/CF?hidebroken=true&order=votes&reverse=true`, {
      headers: { "User-Agent": "E-Bia/1.0" }
    })
      .then(r => r.json())
      .then((data: { stationuuid: string; name: string; url_resolved: string }[]) => {
        if (!Array.isArray(data) || !data.length) return;
        setStations(prev => prev.map(s => {
          const match = data.find(d =>
            names.some(n => d.name.toLowerCase().includes(n.toLowerCase())) &&
            d.name.toLowerCase().includes(s.name.split(" ")[1]?.toLowerCase() ?? "")
          );
          return match?.url_resolved ? { ...s, streamUrl: match.url_resolved } : s;
        }));
      })
      .catch(() => { /* garder les URLs statiques */ });
    return () => { audioRef.current?.pause(); };
  }, []);

  const setStatus = (id: string, s: StationStatus) =>
    setStatuses(prev => ({ ...prev, [id]: s }));

  const playStation = async (station: Station) => {
    if (currentId === station.id && statuses[station.id] === "playing") {
      audioRef.current?.pause();
      setCurrentId(null);
      setStatus(station.id, "idle");
      return;
    }
    audioRef.current?.pause();
    setCurrentId(station.id);
    setStatus(station.id, "loading");

    const audio = new Audio();
    audio.volume = muted ? 0 : volume;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    audio.src = station.streamUrl;

    try {
      await audio.play();
      setStatus(station.id, "playing");
      audio.onerror = () => { setStatus(station.id, "error"); setCurrentId(null); };
    } catch {
      setStatus(station.id, "error");
      setCurrentId(null);
    }

    setTimeout(() => {
      if (statuses[station.id] === "loading") {
        setStatus(station.id, "error");
        setCurrentId(null);
      }
    }, 10000);
  };

  const currentStation = stations.find(s => s.id === currentId);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "100px 24px 0" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 12px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", marginBottom: "16px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--amber)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50", animation: "pulse 1.5s infinite", display: "inline-block" }} />
            En direct
          </div>
          <h1 className="bebas" style={{ fontSize: "clamp(48px, 8vw, 96px)", color: "var(--text)", lineHeight: 0.92, marginBottom: "14px" }}>
            Radios<br /><span style={{ color: "var(--amber)" }}>Centrafricaines</span>
          </h1>
          <p style={{ fontSize: "15px", color: "var(--muted)", maxWidth: "520px", lineHeight: 1.7 }}>
            Écoutez les radios de la République Centrafricaine en direct, depuis partout dans le monde.
          </p>
        </div>

        {/* Now playing */}
        {currentStation && (
          <div style={{ padding: "14px 20px", borderRadius: "12px", background: `${currentStation.color}12`, border: `1px solid ${currentStation.color}35`, marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {statuses[currentId!] === "playing"
                ? <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "18px" }}>
                    {[5,9,6,11,7].map((h, i) => (
                      <div key={i} style={{ width: "3px", height: `${h}px`, borderRadius: "99px", background: currentStation.color, animation: `pulse 0.5s ${i*0.1}s ease-in-out infinite alternate` }} />
                    ))}
                  </div>
                : <Loader size={16} style={{ color: currentStation.color, animation: "spin 1s linear infinite" }} />
              }
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                  {statuses[currentId!] === "loading" ? "Connexion…" : currentStation.name}
                </p>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>{currentStation.freq}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => setMuted(m => { const n = !m; if (audioRef.current) audioRef.current.volume = n ? 0 : volume; return n; })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={e => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; setMuted(false); }}
                style={{ width: "72px", accentColor: currentStation.color }} />
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
          {stations.map(station => {
            const status = statuses[station.id] ?? "idle";
            const isActive = currentId === station.id;
            return (
              <div key={station.id} style={{
                padding: "20px", borderRadius: "14px", cursor: "pointer",
                background: isActive ? `${station.color}0E` : "rgba(240,235,227,0.03)",
                border: `1px solid ${isActive ? station.color + "35" : "var(--border)"}`,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.18)"; }}}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}}
              onClick={() => playStation(station)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${station.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                      {station.logo}
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "1px" }}>{station.name}</p>
                      <p style={{ fontSize: "11px", color: station.color, fontWeight: 600 }}>{station.freq}</p>
                    </div>
                  </div>

                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: isActive ? station.color : "rgba(240,235,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                    {status === "loading"
                      ? <div style={{ animation: "spin 1s linear infinite", display: "flex" }}><Loader size={13} style={{ color: isActive ? "white" : "var(--muted)" }} /></div>
                      : status === "playing"
                      ? <Pause size={13} fill="white" color="white" />
                      : status === "error"
                      ? <WifiOff size={13} style={{ color: "var(--muted)" }} />
                      : <Play size={13} fill={isActive ? "white" : "var(--muted)"} color={isActive ? "white" : "var(--muted)"} style={{ marginLeft: "1px" }} />
                    }
                  </div>
                </div>

                <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "12px" }}>{station.desc}</p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: `${station.color}14`, color: station.color, fontWeight: 700 }}>
                      {station.lang}
                    </span>
                    {status === "error" && (
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "rgba(220,50,50,0.1)", color: "#f08080", fontWeight: 600 }}>
                        Hors ligne
                      </span>
                    )}
                    {isActive && status === "playing" && (
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "rgba(76,175,130,0.12)", color: "#4caf82", fontWeight: 700 }}>
                        ● Live
                      </span>
                    )}
                  </div>
                  <a href={station.homepage} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color: "var(--muted)", display: "flex", transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
