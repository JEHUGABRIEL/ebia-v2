import { useState } from "react";
import { X, Music2, Plus, Trash2, ListMusic, Loader2 } from "lucide-react";
import { createPlaylist, type Track } from "../lib/api";

type RadioQueuePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  queueTracks: Track[];
  onRemoveTrack: (trackId: string) => void;
  onClearQueue: () => void;
  stationName: string;
};

export default function RadioQueuePanel({
  isOpen,
  onClose,
  queueTracks,
  onRemoveTrack,
  onClearQueue,
  stationName,
}: RadioQueuePanelProps) {
  const [playlistName, setPlaylistName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveAsPlaylist = async () => {
    if (queueTracks.length === 0) return;

    const name = playlistName.trim() || `Radio ${stationName}`;

    try {
      setSaving(true);

      // Create playlist
      const playlist = await createPlaylist({
        name,
        description: `Queue de la radio ${stationName}`,
        isPublic: true,
      });

      // Add tracks to playlist
      for (const track of queueTracks) {
        try {
          const { addTrackToPlaylist } = await import("../lib/api");
          await addTrackToPlaylist(playlist.id, track.id);
        } catch (err) {
          console.error("Failed to add track to playlist:", err);
        }
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to save playlist:", err);
    } finally {
      setSaving(false);
    }
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
            <ListMusic size={18} style={{ color: "#4caf82" }} />
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                File radio
              </h2>
              <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                {queueTracks.length} titre{queueTracks.length !== 1 ? "s" : ""}
              </p>
            </div>
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

        {/* Queue List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {queueTracks.length === 0 ? (
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
                La file est vide
              </p>
              <p style={{ fontSize: "12px", color: "rgba(240,235,227,0.3)" }}>
                Les titres apparaîtront ici pendant l'écoute
              </p>
            </div>
          ) : (
            queueTracks.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  marginBottom: "4px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(240,235,227,0.03)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Track Number */}
                <span
                  style={{
                    width: "20px",
                    fontSize: "12px",
                    color: "var(--muted)",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>

                {/* Track Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text)",
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
                  onClick={() => onRemoveTrack(track.id)}
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
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer - Save as Playlist */}
        {queueTracks.length > 0 && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid rgba(240,235,227,0.06)",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder={`Radio ${stationName}`}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(240,235,227,0.1)",
                  background: "rgba(240,235,227,0.03)",
                  color: "var(--text)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={onClearQueue}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "99px",
                  border: "1px solid rgba(240,235,227,0.1)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Tout effacer
              </button>
              <button
                onClick={handleSaveAsPlaylist}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: "10px 16px",
                  borderRadius: "99px",
                  background: saved ? "#10B981" : "#4caf82",
                  color: "#fff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : saved ? (
                  "✓ Enregistré"
                ) : (
                  <>
                    <Plus size={14} />
                    Sauver en playlist
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
