import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ArrowRight, Play } from "lucide-react";

const TICKER = ["Afro-Pop","Hip-Hop","Afro-Folk","Soukous","Gospel","Afro-Trap","Ndombolo","Bikutsi","Traditionnel","R&B","Afro-Beat","Soul"];

export default function Landing() {
  const { user } = useApp();
  const navigate = useNavigate();
  const full = [...TICKER,...TICKER,...TICKER,...TICKER];

  return (
    <div className="grain" style={{ background: "var(--bg)", color: "var(--text)", overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "100px 0 60px", position: "relative", overflow: "hidden",
      }}>
        {/* Warm glow */}
        <div style={{
          position: "absolute", top: "-5%", right: "-10%",
          width: "700px", height: "700px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,96,26,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div className="section-pad" style={{ maxWidth: "1360px", margin: "0 auto", width: "100%" }}>
          <div className="hero-grid">

            {/* LEFT – Typographie */}
            <div>
              <div className="fade-up" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "6px 14px", borderRadius: "99px",
                border: "1px solid rgba(232,96,26,0.3)", marginBottom: "36px",
                fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "var(--amber)",
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />
                République Centrafricaine
              </div>

              <h1 className="bebas fade-up-2" style={{
                fontSize: "clamp(72px, 11vw, 148px)",
                lineHeight: 0.9, letterSpacing: "0.02em",
                marginBottom: "36px",
              }}>
                <span style={{ display: "block", color: "var(--text)" }}>La</span>
                <span style={{ display: "block", color: "var(--amber)" }}>musique</span>
                <span style={{ display: "block", color: "var(--text)" }}>de chez</span>
                <span style={{ display: "block", color: "var(--gold)" }}>nous.</span>
              </h1>

              <p className="fade-up-3" style={{
                color: "var(--muted)", fontSize: "17px", lineHeight: 1.7,
                maxWidth: "460px", marginBottom: "44px", fontWeight: 400,
              }}>
                Découvrez, écoutez et soutenez les artistes qui définissent le son de la République Centrafricaine.
              </p>

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
                >
                  <Play size={14} fill="white" /> Écouter maintenant
                </Link>
                {!user && (
                  <button onClick={() => navigate("/login")} style={{
                    padding: "15px 30px", borderRadius: "99px",
                    background: "transparent", border: "1px solid rgba(240,235,227,0.18)",
                    color: "var(--text)", fontWeight: 600, fontSize: "13px",
                    cursor: "pointer", transition: "background 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.35)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.18)"; }}
                  >
                    Rejoindre E-Bia <ArrowRight size={13} style={{ display: "inline", marginLeft: "4px", verticalAlign: "-2px" }} />
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT – Orbe */}
            <div style={{ flexShrink: 0 }} className="hero-orb hidden md:block">
              <div style={{
                width: "380px", height: "380px", borderRadius: "50%",
                border: "1px solid rgba(232,96,26,0.18)",
                background: "radial-gradient(circle at 35% 35%, rgba(232,96,26,0.1), rgba(201,147,10,0.06) 60%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                {/* Cercles concentriques */}
                {[280, 200, 130].map((s, i) => (
                  <div key={i} style={{
                    position: "absolute", width: s, height: s, borderRadius: "50%",
                    border: `1px solid rgba(232,96,26,${0.06 + i * 0.06})`,
                  }} />
                ))}
                <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div className="bebas" style={{ fontSize: "68px", color: "var(--amber)", lineHeight: 1, letterSpacing: "0.08em" }}>E-BIA</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: "6px" }}>Music Platform · RCA</div>
                </div>

                {/* Floating pill – En cours */}
                <div style={{
                  position: "absolute", top: "32px", right: "-44px",
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: "12px", padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: "10px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Play size={10} fill="white" color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>En cours</div>
                    <div style={{ fontSize: "10px", color: "var(--muted)" }}>Idylle Mamba</div>
                  </div>
                </div>

                {/* Floating badge – artistes */}
                <div style={{
                  position: "absolute", bottom: "48px", left: "-52px",
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: "10px", padding: "10px 14px",
                  fontSize: "11px", fontWeight: 700, color: "var(--gold)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}>
                  ♪ 19 artistes RCA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        overflow: "hidden", padding: "14px 0", background: "#0D0D0D",
      }}>
        <div className="marquee-track">
          {full.map((g, i) => (
            <span key={i} style={{
              padding: "0 28px", fontSize: "11px", fontWeight: 600,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: i % 2 === 0 ? "var(--muted)" : "var(--amber)",
            }}>
              {g}&nbsp;&nbsp;<span style={{ color: "rgba(240,235,227,0.12)" }}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="section-pad" style={{ maxWidth: "1360px", margin: "0 auto", paddingTop: "100px", paddingBottom: "100px" }}>
        <div className="stats-grid" style={{
          border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden",
        }}>
          {[
            { value: "19", label: "Artistes centrafricains", note: "et en croissance", c: "var(--amber)" },
            { value: "54", label: "Titres disponibles", note: "écoute 100% libre", c: "var(--gold)" },
            { value: "∞", label: "Musique à découvrir", note: "de la RCA au monde", c: "var(--text)" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "56px 48px", background: "var(--bg)",
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
            }}>
              <div className="bebas" style={{ fontSize: "88px", lineHeight: 1, color: s.c, marginBottom: "14px" }}>{s.value}</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{s.label}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", letterSpacing: "0.04em" }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="section-pad" style={{ maxWidth: "1360px", margin: "0 auto", paddingBottom: "140px" }}>
        <div style={{ marginBottom: "64px" }}>
          <div style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em",
            color: "var(--amber)", textTransform: "uppercase", marginBottom: "16px",
          }}>Pourquoi E-Bia</div>
          <h2 className="bebas" style={{ fontSize: "56px", color: "var(--text)", lineHeight: 1 }}>
            La plateforme faite pour nous
          </h2>
        </div>

        <div className="features-grid">
          {[
            { num: "01", title: "Écoute libre", desc: "Toute la musique centrafricaine sans restriction. Aucun compte requis pour commencer à écouter.", c: "var(--amber)" },
            { num: "02", title: "Artistes locaux", desc: "Soutenez directement les artistes de la RCA. Suivez-les, partagez leur musique, faites rayonner leur talent.", c: "var(--gold)" },
            { num: "03", title: "Qualité premium", desc: "Streaming haute qualité optimisé pour les connexions centrafricaines. Une expérience fluide, partout.", c: "var(--text)" },
          ].map(f => (
            <div key={f.num} className="card-lift" style={{
              padding: "44px 40px", borderRadius: "20px",
              border: "1px solid var(--border)", background: "rgba(240,235,227,0.018)",
              cursor: "default",
            }}
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
