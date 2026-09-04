import { useEffect, useState } from "react";
import {
  scheduleRelease,
  getScheduledReleases,
  cancelRelease,
  type ScheduledRelease,
  type MyTrack,
} from "../lib/api";
import { Calendar, Clock, Trash2, Loader2, Check, Bell } from "lucide-react";

type Props = {
  tracks: MyTrack[];
  onScheduled?: () => void;
};

export default function ReleaseScheduler({ tracks, onScheduled }: Props) {
  const [releases, setReleases] = useState<ScheduledRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [releaseDate, setReleaseDate] = useState("");
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReleases();
  }, []);

  const loadReleases = async () => {
    try {
      const data = await getScheduledReleases();
      setReleases(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedTrack || !releaseDate) return;
    setSaving(true);
    setError("");
    try {
      const track = tracks.find(t => t.id === selectedTrack);
      await scheduleRelease({
        trackId: selectedTrack,
        trackTitle: track?.title || "Titre",
        releaseDate,
        notifyFollowers,
      });
      await loadReleases();
      setShowForm(false);
      setSelectedTrack("");
      setReleaseDate("");
      onScheduled?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la programmation");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (releaseId: string) => {
    if (!window.confirm("Annuler cette programmation ?")) return;
    try {
      await cancelRelease(releaseId);
      await loadReleases();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'annulation");
    }
  };

  const scheduledTracks = tracks.filter(
    t => !releases.some(r => r.trackId === t.id && r.status === "scheduled")
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-amber-500" />
          <h3 className="text-white font-semibold">Sorties programmées</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition"
        >
          {showForm ? "Annuler" : "Programmer"}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Schedule form */}
      {showForm && (
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="">Sélectionner un morceau</option>
            {scheduledTracks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />

          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyFollowers}
              onChange={(e) => setNotifyFollowers(e.target.checked)}
              className="rounded accent-amber-500"
            />
            <Bell size={14} />
            Notifier les followers
          </label>

          <button
            onClick={handleSchedule}
            disabled={!selectedTrack || !releaseDate || saving}
            className="w-full py-2.5 rounded-lg bg-amber-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Programmer
          </button>
        </div>
      )}

      {/* Releases list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="text-amber-500 animate-spin" />
        </div>
      ) : releases.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">
          Aucune sortie programmée
        </div>
      ) : (
        <div className="space-y-2">
          {releases.map(release => (
            <div
              key={release.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                release.status === "published" ? "bg-green-500/20 text-green-400" :
                release.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                "bg-amber-500/20 text-amber-400"
              }`}>
                {release.status === "published" ? <Check size={16} /> :
                 release.status === "cancelled" ? <Trash2 size={16} /> :
                 <Clock size={16} />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {release.trackTitle}
                </p>
                <p className="text-xs text-white/40">
                  {release.status === "published" ? "Publié" :
                   release.status === "cancelled" ? "Annulé" :
                   `Sortie le ${new Date(release.releaseDate).toLocaleDateString("fr-FR")}`}
                </p>
              </div>

              {release.status === "scheduled" && (
                <button
                  onClick={() => handleCancel(release.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition"
                  title="Annuler"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
