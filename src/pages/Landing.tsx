import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ArrowRight, Play, Star, Quote, ChevronRight, Music2, TrendingUp, Disc, Radio } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getArtists, getTracks, getTrendingTracks, getRetroTracks, BASE, type Artist, type Track } from "../lib/api";

const TICKER = ["Afro-Pop","Hip-Hop","Afro-Folk","Soukous","Gospel","Afro-Trap","Ndombolo","Bikutsi","Traditionnel","R&B","Afro-Beat","Soul"];

const COMMENTS = [
  { name: "Aimée K.", role: "Auditrice, Bangui", stars: 5, text: "Enfin une plateforme qui met en valeur notre musique ! J'écoute E-Bia tous les jours pour découvrir de nouveaux artistes centrafricains." },
  { name: "David L.", role: "Artiste, Bimbo", stars: 5, text: "Grâce à E-Bia, ma musique arrive jusqu'en Europe. Les statistiques d'écoute m'aident à comprendre mon audience." },
  { name: "Chantal M.", role: "Auditrice, Berberati", stars: 5, text: "L'application est super intuitive. J'adore pouvoir identifier les morceaux que j'entends à la radio locale !" },
  { name: "Fabrice N.", role: "Artiste, Bangui", stars: 5, text: "E-Bia a changé ma carrière. Je publie mes titres directement et je reçois des retours incroyables des auditeurs." },
  { name: "Sandrine P.", role: "Auditrice, Bambari", stars: 5, text: "La qualité d'écoute est impressionnante, même avec une connexion limitée. C'est vraiment fait pour nous." },
  { name: "Jean-Baptiste O.", role: "Artiste, Berberati", stars: 5, text: "La reconnaissance musicale est bluffante. Enregistre 5 secondes et E-Bia retrouve le morceau. De la magie !" },
];

const GENRES = [
  { id: "rumba", label: "Rumba", icon: Disc, color: "#E8601A" },
  { id: "ndombolo", label: "Ndombolo", icon: Music2, color: "#C9930A" },
  { id: "hiphop", label: "Hip-Hop", icon: TrendingUp, color: "#8B5CF6" },
  { id: "gospel", label: "Gospel", icon: Star, color: "#10B981" },
  { id: "afrobeat", label: "Afro-Beat", icon: Play, color: "#F59E0B" },
  { id: "soukous", label: "Soukous", icon: Disc, color: "#EF4444" },
];

const FEATURED_RADIOS = [
  { name: "Radio Ndeke Luka", freq: "100.9 FM", desc: "La radio la plus écoutée de RCA", color: "#E8601A", live: true },
  { name: "Guira FM", freq: "93.3 FM", desc: "Radio de la MINUSCA · Paix et culture", color: "#1565C0", live: true },
  { name: "Hit Radio RCA", freq: "96.1 FM", desc: "Musique populaire à Bangui", color: "#C62828", live: true },
  { name: "Radio Lengo Songo", freq: "98.9 FM", desc: "Musique centrafricaine et culture", color: "#2E7D32", live: true },
];

const UPCOMING_CONCERTS = [
  { title: "Festival Ndeke", location: "Bangui", date: "2026", genre: "Multi-genre", status: "Bientôt" },
  { title: "Soukous Night", location: "Bangui", date: "2026", genre: "Soukous", status: "Bientôt" },
  { title: "Gospel Fest RCA", location: "Berberati", date: "2026", genre: "Gospel", status: "Bientôt" },
];

