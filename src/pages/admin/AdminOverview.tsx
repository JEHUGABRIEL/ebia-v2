import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Music2, Play, UserCheck, FileEdit, Shield, Loader2, ChevronRight } from "lucide-react";
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
    { key: "artists", label: "Comptes artistes à valider", count: pending?.artists ?? 0, icon: UserCheck, color: "#8B5CF6", to: "/admin/validations/artists" },
    { key: "profile", label: "Modifications de profil à valider", count: pending?.profileChanges ?? 0, icon: FileEdit, color: "#3B82F6", to: "/admin/validations/profile" },
    { key: "tracks", label: "Titres à valider", count: pending?.tracks ?? 0, icon: Music2, color: "#10B981", to: "/admin/validations/tracks" },
    { key: "moderation", label: "Signalements en attente", count: pending?.moderation ?? 0, icon: Shield, color: "#EF4444", to: "/admin/moderation/pending" },
  ];

  const totalPending = actionCards.reduce((sum, c) => sum + c.count, 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div>
      {/* Header */}
      <div style={{
        position: "relative", overflow: "hidden", borderRadius: "20px", padding: "28px 32px", marginBottom: "28px",
        background: "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(232,96,26,0.08))",
        border: "1px solid rgba(139,92,246,0.18)",
      }}>
        <div style={{ position: "absolute", top: "-40px", right: "-30px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)" }} />
        <div style={{ position: "relative" }}>
          <h1 className="bebas" style={{ fontSize: "38px", color: "var(--text)", lineHeight: 1, marginBottom: "8px" }}>
            {greeting}, {user?.displayName || "Admin"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", textTransform: "capitalize" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={32} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            {kpis.map((card) => (
              <div key={card.label} style={{
                position: "relative", padding: "22px", borderRadius: "16px", background: "var(--bg2)",
                border: "1px solid rgba(240,235,227,0.06)", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: card.color }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>{card.label}</span>
                  <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <card.icon size={16} style={{ color: card.color }} />
                  </div>
                </div>
                <p className="bebas" style={{ fontSize: "32px", color: "var(--text)", lineHeight: 1 }}>{card.value.toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>

          {/* À traiter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>À traiter</h2>
            {totalPending > 0 && (
              <span style={{ padding: "2px 9px", borderRadius: "99px", background: "rgba(232,96,26,0.15)", color: "var(--amber)", fontSize: "11px", fontWeight: 700 }}>
                {totalPending}
              </span>
            )}
          </div>

          {totalPending === 0 ? (
            <div style={{ padding: "36px 20px", borderRadius: "16px", background: "rgba(76,175,130,0.06)", border: "1px solid rgba(76,175,130,0.15)", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#4caf82", fontWeight: 600 }}>Tout est à jour — rien en attente de validation.</p>
            </div>
          ) : (
            <div style={{ borderRadius: "16px", background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.06)", overflow: "hidden" }}>
              {actionCards.filter(c => c.count > 0).map((card, idx, arr) => (
                <button
                  key={card.key}
                  onClick={() => navigate(card.to)}
                  style={{
                    display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", width: "100%",
                    background: "none", border: "none", borderBottom: idx < arr.length - 1 ? "1px solid rgba(240,235,227,0.04)" : "none",
                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                >
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <card.icon size={17} style={{ color: card.color }} />
                  </div>
                  <p style={{ flex: 1, fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>{card.label}</p>
                  <span style={{ padding: "3px 10px", borderRadius: "99px", background: `${card.color}18`, color: card.color, fontSize: "12px", fontWeight: 800 }}>{card.count}</span>
                  <ChevronRight size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
