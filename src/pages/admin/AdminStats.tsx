import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getAdminStats, type AdminStats } from "../../lib/api";

const MUTED = "#6B6560";
const TEXT = "#F0EBE3";
const GRID = "rgba(240,235,227,0.08)";

function ChartCard({ title, children, height = 260 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div style={{ padding: "20px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>{title}</h3>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px" }}>
      {label && <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: "12px", color: "var(--text)", fontWeight: 700 }}>{p.name}: {p.value.toLocaleString("fr-FR")}</p>
      ))}
    </div>
  );
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    getAdminStats().then(setStats).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <Loader2 size={32} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)" }}>
        <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "14px" }}>Impossible de charger les statistiques.</p>
        <button onClick={load} style={{ padding: "8px 18px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
          Réessayer
        </button>
      </div>
    );
  }

  const totals = [
    { name: "Utilisateurs", value: stats.totalUsers, fill: "#3B82F6" },
    { name: "Artistes", value: stats.totalArtists, fill: "#8B5CF6" },
    { name: "Titres", value: stats.totalTracks, fill: "#10B981" },
    { name: "Écoutes", value: stats.totalPlays, fill: "#F59E0B" },
    { name: "Likes", value: stats.totalLikes, fill: "#EF4444" },
  ];

  const growth = [
    { name: "Aujourd'hui", value: stats.newUsersToday },
    { name: "Cette semaine", value: stats.newUsersThisWeek },
  ];

  const otherUsers = Math.max(0, stats.totalUsers - stats.totalArtists);
  const distribution = [
    { name: "Artistes", value: stats.totalArtists, fill: "#8B5CF6" },
    { name: "Autres (auditeurs, admins)", value: otherUsers, fill: "#3B82F6" },
  ];

  const engagementPct = stats.totalUsers > 0 ? Math.round((stats.activeUsersToday / stats.totalUsers) * 1000) / 10 : 0;

  return (
    <div>
      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "24px" }}>
        Instantané au {new Date(stats.computedAt).toLocaleString("fr-FR")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        <ChartCard title="Vue d'ensemble">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totals} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(240,235,227,0.04)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {totals.map((t, i) => <Cell key={i} fill={t.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Répartition des comptes">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {distribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "8px" }}>
            {distribution.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.fill }} />
                {d.name}
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Nouvelles inscriptions" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growth} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: TEXT, fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(240,235,227,0.04)" }} />
              <Bar dataKey="value" fill="#06B6D4" radius={[0, 6, 6, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Engagement du jour" height={220}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px" }}>
            <p className="bebas" style={{ fontSize: "48px", color: "#22C55E", lineHeight: 1 }}>{engagementPct}%</p>
            <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
              {stats.activeUsersToday.toLocaleString("fr-FR")} actif{stats.activeUsersToday !== 1 ? "s" : ""} aujourd'hui sur {stats.totalUsers.toLocaleString("fr-FR")} utilisateurs
            </p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
