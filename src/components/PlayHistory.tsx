import { useState, useEffect } from "react";
import {
  Music2,
  Trash2,
  Play,
  Loader2,
  History,
} from "lucide-react";
import {
  getPlayHistory,
  clearPlayHistory,
  deletePlayHistoryEntry,
  recordPlay,
  type PlayHistoryItem,
} from "../lib/api";
import { useApp } from "../context/AppContext";
import ConfirmModal from "./ConfirmModal";

export default function PlayHistory() {
  const { playTrack, currentTrack, isPlaying } = useApp();

  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getPlayHistory(0, 100);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load play history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = async (item: PlayHistoryItem) => {
    try {
      await recordPlay(item.trackId);
    } catch {}
    playTrack({
      id: item.trackId,
      title: item.trackTitle,
      artist: item.artistName,
    } as any);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlayHistoryEntry(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Failed to delete history entry:", err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearPlayHistory();
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    } finally {
      setClearing(false);
      setConfirmClearAll(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
        <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1 }}>Historique d'écoute</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{history.length} écoute{history.length !== 1 ? "s" : ""}</p>
        </div>
        {history.length > 0 && (
          <button onClick={() => setConfirmClearAll(true)} disabled={clearing} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(220,50,50,0.3)", background: "transparent", color: "#f08080", fontSize: "12px", fontWeight: 600, cursor: clearing ? "not-allowed" : "pointer", opacity: clearing ? 0.5 : 1 }}>
            {clearing ? "Suppression..." : "Tout supprimer"}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <History size={48} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>Aucun historique d'écoute</p>
          <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>Vos écoutes apparaîtront ici</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "0 14px 10px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ width: "28px" }} />
            <span style={{ flex: 1 }}>Titre</span>
            <span style={{ width: "120px" }}>Artiste</span>
            <span style={{ width: "80px", textAlign: "right" }}>Écouté</span>
            <span style={{ width: "32px" }} />
          </div>

          {/* Items */}
          {history.map((item) => {
            const isCurrentTrackPlaying = currentTrack?.id === item.trackId && isPlaying;
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  background: isCurrentTrackPlaying ? "rgba(232,96,26,0.1)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentTrackPlaying) (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentTrackPlaying) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
                onClick={() => handlePlayTrack(item)}
              >
                <div style={{ width: "28px", display: "flex", justifyContent: "center" }}>
                  {isCurrentTrackPlaying ? (
                    <Music2 size={14} style={{ color: "var(--amber)" }} />
                  ) : (
                    <Play size={14} style={{ color: "var(--muted)" }} fill="currentColor" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: isCurrentTrackPlaying ? "var(--amber)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.trackTitle}</p>
                </div>

                <span style={{ width: "120px", fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.artistName}</span>

                <span style={{ width: "80px", textAlign: "right", fontSize: "11px", color: "var(--muted)" }}>{formatTimeAgo(item.playedAt)}</span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(item.id);
                  }}
                  style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "all 0.15s", flexShrink: 0 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(220,50,50,0.1)"; (e.currentTarget as HTMLElement).style.color = "#f08080"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Retirer de l'historique"
        message="Cette écoute sera retirée de votre historique."
        confirmLabel="Retirer"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <ConfirmModal
        open={confirmClearAll}
        title="Supprimer tout l'historique"
        message="Toutes vos écoutes seront définitivement supprimées de votre historique. Cette action est irréversible."
        confirmLabel="Tout supprimer"
        loading={clearing}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  );
}
