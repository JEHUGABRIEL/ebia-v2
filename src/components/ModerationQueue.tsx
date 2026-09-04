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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  dismissed: "bg-white/10 text-white/50 border-white/10",
};

export default function ModerationQueue() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, resolved: 0, dismissed: 0 });
  const [filter, setFilter] = useState<string>("pending");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    loadFlags();
    loadStats();
  }, [filter]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await getFlaggedContent(filter || undefined);
      setFlags(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getModerationStats();
      setStats(data);
    } catch {
      // Ignore
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="bebas text-3xl text-white">Modération</h1>
        <p className="text-sm text-white/40 mt-1">File de signalements en attente</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "En attente", value: stats.pending, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Résolus", value: stats.resolved, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Rejetés", value: stats.dismissed, color: "text-white/50", bg: "bg-white/5" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["pending", "resolved", "dismissed"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              filter === s ? "bg-amber-500 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
            }`}
          >
            {s === "pending" ? "En attente" : s === "resolved" ? "Résolus" : "Rejetés"}
          </button>
        ))}
      </div>

      {/* Flags list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-amber-500 animate-spin" />
        </div>
      ) : flags.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Shield size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aucun signalement {filter === "pending" ? "en attente" : filter}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map(flag => (
            <div key={flag.id} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[flag.status] || STATUS_COLORS.pending}`}>
                      {flag.status}
                    </span>
                    <span className="text-xs text-white/40">
                      {FLAG_TYPE_LABELS[flag.flagType] || flag.flagType}
                    </span>
                  </div>

                  <p className="text-sm text-white font-medium mb-1">
                    {flag.targetTitle || `Contenu ${flag.targetType}`}
                  </p>

                  {flag.reason && (
                    <p className="text-xs text-white/50 mb-2">"{flag.reason}"</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-white/30">
                    <span>Par {flag.reporterName || "Anonyme"}</span>
                    <span>•</span>
                    <span>{new Date(flag.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>

                  {flag.reviewNote && (
                    <p className="text-xs text-white/40 mt-2 italic">Note: {flag.reviewNote}</p>
                  )}
                </div>

                {flag.status === "pending" && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleResolve(flag.id, "resolved")}
                      disabled={resolvingId === flag.id}
                      className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition disabled:opacity-50"
                      title="Résoudre"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleResolve(flag.id, "dismissed")}
                      disabled={resolvingId === flag.id}
                      className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition disabled:opacity-50"
                      title="Rejeter"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
