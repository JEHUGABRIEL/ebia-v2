import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Music2,
  Trash2,
  Play,
  Loader2,
  History,
  X,
} from "lucide-react";
import {
  getPlayHistory,
  clearPlayHistory,
  deletePlayHistoryEntry,
  type PlayHistoryItem,
} from "../lib/api";
import { useApp } from "../context/AppContext";
import ConfirmModal from "../components/ConfirmModal";

export default function PlayHistoryPage() {
  const navigate = useNavigate();
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

  const handlePlayTrack = (item: PlayHistoryItem) => {
    // L'écoute est comptabilisée par le lecteur lui-même (80% de la durée réelle) —
    // pas d'enregistrement immédiat ici pour éviter un double comptage.
    playTrack({
      id: item.trackId,
      title: item.trackTitle,
      artistName: item.artistName,
    } as any);
  };

  const handleDeleteEntry = async (historyId: string) => {
    try {
      await deletePlayHistoryEntry(historyId);
      setHistory((prev) => prev.filter((h) => h.id !== historyId));
    } catch (err) {
      console.error("Failed to delete history entry:", err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      await clearPlayHistory();
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    } finally {
      setClearing(false);
      setConfirmClearAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const isCurrentTrack = (item: PlayHistoryItem) =>
    currentTrack?.id === item.trackId;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>
      {/* Header */}
      <section
        style={{
          padding: "120px 24px 40px",
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px",
              borderRadius: "99px",
              border: "1px solid rgba(232,96,26,0.3)",
              marginBottom: "20px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--amber)",
            }}
          >
            <History size={12} />
            Historique
          </div>

          <h1
            className="bebas"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "var(--text)",
              lineHeight: 0.92,
              marginBottom: "16px",
            }}
          >
            Historique des écoutes
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "var(--muted)",
              maxWidth: "500px",
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Retrouvez tous les titres que vous avez écoutés récemment.
          </p>

          {history.length > 0 && (
            <button
              onClick={() => setConfirmClearAll(true)}
              disabled={clearing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 24px",
                borderRadius: "99px",
                background: "rgba(239,68,68,0.1)",
                color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.3)",
                fontWeight: 700,
                fontSize: "13px",
                cursor: clearing ? "not-allowed" : "pointer",
                opacity: clearing ? 0.6 : 1,
              }}
            >
              {clearing ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Trash2 size={14} />
              )}
              Effacer l'historique
            </button>
          )}
        </div>
      </section>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <Loader2
              size={32}
              style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : history.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
              textAlign: "center",
            }}
          >
            <Clock
              size={64}
              style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "24px" }}
            />
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              Aucun historique
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted)",
                marginBottom: "24px",
              }}
            >
              Vos écoutes apparaîtront ici.
            </p>
            <button
              onClick={() => navigate("/explore")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "99px",
                background: "var(--amber)",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <Play size={14} fill="currentColor" /> Découvrir des titres
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 120px 40px",
                gap: "16px",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(240,235,227,0.06)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span>#</span>
              <span>Titre</span>
              <span>Artiste</span>
              <span style={{ textAlign: "right" }}>Écouté</span>
              <span />
            </div>

            {/* History items */}
            {history.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handlePlayTrack(item)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 1fr 120px 40px",
                  gap: "16px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  background: isCurrentTrack(item)
                    ? "rgba(232,96,26,0.1)"
                    : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentTrack(item))
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(240,235,227,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentTrack(item))
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: isCurrentTrack(item) ? "var(--amber)" : "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isCurrentTrack(item) && isPlaying ? (
                    <Music2 size={14} style={{ color: "var(--amber)" }} />
                  ) : (
                    index + 1
                  )}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "6px",
                      background: "rgba(240,235,227,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Music2 size={16} style={{ color: "var(--muted)" }} />
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: isCurrentTrack(item) ? "var(--amber)" : "var(--text)",
                    }}
                  >
                    {item.trackTitle}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {item.artistName}
                </span>

                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  {formatDate(item.playedAt)}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(item.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#EF4444";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                  }}
                  title="Supprimer de l'historique"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Retirer de l'historique"
        message="Cette écoute sera retirée de votre historique."
        confirmLabel="Retirer"
        onConfirm={() => confirmDeleteId && handleDeleteEntry(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <ConfirmModal
        open={confirmClearAll}
        title="Effacer tout l'historique"
        message="Toutes vos écoutes seront définitivement supprimées de votre historique. Cette action est irréversible."
        confirmLabel="Tout effacer"
        loading={clearing}
        onConfirm={handleClearHistory}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  );
}
