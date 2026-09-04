import { useState, useEffect } from "react";
import {
  Users,
  Music2,
  Play,
  Heart,
  Shield,
  Loader2,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react";
import {
  getAdminStats,
  getAdminUsers,
  toggleUserActive,
  changeUserRole,
  type AdminStats,
  type AdminUser,
} from "../lib/api";
import ModerationQueue from "../components/ModerationQueue";

type AdminSection = "stats" | "users" | "moderation";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [section, setSection] = useState<AdminSection>("stats");

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await getAdminUsers(page, 20, roleFilter || undefined);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      await toggleUserActive(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
      );
    } catch (err) {
      console.error("Failed to toggle user active:", err);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await changeUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Failed to change user role:", err);
    }
  };

  const statCards = stats
    ? [
        { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "#3B82F6" },
        { label: "Artistes", value: stats.totalArtists, icon: Music2, color: "#8B5CF6" },
        { label: "Titres", value: stats.totalTracks, icon: Music2, color: "#10B981" },
        { label: "Écoutes", value: stats.totalPlays, icon: Play, color: "#F59E0B" },
        { label: "Likes", value: stats.totalLikes, icon: Heart, color: "#EF4444" },
        { label: "Nouveaux aujourd'hui", value: stats.newUsersToday, icon: TrendingUp, color: "#06B6D4" },
        { label: "Nouveaux cette semaine", value: stats.newUsersThisWeek, icon: Calendar, color: "#EC4899" },
        { label: "Actifs aujourd'hui", value: stats.activeUsersToday, icon: Activity, color: "#22C55E" },
      ]
    : [];

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
              border: "1px solid rgba(139,92,246,0.3)",
              marginBottom: "20px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#8B5CF6",
            }}
          >
            <Shield size={12} />
            Administration
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
            Dashboard Admin
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "var(--muted)",
              maxWidth: "500px",
              lineHeight: 1.7,
            }}
          >
            Gérez les utilisateurs et surveillez l'activité de la plateforme.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>
        {/* Navigation tabs */}
        <div className="admin-tabs" style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          {([
            { key: "stats" as AdminSection, label: "Statistiques", icon: TrendingUp },
            { key: "users" as AdminSection, label: "Utilisateurs", icon: Users },
            { key: "moderation" as AdminSection, label: "Modération", icon: Shield },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSection(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 18px", borderRadius: "99px",
                background: section === tab.key ? "var(--amber)" : "rgba(240,235,227,0.05)",
                color: section === tab.key ? "#fff" : "var(--muted)",
                border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Section */}
        {section === "stats" && (
        <>
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
          ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "48px",
            }}
          >
            {statCards.map((card) => (
              <div
                key={card.label}
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  background: "rgba(240,235,227,0.03)",
                  border: "1px solid rgba(240,235,227,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: `${card.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <card.icon size={18} style={{ color: card.color }} />
                  </div>
                  <span
                    style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}
                  >
                    {card.label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {card.value.toLocaleString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {/* Users Section */}
        {section === "users" && (
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>
              Utilisateurs
            </h2>

            <div style={{ display: "flex", gap: "8px" }}>
              {["", "listener", "artist", "admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => { setRoleFilter(role); setPage(0); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "99px",
                    border: "1px solid rgba(240,235,227,0.1)",
                    background: roleFilter === role ? "var(--amber)" : "transparent",
                    color: roleFilter === role ? "#fff" : "var(--muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {role || "Tous"}
                </button>
              ))}
            </div>
          </div>

          {usersLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Loader2
                size={24}
                style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }}
              />
            </div>
          ) : (
            <div
              style={{
                background: "rgba(240,235,227,0.02)",
                border: "1px solid rgba(240,235,227,0.06)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {/* Table Header */}
              <div
                className="admin-user-row admin-table-header"
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid rgba(240,235,227,0.06)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <span>Nom</span>
                <span>Email</span>
                <span>Rôle</span>
                <span>Statut</span>
                <span style={{ textAlign: "right" }}>Actions</span>
              </div>

              {/* Users */}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="admin-user-row"
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid rgba(240,235,227,0.03)",
                    alignItems: "center",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>
                    {user.displayName || "—"}
                  </span>
                  <span style={{ color: "var(--muted)" }}>{user.email}</span>
                  <span>
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(240,235,227,0.1)",
                        background: "rgba(240,235,227,0.05)",
                        color: "var(--text)",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      <option value="listener">listener</option>
                      <option value="artist">artist</option>
                      <option value="admin">admin</option>
                    </select>
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: user.active ? "#10B981" : "#EF4444",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: user.active ? "#10B981" : "#EF4444",
                      }}
                    />
                    {user.active ? "Actif" : "Inactif"}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(240,235,227,0.1)",
                        background: "none",
                        color: user.active ? "#EF4444" : "#10B981",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {user.active ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  Aucun utilisateur trouvé
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: "10px 20px",
                borderRadius: "99px",
                border: "1px solid rgba(240,235,227,0.1)",
                background: "none",
                color: page === 0 ? "rgba(240,235,227,0.2)" : "var(--muted)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: page === 0 ? "not-allowed" : "pointer",
              }}
            >
              Précédent
            </button>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "13px",
                color: "var(--muted)",
              }}
            >
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < 20}
              style={{
                padding: "10px 20px",
                borderRadius: "99px",
                border: "1px solid rgba(240,235,227,0.1)",
                background: "none",
                color: users.length < 20 ? "rgba(240,235,227,0.2)" : "var(--muted)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: users.length < 20 ? "not-allowed" : "pointer",
              }}
            >
              Suivant
            </button>
          </div>
        </div>
        )}

        {/* Moderation Section */}
        {section === "moderation" && (
          <div style={{ maxWidth: "800px" }}>
            <ModerationQueue />
          </div>
        )}
      </div>
    </div>
  );
}
