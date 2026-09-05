import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Calendar, MapPin, Clock, Ticket, Music2, ArrowLeft, Bell, CheckCircle2,
  Share2, Heart, ChevronRight, ExternalLink, Loader,
} from "lucide-react";
import { getEvent, getEvents, type EventItem } from "../lib/api";
import { eventColor, fmtEventDate } from "../lib/eventColors";

export default function ConcertDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subscribed, setSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [otherEvents, setOtherEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getEvent(id).then(setEvent).catch(() => setEvent(null)).finally(() => setLoading(false));
    getEvents().then(r => setOtherEvents(r.data)).catch(() => setOtherEvents([]));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader size={28} style={{ color: "var(--muted)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!event) {
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

  const color = eventColor(event.genre);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO BANNER ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "120px 24px 60px",
        background: event.coverImageUrl
          ? `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${event.coverImageUrl}) center/cover`
          : `linear-gradient(135deg, ${color}15, rgba(240,235,227,0.02))`,
      }}>
        {/* Decorative elements */}
        <div style={{
          position: "absolute", top: "-30%", right: "-10%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: `radial-gradient(circle, ${color}12 0%, transparent 65%)`,
          pointerEvents: "none",
        }} />
        {[240, 160, 100].map((s, i) => (
          <div key={i} style={{
            position: "absolute", top: `${20 + i * 15}%`, right: `${5 + i * 8}%`,
            width: s, height: s, borderRadius: "50%",
            border: `1px solid ${color}${10 + i * 4}`,
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

          <div style={{ display: "grid", gridTemplateColumns: event.coverImageUrl ? "1fr" : "1fr 1fr", gap: "48px", alignItems: "center" }}>
            {/* Left: Info */}
            <div>
              {/* Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <span style={{
                  padding: "5px 14px", borderRadius: "99px",
                  background: event.free ? "rgba(16,185,129,0.15)" : "rgba(232,96,26,0.15)",
                  color: event.free ? "#10B981" : "var(--amber)",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                }}>{event.free ? t("concerts.free") : t("concerts.paid")}</span>
                {event.genre && (
                  <span style={{
                    padding: "5px 12px", borderRadius: "99px",
                    background: "rgba(240,235,227,0.06)", color: "var(--muted)",
                    fontSize: "11px", fontWeight: 600,
                  }}>{event.genre}</span>
                )}
              </div>

              <h1 style={{
                fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800,
                color: "var(--text)", lineHeight: 1.05, marginBottom: "8px",
              }}>
                {event.title}
              </h1>

              {event.artistName && (
                <p style={{
                  fontSize: "16px", color, fontWeight: 600, marginBottom: "16px",
                }}>
                  {event.artistName}
                </p>
              )}

              {event.description && (
                <p style={{
                  fontSize: "15px", color: "var(--muted)", lineHeight: 1.8,
                  marginBottom: "32px", maxWidth: "520px",
                }}>
                  {event.description}
                </p>
              )}

              {/* Info grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
                marginBottom: "32px", maxWidth: event.coverImageUrl ? "560px" : "none",
              }}>
                {[
                  { icon: Calendar, label: t("concerts.detail.date"), value: fmtEventDate(event.eventDate) },
                  ...(event.eventTime ? [{ icon: Clock, label: t("concerts.detail.time"), value: event.eventTime }] : []),
                  { icon: MapPin, label: t("concerts.detail.location"), value: `${event.venue}, ${event.city}` },
                  ...(event.capacity ? [{ icon: Ticket, label: t("concerts.detail.capacity"), value: `${event.capacity.toLocaleString("fr-FR")} places` }] : []),
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: "12px",
                    background: "rgba(240,235,227,0.03)",
                    border: "1px solid rgba(240,235,227,0.05)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <item.icon size={13} style={{ color }} />
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
                <button
                  onClick={() => setSubscribed(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "14px 28px", borderRadius: "99px",
                    background: subscribed ? "rgba(16,185,129,0.15)" : color,
                    color: subscribed ? "#10B981" : "#fff",
                    border: subscribed ? "1px solid rgba(16,185,129,0.3)" : "none",
                    fontWeight: 700, fontSize: "14px", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { if (!subscribed) (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}40`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  {subscribed ? <><CheckCircle2 size={16} /> {t("concerts.subscribed")}</> : <><Bell size={16} /> {t("concerts.detail.register")}</>}
                </button>

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

            {/* Right: Visual (only when no cover image) */}
            {!event.coverImageUrl && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", minHeight: "360px",
              }}>
                <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <Music2 size={80} style={{ color, opacity: 0.2, marginBottom: "20px" }} />
                  <div className="bebas" style={{
                    fontSize: "96px", color, opacity: 0.1, lineHeight: 1,
                  }}>
                    {fmtEventDate(event.eventDate, { day: "numeric", month: "short" })}
                  </div>
                  {event.genre && (
                    <div style={{
                      marginTop: "8px", fontSize: "14px", fontWeight: 600,
                      color, opacity: 0.5,
                    }}>
                      {event.genre}
                    </div>
                  )}
                </div>
                {/* Concentric circles */}
                {[280, 200, 120].map((s, i) => (
                  <div key={i} style={{
                    position: "absolute", width: s, height: s, borderRadius: "50%",
                    border: `1px solid ${color}${8 + i * 4}`,
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* ── PRACTICAL INFO ── */}
        <div style={{
          padding: "32px", borderRadius: "20px", marginTop: "48px",
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
                value: `${event.venue}, ${event.city}`,
                color,
              },
              {
                icon: Clock,
                title: t("concerts.detail.schedule"),
                value: event.eventTime ? `${t("concerts.detail.show")} ${event.eventTime}` : t("concerts.detail.schedule"),
                color: "#8B5CF6",
              },
              {
                icon: Ticket,
                title: t("concerts.detail.tickets"),
                value: event.free
                  ? t("concerts.detail.freeEntry")
                  : event.ticketPrice
                    ? `${event.ticketPrice.toLocaleString("fr-FR")} FCFA`
                    : t("concerts.detail.onSale"),
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
        {otherEvents.filter(o => o.id !== event.id).length > 0 && (
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
              {otherEvents.filter(o => o.id !== event.id).slice(0, 3).map(other => {
                const otherColor = eventColor(other.genre);
                return (
                  <div key={other.id} onClick={() => navigate(`/concerts/${other.id}`)} style={{
                    padding: "20px", borderRadius: "14px",
                    background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.05)",
                    transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = `${otherColor}30`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.05)"; }}
                  >
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px",
                    }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "99px",
                        background: other.free ? "rgba(16,185,129,0.1)" : "rgba(232,96,26,0.1)",
                        color: other.free ? "#10B981" : "var(--amber)",
                        fontSize: "10px", fontWeight: 700,
                      }}>{other.free ? t("concerts.free") : t("concerts.paid")}</span>
                      <ExternalLink size={12} style={{ color: "var(--muted)" }} />
                    </div>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{other.title}</p>
                    {other.artistName && <p style={{ fontSize: "12px", color: otherColor, fontWeight: 600, marginBottom: "10px" }}>{other.artistName}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
                      <Calendar size={11} /> {fmtEventDate(other.eventDate)} · <MapPin size={11} /> {other.city}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        <div style={{
          padding: "40px", borderRadius: "20px",
          background: `linear-gradient(135deg, ${color}10, ${color}04)`,
          border: `1px solid ${color}20`,
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
              background: subscribed ? "rgba(16,185,129,0.15)" : color,
              color: subscribed ? "#10B981" : "#fff",
              border: subscribed ? "1px solid rgba(16,185,129,0.3)" : "none",
              fontWeight: 700, fontSize: "14px", cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!subscribed) (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}40`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            {subscribed ? <><CheckCircle2 size={16} /> {t("concerts.subscribed")}</> : <><Bell size={16} /> {t("concerts.subscribe")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
