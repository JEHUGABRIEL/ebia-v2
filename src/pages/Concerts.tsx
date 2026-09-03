import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Calendar, MapPin, Clock, Users, Music2, ArrowRight, Bell, CheckCircle2, ChevronRight } from "lucide-react";
import { CONCERTS, PAST_CONCERTS, STATUS_CONFIG } from "../data/concerts";

export default function Concerts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [subscribed, setSubscribed] = useState(false);

  const featured = CONCERTS.find(c => c.featured);
  const upcoming = CONCERTS.filter(c => c.status !== "past");
  const statusConfig = STATUS_CONFIG;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO ── */}
      <section style={{
        padding: "120px 24px 60px", maxWidth: "1360px", margin: "0 auto",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-20%", right: "-15%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,96,26,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "5px 12px", borderRadius: "99px",
            border: "1px solid rgba(232,96,26,0.3)", marginBottom: "20px",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", color: "var(--amber)",
          }}>
            <Calendar size={12} />
            {t("concerts.title")}
          </div>

          <h1 className="bebas" style={{
            fontSize: "clamp(48px, 8vw, 96px)", color: "var(--text)",
            lineHeight: 0.92, marginBottom: "16px",
          }}>
            {t("concerts.heroTitle")}<br />
            <span style={{ color: "var(--amber)" }}>{t("concerts.heroAccent")}</span>
          </h1>

          <p style={{
            fontSize: "16px", color: "var(--muted)", maxWidth: "500px",
            lineHeight: 1.7, marginBottom: "32px",
          }}>
            {t("concerts.heroDescription")}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSubscribed(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "13px 24px", borderRadius: "99px",
                background: subscribed ? "rgba(16,185,129,0.15)" : "var(--amber)",
                color: subscribed ? "#10B981" : "#fff",
                border: subscribed ? "1px solid rgba(16,185,129,0.3)" : "none",
                fontWeight: 700, fontSize: "13px", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!subscribed) { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,96,26,0.4)"; }}}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              {subscribed ? <><CheckCircle2 size={14} /> {t("concerts.subscribed")}</> : <><Bell size={14} /> {t("concerts.subscribe")}</>}
            </button>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>

        {/* ── FEATURED EVENT ── */}
        {featured && (
          <div style={{ marginBottom: "64px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px",
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase", color: featured.coverColor,
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: featured.coverColor }} />
              {t("concerts.featured")}
            </div>

            <div style={{
              borderRadius: "20px", overflow: "hidden",
              border: `1px solid ${featured.coverColor}25`,
              background: `linear-gradient(135deg, ${featured.coverColor}12, rgba(240,235,227,0.02))`,
              transition: "border-color 0.3s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${featured.coverColor}40`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${featured.coverColor}25`}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "320px" }}>
                {/* Left: Info */}
                <div style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "99px",
                      background: statusConfig[featured.status].bg,
                      color: statusConfig[featured.status].color,
                      fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                    }}>{statusConfig[featured.status].label}</span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{featured.genre}</span>
                  </div>

                  <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", marginBottom: "12px", lineHeight: 1.1 }}>
                    {featured.title}
                  </h2>

                  <p style={{ fontSize: "14px", color: featured.coverColor, fontWeight: 600, marginBottom: "16px" }}>
                    {featured.artist}
                  </p>

                  <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "24px" }}>
                    {featured.description}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    {[
                      { icon: Calendar, text: featured.date },
                      { icon: Clock, text: featured.time },
                      { icon: MapPin, text: featured.location },
                      { icon: Users, text: `${featured.attendees?.toLocaleString("fr-FR")} ${t("concerts.attendees")}` },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--muted)" }}>
                        <item.icon size={14} style={{ color: featured.coverColor, flexShrink: 0 }} />
                        {item.text}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => navigate(`/concerts/${featured.id}`)} style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 24px", borderRadius: "99px",
                    background: featured.coverColor, color: "#fff",
                    fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer",
                    transition: "box-shadow 0.2s",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${featured.coverColor}40`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
                  >
                    {t("concerts.viewDetails")} <ArrowRight size={14} />
                  </button>
                </div>

                {/* Right: Visual */}
                <div style={{
                  background: `linear-gradient(135deg, ${featured.coverColor}20, ${featured.coverColor}08)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                    <Music2 size={64} style={{ color: featured.coverColor, opacity: 0.3, marginBottom: "16px" }} />
                    <div className="bebas" style={{ fontSize: "72px", color: featured.coverColor, opacity: 0.15, lineHeight: 1 }}>
                      {featured.date.split(" ")[1]}
                    </div>
                  </div>
                  {/* Decorative circles */}
                  {[200, 140, 80].map((s, i) => (
                    <div key={i} style={{
                      position: "absolute", width: s, height: s, borderRadius: "50%",
                      border: `1px solid ${featured.coverColor}${15 + i * 5}`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── UPCOMING EVENTS ── */}
        <div style={{ marginBottom: "64px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px",
          }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{t("concerts.upcoming")}</h2>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              {upcoming.length} {t("concerts.events")}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {upcoming.filter(c => !c.featured).map(event => {
              const status = statusConfig[event.status];
              return (
                <div key={event.id} onClick={() => navigate(`/concerts/${event.id}`)} style={{
                  borderRadius: "16px", overflow: "hidden",
                  background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)",
                  transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = `${event.coverColor}30`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.06)"; }}
                >
                  {/* Cover */}
                  <div style={{
                    height: "140px", position: "relative",
                    background: `linear-gradient(135deg, ${event.coverColor}18, ${event.coverColor}08)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Music2 size={32} style={{ color: event.coverColor, opacity: 0.3 }} />
                    <div className="bebas" style={{
                      position: "absolute", bottom: "12px", right: "16px",
                      fontSize: "48px", color: event.coverColor, opacity: 0.12, lineHeight: 1,
                    }}>{event.date.split(" ")[0].slice(0, 3).toUpperCase()}</div>

                    <div style={{
                      position: "absolute", top: "12px", left: "12px",
                      padding: "4px 10px", borderRadius: "99px",
                      background: status.bg, color: status.color,
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
                    }}>{status.label}</div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "18px" }}>
                    <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{event.title}</p>
                    <p style={{ fontSize: "13px", color: event.coverColor, fontWeight: 600, marginBottom: "12px" }}>{event.artist}</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                        <Calendar size={12} /> {event.date} · {event.time}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                        <MapPin size={12} /> {event.location}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
                        <Users size={12} />
                        {event.attendees?.toLocaleString("fr-FR")} {t("concerts.attendees")}
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PAST EVENTS ── */}
        <div style={{ marginBottom: "64px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px",
          }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{t("concerts.past")}</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {PAST_CONCERTS.map((event, i) => (
              <div key={i} style={{
                padding: "20px", borderRadius: "14px",
                background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.04)",
                transition: "border-color 0.2s", cursor: "default",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.04)"}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: "99px",
                    background: "rgba(240,235,227,0.05)", color: "var(--muted)",
                    fontSize: "10px", fontWeight: 600,
                  }}>{t("concerts.pastEvent")}</span>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>{event.date}</span>
                </div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{event.title}</p>
                <p style={{ fontSize: "12px", color: event.coverColor, fontWeight: 600, marginBottom: "8px" }}>{event.artist}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
                  <MapPin size={11} /> {event.location} · <Users size={11} /> {event.attendees?.toLocaleString("fr-FR")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SUBSCRIBE CTA ── */}
        <div style={{
          padding: "48px", borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(232,96,26,0.08), rgba(201,147,10,0.04))",
          border: "1px solid rgba(232,96,26,0.15)",
          textAlign: "center", marginBottom: "32px",
        }}>
          <Bell size={28} style={{ color: "var(--amber)", marginBottom: "16px", opacity: 0.7 }} />
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
            {t("concerts.ctaTitle")}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
            {t("concerts.ctaDescription")}
          </p>
          <button
            onClick={() => setSubscribed(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px", borderRadius: "99px",
              background: subscribed ? "rgba(16,185,129,0.15)" : "var(--amber)",
              color: subscribed ? "#10B981" : "#fff",
              border: subscribed ? "1px solid rgba(16,185,129,0.3)" : "none",
              fontWeight: 700, fontSize: "14px", cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!subscribed) { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,96,26,0.4)"; }}}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            {subscribed ? <><CheckCircle2 size={16} /> {t("concerts.subscribed")}</> : <><Bell size={16} /> {t("concerts.subscribe")}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
