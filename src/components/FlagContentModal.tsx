import { useState } from "react";
import { flagContent } from "../lib/api";
import { Flag, Loader2, X, AlertTriangle } from "lucide-react";

type Props = {
  targetId: string;
  targetType: string;
  targetTitle?: string;
  onClose: () => void;
  onFlagged?: () => void;
};

const FLAG_TYPES = [
  { value: "EXPLICIT_CONTENT", label: "Contenu explicite", icon: "🔞" },
  { value: "HATE_SPEECH", label: "Discours haineux", icon: "😡" },
  { value: "SPAM", label: "Spam", icon: "🚫" },
  { value: "COPYRIGHT_VIOLATION", label: "Violation de droits d'auteur", icon: "©️" },
  { value: "INAPPROPRIATE_LANGUAGE", label: "Langage inapproprié", icon: "⚠️" },
  { value: "MISINFORMATION", label: "Désinformation", icon: "❌" },
  { value: "OTHER", label: "Autre", icon: "📝" },
];

export default function FlagContentModal({ targetId, targetType, targetTitle, onClose, onFlagged }: Props) {
  const [flagType, setFlagType] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFlag = async () => {
    if (!flagType) return;
    setSaving(true);
    setError("");
    try {
      await flagContent({
        targetId,
        targetType,
        targetTitle,
        flagType,
        reason: reason || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onFlagged?.();
        onClose();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du signalement");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-sm bg-[var(--bg2)] rounded-2xl border border-[var(--border)] p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-green-400" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Signalement envoyé</h3>
          <p className="text-white/50 text-sm">Merci, nous examinerons le contenu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[var(--bg2)] rounded-2xl border border-[var(--border)] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-red-400" />
            <h2 className="text-white font-semibold">Signaler ce contenu</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {targetTitle && (
            <p className="text-sm text-white/60">
              Contenu signalé : <span className="text-white font-medium">{targetTitle}</span>
            </p>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>
          )}

          {/* Flag type selection */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Raison du signalement</label>
            <div className="grid grid-cols-2 gap-2">
              {FLAG_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFlagType(type.value)}
                  className={`p-3 rounded-xl border text-left text-sm transition ${
                    flagType === type.value
                      ? "border-red-500/50 bg-red-500/10 text-white"
                      : "border-[var(--border)] bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-2">Détails (optionnel)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Décrivez le problème..."
              rows={3}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          <button
            onClick={handleFlag}
            disabled={!flagType || saving}
            className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
            Signaler
          </button>
        </div>
      </div>
    </div>
  );
}
