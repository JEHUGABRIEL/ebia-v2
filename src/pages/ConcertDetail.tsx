import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Calendar, MapPin, Clock, Users, Music2, ArrowLeft, Bell, CheckCircle2,
  Share2, Heart, Ticket, Tag, Mic2, Star, ChevronRight, ExternalLink,
} from "lucide-react";
import { CONCERTS, STATUS_CONFIG } from "../data/concerts";

export default function ConcertDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subscribed, setSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);

  const concert = CONCERTS.find(c => c.id === id);

  if (!concert) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Music2 size={48} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
            {t("concerts.detail.notFound")}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px" }}>
            {t("concerts.detail.notFoundHint")}
          </p>
          <button
            onClick={() => navigate("/concerts")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", borderRadius: "99px",
              background: "var(--amber)", color: "#fff",
              fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> {t("concerts.detail.backToConcerts")}
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[concert.status];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO BANNER ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "120px 24px 60px",
        background: `linear-gradient(135deg, ${concert.coverColor}15, rgba(240,235,227,0.02))`,
      }}>
        {/* Decorative elements */}
        <div style={{
          position: "absolute", top: "-30%", right: "-10%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: `radial-gradient(circle, ${concert.coverColor}12 0%, transparent 65%)`,
          pointerEvents: "none",
        }} />
        {[240, 160, 100].map((s, i) => (
          <div key={i} style={{
            position: "absolute", top: `${20 + i * 15}%`, right: `${5 + i * 8}%`,
            width: s, height: s, borderRadius: "50%",
            border: `1px solid ${concert.coverColor}${10 + i * 4}`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Back button */}
          <button
            onClick={() => navigate("/concerts")}
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
              {/* Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <span style={{
                  padding: "5px 14px", borderRadius: "99px",
                  background: status.bg, color: status.color,
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                }}>{status.label}</span>
                <span style={{
                  padding: "5px 12px", borderRadius: "99px",
                  background: "rgba(240,235,227,0.06)", color: "var(--muted)",
                  fontSize: "11px", fontWeight: 600,
                }}>{concert.genre}</span>
              </div>

              <h1 style={{
                fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800,
                color: "var(--text)", lineHeight: 1.05, marginBottom: "8px",
              }}>
                {concert.title}
              </h1>

              <p style={{
                fontSize: "16px", color: concert.coverColor,
                fontWeight: 600, marginBottom: "16px",
              }}>
                {concert.artist}
              </p>

              <p style={{
                fontSize: "15px", color: "var(--muted)", lineHeight: 1.8,
                marginBottom: "32px", maxWidth: "520px",
              }}>
                {concert.longDescription || concert.description}
              </p>

              {/* Info grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
                marginBottom: "32px",
              }}>
                {[
                  { icon: Calendar, label: t("concerts.detail.date"), value: concert.date },
                  { icon: Clock, label: t("concerts.detail.time"), value: concert.time },
                  { icon: MapPin, label: t("concerts.detail.location"), value: concert.location },
                  { icon: Users, label: t("concerts.detail.capacity"), value: `${concert.attendees?.toLocaleString("fr-FR")} ${t("concerts.attendees")}` },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: "12px",
                    background: "rgba(240,235,227,0.03)",
                    border: "1px solid rgba(240,235,227,0.05)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <item.icon size={13} style={{ color: concert.coverColor }} />
                      <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                        {item.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {concert.status === "sold_out" ? (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "14px 28px", borderRadius: "99px",
                    background: "rgba(240,128,128,0.1)", color: "#f08080",
                    border: "1px solid rgba(240,128,128,0.2)",
                    fontWeight: 700, fontSize: "14px",
                  }}>
                    <Ticket size={16} /> {t("concerts.detail.soldOut")}
                  </div>
                ) : (
                  <button
                    onClick={() => setSubscribed(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "14px 28px", borderRadius: "99px",
                      background: subscribed ? "rgba(16,185,129,0.15)" : concert.coverColor,
                      color: subscribed ? "#10B981" : "#fff",
                      border: subscribed ? "1px solid rgba(16,185,129,0.3)" : "none",
                      fontWeight: 700, fontSize: "14px", cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { if (!subscribed) (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${concert.coverColor}40`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                  >
                    {subscribed ? <><CheckCircle2 size={16} /> {t("concerts.subscribed")}</> : <><Bell size={16} /> {t("concerts.detail.register")}</>}
                  </button>
                )}

                <button
                  onClick={() => setLiked(!liked)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "14px 20px", borderRadius: "99px",
                    background: liked ? "rgba(232,96,26,0.1)" : "rgba(240,235,227,0.04)",
                    border: liked ? "1px solid rgba(232,96,26,0.2)" : "1px solid rgba(240,235,227,0.08)",
                    color: liked ? "var(--amber)" : "var(--muted)",
                    fontWeight: 600, fontSize: "13px", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Heart size={15} fill={liked ? "var(--amber)" : "none"} /> {liked ? t("concerts.detail.liked") : t("concerts.detail.like")}
                </button>

                <button style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "14px 20px", borderRadius: "99px",
                  background: "rgba(240,235,227,0.04)", border: "1px solid rgba(240,235,227,0.08)",
                  color: "var(--muted)", fontWeight: 600, fontSize: "13px",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  <Share2 size={15} /> {t("concerts.detail.share")}
                </button>
              </div>
            </div>

            {/* Right: Visual */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", minHeight: "360px",
            }}>
              <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <Music2 size={80} style={{ color: concert.coverColor, opacity: 0.2, marginBottom: "20px" }} />
                <div className="bebas" style={{
                  fontSize: "96px", color: concert.coverColor, opacity: 0.1, lineHeight: 1,
                }}>
                  {concert.date.split(" ")[1]}
                </div>
                <div style={{
                  marginTop: "8px", fontSize: "14px", fontWeight: 600,
                  color: concert.coverColor, opacity: 0.5,
                }}>
                  {concert.genre}
                </div>
              </div>
              {/* Concentric circles */}
              {[280, 200, 120].map((s, i) => (
                <div key={i} style={{
                  position: "absolute", width: s, height: s, borderRadius: "50%",
                  border: `1px solid ${concert.coverColor}${8 + i * 4}`,
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* ── LINEUP ── */}
        {concert.lineup && concert.lineup.length > 0 && (
          <div style={{ marginTop: "48px", marginBottom: "48px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px",
            }}>
              <Mic2 size={18} style={{ color: concert.coverColor }} />
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
                {t("concerts.detail.lineup")}
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {concert.lineup.map((artist, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "16px 18px", borderRadius: "14px",
                  background: i === 0 ? `${concert.coverColor}10` : "rgba(240,235,227,0.03)",
                  border: `1px solid ${i === 0 ? `${concert.coverColor}25` : "rgba(240,235,227,0.05)"}`,
                  transition: "border-color 0.2s, transform 0.2s", cursor: "pointer",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${concert.coverColor}40`; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = i === 0 ? `${concert.coverColor}25` : "rgba(240,235,227,0.05)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    background: i === 0 ? `${concert.coverColor}20` : "rgba(240,235,227,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {i === 0 ? (
                      <Star size={16} style={{ color: concert.coverColor }} />
                    ) : (
                      <Music2 size={14} style={{ color: "var(--muted)" }} />
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{artist}</p>
                    {i === 0 && (
                      <p style={{ fontSize: "10px", fontWeight: 600, color: concert.coverColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Tête d'affiche
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAGS ── */}
        {concert.tags && concert.tags.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px",
            }}>
              <Tag size={16} style={{ color: concert.coverColor }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                {t("concerts.detail.tags")}
              </h3>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {concert.tags.map((tag, i) => (
                <span key={i} style={{
                  padding: "6px 14px", borderRadius: "99px",
                  background: `${concert.coverColor}08`,
                  border: `1px solid ${concert.coverColor}20`,
                  color: concert.coverColor, fontSize: "12px", fontWeight: 600,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── PRACTICAL INFO ── */}
        <div style={{
          padding: "32px", borderRadius: "20px",
          background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.05)",
          marginBottom: "48px",
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "20px" }}>
            {t("concerts.detail.practicalInfo")}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
            {[
              {
                icon: MapPin,
                title: t("concerts.detail.howToGetThere"),
                value: concert.location,
                color: concert.coverColor,
              },
              {
                icon: Clock,
                title: t("concerts.detail.schedule"),
                value: `${t("concerts.detail.doors")} 18h00 · ${t("concerts.detail.show")} ${concert.time}`,
                color: "#8B5CF6",
              },
              {
                icon: Ticket,
                title: t("concerts.detail.tickets"),
                value: concert.status === "free" ? t("concerts.detail.freeEntry") : concert.status === "sold_out" ? t("concerts.detail.soldOut") : t("concerts.detail.onSale"),
                color: "#10B981",
              },
            ].map((item, i) => (
              <div key={i} style={{
                padding: "20px", borderRadius: "14px",
                background: "rgba(240,235,227,0.03)",
                border: "1px solid rgba(240,235,227,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: `${item.color}12`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {item.title}
                  </span>
                </div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", lineHeight: 1.5 }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── OTHER CONCERTS ── */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px",
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
              {t("concerts.detail.otherConcerts")}
            </h2>
            <button
              onClick={() => navigate("/concerts")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "13px", fontWeight: 600, color: "var(--amber)",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              {t("concerts.detail.viewAll")} <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {CONCERTS.filter(c => c.id !== concert.id).slice(0, 3).map(other => (
              <div key={other.id} onClick={() => navigate(`/concerts/${other.id}`)} style={{
                padding: "20px", borderRadius: "14px",
                background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.05)",
                transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = `${other.coverColor}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.05)"; }}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px",
                }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: "99px",
                    background: STATUS_CONFIG[other.status].bg, color: STATUS_CONFIG[other.status].color,
                    fontSize: "10px", fontWeight: 700,
                  }}>{STATUS_CONFIG[other.status].label}</span>
                  <ExternalLink size={12} style={{ color: "var(--muted)" }} />
                </div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{other.title}</p>
                <p style={{ fontSize: "12px", color: other.coverColor, fontWeight: 600, marginBottom: "10px" }}>{other.artist}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
                  <Calendar size={11} /> {other.date} · <MapPin size={11} /> {other.location.split(",")[0]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <div style={{
          padding: "40px", borderRadius: "20px",
          background: `linear-gradient(135deg, ${concert.coverColor}10, ${concert.coverColor}04)`,
          border: `1px solid ${concert.coverColor}20`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "20px",
        }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
              {t("concerts.detail.ctaTitle")}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              {t("concerts.detail.ctaDescription")}
            </p>
          </div>
          <button
            onClick={() => setSubscribed(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px", borderRadius: "99px",
              background: subscribed ? "rgba(16,185,129,0.15)" : concert.coverColor,
              color: subscribed ? "#10B981" : "#fff",
              border: subscribed ? "1px solid rgba(16,185,129,0.3)" : "none",
              fontWeight: 700, fontSize: "14px", cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!subscribed) (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${concert.coverColor}40`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            {subscribed ? <><CheckCircle2 size={16} /> {t("concerts.subscribed")}</> : <><Bell size={16} /> {t("concerts.subscribe")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
