import { useState } from "react";
import { X, Sliders, Power } from "lucide-react";
import { useEQ } from "../context/EQContext";

type EQPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function EQPanel({ isOpen, onClose }: EQPanelProps) {
  const { enabled, toggleEQ, bands, setBandGain, currentPreset, setPreset, presets } = useEQ();
  const [dragging, setDragging] = useState<number | null>(null);

  if (!isOpen) return null;

  const formatFrequency = (freq: number) => {
    if (freq >= 1000) return `${freq / 1000}k`;
    return `${freq}`;
  };

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
          width: "min(420px, 90vw)",
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
            <Sliders size={18} style={{ color: "var(--amber)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              Égaliseur
            </h2>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Power button */}
            <button
              onClick={toggleEQ}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: `2px solid ${enabled ? "var(--amber)" : "rgba(240,235,227,0.15)"}`,
                background: enabled ? "rgba(232,96,26,0.15)" : "transparent",
                color: enabled ? "var(--amber)" : "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              title={enabled ? "Désactiver l'égaliseur" : "Activer l'égaliseur"}
            >
              <Power size={14} />
            </button>
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
        </div>

        {/* Status */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid rgba(240,235,227,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: enabled ? "var(--amber)" : "var(--muted)",
            }}
          >
            {enabled ? "Activé" : "Désactivé"}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              padding: "4px 10px",
              borderRadius: "99px",
              background: "rgba(240,235,227,0.05)",
            }}
          >
            {currentPreset === "custom" ? "Personnalisé" : presets.find(p => p.name === currentPreset)?.label || currentPreset}
          </span>
        </div>

        {/* Presets */}
        <div style={{ padding: "16px 20px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "10px",
            }}
          >
            Presets
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setPreset(preset.name)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "99px",
                  border: `1px solid ${currentPreset === preset.name ? "var(--amber)" : "rgba(240,235,227,0.1)"}`,
                  background: currentPreset === preset.name ? "rgba(232,96,26,0.12)" : "transparent",
                  color: currentPreset === preset.name ? "var(--amber)" : "var(--muted)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Equalizer Sliders */}
        <div
          style={{
            flex: 1,
            padding: "0 20px 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}
          >
            Bandes de fréquence
          </p>

          <div
            style={{
              flex: 1,
              display: "flex",
              gap: "4px",
              alignItems: "stretch",
              justifyContent: "space-between",
              minHeight: "280px",
            }}
          >
            {bands.map((band, index) => (
              <div
                key={band.frequency}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {/* Gain value */}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: band.gain > 0 ? "var(--amber)" : band.gain < 0 ? "#6B7280" : "var(--muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {band.gain > 0 ? "+" : ""}{band.gain}
                </span>

                {/* Slider track */}
                <div
                  style={{
                    flex: 1,
                    width: "28px",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* Background track */}
                  <div
                    style={{
                      position: "absolute",
                      width: "4px",
                      height: "100%",
                      borderRadius: "2px",
                      background: "rgba(240,235,227,0.08)",
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  />

                  {/* Active fill */}
                  <div
                    style={{
                      position: "absolute",
                      width: "4px",
                      borderRadius: "2px",
                      background: "var(--amber)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      ...(band.gain >= 0
                        ? {
                            bottom: "50%",
                            height: `${(band.gain / 12) * 50}%`,
                          }
                        : {
                            top: "50%",
                            height: `${(Math.abs(band.gain) / 12) * 50}%`,
                          }),
                    }}
                  />

                  {/* Center line */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "2px",
                      background: "rgba(240,235,227,0.2)",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />

                  {/* Slider thumb */}
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={band.gain}
                    onChange={(e) => setBandGain(index, Number(e.target.value))}
                    onMouseDown={() => setDragging(index)}
                    onMouseUp={() => setDragging(null)}
                    onTouchStart={() => setDragging(index)}
                    onTouchEnd={() => setDragging(null)}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      appearance: "none",
                      WebkitAppearance: "none",
                      background: "transparent",
                      cursor: "pointer",
                      zIndex: 2,
                      writingMode: "vertical-lr" as const,
                      direction: "rtl" as const,
                    }}
                  />

                  {/* Custom thumb visual */}
                  <div
                    style={{
                      position: "absolute",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: dragging === index ? "var(--amber)" : "#fff",
                      boxShadow: `0 0 0 2px var(--amber), 0 2px 8px rgba(0,0,0,0.3)`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      top: `${50 - (band.gain / 12) * 50}%`,
                      marginTop: "-8px",
                      pointerEvents: "none",
                      transition: dragging === index ? "none" : "background 0.15s",
                    }}
                  />
                </div>

                {/* Frequency label */}
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color: "var(--muted)",
                    textAlign: "center",
                  }}
                >
                  {formatFrequency(band.frequency)}
                </span>
              </div>
            ))}
          </div>

          {/* dB scale */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "12px",
              padding: "0 12px",
            }}
          >
            <span style={{ fontSize: "9px", color: "var(--muted)" }}>−12 dB</span>
            <span style={{ fontSize: "9px", color: "var(--muted)" }}>0 dB</span>
            <span style={{ fontSize: "9px", color: "var(--muted)" }}>+12 dB</span>
          </div>
        </div>
      </div>
    </>
  );
}
