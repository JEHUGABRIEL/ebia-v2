import { useState } from "react";
import {
  X,
  Music2,
  GripVertical,
  ListMusic,
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { useApp } from "../context/AppContext";

type QueuePanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { queue, currentIndex, removeFromQueue, clearQueue, reorderQueue } = useQueue();
  const { playTrack, isPlaying } = useApp();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorderQueue(dragIndex, index);
      setDragIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const isCurrentTrack = (index: number) => index === currentIndex;

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
          width: "min(400px, 90vw)",
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
            <ListMusic size={18} style={{ color: "var(--amber)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              File d'attente
            </h2>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "99px",
                background: "rgba(232,96,26,0.1)",
                color: "var(--amber)",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {queue.length}
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.1)",
                  color: "#EF4444",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Tout effacer
              </button>
            )}
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

        {/* Queue List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {queue.length === 0 ? (
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
                La file d'attente est vide
              </p>
              <p style={{ fontSize: "12px", color: "rgba(240,235,227,0.3)" }}>
                Ajoutez des titres pour les écouter ensuite
              </p>
            </div>
          ) : (
            queue.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  playTrack(track as any);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  background: isCurrentTrack(index)
                    ? "rgba(232,96,26,0.1)"
                    : dragIndex === index
                    ? "rgba(240,235,227,0.06)"
                    : "transparent",
                  marginBottom: "4px",
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentTrack(index))
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(240,235,227,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentTrack(index) && dragIndex !== index)
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Drag Handle */}
                <GripVertical
                  size={14}
                  style={{ color: "var(--muted)", cursor: "grab", flexShrink: 0 }}
                />

                {/* Track Number */}
                <span
                  style={{
                    width: "20px",
                    fontSize: "12px",
                    color: isCurrentTrack(index) ? "var(--amber)" : "var(--muted)",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {isCurrentTrack(index) && isPlaying ? "▶" : index + 1}
                </span>

                {/* Track Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isCurrentTrack(index) ? "var(--amber)" : "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {track.title}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {track.artist_name || track.artistName}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(index);
                  }}
                  style={{
                    padding: "4px",
                    borderRadius: "4px",
                    border: "none",
                    background: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#EF4444";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