const HERO_SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1508973379184-7517410fb0bc?w=1920&q=70&auto=format&fit=crop",
    badge: "République Centrafricaine",
    lines: [
      { text: "La", color: "var(--text)" },
      { text: "musique", color: "var(--amber)" },
      { text: "de chez", color: "var(--text)" },
      { text: "nous.", color: "var(--gold)" },
    ],
    description: "Découvrez, écoutez et soutenez les artistes qui définissent le son de la République Centrafricaine.",
  },
  {
    img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1920&q=70&auto=format&fit=crop",
    badge: "Radios en direct",
    lines: [
      { text: "Toutes", color: "var(--text)" },
      { text: "les radios", color: "var(--amber)" },
      { text: "de la", color: "var(--text)" },
      { text: "RCA.", color: "var(--gold)" },
    ],
    description: "Écoutez vos stations préférées en direct, 24h/24, où que vous soyez dans le monde.",
  },
  {
    img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=70&auto=format&fit=crop",
    badge: "Concerts & festivals",
    lines: [
      { text: "Vivez la", color: "var(--text)" },
      { text: "scène", color: "var(--amber)" },
      { text: "en", color: "var(--text)" },
      { text: "direct.", color: "var(--gold)" },
    ],
    description: "Ne manquez plus aucun concert, festival ou événement musical près de chez vous.",
  },
  {
    img: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=1920&q=70&auto=format&fit=crop",
    badge: "Espace artiste",
    lines: [
      { text: "Ta voix.", color: "var(--text)" },
      { text: "Ton", color: "var(--amber)" },
      { text: "public", color: "var(--text)" },
      { text: "t'attend.", color: "var(--gold)" },
    ],
    description: "Publiez votre musique, suivez vos statistiques et connectez-vous à vos auditeurs.",
  },
];

/* ── Horizontal scroll row ── */
function ScrollRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const w = ref.current.offsetWidth * 0.7;
    ref.current.scrollBy({ left: dir === "right" ? w : -w, behavior: "smooth" });
  };
  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} className={className} style={{
        display: "flex", gap: "20px", overflowX: "auto", scrollBehavior: "smooth",
        scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: "8px",
      }}>
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        {children}
      </div>
      {/* Nav arrows */}
      <button onClick={() => scroll("left")} style={{
        position: "absolute", left: "-16px", top: "50%", transform: "translateY(-50%)",
        width: "36px", height: "36px", borderRadius: "50%", background: "rgba(8,8,8,0.85)",
        border: "1px solid rgba(240,235,227,0.1)", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
        transition: "transform 0.15s, background 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; e.currentTarget.style.background = "rgba(232,96,26,0.9)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1)"; e.currentTarget.style.background = "rgba(8,8,8,0.85)"; }}
      ><ChevronRight size={18} style={{ transform: "rotate(180deg)" }} /></button>
      <button onClick={() => scroll("right")} style={{
        position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)",
        width: "36px", height: "36px", borderRadius: "50%", background: "rgba(8,8,8,0.85)",
        border: "1px solid rgba(240,235,227,0.1)", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
        transition: "transform 0.15s, background 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; e.currentTarget.style.background = "rgba(232,96,26,0.9)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1)"; e.currentTarget.style.background = "rgba(8,8,8,0.85)"; }}
      ><ChevronRight size={18} /></button>
    </div>
  );
}

