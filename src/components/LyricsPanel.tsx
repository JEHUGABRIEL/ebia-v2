import { useState, useEffect, useRef } from "react";
import { X, Music2, Loader2, Mic } from "lucide-react";
import { getTrackLyrics, type TrackLyrics } from "../lib/api";

type LyricsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  trackId: string | null;
  trackTitle: string;
  currentTime: number; // in seconds
};

export default function LyricsPanel({ isOpen, onClose, trackId, trackTitle, currentTime }: LyricsPanelProps) {
  const [lyrics, setLyrics] = useState<TrackLyrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen || !trackId) return;
    loadLyrics();
  }, [isOpen, trackId]);

  useEffect(() => {
    if (!lyrics?.timedLines?.length) return;

    // Find the active line based on current playback time
    const timedLines = lyrics.timedLines;
    let newIndex = -1;

    for (let i = timedLines.length - 1; i >= 0; i--) {
      if (currentTime >= timedLines[i].startTime) {
        newIndex = i;
        break;
      }
    }

    setActiveLineIndex(newIndex);

    // Auto-scroll to active line
    if (newIndex >= 0 && lineRefs.current[newIndex]) {
      lineRefs.current[newIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTime, lyrics]);

  const loadLyrics = async () => {
    if (!trackId) return;
    try {
      setLoading(true);
      const data = await getTrackLyrics(trackId);
      setLyrics(data);
    } catch (err) {
      console.error("Failed to load lyrics:", err);
      setLyrics(null);
    } finally {
      setLoading(false);
    }
  };

  const hasTimedLines = lyrics?.timedLines && lyrics.timedLines.length > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 90,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(450px, 90vw)",
          background: "rgba(12,12,12,0.98)",
          borderLeft: "1px solid rgba(240,235,227,0.06)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s ease-out",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid rgba(240,235,227,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Mic size={18} style={{ color: "var(--amber)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              Paroles
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "6px",
              borderRadius: "8px",
              border: "none",
              background: "rgba(240,235,227,0.06)",
              color: "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Track Title */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(240,235,227,0.03)" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
            {trackTitle}
          </p>
        </div>

        {/* Lyrics Content */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Loader2
                size={24}
                style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }}
              />
            </div>
          ) : !lyrics ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <Music2
                size={48}
                style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }}
              />
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "4px" }}>
                Aucune parole disponible
              </p>
              <p style={{ fontSize: "12px", color: "rgba(240,235,227,0.3)" }}>
                Les paroles ne sont pas encore ajoutées pour ce titre
              </p>
            </div>
          ) : hasTimedLines ? (
            /* Timed Lyrics - Karaoke Style */
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {lyrics.timedLines.map((line, index) => (
                <div
                  key={index}
                  ref={el => { lineRefs.current[index] = el; }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease",
                    background: index === activeLineIndex ? "rgba(232,96,26,0.1)" : "transparent",
                    transform: index === activeLineIndex ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <p
                    style={{
                      fontSize: index === activeLineIndex ? "18px" : "15px",
                      fontWeight: index === activeLineIndex ? 700 : 500,
                      color: index === activeLineIndex ? "var(--amber)" :
                             index < activeLineIndex ? "rgba(240,235,227,0.4)" : "var(--muted)",
                      lineHeight: 1.6,
                      transition: "all 0.3s ease",
                      textAlign: "center",
                    }}
                  >
                    {line.text}
                  </p>
                </div>
              ))}
            </div>
          ) : lyrics.plainText ? (
            /* Plain Text Lyrics */
            <div style={{ whiteSpace: "pre-wrap" }}>
              {lyrics.plainText.split("\n").map((line, index) => (
                <p
                  key={index}
                  style={{
                    fontSize: "15px",
                    color: "var(--muted)",
                    lineHeight: 1.8,
                    marginBottom: "8px",
                  }}
                >
                  {line || "\u00A0"}
                </p>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                Aucune parole disponible
              </p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        {hasTimedLines && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid rgba(240,235,227,0.06)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "11px", color: "rgba(240,235,227,0.3)" }}>
              Les paroles défilent automatiquement avec la musique
            </p>
          </div>
        )}
      </div>
    </>
  );
}
