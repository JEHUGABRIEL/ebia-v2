import { useEffect, useState } from "react";
import { getArtistAnalytics, type ArtistAnalytics } from "../lib/api";
import { Loader2, Globe, Users, Clock, TrendingDown, MapPin, BarChart3 } from "lucide-react";

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-16 truncate">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
      </div>
      <span className="text-xs text-white/40 w-10 text-right">{value}</span>
    </div>
  );
}

function StatBlock({ icon: Icon, title, children }: { icon: typeof Globe; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function RetentionChart({ data }: { data: { second: number; retentionPercentage: number }[] }) {
  if (data.length === 0) return <p className="text-white/40 text-sm text-center py-4">Pas de données</p>;
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((point, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500"
            style={{ height: `${Math.max(point.retentionPercentage, 2)}%` }}
            title={`${point.second}s — ${point.retentionPercentage.toFixed(1)}%`}
          />
          {i % 3 === 0 && (
            <span className="text-[9px] text-white/30">{point.second}s</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function EnhancedStats() {
  const [analytics, setAnalytics] = useState<ArtistAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getArtistAnalytics("year");
      setAnalytics(data);
    } catch {
      // Stats not available
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-white/40 text-sm">
        Analytics non disponibles
      </div>
    );
  }

  const maxCity = Math.max(...(analytics.topCities?.map(c => c.listeners) || [1]), 1);
  const maxHour = Math.max(...(analytics.peakHours?.map(h => h.plays) || [1]), 1);

  return (
    <div className="space-y-4">
      {/* Demographics */}
      {analytics.demographics && (
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Auditeurs</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{analytics.demographics.totalListeners}</p>
              <p className="text-xs text-white/40">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{analytics.demographics.returningListeners}</p>
              <p className="text-xs text-white/40">Retours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{analytics.demographics.newListeners}</p>
              <p className="text-xs text-white/40">Nouveaux</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{analytics.demographics.retentionRate}%</p>
              <p className="text-xs text-white/40">Rétention</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Geography */}
        {analytics.geography && (
          <StatBlock icon={Globe} title="Géographie">
            <p className="text-white/80 text-sm mb-3">
              📍 {analytics.geography.topCity}, {analytics.geography.topCountry}
            </p>
            <div className="space-y-2">
              {analytics.geography.countries?.slice(0, 5).map((c, i) => (
                <MiniBar key={i} label={c.country} value={c.listeners} max={analytics.geography!.countries[0]?.listeners || 1} color="var(--amber)" />
              ))}
            </div>
          </StatBlock>
        )}

        {/* Top Cities */}
        {analytics.topCities && analytics.topCities.length > 0 && (
          <StatBlock icon={MapPin} title="Villes">
            <div className="space-y-2">
              {analytics.topCities.slice(0, 5).map((c, i) => (
                <MiniBar key={i} label={c.city} value={c.listeners} max={maxCity} color="#4caf82" />
              ))}
            </div>
          </StatBlock>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Peak Hours */}
        {analytics.peakHours && analytics.peakHours.length > 0 && (
          <StatBlock icon={Clock} title="Heures de pointe">
            <div className="flex items-end gap-1 h-20">
              {analytics.peakHours.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
                    style={{ height: `${Math.max((h.plays / maxHour) * 100, 2)}%` }}
                    title={`${h.hour}h — ${h.plays} écoutes`}
                  />
                  {i % 4 === 0 && (
                    <span className="text-[9px] text-white/30 mt-1">{h.hour}h</span>
                  )}
                </div>
              ))}
            </div>
          </StatBlock>
        )}

        {/* Retention Curve */}
        {analytics.retentionCurve && analytics.retentionCurve.length > 0 && (
          <StatBlock icon={TrendingDown} title="Rétention d'écoute">
            <RetentionChart data={analytics.retentionCurve} />
          </StatBlock>
        )}
      </div>

      {/* Skip Rates */}
      {analytics.skipRates && analytics.skipRates.length > 0 && (
        <StatBlock icon={BarChart3} title="Taux de complétion par titre">
          <div className="space-y-3">
            {analytics.skipRates.slice(0, 8).map((s, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white/80 truncate">{s.trackTitle}</span>
                  <span className="text-xs text-white/40">{s.completionRate}% complété</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${s.completionRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </StatBlock>
      )}

      {/* Listener Retention */}
      {analytics.retention && (
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Rétention des auditeurs</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "7 jours", value: analytics.retention.day7 },
              { label: "30 jours", value: analytics.retention.day30 },
              { label: "90 jours", value: analytics.retention.day90 },
            ].map(r => (
              <div key={r.label} className="text-center">
                <p className="text-2xl font-bold text-white">{r.value.toFixed(1)}%</p>
                <p className="text-xs text-white/40">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
