import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Ticket, Music2, ArrowRight, Bell, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { getEvents, getListenerPreferredGenres, type EventItem } from "../lib/api";
import { orderByPreferredGenres } from "../lib/preferences";
import { eventColor, fmtEventDate } from "../lib/eventColors";
import { useApp } from "../context/AppContext";
import HeroCarousel, { type HeroSlide } from "../components/HeroCarousel";

const EVENT_SLIDES: HeroSlide[] = [
  {
    img: "https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?w=1600&q=70&auto=format&fit=crop",
    tag: "Concerts", titleTop: "Prochains", titleAccent: "Événements",
    description: "Ne manquez aucun concert, festival ou événement musical en République Centrafricaine. Inscrivez-vous pour être notifié des prochaines sorties.",
  },
  {
    img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=70&auto=format&fit=crop",
    tag: "Festivals", titleTop: "Vivez", titleAccent: "l'ambiance",
    description: "Des milliers de festivaliers rassemblés pour une même passion : la musique centrafricaine.",
  },
  {
    img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=70&auto=format&fit=crop",
    tag: "En direct", titleTop: "Ne manquez", titleAccent: "aucun show",
    description: "Des scènes qui vibrent, des artistes en feu. Suivez tous les concerts près de chez vous.",
  },
  {
    img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1600&q=70&auto=format&fit=crop",
    tag: "Communauté", titleTop: "Partagez", titleAccent: "l'émotion",
    description: "Chaque concert est un moment unique à vivre ensemble, entre fans et artistes.",
  },
];

