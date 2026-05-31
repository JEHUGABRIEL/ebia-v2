import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArtists, type Artist } from "../lib/api";
import { MapPin, Search, CheckCircle, Play } from "lucide-react";

const GENRES = ["Tous", "Afro-Pop", "Hip-Hop", "Afro-Folk", "Afro-Trap", "Jazz", "Gospel", "Traditionnel"];

export default function Explore() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("Tous");

  useEffect(() => {
    getArtists().then(r => setArtists(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = artists.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.genre || "").toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "Tous" || (a.genre || "").includes(genre);
    return matchSearch && matchGenre;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>

      {/* ── HERO BANNER ── */}
      <div className="section-pad page-hero-pad" style={{
        paddingTop: "120px", paddingBottom: "64px",
        maxWidth: "1360px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "32px", flexWrap: "wrap", marginBottom: "48px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", color: "var(--amber)", textTransform: "uppercase", marginBottom: "12px" }}>
              E-Bia · République Centrafricaine
            </div>
            <h1 className="bebas" style={{ fontSize: "clamp(64px, 10vw, 120px)", color: "var(--text)", lineHeight: 0.9, marginBottom: "12px" }}>
              Artistes
            </h1>
            <p style={{ fontSize: "15px", color: "var(--muted)", fontWeight: 400 }}>
              Les talents qui font vibrer la RCA
            </p>
          </div>

          {/* Search */}
          <div style={{ position: "relative", minWidth: "280px", maxWidth: "380px", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Artiste, genre..."
              style={{
                width: "100%", padding: "14px 18px 14px 44px", borderRadius: "99px",
                background: "rgba(240,235,227,0.05)", border: "1px solid rgba(240,235,227,0.1)",
                color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(232,96,26,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(240,235,227,0.1)"} />
          </div>
        </div>

        {/* Genre filters */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "48px" }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenre(g)} style={{
              padding: "8px 18px", borderRadius: "99px", cursor: "pointer",
              fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em",
              border: `1px solid ${g === genre ? "var(--amber)" : "rgba(240,235,227,0.1)"}`,
              background: g === genre ? "rgba(232,96,26,0.15)" : "transparent",
              color: g === genre ? "var(--amber)" : "var(--muted)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (g !== genre) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.25)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}}
            onMouseLeave={e => { if (g !== genre) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.1)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}}
            >{g}</button>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "24px" }}>
            {filtered.length} artiste{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ borderRadius: "16px", overflow: "hidden", background: "rgba(240,235,227,0.04)" }}>
                <div style={{ aspectRatio: "1", background: "rgba(240,235,227,0.06)", animation: "pulse 1.5s infinite" }} />
                <div style={{ padding: "16px" }}>
                  <div style={{ height: "14px", borderRadius: "99px", background: "rgba(240,235,227,0.06)", marginBottom: "8px" }} />
                  <div style={{ height: "11px", width: "60%", borderRadius: "99px", background: "rgba(240,235,227,0.04)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div className="bebas" style={{ fontSize: "32px", color: "var(--muted)" }}>Aucun artiste trouvé</div>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "8px" }}>Essayez un autre terme de recherche</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
            {filtered.map((artist) => (
              <Link key={artist.id} to={`/artist/${artist.slug}`} style={{ textDecoration: "none" }}>
                <div style={{
                  borderRadius: "16px", overflow: "hidden",
                  background: "rgba(240,235,227,0.03)",
                  border: "1px solid rgba(240,235,227,0.07)",
                  transition: "transform 0.22s ease, border-color 0.22s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.07)"; }}
                >
                  {/* Image */}
                  <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative" }}>
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"} />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: `linear-gradient(135deg, rgba(232,96,26,0.2), rgba(201,147,10,0.1))`,
                      }}>
                        <span className="bebas" style={{ fontSize: "64px", color: "var(--amber)", opacity: 0.6 }}>{artist.name[0]}</span>
                      </div>
                    )}

                    {/* Play hover overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: 0, transition: "opacity 0.2s",
                    }}
                    className="play-overlay"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}
                    >
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", transform: "scale(0.85)", transition: "transform 0.2s" }}>
                        <Play size={18} fill="white" color="white" style={{ marginLeft: "2px" }} />
                      </div>
                    </div>

                    {/* Verified badge */}
                    {artist.verified && (
                      <div style={{ position: "absolute", top: "10px", right: "10px", width: "26px", height: "26px", borderRadius: "50%", background: "rgba(8,8,8,0.75)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                        <CheckCircle size={14} style={{ color: "var(--amber)" }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.name}</p>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.genre}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={10} style={{ color: "var(--muted)", flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>{artist.city}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