/* ── Auto-scrolling row (discrete swipe every N seconds) ── */
function AutoScrollRow({ children, interval = 2800, swipeAmount = 180 }: { children: React.ReactNode; interval?: number; swipeAmount?: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const posRef = useRef(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const id = setInterval(() => {
      if (paused) return;
      posRef.current += swipeAmount;
      const halfWidth = el.scrollWidth / 2;
      if (posRef.current >= halfWidth) posRef.current = 0;
      el.scrollTo({ left: posRef.current, behavior: "smooth" });
    }, interval);
    return () => clearInterval(id);
  }, [paused, interval, swipeAmount]);

  const swipe = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const halfWidth = el.scrollWidth / 2;
    posRef.current += dir === "right" ? swipeAmount : -swipeAmount;
    if (posRef.current < 0) posRef.current = halfWidth - swipeAmount;
    if (posRef.current >= halfWidth) posRef.current = 0;
    el.scrollTo({ left: posRef.current, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={trackRef}
        className="hide-scrollbar"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          display: "flex", gap: "20px", overflowX: "hidden",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        {children}
        {children}
      </div>
      {/* Prev */}
      <button onClick={() => swipe("left")} style={{
        position: "absolute", left: "-16px", top: "50%", transform: "translateY(-50%)",
        width: "36px", height: "36px", borderRadius: "50%",
        background: "rgba(8,8,8,0.85)", border: "1px solid rgba(240,235,227,0.1)",
        color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
        transition: "transform 0.15s, background 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; e.currentTarget.style.background = "rgba(232,96,26,0.9)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1)"; e.currentTarget.style.background = "rgba(8,8,8,0.85)"; }}
      ><ChevronRight size={18} style={{ transform: "rotate(180deg)" }} /></button>
      {/* Next */}
      <button onClick={() => swipe("right")} style={{
        position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)",
        width: "36px", height: "36px", borderRadius: "50%",
        background: "rgba(8,8,8,0.85)", border: "1px solid rgba(240,235,227,0.1)",
        color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
        transition: "transform 0.15s, background 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; e.currentTarget.style.background = "rgba(232,96,26,0.9)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1)"; e.currentTarget.style.background = "rgba(8,8,8,0.85)"; }}
      ><ChevronRight size={18} /></button>
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ title, linkTo, linkLabel }: { title: string; linkTo?: string; linkLabel?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{title}</h2>
      {linkTo && (
        <Link to={linkTo} style={{
          fontSize: "12px", fontWeight: 700, color: "var(--muted)", textDecoration: "none",
          letterSpacing: "0.05em", transition: "color 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
        >{linkLabel || "Tout afficher"}</Link>
      )}
    </div>
  );
}

export default function Landing() {
  const { user } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const full = [...TICKER,...TICKER,...TICKER,...TICKER];
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setHeroSlide(s => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);
  const [stats, setStats] = useState({ artists: 0, tracks: 0, total_plays: 0, total_likes: 0 });
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [retroTracks, setRetroTracks] = useState<Track[]>([]);
  const [artistMap, setArtistMap] = useState<Record<string, Artist>>({});

  useEffect(() => {
    fetch(`${BASE}/api/v1/stats`).then(r => r.json()).then(d => setStats(d)).catch(() => {});
    getArtists().then(r => {
      setArtists(r.data);
      const map: Record<string, Artist> = {};
      r.data.forEach(a => { map[a.id] = a; });
      setArtistMap(map);
    }).catch(() => {});
    getTracks({ limit: "20" }).then(r => setTracks(r.data)).catch(() => {});
    getTrendingTracks(15).then(r => setTrendingTracks(Array.isArray(r) ? r : [])).catch(() => {});
    getRetroTracks(15).then(r => setRetroTracks(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const topTracks = [...tracks].sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0));
  const newTracks = [...tracks].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="grain" style={{ background: "var(--bg)", color: "var(--text)", overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "100px 0 60px", position: "relative", overflow: "hidden",
      }}>
        {HERO_SLIDES.map((s, i) => (
          <div key={i} style={{
            position: "absolute", inset: 0,
            opacity: i === heroSlide ? 1 : 0,
            transition: "opacity 1.2s ease",
          }}>
            <img
              src={s.img}
              alt=""
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                animation: i === heroSlide ? "heroKenBurns 6500ms ease-out forwards" : "none",
              }}
            />
          </div>
        ))}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.9) 45%, rgba(8,8,8,0.55) 75%, rgba(8,8,8,0.35) 100%), linear-gradient(180deg, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.6) 100%)",
        }} />
        <div style={{
          position: "absolute", top: "-5%", right: "-10%",
          width: "700px", height: "700px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,96,26,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div className="section-pad" style={{ maxWidth: "1360px", margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div className="hero-grid">
            <div>
              <div key={heroSlide}>
                <div className="fade-up" style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "6px 14px", borderRadius: "99px",
                  border: "1px solid rgba(232,96,26,0.3)", marginBottom: "36px",
                  fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "var(--amber)",
                }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />
                  {HERO_SLIDES[heroSlide].badge}
                </div>
                <h1 className="bebas fade-up-2" style={{
                  fontSize: "clamp(72px, 11vw, 148px)", lineHeight: 0.9, letterSpacing: "0.02em", marginBottom: "36px",
                }}>
                  {HERO_SLIDES[heroSlide].lines.map((line, i) => (
                    <span key={i} style={{ display: "block", color: line.color }}>{line.text}</span>
                  ))}
                </h1>
                <p className="fade-up-3" style={{
                  color: "var(--muted)", fontSize: "17px", lineHeight: 1.7,
                  maxWidth: "460px", marginBottom: "44px", fontWeight: 400,
                }}>
                  {HERO_SLIDES[heroSlide].description}
                </p>
              </div>
              <div className="fade-up-4" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <Link to="/explore" style={{
                  display: "inline-flex", alignItems: "center", gap: "10px",
                  padding: "15px 30px", borderRadius: "99px",
                  background: "var(--amber)", color: "#fff",
                  fontWeight: 700, fontSize: "13px", letterSpacing: "0.04em",
                  textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(232,96,26,0.4)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                ><Play size={14} fill="white" /> Écouter maintenant</Link>
                {!user && (
                  <button onClick={() => navigate("/login")} style={{
                    padding: "15px 30px", borderRadius: "99px",
                    background: "transparent", border: "1px solid rgba(240,235,227,0.18)",
                    color: "var(--text)", fontWeight: 600, fontSize: "13px",
                    cursor: "pointer", transition: "background 0.2s, border-color 0.2s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.35)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.18)"; }}
                  >Rejoindre E-Bia <ArrowRight size={13} style={{ display: "inline", marginLeft: "4px", verticalAlign: "-2px" }} /></button>
                )}
              </div>
            </div>
            <div style={{ flexShrink: 0 }} className="hero-orb hidden md:block">
              <div style={{
                width: "380px", height: "380px", borderRadius: "50%",
                border: "1px solid rgba(232,96,26,0.18)",
                background: "radial-gradient(circle at 35% 35%, rgba(232,96,26,0.1), rgba(201,147,10,0.06) 60%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
              }}>
                {[280, 200, 130].map((s, i) => (
                  <div key={i} style={{ position: "absolute", width: s, height: s, borderRadius: "50%", border: `1px solid rgba(232,96,26,${0.06 + i * 0.06})` }} />
                ))}
                <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div className="bebas" style={{ fontSize: "68px", color: "var(--amber)", lineHeight: 1, letterSpacing: "0.08em" }}>E-BIA</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: "6px" }}>Music Platform · RCA</div>
                </div>
                <div style={{ position: "absolute", top: "32px", right: "-44px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Play size={10} fill="white" color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>En cours</div>
                    <div style={{ fontSize: "10px", color: "var(--muted)" }}>Idylle Mamba</div>
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: "48px", left: "-52px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: "var(--gold)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                  ♪ {stats.artists || 5} artistes RCA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", overflow: "hidden", padding: "14px 0", background: "#0D0D0D" }}>
        <div className="marquee-track">
          {full.map((g, i) => (
            <span key={i} style={{ padding: "0 28px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: i % 2 === 0 ? "var(--muted)" : "var(--amber)" }}>
              {g}&nbsp;&nbsp;<span style={{ color: "rgba(240,235,227,0.12)" }}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── CATALOG SECTIONS ── */}
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "64px 48px 0" }}>

        {/* Artistes populaires */}
        {artists.length > 0 && (
          <div style={{ marginBottom: "64px" }}>
            <SectionHeader title="Artistes populaires" linkTo="/explore" linkLabel="Tout afficher" />
            <AutoScrollRow>
              {artists.map(a => (
                <Link key={a.id} to={`/artist/${a.slug}`} style={{ textDecoration: "none", flexShrink: 0, width: "160px" }}>
                  <div style={{ textAlign: "center", padding: "16px 8px", borderRadius: "12px", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(240,235,227,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: "128px", height: "128px", borderRadius: "50%", margin: "0 auto 14px", overflow: "hidden", border: "3px solid transparent", transition: "border-color 0.2s" }}>
                      {a.avatar_url ? (
                        <img src={a.avatar_url} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(232,96,26,0.25), rgba(201,147,10,0.15))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="bebas" style={{ fontSize: "48px", color: "var(--amber)", opacity: 0.7 }}>{a.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--muted)" }}>Artiste</p>
                  </div>
                </Link>
              ))}
            </AutoScrollRow>
          </div>
        )}

        {/* Titres populaires */}
        {topTracks.length > 0 && (
          <div style={{ marginBottom: "64px" }}>
            <SectionHeader title="Titres populaires" linkTo="/explore" linkLabel="Tout afficher" />
            <ScrollRow className="hide-scrollbar">
              {topTracks.map(t => {
                const artist = artistMap[t.artistId || t.artist_id || ""];
                return (
                  <Link key={t.id} to={`/artist/${artist?.slug || ""}`} style={{ textDecoration: "none", flexShrink: 0, width: "180px" }}>
                    <div style={{ borderRadius: "12px", overflow: "hidden", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)", transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.25)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.06)"; }}
                    >
                      <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative" }}>
                        {artist?.avatar_url ? (
                          <img src={artist.avatar_url} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, rgba(232,96,26,0.2), rgba(201,147,10,0.1))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Music2 size={32} style={{ color: "var(--amber)", opacity: 0.4 }} />
                          </div>
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                          className="track-hover-overlay"
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                        >
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={16} fill="white" color="white" style={{ marginLeft: "2px" }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: "14px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                        <p style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist?.name || "Artiste"}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ScrollRow>
          </div>
        )}

        {/* Découvrir par genre */}
        <div style={{ marginBottom: "64px" }}>
          <SectionHeader title="Découvrir par genre" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
            {GENRES.map(g => (
              <Link key={g.id} to="/explore" style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "24px 20px", borderRadius: "12px", cursor: "pointer",
                  background: `linear-gradient(135deg, ${g.color}22, ${g.color}08)`,
                  border: `1px solid ${g.color}33`,
                  transition: "transform 0.2s, border-color 0.2s",
                  display: "flex", alignItems: "center", gap: "14px",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = `${g.color}66`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = `${g.color}33`; }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${g.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <g.icon size={18} style={{ color: g.color }} />
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{g.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Nouveaux titres */}
        {newTracks.length > 0 && (
          <div style={{ marginBottom: "64px" }}>
            <SectionHeader title="Nouveaux titres" linkTo="/explore" linkLabel="Tout afficher" />
            <ScrollRow className="hide-scrollbar">
              {newTracks.slice(0, 10).map(t => {
                const artist = artistMap[t.artistId || t.artist_id || ""];
                return (
                  <Link key={t.id} to={`/artist/${artist?.slug || ""}`} style={{ textDecoration: "none", flexShrink: 0, width: "180px" }}>
                    <div style={{ borderRadius: "12px", overflow: "hidden", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)", transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.25)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.06)"; }}
                    >
                      <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative" }}>
                        {artist?.avatar_url ? (
                          <img src={artist.avatar_url} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, rgba(139,92,246,0.2), rgba(201,147,10,0.1))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Music2 size={32} style={{ color: "var(--amber)", opacity: 0.4 }} />
                          </div>
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                          className="track-hover-overlay"
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                        >
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={16} fill="white" color="white" style={{ marginLeft: "2px" }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: "14px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                        <p style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist?.name || "Artiste"}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ScrollRow>
          </div>
        )}

        {/* ── TENDANCES ── */}
        {trendingTracks.length > 0 && (
          <div style={{ marginBottom: "64px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", color: "var(--amber)", textTransform: "uppercase", marginBottom: "8px" }}>Tendances</div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>Les titres les plus écoutés en ce moment</h2>
              </div>
            </div>
            <ScrollRow className="hide-scrollbar">
              {trendingTracks.map((t, i) => {
                const artist = artistMap[t.artistId || t.artist_id || ""];
                return (
                  <Link key={t.id} to={`/artist/${artist?.slug || ""}`} style={{ textDecoration: "none", flexShrink: 0, width: "180px" }}>
                    <div style={{ borderRadius: "12px", overflow: "hidden", background: "rgba(232,96,26,0.04)", border: "1px solid rgba(232,96,26,0.12)", transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.35)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.12)"; }}
                    >
                      <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative" }}>
                        {artist?.avatar_url ? (
                          <img src={artist.avatar_url} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, rgba(232,96,26,0.2), rgba(201,147,10,0.1))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Music2 size={32} style={{ color: "var(--amber)", opacity: 0.4 }} />
                          </div>
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} className="track-hover-overlay" onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={16} fill="white" color="white" style={{ marginLeft: "2px" }} />
                          </div>
                        </div>
                        <div style={{ position: "absolute", top: "10px", right: "10px", padding: "3px 8px", borderRadius: "99px", background: "rgba(232,96,26,0.85)", fontSize: "10px", fontWeight: 700, color: "#fff" }}>🔥 {i + 1}</div>
                      </div>
                      <div style={{ padding: "14px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                        <p style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist?.name || "Artiste"}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ScrollRow>
          </div>
        )}

        {/* ── RÉTRO ── */}
        {retroTracks.length > 0 && (
          <div style={{ marginBottom: "64px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", color: "var(--gold)", textTransform: "uppercase", marginBottom: "8px" }}>Rétro</div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>Les classiques qui ont marqué</h2>
              </div>
            </div>
            <ScrollRow className="hide-scrollbar">
              {retroTracks.map((t, i) => {
                const artist = artistMap[t.artistId || t.artist_id || ""];
                return (
                  <Link key={t.id} to={`/artist/${artist?.slug || ""}`} style={{ textDecoration: "none", flexShrink: 0, width: "220px" }}>
                    <div style={{ borderRadius: "12px", overflow: "hidden", background: "rgba(201,147,10,0.04)", border: "1px solid rgba(201,147,10,0.12)", transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,147,10,0.35)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,147,10,0.12)"; }}
                    >
                      <div style={{ height: "160px", position: "relative", overflow: "hidden" }}>
                        {artist?.avatar_url ? (
                          <img src={artist.avatar_url} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, rgba(201,147,10,${0.12 + (i % 3) * 0.04}), rgba(232,96,26,${0.06 + (i % 3) * 0.03}))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Music2 size={28} style={{ color: "var(--gold)", opacity: 0.5, marginBottom: "6px" }} />
                          </div>
                        )}
                        <div style={{ position: "absolute", top: "10px", left: "10px", padding: "3px 8px", borderRadius: "99px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", fontSize: "10px", fontWeight: 600, color: "var(--gold)" }}>{t.genre}</div>
                      </div>
                      <div style={{ padding: "14px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                        <p style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist?.name || "Artiste"}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ScrollRow>
          </div>
        )}

        {/* ── RÉCEMMENT AJOUTÉES ── */}
        {newTracks.length > 0 && (
          <div style={{ marginBottom: "64px" }}>
            <SectionHeader title="Récemment ajoutées" linkTo="/explore" linkLabel="Tout afficher" />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {newTracks.slice(0, 8).map((t, i) => {
                const artist = artistMap[t.artistId || t.artist_id || ""];
                return (
                  <Link key={t.id} to={`/artist/${artist?.slug || ""}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px",
                      borderRadius: "10px", transition: "background 0.15s", cursor: "pointer",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(240,235,227,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--muted)", width: "24px", textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ width: "44px", height: "44px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "rgba(240,235,227,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {artist?.avatar_url ? (
                          <img src={artist.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Music2 size={18} style={{ color: "var(--amber)", opacity: 0.4 }} />
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                        <p style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist?.name || "Artiste"}</p>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--muted)", flexShrink: 0 }}>{t.genre}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NOUVELLES SORTIES ── */}
        {newTracks.length > 0 && (
          <div style={{ marginBottom: "64px" }}>
            <SectionHeader title="Nouvelles sorties" linkTo="/explore" linkLabel="Tout afficher" />
            <ScrollRow className="hide-scrollbar">
              {newTracks.slice(0, 10).map(t => {
                const artist = artistMap[t.artistId || t.artist_id || ""];
                return (
                  <Link key={t.id} to={`/artist/${artist?.slug || ""}`} style={{ textDecoration: "none", flexShrink: 0, width: "280px" }}>
                    <div style={{
                      borderRadius: "14px", overflow: "hidden",
                      background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)",
                      transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.3)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.06)"; }}
                    >
                      <div style={{ height: "160px", overflow: "hidden", position: "relative" }}>
                        {artist?.avatar_url ? (
                          <img src={artist.avatar_url} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(232,96,26,0.08))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Music2 size={36} style={{ color: "var(--amber)", opacity: 0.3 }} />
                          </div>
                        )}
                        <div style={{
                          position: "absolute", top: "10px", right: "10px",
                          padding: "4px 10px", borderRadius: "99px",
                          background: "rgba(16,185,129,0.85)", backdropFilter: "blur(8px)",
                          fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.05em",
                        }}>NOUVEAU</div>
                      </div>
                      <div style={{ padding: "16px" }}>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                        <p style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist?.name || "Artiste"}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ScrollRow>
          </div>
        )}

        {/* ── RADIOS EN DIRECT ── */}
        <div style={{ marginBottom: "64px" }}>
          <SectionHeader title="Écouter en direct" linkTo="/radio" linkLabel="Toutes les radios" />
          <ScrollRow className="hide-scrollbar">
            {FEATURED_RADIOS.map((radio, i) => (
              <Link key={i} to="/radio" style={{ textDecoration: "none", flexShrink: 0, width: "260px" }}>
                <div style={{
                  padding: "20px", borderRadius: "14px",
                  background: `${radio.color}0A`, border: `1px solid ${radio.color}20`,
                  transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = `${radio.color}40`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = `${radio.color}20`; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${radio.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Radio size={20} style={{ color: radio.color }} />
                    </div>
                    {radio.live && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 8px", borderRadius: "99px", background: "rgba(76,175,130,0.12)" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4caf82", animation: "pulse 1.5s infinite" }} />
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#4caf82" }}>EN DIRECT</span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{radio.name}</p>
                  <p style={{ fontSize: "12px", color: radio.color, fontWeight: 600, marginBottom: "6px" }}>{radio.freq}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{radio.desc}</p>
                </div>
              </Link>
            ))}
          </ScrollRow>
        </div>

        {/* ── PROCHAINS CONCERTS ── */}
        <div style={{ marginBottom: "64px" }}>
          <SectionHeader title="Prochains événements" linkTo="/concerts" linkLabel="Tout afficher" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {UPCOMING_CONCERTS.map((concert, i) => (
              <Link key={i} to="/concerts" style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "24px 20px", borderRadius: "14px",
                  background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)",
                  transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.25)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.06)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "99px", background: "rgba(232,96,26,0.1)", color: "var(--amber)", fontWeight: 700, letterSpacing: "0.05em" }}>
                      {concert.status}
                    </span>
                    <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "99px", background: "rgba(240,235,227,0.06)", color: "var(--muted)", fontWeight: 600 }}>
                      {concert.genre}
                    </span>
                  </div>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{concert.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--muted)" }}>
                    <span>{concert.location}</span>
                    <span style={{ color: "rgba(240,235,227,0.15)" }}>•</span>
                    <span>{concert.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="section-pad" style={{ maxWidth: "1360px", margin: "0 auto", paddingTop: "40px", paddingBottom: "100px" }}>
        <div className="stats-grid" style={{ border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden" }}>
          {[
            { value: stats.artists || "—", label: "Artistes centrafricains", note: "et en croissance", c: "var(--amber)" },
            { value: stats.tracks || "—", label: "Titres disponibles", note: "écoute 100% libre", c: "var(--gold)" },
            { value: stats.total_plays > 0 ? stats.total_plays.toLocaleString("fr-FR") : "∞", label: "Écoutes totales", note: "de la RCA au monde", c: "var(--text)" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "56px 48px", background: "var(--bg)", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div className="bebas" style={{ fontSize: "88px", lineHeight: 1, color: s.c, marginBottom: "14px" }}>{s.value}</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{s.label}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", letterSpacing: "0.04em" }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMMENTS / TESTIMONIALS ── */}
      <div className="section-pad" style={{ maxWidth: "1360px", margin: "0 auto", paddingBottom: "100px" }}>
        <div style={{ marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", color: "var(--amber)", textTransform: "uppercase", marginBottom: "16px" }}>{t("landing.testimonialsTag")}</div>
          <h2 className="bebas" style={{ fontSize: "56px", color: "var(--text)", lineHeight: 1 }}>{t("landing.testimonialsTitle")}</h2>
        </div>
        <div className="comments-slider-wrapper" style={{ overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "80px", height: "100%", background: "linear-gradient(to right, var(--bg), transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "100%", background: "linear-gradient(to left, var(--bg), transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div className="comments-track">
            {[...COMMENTS, ...COMMENTS, ...COMMENTS].map((c, i) => (
              <div key={i} className="comment-card" style={{ padding: "28px 24px", borderRadius: "16px", border: "1px solid rgba(240,235,227,0.06)", background: "rgba(240,235,227,0.025)", transition: "border-color 0.3s", boxSizing: "border-box" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.25)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.06)"}
              >
                <Quote size={20} style={{ color: "var(--amber)", opacity: 0.3, marginBottom: "12px" }} />
                <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.7, marginBottom: "20px" }}>{c.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--amber), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "14px", flexShrink: 0 }}>{c.name[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{c.role}</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: "2px", flexShrink: 0 }}>
                    {[...Array(c.stars)].map((_, s) => (<Star key={s} size={12} fill="var(--amber)" color="var(--amber)" />))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .comments-slider-wrapper { --card-gap: 16px; }
        .comments-track { display: flex; gap: var(--card-gap); width: max-content; will-change: transform; animation: scrollComments 30s linear infinite; }
        .comments-track:hover { animation-play-state: paused; }
        .comment-card { width: calc((100vw - 96px) / 3 - 8px); flex-shrink: 0; }
        @keyframes scrollComments { 0% { transform: translateX(0); } 100% { transform: translateX(-33.3333%); } }
        @keyframes heroKenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
        @media (max-width: 1024px) { .comment-card { width: calc((100vw - 96px) / 2 - 8px); } }
        @media (max-width: 640px) { .comment-card { width: calc(100vw - 64px); } }
      `}</style>

      {/* ── FEATURES ── */}
      <div className="section-pad" style={{ maxWidth: "1360px", margin: "0 auto", paddingBottom: "140px" }}>
        <div style={{ marginBottom: "64px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", color: "var(--amber)", textTransform: "uppercase", marginBottom: "16px" }}>Pourquoi E-Bia</div>
          <h2 className="bebas" style={{ fontSize: "56px", color: "var(--text)", lineHeight: 1 }}>La plateforme faite pour nous</h2>
        </div>
        <div className="features-grid">
          {[
            { num: "01", title: "Écoute libre", desc: "Toute la musique centrafricaine sans restriction. Aucun compte requis pour commencer à écouter.", c: "var(--amber)" },
            { num: "02", title: "Artistes locaux", desc: "Soutenez directement les artistes de la RCA. Suivez-les, partagez leur musique, faites rayonner leur talent.", c: "var(--gold)" },
            { num: "03", title: "Qualité premium", desc: "Streaming haute qualité optimisé pour les connexions centrafricaines. Une expérience fluide, partout.", c: "var(--text)" },
          ].map(f => (
            <div key={f.num} className="card-lift" style={{ padding: "44px 40px", borderRadius: "20px", border: "1px solid var(--border)", background: "rgba(240,235,227,0.018)", cursor: "default" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.3)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
            >
              <div className="bebas" style={{ fontSize: "80px", color: f.c, opacity: 0.12, lineHeight: 1, marginBottom: "28px" }}>{f.num}</div>
              <h3 style={{ fontSize: "19px", fontWeight: 700, color: "var(--text)", marginBottom: "12px" }}>{f.title}</h3>
              <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
