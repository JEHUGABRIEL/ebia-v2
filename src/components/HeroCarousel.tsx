import { useEffect, useState, type ReactNode } from "react";

export type HeroSlide = {
  img: string;
  tag: string;
  titleTop: string;
  titleAccent: string;
  description: string;
};

type Props = {
  slides: HeroSlide[];
  accentColor: string;
  glowColor: string;
  glowSide?: "left" | "right";
  badgeIcon?: ReactNode;
  interval?: number;
  /** Contenu statique affiché sous le texte (bouton, stats...), ne défile pas avec les slides. */
  children?: ReactNode;
};

export default function HeroCarousel({
  slides, accentColor, glowColor, glowSide = "right", badgeIcon, interval = 6000, children,
}: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [slides.length, interval]);

  const slide = slides[current];

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      minHeight: "560px", display: "flex", alignItems: "flex-end",
    }}>
      {slides.map((s, i) => (
        <div key={i} style={{
          position: "absolute", inset: 0,
          opacity: i === current ? 1 : 0,
          transition: "opacity 1s ease",
          zIndex: 0,
        }}>
          <img
            src={s.img}
            alt=""
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              animation: i === current ? `heroKenBurns ${interval}ms ease-out forwards` : "none",
            }}
          />
        </div>
      ))}

      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(8,8,8,0.35) 0%, rgba(8,8,8,0.8) 60%, #080808 100%), linear-gradient(90deg, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.55) 45%, rgba(8,8,8,0.15) 100%)",
      }} />
      <div style={{
        position: "absolute", top: "-20%", [glowSide]: "-15%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1360px", margin: "0 auto", width: "100%", padding: "160px 24px 64px" }}>
        <div key={current} style={{ animation: "heroFadeIn 0.6s ease" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "5px 14px", borderRadius: "99px",
            border: `1px solid ${accentColor}4D`, marginBottom: "20px",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", color: accentColor,
            background: "rgba(8,8,8,0.4)", backdropFilter: "blur(8px)",
          }}>
            {badgeIcon}
            {slide.tag}
          </div>

          <h1 className="bebas" style={{
            fontSize: "clamp(48px, 8vw, 96px)", color: "var(--text)",
            lineHeight: 0.92, marginBottom: "16px",
          }}>
            {slide.titleTop}<br />
            <span style={{ color: accentColor }}>{slide.titleAccent}</span>
          </h1>

          <p style={{
            fontSize: "16px", color: "var(--muted)", maxWidth: "520px",
            lineHeight: 1.7, marginBottom: "24px",
          }}>
            {slide.description}
          </p>
        </div>

        {children}

        {slides.length > 1 && (
          <div style={{ display: "flex", gap: "6px", marginTop: "32px" }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: i === current ? "22px" : "6px", height: "6px", borderRadius: "99px",
                  background: i === current ? accentColor : "rgba(240,235,227,0.3)",
                  border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes heroKenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
        @keyframes heroFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </section>
  );
}
