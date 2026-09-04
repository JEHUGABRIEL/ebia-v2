import { useEffect, useState } from "react";
import { getListeningStats, type ListeningStats } from "../lib/api";
import {
  Music,
  Clock,
  Users,
  Disc3,
  Flame,
  TrendingUp,
  BarChart3,
  Loader2,
  Headphones,
} from "lucide-react";

type Period = "all" | "year" | "month" | "week";

const PERIOD_LABELS: Record<Period, string> = {
  all: "Tout le temps",
  year: "Cette année",
  month: "Ce mois-ci",
  week: "Cette semaine",
};

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Music; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function GenreBar({ genre, percentage }: { genre: string; percentage: number; playCount: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/80 w-24 truncate">{genre}</span>
      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-xs text-white/40 w-12 text-right">{percentage}%</span>
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; playCount: number }[] }) {
  const max = Math.max(...data.map(d => d.playCount), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {Array.from({ length: 24 }, (_, i) => {
        const entry = data.find(d => d.hour === i);
        const count = entry?.playCount ?? 0;
        const height = (count / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500"
              style={{ height: `${Math.max(height, 2)}%`, minHeight: count > 0 ? '4px' : '2px', opacity: count > 0 ? 1 : 0.2 }}
              title={`${i}h — ${count} écoutes`}
            />
            {i % 4 === 0 && (
              <span className="text-[9px] text-white/30">{i}h</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Wrapped() {
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getListeningStats(period);
      setStats(data);
    } catch {
      // Stats not available
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (min: number) => {
    if (min < 60) return `${min} min`;
    const hours = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${hours}h ${m}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={32} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!stats || stats.totalTracksPlayed === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
        <Headphones size={64} className="text-white/20" />
        <p className="text-white/40 text-lg">Pas encore assez de données</p>
        <p className="text-white/30 text-sm">Écoutez quelques titres pour voir vos stats !</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h1 className="bebas text-6xl md:text-8xl text-white tracking-wider mb-2">Ton Wrapped</h1>
          <p className="text-white/50 text-sm">Tes statistiques d'écoute personnalisées</p>

          {/* Period selector */}
          <div className="flex justify-center gap-2 mt-6">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  period === p
                    ? "bg-amber-500 text-white"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 space-y-6">
        {/* Top stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Disc3} label="Écoutes" value={stats.totalTracksPlayed} color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={Clock} label="Temps d'écoute" value={formatMinutes(stats.totalMinutesListened)} color="bg-blue-500/20 text-blue-400" />
          <StatCard icon={Users} label="Artistes" value={stats.uniqueArtists} color="bg-purple-500/20 text-purple-400" />
          <StatCard icon={Music} label="Titres joués" value={stats.uniqueTracks} color="bg-green-500/20 text-green-400" />
          <StatCard icon={Flame} label="Jours actifs" value={stats.listeningDays} color="bg-red-500/20 text-red-400" />
          <StatCard icon={TrendingUp} label="Série actuelle" value={`${stats.currentStreak}j`} color="bg-cyan-500/20 text-cyan-400" />
        </div>

        {/* Top artist & track */}
        {(stats.topArtist || stats.topTrack) && (
          <div className="bg-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Tes favoris</h3>
            {stats.topArtist && (
              <div className="flex items-center gap-4">
                <img
                  src={stats.topArtist.avatarUrl || "/images/default-avatar.png"}
                  alt={stats.topArtist.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <p className="text-xs text-amber-400 font-semibold">Artiste #1</p>
                  <p className="text-lg font-bold text-white">{stats.topArtist.name}</p>
                  <p className="text-xs text-white/40">
                    {stats.topArtist.playCount} écoutes · {stats.topArtist.minutesListened} min
                  </p>
                </div>
              </div>
            )}
            {stats.topTrack && (
              <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Music size={24} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-amber-400 font-semibold">Titre #1</p>
                  <p className="text-lg font-bold text-white">{stats.topTrack.title}</p>
                  <p className="text-xs text-white/40">
                    {stats.topTrack.artistName} · {stats.topTrack.playCount} écoutes
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Genre distribution */}
        {stats.topGenres.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Genres préférés</h3>
            </div>
            <div className="space-y-3">
              {stats.topGenres.slice(0, 6).map((g, i) => (
                <GenreBar key={i} genre={g.genre} percentage={g.percentage} playCount={g.playCount} />
              ))}
            </div>
          </div>
        )}

        {/* Hourly distribution */}
        {stats.hourlyDistribution.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Quand tu écoutes</h3>
            </div>
            <HourlyChart data={stats.hourlyDistribution} />
          </div>
        )}

        {/* Monthly progress */}
        {stats.monthlyProgress.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Évolution mensuelle</h3>
            </div>
            <div className="space-y-2">
              {stats.monthlyProgress.slice(-6).map((m, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-white/60 w-16">{m.month.slice(5)}/{m.month.slice(0, 4)}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                      style={{ width: `${Math.min((m.tracksPlayed / Math.max(...stats.monthlyProgress.map(x => x.tracksPlayed), 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-white/40 w-16 text-right">{m.tracksPlayed} titres</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
