import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Music2, Play, UserCheck, FileEdit, Shield, Loader2, ArrowRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  getAdminStats,
  getArtistValidations,
  getProfileChangeValidations,
  getTrackValidations,
  getModerationStats,
  type AdminStats,
} from "../../lib/api";

type PendingCounts = {
  artists: number;
  profileChanges: number;
  tracks: number;
  moderation: number;
};

export default function AdminOverview() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<PendingCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getAdminStats().catch(() => null),
      getArtistValidations().catch(() => []),
      getProfileChangeValidations().catch(() => []),
      getTrackValidations().catch(() => []),
      getModerationStats().catch(() => ({ pending: 0, resolved: 0, dismissed: 0 })),
    ]).then(([s, artists, profiles, tracks, mod]) => {
      if (!alive) return;
      setStats(s);
      setPending({ artists: artists.length, profileChanges: profiles.length, tracks: tracks.length, moderation: mod.pending });
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const kpis = stats ? [
    { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "#3B82F6" },
    { label: "Artistes", value: stats.totalArtists, icon: Music2, color: "#8B5CF6" },
    { label: "Titres", value: stats.totalTracks, icon: Music2, color: "#10B981" },
    { label: "Écoutes", value: stats.totalPlays, icon: Play, color: "#F59E0B" },
  ] : [];

  const actionCards = [
    { key: "artists", label: "Comptes artistes à valider", count: pending?.artists ?? 0, icon: UserCheck, to: "/admin/validations/artists" },
    { key: "profile", label: "Modifications de profil à valider", count: pending?.profileChanges ?? 0, icon: FileEdit, to: "/admin/validations/profile" },
    { key: "tracks", label: "Titres à valider", count: pending?.tracks ?? 0, icon: Music2, to: "/admin/validations/tracks" },
    { key: "moderation", label: "Signalements en attente", count: pending?.moderation ?? 0, icon: Shield, to: "/admin/moderation/pending" },
  ];

  const totalPending = actionCards.reduce((sum, c) => sum + c.count, 0);

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1, marginBottom: "8px" }}>
          Bonjour, {user?.displayName || "Admin"}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted)" }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={32} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            {kpis.map((card) => (
              <div key={card.label} style={{ padding: "20px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${card.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <card.icon size={18} style={{ color: card.color }} />
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>{card.label}</span>
                </div>
                <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>{card.value.toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>

          {/* À traiter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>À traiter</h2>
            {totalPending > 0 && (
              <span style={{ padding: "2px 8px", borderRadius: "99px", background: "rgba(232,96,26,0.15)", color: "var(--amber)", fontSize: "11px", fontWeight: 700 }}>
                {totalPending}
              </span>
            )}
          </div>

          {totalPending === 0 ? (
            <div style={{ padding: "32px 20px", borderRadius: "16px", background: "rgba(76,175,130,0.06)", border: "1px solid rgba(76,175,130,0.15)", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#4caf82", fontWeight: 600 }}>Tout est à jour — rien en attente de validation.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
              {actionCards.filter(c => c.count > 0).map((card) => (
                <button
                  key={card.key}
                  onClick={() => navigate(card.to)}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px", padding: "18px",
                    borderRadius: "14px", background: "rgba(232,96,26,0.06)", border: "1px solid rgba(232,96,26,0.2)",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.1)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.06)"}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(232,96,26,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <card.icon size={19} style={{ color: "var(--amber)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{card.count}</p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>{card.label}</p>
                  </div>
                  <ArrowRight size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
