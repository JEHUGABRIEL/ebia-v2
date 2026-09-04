import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Volume2, VolumeX, Loader, WifiOff, ExternalLink,
  Radio as RadioIcon, Headphones, Globe, Zap, Heart, ListMusic,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { STATIC_STATIONS, CATEGORY_CONFIG, type StationCategory, type Station } from "../data/radios";
import { getListenerPreferredGenres, getTracks, type Track } from "../lib/api";
import { orderByPreferredGenres } from "../lib/preferences";
import { useApp } from "../context/AppContext";
import RadioQueuePanel from "../components/RadioQueuePanel";

type StationStatus = "idle" | "loading" | "playing" | "error";

export default function RadioPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useApp();
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, StationStatus>>({});
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [activeCategory, setActiveCategory] = useState<StationCategory>("all");
  const [likedStations, setLikedStations] = useState<Set<string>>(new Set());
  const [radioQueue, setRadioQueue] = useState<Track[]>([]);
  const [showRadioQueue, setShowRadioQueue] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stations dont le programme (tags) correspond aux genres de l'auditeur → en tête.
  useEffect(() => {
    if (!user || user.role === "artist" || user.role === "admin") return;
    getListenerPreferredGenres(user.role).then(setPreferredGenres).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stations = preferredGenres.length > 0
    ? orderByPreferredGenres(STATIC_STATIONS, preferredGenres)
    : STATIC_STATIONS;
  const filteredStations = activeCategory === "all"
    ? stations
    : stations.filter(s => s.category === activeCategory);

  const featured = stations.find(s => s.id === "ndeke-luka");
  const currentStation = stations.find(s => s.id === currentId);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const setStatus = useCallback((id: string, s: StationStatus) =>
    setStatuses(prev => ({ ...prev, [id]: s })), []);

  // Fetch tracks from same genre when station changes
  useEffect(() => {
    if (!currentStation || statuses[currentStation.id] !== "playing") return;

    const genreMap: Record<string, string> = {
      music: "Afro-Pop",
      gospel: "Gospel",
      info: "Hip-Hop",
      community: "R&B",
    };

    const genre = genreMap[currentStation.category] || "Afro-Pop";
    getTracks({ genre, limit: "15" })
      .then(r => setRadioQueue(r.data || []))
      .catch(() => setRadioQueue([]));
  }, [currentStation?.id, statuses[currentStation?.id || ""]]);

  const playStation = useCallback((station: Station) => {
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

    audio.play()
      .then(() => {
        setStatus(station.id, "playing");
        audio.onerror = () => { setStatus(station.id, "error"); setCurrentId(null); };
      })
      .catch(() => { setStatus(station.id, "error"); setCurrentId(null); });

    setTimeout(() => {
      setStatuses(prev => {
        if (prev[station.id] === "loading") {
          setCurrentId(null);
          return { ...prev, [station.id]: "error" };
        }
        return prev;
      });
    }, 10000);
  }, [currentId, statuses, muted, volume, setStatus]);

  const toggleLike = (id: string) => {
    setLikedStations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: currentStation ? "140px" : "120px" }}>

      {/* ── HERO ── */}
      <section style={{
        padding: "120px 24px 60px", maxWidth: "1360px", margin: "0 auto",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-20%", left: "-15%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "5px 14px", borderRadius: "99px",
            border: "1px solid rgba(16,185,129,0.3)", marginBottom: "20px",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", color: "#4caf82",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#4CAF50", display: "inline-block",
              animation: "radioPulse 1.5s infinite",
            }} />
            {t("radio.liveTag")}
          </div>

          <h1 className="bebas" style={{
            fontSize: "clamp(48px, 8vw, 96px)", color: "var(--text)",
            lineHeight: 0.92, marginBottom: "16px",
          }}>
            {t("radio.title")}<br />
            <span style={{ color: "#4caf82" }}>{t("radio.titleAccent")}</span>
          </h1>

          <p style={{
            fontSize: "16px", color: "var(--muted)", maxWidth: "520px",
            lineHeight: 1.7, marginBottom: "24px",
          }}>
            {t("radio.description")}
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
              { value: stations.length, label: t("radio.statStations") },
              { value: "24/7", label: t("radio.statLive") },
              { value: "2", label: t("radio.statLang") },
            ].map((stat, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)" }}>{stat.value}</span>
                <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>

        {/* ── FEATURED STATION ── */}
        {featured && (
          <div style={{ marginBottom: "48px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px",
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase", color: featured.color,
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: featured.color }} />
              {t("radio.featured")}
            </div>

            <div
              onClick={() => playStation(featured)}
              style={{
                borderRadius: "20px", overflow: "hidden", cursor: "pointer",
                background: `linear-gradient(135deg, ${featured.color}12, rgba(240,235,227,0.02))`,
                border: `1px solid ${currentId === featured.id ? featured.color + "40" : featured.color + "25"}`,
                transition: "border-color 0.3s, transform 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${featured.color}50`; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${featured.color}25`; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "280px" }}>
                {/* Left: Info */}
                <div style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "14px",
                      background: `${featured.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <featured.Icon size={24} style={{ color: featured.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)" }}>{featured.name}</p>
                      <p style={{ fontSize: "12px", color: featured.color, fontWeight: 600 }}>{featured.freq}</p>
                    </div>
                  </div>

                  <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "20px" }}>
                    {featured.desc}
                  </p>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "99px", background: `${featured.color}14`, color: featured.color, fontSize: "11px", fontWeight: 700 }}>
                      {featured.lang}
                    </span>
                    {featured.listeners && (
                      <span style={{ padding: "4px 12px", borderRadius: "99px", background: "rgba(240,235,227,0.06)", color: "var(--muted)", fontSize: "11px", fontWeight: 600 }}>
                        {featured.listeners.toLocaleString("fr-FR")} {t("radio.listeners")}
                      </span>
                    )}
                    {statuses[featured.id] === "playing" && currentId === featured.id && (
                      <span style={{ padding: "4px 12px", borderRadius: "99px", background: "rgba(76,175,130,0.12)", color: "#4caf82", fontSize: "11px", fontWeight: 700 }}>
                        ● {t("radio.live")}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "12px 24px", borderRadius: "99px",
                      background: currentId === featured.id && statuses[featured.id] === "playing" ? featured.color : featured.color,
                      color: "#fff", fontWeight: 700, fontSize: "13px",
                      border: "none", cursor: "pointer", transition: "box-shadow 0.2s",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${featured.color}40`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                    >
                      {currentId === featured.id && statuses[featured.id] === "playing"
                        ? <><Pause size={14} fill="white" /> {t("radio.pause")}</>
                        : <><Play size={14} fill="white" /> {t("radio.listen")}</>
                      }
                    </button>
                    <a href={featured.homepage} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "12px 18px", borderRadius: "99px",
                        background: "rgba(240,235,227,0.04)", border: "1px solid rgba(240,235,227,0.08)",
                        color: "var(--muted)", fontWeight: 600, fontSize: "12px", textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={13} /> {t("radio.website")}
                    </a>
                  </div>
                </div>

                {/* Right: Visual */}
                <div style={{
                  background: `linear-gradient(135deg, ${featured.color}20, ${featured.color}08)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                    {currentId === featured.id && statuses[featured.id] === "playing" ? (
                      <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "48px", justifyContent: "center" }}>
                        {[12, 24, 16, 32, 20, 28, 14].map((h, i) => (
                          <div key={i} style={{
                            width: "5px", height: `${h}px`, borderRadius: "99px",
                            background: featured.color, animation: `radioBar 0.5s ${i * 0.08}s ease-in-out infinite alternate`,
                          }} />
                        ))}
                      </div>
                    ) : (
                      <RadioIcon size={56} style={{ color: featured.color, opacity: 0.25 }} />
                    )}
                    <div className="bebas" style={{ fontSize: "64px", color: featured.color, opacity: 0.12, lineHeight: 1, marginTop: "12px" }}>
                      {featured.freq}
                    </div>
                  </div>
                  {[200, 140, 80].map((s, i) => (
                    <div key={i} style={{
                      position: "absolute", width: s, height: s, borderRadius: "50%",
                      border: `1px solid ${featured.color}${12 + i * 4}`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CATEGORY FILTERS ── */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "flex", gap: "8px", overflowX: "auto",
            paddingBottom: "8px", scrollbarWidth: "none",
          }}>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const cat = key as StationCategory;
              const isActive = activeCategory === cat;
              const IconComp = config.icon;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "10px 18px", borderRadius: "99px",
                  background: isActive ? "rgba(240,235,227,0.1)" : "rgba(240,235,227,0.03)",
                  border: `1px solid ${isActive ? "rgba(240,235,227,0.15)" : "rgba(240,235,227,0.05)"}`,
                  color: isActive ? "var(--text)" : "var(--muted)",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  <IconComp size={14} /> {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STATIONS GRID ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px", marginBottom: "48px",
        }}>
          {filteredStations.map(station => {
            const status = statuses[station.id] ?? "idle";
            const isActive = currentId === station.id;
            const isPlaying = isActive && status === "playing";

            return (
              <div key={station.id}
                onClick={() => navigate(`/radio/${station.id}`)}
                style={{
                  borderRadius: "18px", overflow: "hidden", cursor: "pointer",
                  background: isPlaying ? `${station.color}0E` : "rgba(240,235,227,0.03)",
                  border: `1px solid ${isPlaying ? station.color + "35" : "rgba(240,235,227,0.06)"}`,
                  transition: "all 0.25s",
                }}
                onMouseEnter={e => {
                  if (!isPlaying) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.12)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isPlaying) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.03)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.06)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }
                }}
              >
                {/* Cover */}
                <div style={{
                  height: "120px", position: "relative",
                  background: `linear-gradient(135deg, ${station.color}15, ${station.color}05)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isPlaying ? (
                    <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "32px" }}>
                      {[8, 18, 12, 24, 14, 20, 10].map((h, i) => (
                        <div key={i} style={{
                          width: "4px", height: `${h}px`, borderRadius: "99px",
                          background: station.color, animation: `radioBar 0.5s ${i * 0.08}s ease-in-out infinite alternate`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    <station.Icon size={36} style={{ color: station.color, opacity: 0.2 }} />
                  )}

                  {/* Frequency watermark */}
                  <div className="bebas" style={{
                    position: "absolute", bottom: "8px", right: "14px",
                    fontSize: "42px", color: station.color, opacity: 0.1, lineHeight: 1,
                  }}>{station.freq.split(" ")[0]}</div>

                  {/* Play button overlay */}
                  <div style={{
                    position: "absolute", top: "12px", right: "12px",
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: isPlaying ? station.color : "rgba(0,0,0,0.3)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    {status === "loading"
                      ? <Loader size={14} style={{ color: "white", animation: "spin 1s linear infinite" }} />
                      : isPlaying
                      ? <Pause size={14} fill="white" color="white" />
                      : status === "error"
                      ? <WifiOff size={14} style={{ color: "rgba(255,255,255,0.6)" }} />
                      : <Play size={14} fill="white" color="white" style={{ marginLeft: "1px" }} />
                    }
                  </div>

                  {/* Live badge */}
                  {isPlaying && (
                    <div style={{
                      position: "absolute", top: "12px", left: "12px",
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "4px 10px", borderRadius: "99px",
                      background: "rgba(76,175,130,0.2)", backdropFilter: "blur(8px)",
                    }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4CAF50", animation: "radioPulse 1.5s infinite" }} />
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#4caf82" }}>{t("radio.live")}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{station.name}</p>
                      <p style={{ fontSize: "12px", color: station.color, fontWeight: 600 }}>{station.freq}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleLike(station.id); }} style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: "4px", color: likedStations.has(station.id) ? "var(--amber)" : "var(--muted)",
                      transition: "color 0.2s",
                    }}>
                      <Heart size={16} fill={likedStations.has(station.id) ? "var(--amber)" : "none"} />
                    </button>
                  </div>

                  <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "14px" }}>
                    {station.desc}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        fontSize: "10px", padding: "3px 10px", borderRadius: "99px",
                        background: `${station.color}14`, color: station.color, fontWeight: 700,
                      }}>
                        {station.lang}
                      </span>
                      {status === "error" && (
                        <span style={{
                          fontSize: "10px", padding: "3px 10px", borderRadius: "99px",
                          background: "rgba(220,50,50,0.1)", color: "#f08080", fontWeight: 600,
                        }}>
                          {t("radio.offline")}
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
              </div>
            );
          })}
        </div>

        {/* ── HOW IT WORKS ── */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>
            {t("radio.howItWorks")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              { icon: Headphones, title: t("radio.step1Title"), desc: t("radio.step1Desc"), color: "#E8601A" },
              { icon: Zap, title: t("radio.step2Title"), desc: t("radio.step2Desc"), color: "#8B5CF6" },
              { icon: Globe, title: t("radio.step3Title"), desc: t("radio.step3Desc"), color: "#10B981" },
            ].map((step, i) => (
              <div key={i} style={{
                padding: "24px", borderRadius: "16px",
                background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.05)",
              }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "12px",
                  background: `${step.color}12`, display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px",
                }}>
                  <step.icon size={20} style={{ color: step.color }} />
                </div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>{step.title}</p>
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NOW PLAYING BAR (sticky bottom) ── */}
      {currentStation && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(18,18,18,0.95)", backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(240,235,227,0.08)",
          padding: "12px 24px",
        }}>
          <div style={{ maxWidth: "1360px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
            {/* Left: Station info */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                background: `${currentStation.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {statuses[currentId!] === "playing" ? (
                  <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "18px" }}>
                    {[5, 10, 7, 14, 9].map((h, i) => (
                      <div key={i} style={{
                        width: "3px", height: `${h}px`, borderRadius: "99px",
                        background: currentStation.color, animation: `radioBar 0.5s ${i * 0.1}s ease-in-out infinite alternate`,
                      }} />
                    ))}
                  </div>
                ) : (
                  <currentStation.Icon size={20} style={{ color: currentStation.color }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {statuses[currentId!] === "loading" ? t("radio.connecting") : currentStation.name}
                </p>
                <p style={{ fontSize: "11px", color: currentStation.color, fontWeight: 600 }}>{currentStation.freq}</p>
              </div>
            </div>

            {/* Center: Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => playStation(currentStation)} style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: currentStation.color, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "box-shadow 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${currentStation.color}50`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {statuses[currentId!] === "loading"
                  ? <Loader size={16} style={{ color: "white", animation: "spin 1s linear infinite" }} />
                  : statuses[currentId!] === "playing"
                  ? <Pause size={16} fill="white" color="white" />
                  : <Play size={16} fill="white" color="white" style={{ marginLeft: "1px" }} />
                }
              </button>
            </div>

            {/* Right: Queue + Volume */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Queue button */}
              <button
                onClick={() => setShowRadioQueue(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "99px",
                  background: radioQueue.length > 0 ? "rgba(76,175,130,0.12)" : "transparent",
                  border: `1px solid ${radioQueue.length > 0 ? "rgba(76,175,130,0.3)" : "rgba(240,235,227,0.1)"}`,
                  color: radioQueue.length > 0 ? "#4caf82" : "var(--muted)",
                  fontSize: "11px", fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <ListMusic size={13} />
                {radioQueue.length > 0 ? `${radioQueue.length} titres` : "File"}
              </button>
              <button onClick={() => setMuted(m => { const n = !m; if (audioRef.current) audioRef.current.volume = n ? 0 : volume; return n; })} style={{
                background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
              }}>
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={e => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; setMuted(false); }}
                style={{ width: "80px", accentColor: currentStation.color }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes radioPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes radioBar { from { opacity: 0.6; } to { opacity: 1; } }
      `}</style>

      {/* Radio Queue Panel */}
      <RadioQueuePanel
        isOpen={showRadioQueue}
        onClose={() => setShowRadioQueue(false)}
        queueTracks={radioQueue}
        onRemoveTrack={(trackId) => setRadioQueue(prev => prev.filter(t => t.id !== trackId))}
        onClearQueue={() => setRadioQueue([])}
        stationName={currentStation?.name || "Radio"}
      />
    </div>
  );
}
