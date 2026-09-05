import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Play, Pause, Loader,
  Radio as RadioIcon, ArrowLeft, Heart, Share2,
  Globe, Zap, Calendar, ChevronRight,
} from "lucide-react";
import { CATEGORY_CONFIG, toStation, type Station } from "../data/radios";
import { getRadios } from "../lib/api";

type StationStatus = "idle" | "loading" | "playing" | "error";

export default function RadioDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<StationStatus>("idle");
  const [muted] = useState(false);
  const [volume] = useState(0.8);
  // muted/volume are read-only here — volume controls are in the list page's now-playing bar
  const [liked, setLiked] = useState(false);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getRadios().then(r => setAllStations(r.data.map(toStation))).catch(() => setAllStations([])).finally(() => setLoading(false));
  }, []);

  const station = allStations.find(s => s.id === id);

  const playStation = useCallback(() => {
    if (!station) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setStatus("idle");
      return;
    }
    audioRef.current?.pause();
    setStatus("loading");

    const audio = new Audio();
    audio.volume = muted ? 0 : volume;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    audio.src = station.streamUrl;

    audio.play()
      .then(() => {
        setIsPlaying(true);
        setStatus("playing");
        audio.onerror = () => { setStatus("error"); setIsPlaying(false); };
      })
      .catch(() => { setStatus("error"); });

    setTimeout(() => {
      setStatus(prev => {
        if (prev === "loading") { setIsPlaying(false); return "error"; }
        return prev;
      });
    }, 10000);
  }, [station, isPlaying, muted, volume]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader size={28} style={{ color: "var(--muted)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!station) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <RadioIcon size={48} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
            {t("radio.detail.notFound")}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px" }}>
            {t("radio.detail.notFoundHint")}
          </p>
          <button
            onClick={() => navigate("/radio")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "99px",
              background: "var(--amber)", color: "#fff",
              fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> {t("radio.detail.backToRadios")}
          </button>
        </div>
      </div>
    );
  }

  const otherStations = allStations.filter(s => s.id !== station.id).slice(0, 3);
  const CatIcon = CATEGORY_CONFIG[station.category]?.icon || RadioIcon;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO BANNER ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "120px 24px 60px",
        background: `linear-gradient(135deg, ${station.color}15, rgba(240,235,227,0.02))`,
      }}>
        {/* Decorative */}
        <div style={{
          position: "absolute", top: "-30%", right: "-10%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: `radial-gradient(circle, ${station.color}12 0%, transparent 65%)`,
          pointerEvents: "none",
        }} />
        {[240, 160, 100].map((s, i) => (
          <div key={i} style={{
            position: "absolute", top: `${20 + i * 15}%`, right: `${5 + i * 8}%`,
            width: s, height: s, borderRadius: "50%",
            border: `1px solid ${station.color}${10 + i * 4}`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Back */}
          <button
            onClick={() => navigate("/radio")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "99px",
              background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.08)",
              color: "var(--muted)", fontSize: "12px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s", marginBottom: "32px",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}
          >
            <ArrowLeft size={14} /> {t("common.back")}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
            {/* Left: Info */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "16px",
                  background: `${station.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <station.Icon size={28} style={{ color: station.color }} />
                </div>
                <div>
                  <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "var(--text)", lineHeight: 1.05 }}>
                    {station.name}
                  </h1>
                  <p style={{ fontSize: "16px", color: station.color, fontWeight: 700 }}>{station.freq}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "5px 14px", borderRadius: "99px",
                  background: `${station.color}14`, color: station.color,
                  fontSize: "11px", fontWeight: 700,
                }}>
                  <CatIcon size={12} /> {CATEGORY_CONFIG[station.category]?.label}
                </span>
                {status === "playing" && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "5px 12px", borderRadius: "99px",
                    background: "rgba(76,175,130,0.12)", color: "#4caf82",
                    fontSize: "11px", fontWeight: 700,
                  }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4CAF50", animation: "radioPulse 1.5s infinite" }} />
                    {t("radio.live")}
                  </span>
                )}
                {station.listeners && (
                  <span style={{
                    padding: "5px 12px", borderRadius: "99px",
                    background: "rgba(240,235,227,0.06)", color: "var(--muted)",
                    fontSize: "11px", fontWeight: 600,
                  }}>
                    {station.listeners.toLocaleString("fr-FR")} {t("radio.listeners")}
                  </span>
                )}
              </div>

              <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.8, marginBottom: "28px", maxWidth: "520px" }}>
                {station.longDesc || station.desc}
              </p>

              {/* Info cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
                {[
                  { icon: Globe, label: t("radio.detail.language"), value: station.lang },
                  { icon: Zap, label: t("radio.detail.category"), value: CATEGORY_CONFIG[station.category]?.label },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: "12px",
                    background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.05)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <item.icon size={13} style={{ color: station.color }} />
                      <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                        {item.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={playStation}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "14px 28px", borderRadius: "99px",
                    background: station.color, color: "#fff",
                    fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${station.color}40`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  {status === "loading"
                    ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> {t("radio.connecting")}</>
                    : isPlaying
                    ? <><Pause size={16} fill="white" /> {t("radio.pause")}</>
                    : <><Play size={16} fill="white" /> {t("radio.listen")}</>
                  }
                </button>

                <button
                  onClick={() => setLiked(!liked)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "14px 20px", borderRadius: "99px",
                    background: liked ? `${station.color}10` : "rgba(240,235,227,0.04)",
                    border: liked ? `1px solid ${station.color}30` : "1px solid rgba(240,235,227,0.08)",
                    color: liked ? station.color : "var(--muted)",
                    fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  <Heart size={15} fill={liked ? station.color : "none"} /> {liked ? t("radio.detail.following") : t("radio.detail.follow")}
                </button>

                <a href={station.homepage} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "14px 20px", borderRadius: "99px",
                  background: "rgba(240,235,227,0.04)", border: "1px solid rgba(240,235,227,0.08)",
                  color: "var(--muted)", fontWeight: 600, fontSize: "13px", textDecoration: "none",
                }}>
                  <Share2 size={15} /> {t("radio.detail.share")}
                </a>
              </div>
            </div>

            {/* Right: Visual */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", minHeight: "360px",
            }}>
              <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                {isPlaying ? (
                  <div style={{ display: "flex", gap: "5px", alignItems: "flex-end", height: "64px", justifyContent: "center" }}>
                    {[16, 32, 22, 44, 28, 38, 18, 34, 24].map((h, i) => (
                      <div key={i} style={{
                        width: "6px", height: `${h}px`, borderRadius: "99px",
                        background: station.color, animation: `radioBar 0.5s ${i * 0.06}s ease-in-out infinite alternate`,
                      }} />
                    ))}
                  </div>
                ) : (
                  <RadioIcon size={72} style={{ color: station.color, opacity: 0.2 }} />
                )}
                <div className="bebas" style={{ fontSize: "80px", color: station.color, opacity: 0.1, lineHeight: 1, marginTop: "16px" }}>
                  {station.freq}
                </div>
              </div>
              {[280, 200, 120].map((s, i) => (
                <div key={i} style={{
                  position: "absolute", width: s, height: s, borderRadius: "50%",
                  border: `1px solid ${station.color}${8 + i * 4}`,
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* ── SCHEDULE ── */}
        {station.schedule && station.schedule.length > 0 && (
          <div style={{ marginTop: "48px", marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <Calendar size={18} style={{ color: station.color }} />
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
                {t("radio.detail.schedule")}
              </h2>
            </div>

            <div style={{
              borderRadius: "16px", overflow: "hidden",
              border: "1px solid rgba(240,235,227,0.06)",
            }}>
              {station.schedule.map((slot, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "180px 140px 1fr",
                  padding: "16px 20px", gap: "16px", alignItems: "center",
                  background: i % 2 === 0 ? "rgba(240,235,227,0.02)" : "transparent",
                  borderBottom: i < station.schedule!.length - 1 ? "1px solid rgba(240,235,227,0.04)" : "none",
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>{slot.day}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: station.color }}>{slot.time}</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{slot.show}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAGS ── */}
        {station.tags && station.tags.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>
              {t("radio.detail.tags")}
            </h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {station.tags.map((tag, i) => (
                <span key={i} style={{
                  padding: "6px 14px", borderRadius: "99px",
                  background: `${station.color}08`, border: `1px solid ${station.color}20`,
                  color: station.color, fontSize: "12px", fontWeight: 600,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── OTHER STATIONS ── */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
              {t("radio.detail.otherStations")}
            </h2>
            <button
              onClick={() => navigate("/radio")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "13px", fontWeight: 600, color: "var(--amber)",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              {t("radio.detail.viewAll")} <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {otherStations.map(other => (
              <div key={other.id} onClick={() => navigate(`/radio/${other.id}`)} style={{
                padding: "20px", borderRadius: "14px",
                background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.05)",
                transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = `${other.color}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.05)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: `${other.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <other.Icon size={18} style={{ color: other.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{other.name}</p>
                    <p style={{ fontSize: "11px", color: other.color, fontWeight: 600 }}>{other.freq}</p>
                  </div>
                </div>
                <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{other.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <div style={{
          padding: "40px", borderRadius: "20px",
          background: `linear-gradient(135deg, ${station.color}10, ${station.color}04)`,
          border: `1px solid ${station.color}20`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "20px",
        }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
              {t("radio.detail.ctaTitle")}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              {t("radio.detail.ctaDescription")}
            </p>
          </div>
          <button
            onClick={playStation}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px", borderRadius: "99px",
              background: station.color, color: "#fff",
              fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${station.color}40`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            {isPlaying ? <><Pause size={16} fill="white" /> {t("radio.pause")}</> : <><Play size={16} fill="white" /> {t("radio.listen")}</>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes radioPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes radioBar { from { opacity: 0.6; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