export default function Concerts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useApp();
  const [subscribed, setSubscribed] = useState(false);
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents().then(r => setEvents(r.data)).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);

  // Événements correspondant aux genres de l'auditeur remontent en tête.
  useEffect(() => {
    if (!user || user.role === "artist" || user.role === "admin") return;
    getListenerPreferredGenres(user.role).then(setPreferredGenres).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const [featured, ...rest] = events;
  const listedRest = orderByPreferredGenres(rest, preferredGenres);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO ── */}
      <HeroCarousel
        slides={EVENT_SLIDES}
        accentColor="#E8601A"
        glowColor="rgba(232,96,26,0.14)"
        glowSide="right"
        badgeIcon={<Calendar size={12} />}
      >
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
      </HeroCarousel>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px", marginBottom: "64px" }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ height: "240px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0 64px" }}>
            <Music2 size={40} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
            <p style={{ fontSize: "15px", color: "var(--muted)" }}>{t("concerts.empty")}</p>
          </div>
        ) : (
          <>
            {/* ── FEATURED EVENT ── */}
            {featured && (
              <div style={{ marginBottom: "64px" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
                  textTransform: "uppercase", color: eventColor(featured.genre),
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: eventColor(featured.genre) }} />
                  {t("concerts.featured")}
                </div>

                <div style={{
                  borderRadius: "20px", overflow: "hidden",
                  border: `1px solid ${eventColor(featured.genre)}25`,
                  background: `linear-gradient(135deg, ${eventColor(featured.genre)}12, rgba(240,235,227,0.02))`,
                  transition: "border-color 0.3s",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${eventColor(featured.genre)}40`}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${eventColor(featured.genre)}25`}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "320px" }}>
                    {/* Left: Info */}
                    <div style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                        <span style={{
                          padding: "4px 12px", borderRadius: "99px",
                          background: featured.free ? "rgba(16,185,129,0.1)" : "rgba(232,96,26,0.1)",
                          color: featured.free ? "#10B981" : "var(--amber)",
                          fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                        }}>{featured.free ? t("concerts.free") : t("concerts.paid")}</span>
                        {featured.genre && <span style={{ fontSize: "11px", color: "var(--muted)" }}>{featured.genre}</span>}
                      </div>

                      <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", marginBottom: "12px", lineHeight: 1.1 }}>
                        {featured.title}
                      </h2>

                      {featured.artistName && (
                        <p style={{ fontSize: "14px", color: eventColor(featured.genre), fontWeight: 600, marginBottom: "16px" }}>
                          {featured.artistName}
                        </p>
                      )}

                      {featured.description && (
                        <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "24px" }}>
                          {featured.description}
                        </p>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                        {[
                          { icon: Calendar, text: fmtEventDate(featured.eventDate) },
                          ...(featured.eventTime ? [{ icon: Clock, text: featured.eventTime }] : []),
                          { icon: MapPin, text: `${featured.venue}, ${featured.city}` },
                          ...(featured.capacity ? [{ icon: Ticket, text: `${featured.capacity.toLocaleString("fr-FR")} places` }] : []),
                        ].map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--muted)" }}>
                            <item.icon size={14} style={{ color: eventColor(featured.genre), flexShrink: 0 }} />
                            {item.text}
                          </div>
                        ))}
                      </div>

                      <button onClick={() => navigate(`/concerts/${featured.id}`)} style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "12px 24px", borderRadius: "99px",
                        background: eventColor(featured.genre), color: "#fff",
                        fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer",
                        transition: "box-shadow 0.2s",
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${eventColor(featured.genre)}40`}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
                      >
                        {t("concerts.viewDetails")} <ArrowRight size={14} />
                      </button>
                    </div>

                    {/* Right: Visual */}
                    <div style={{
                      background: featured.coverImageUrl
                        ? `linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.35)), url(${featured.coverImageUrl}) center/cover`
                        : `linear-gradient(135deg, ${eventColor(featured.genre)}20, ${eventColor(featured.genre)}08)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative", overflow: "hidden",
                    }}>
                      {!featured.coverImageUrl && (
                        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                          <Music2 size={64} style={{ color: eventColor(featured.genre), opacity: 0.3, marginBottom: "16px" }} />
                          <div className="bebas" style={{ fontSize: "72px", color: eventColor(featured.genre), opacity: 0.15, lineHeight: 1 }}>
                            {fmtEventDate(featured.eventDate, { day: "numeric", month: "short" })}
                          </div>
                        </div>
                      )}
                      {!featured.coverImageUrl && [200, 140, 80].map((s, i) => (
                        <div key={i} style={{
                          position: "absolute", width: s, height: s, borderRadius: "50%",
                          border: `1px solid ${eventColor(featured.genre)}${15 + i * 5}`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── UPCOMING EVENTS ── */}
            {listedRest.length > 0 && (
              <div style={{ marginBottom: "64px" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px",
                }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{t("concerts.upcoming")}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {preferredGenres.length > 0 && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "4px 12px", borderRadius: "99px",
                        background: "rgba(232,96,26,0.1)", border: "1px solid rgba(232,96,26,0.25)",
                        fontSize: "11px", fontWeight: 600, color: "var(--amber)",
                      }}>
                        <Sparkles size={11} /> Pour vous d'abord
                      </span>
                    )}
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {events.length} {t("concerts.events")}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                  {listedRest.map(event => {
                    const color = eventColor(event.genre);
                    return (
                      <div key={event.id} onClick={() => navigate(`/concerts/${event.id}`)} style={{
                        borderRadius: "16px", overflow: "hidden",
                        background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)",
                        transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.06)"; }}
                      >
                        {/* Cover */}
                        <div style={{
                          height: "140px", position: "relative",
                          background: event.coverImageUrl
                            ? `linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url(${event.coverImageUrl}) center/cover`
                            : `linear-gradient(135deg, ${color}18, ${color}08)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {!event.coverImageUrl && <Music2 size={32} style={{ color, opacity: 0.3 }} />}

                          <div style={{
                            position: "absolute", top: "12px", left: "12px",
                            padding: "4px 10px", borderRadius: "99px",
                            background: event.free ? "rgba(16,185,129,0.15)" : "rgba(0,0,0,0.35)",
                            color: event.free ? "#10B981" : "#fff",
                            fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
                          }}>{event.free ? t("concerts.free") : t("concerts.paid")}</div>
                        </div>

                        {/* Info */}
                        <div style={{ padding: "18px" }}>
                          <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{event.title}</p>
                          {event.artistName && <p style={{ fontSize: "13px", color, fontWeight: 600, marginBottom: "12px" }}>{event.artistName}</p>}

                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                              <Calendar size={12} /> {fmtEventDate(event.eventDate)}{event.eventTime ? ` · ${event.eventTime}` : ""}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                              <MapPin size={12} /> {event.venue}, {event.city}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

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
