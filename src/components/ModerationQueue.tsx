import { useEffect, useState } from "react";
import {
  getFlaggedContent,
  resolveFlag,
  getModerationStats,
  type ContentFlag,
} from "../lib/api";
import { Shield, Loader2, Check, X } from "lucide-react";

const FLAG_TYPE_LABELS: Record<string, string> = {
  EXPLICIT_CONTENT: "Contenu explicite",
  HATE_SPEECH: "Discours haineux",
  SPAM: "Spam",
  COPYRIGHT_VIOLATION: "Droits d'auteur",
  INAPPROPRIATE_LANGUAGE: "Langage inapproprié",
  MISINFORMATION: "Désinformation",
  OTHER: "Autre",
};

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending: { color: "var(--amber)", bg: "rgba(232,96,26,0.12)", border: "rgba(232,96,26,0.3)", label: "En attente" },
  resolved: { color: "#4caf82", bg: "rgba(76,175,130,0.12)", border: "rgba(76,175,130,0.3)", label: "Résolu" },
  dismissed: { color: "var(--muted)", bg: "rgba(240,235,227,0.06)", border: "var(--border)", label: "Rejeté" },
};

const FILTERS: { key: "pending" | "resolved" | "dismissed"; label: string; color: string }[] = [
  { key: "pending", label: "En attente", color: "var(--amber)" },
  { key: "resolved", label: "Résolus", color: "#4caf82" },
  { key: "dismissed", label: "Rejetés", color: "var(--muted)" },
];

export default function ModerationQueue() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [stats, setStats] = useState({ pending: 0, resolved: 0, dismissed: 0 });
  const [filter, setFilter] = useState<"pending" | "resolved" | "dismissed">("pending");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    loadFlags();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadFlags = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getFlaggedContent(filter);
      setFlags(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getModerationStats();
      setStats(data);
    } catch {
      /* Les pastilles resteront à 0 — pas bloquant pour la liste elle-même */
    }
  };

  const handleResolve = async (flagId: string, status: string) => {
    setResolvingId(flagId);
    try {
      await resolveFlag(flagId, status);
      await loadFlags();
      await loadStats();
    } catch (e) {
      console.error("Failed to resolve flag:", e);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h1 className="bebas" style={{ fontSize: "28px", color: "var(--text)", lineHeight: 1 }}>Modération</h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px" }}>File de signalements sur le contenu</p>
      </div>

      {/* Compteurs + filtre fusionnés : chaque pastille EST le bouton de filtre,
         évite d'avoir deux rangées de contrôles qui font la même chose. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "16px 12px", borderRadius: "14px", textAlign: "center", cursor: "pointer",
                background: active ? `${f.color}1a` : "rgba(240,235,227,0.03)",
                border: `1px solid ${active ? `${f.color}55` : "var(--border)"}`,
                transition: "all 0.15s",
              }}
            >
              <p className="bebas" style={{ fontSize: "26px", color: f.color, lineHeight: 1, marginBottom: "4px" }}>{stats[f.key]}</p>
              <p style={{ fontSize: "11px", color: active ? "var(--text)" : "var(--muted)", fontWeight: 600 }}>{f.label}</p>
            </button>
          );
        })}
      </div>

      {/* Flags list */}
      <div style={{ borderRadius: "16px", background: "rgba(240,235,227,0.02)", border: "1px solid var(--border)", minHeight: "160px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "14px" }}>Impossible de charger les signalements.</p>
            <button onClick={loadFlags} style={{ padding: "8px 18px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Réessayer
            </button>
          </div>
        ) : flags.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <Shield size={36} style={{ color: "var(--muted)", opacity: 0.4, marginBottom: "12px" }} />
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              Aucun signalement {filter === "pending" ? "en attente" : filter === "resolved" ? "résolu" : "rejeté"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {flags.map((flag, idx) => {
              const statusStyle = STATUS_STYLES[flag.status] || STATUS_STYLES.pending;
              return (
                <div key={flag.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", padding: "16px 18px", borderBottom: idx < flags.length - 1 ? "1px solid rgba(240,235,227,0.04)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ padding: "3px 9px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
                        {statusStyle.label}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {FLAG_TYPE_LABELS[flag.flagType] || flag.flagType}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>
                      {flag.targetTitle || `Contenu ${flag.targetType}`}
                    </p>

                    {flag.reason && (
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px", fontStyle: "italic" }}>"{flag.reason}"</p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "rgba(240,235,227,0.3)" }}>
                      <span>Par {flag.reporterName || "Anonyme"}</span>
                      <span>·</span>
                      <span>{new Date(flag.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>

                    {flag.reviewNote && (
                      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px", fontStyle: "italic" }}>Note : {flag.reviewNote}</p>
                    )}
                  </div>

                  {flag.status === "pending" && (
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => handleResolve(flag.id, "resolved")}
                        disabled={resolvingId === flag.id}
                        title="Résoudre"
                        style={{ width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(76,175,130,0.1)", border: "none", color: "#4caf82", cursor: resolvingId === flag.id ? "not-allowed" : "pointer", opacity: resolvingId === flag.id ? 0.5 : 1, transition: "background 0.15s" }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleResolve(flag.id, "dismissed")}
                        disabled={resolvingId === flag.id}
                        title="Rejeter"
                        style={{ width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,235,227,0.05)", border: "none", color: "var(--muted)", cursor: resolvingId === flag.id ? "not-allowed" : "pointer", opacity: resolvingId === flag.id ? 0.5 : 1, transition: "background 0.15s" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
