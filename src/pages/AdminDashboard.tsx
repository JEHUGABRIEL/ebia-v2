import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
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
  LogOut,
  Menu,
  X as XIcon,
  CheckCircle2,
} from "lucide-react";
import {
  getAdminStats,
  getAdminUsers,
  changeUserRole,
  changeUserSubscription,
  type AdminStats,
  type AdminUser,
} from "../lib/api";
import ModerationQueue, { type ModerationFilter } from "../components/ModerationQueue";
import ValidationsQueue, { type ValidationTab } from "../components/ValidationsQueue";
import LogoutModal from "../components/LogoutModal";
import EbiaLogo from "../components/EbiaLogo";
import NotificationCenter from "../components/NotificationCenter";
import UserDetailsModal from "../components/UserDetailsModal";

type AdminSection = "stats" | "users" | "validations" | "moderation";

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  suspended: "Suspendu",
  banned: "Banni",
  deleted: "Supprimé",
};

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  suspended: "#F59E0B",
  banned: "#EF4444",
  deleted: "var(--muted)",
};

const USER_ROLE_CHILDREN: { key: string; label: string }[] = [
  { key: "", label: "Tous" },
  { key: "listener", label: "Auditeurs" },
  { key: "artist", label: "Artistes" },
  { key: "admin", label: "Admins" },
];

const VALIDATION_CHILDREN: { key: ValidationTab; label: string }[] = [
  { key: "artists", label: "Comptes artistes" },
  { key: "profile", label: "Modifications de profil" },
  { key: "tracks", label: "Titres" },
];

const MODERATION_CHILDREN: { key: ModerationFilter; label: string }[] = [
  { key: "pending", label: "En attente" },
  { key: "resolved", label: "Résolus" },
  { key: "dismissed", label: "Rejetés" },
];

const NAV_ITEMS: { key: AdminSection; label: string; icon: typeof Users; children?: { key: string; label: string }[] }[] = [
  { key: "stats", label: "Statistiques", icon: TrendingUp },
  { key: "users", label: "Utilisateurs", icon: Users, children: USER_ROLE_CHILDREN },
  { key: "validations", label: "Validations", icon: CheckCircle2, children: VALIDATION_CHILDREN },
  { key: "moderation", label: "Modération", icon: Shield, children: MODERATION_CHILDREN },
];

export default function AdminDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [section, setSection] = useState<AdminSection>("stats");
  const [validationTab, setValidationTab] = useState<ValidationTab>("artists");
  const [moderationFilter, setModerationFilter] = useState<ModerationFilter>("pending");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);

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
      setUsersError(false);
      const data = await getAdminUsers(page, 20, roleFilter || undefined);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsersError(true);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]);

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

  const handleChangeSubscription = async (userId: string, plan: "free" | "pro") => {
    try {
      await changeUserSubscription(userId, plan);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, subscription: plan } : u))
      );
    } catch (err) {
      console.error("Failed to change user subscription:", err);
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

  if (!user) return null;

  const selectChild = (parentKey: AdminSection, childKey: string) => {
    setSection(parentKey);
    if (parentKey === "users") { setRoleFilter(childKey); setPage(0); }
    else if (parentKey === "validations") setValidationTab(childKey as ValidationTab);
    else if (parentKey === "moderation") setModerationFilter(childKey as ModerationFilter);
  };

  const activeChildKey = (parentKey: AdminSection): string =>
    parentKey === "users" ? roleFilter : parentKey === "validations" ? validationTab : moderationFilter;

  const currentNavItem = NAV_ITEMS.find(n => n.key === section);
  const currentChildLabel = currentNavItem?.children?.find(c => c.key === activeChildKey(section))?.label;

  const sidebarContent = (onNav?: () => void) => (
    <>
      <div style={{ padding: "16px 12px 8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={14} color="white" />
        </div>
        <div>
          <span className="bebas" style={{ fontSize: "15px", color: "var(--text)", letterSpacing: "0.1em", display: "block", lineHeight: 1 }}>E-BIA</span>
          <span style={{ fontSize: "9px", color: "#8B5CF6", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Administration</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <NotificationCenter />
        </div>
      </div>

      <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "8px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
        {NAV_ITEMS.map(item => {
          const active = section === item.key;
          return (
            <div key={item.key}>
              <button
                onClick={() => { setSection(item.key); onNav?.(); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                  background: active ? "rgba(139,92,246,0.12)" : "transparent",
                  border: "none", color: active ? "var(--text)" : "var(--muted)",
                  transition: "all 0.15s", textAlign: "left",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <item.icon size={17} style={{ color: active ? "#8B5CF6" : "inherit", flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: "13px" }}>{item.label}</span>
              </button>

              {/* Sous-liens : uniquement pour la section active */}
              {active && item.children && (
                <div style={{ display: "flex", flexDirection: "column", marginTop: "2px", marginBottom: "4px" }}>
                  {item.children.map(child => {
                    const childActive = activeChildKey(item.key) === child.key;
                    return (
                      <button
                        key={child.key || "all"}
                        onClick={() => { selectChild(item.key, child.key); onNav?.(); }}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "7px 12px 7px 38px", borderRadius: "8px", cursor: "pointer",
                          background: childActive ? "rgba(139,92,246,0.08)" : "transparent",
                          border: "none", color: childActive ? "#8B5CF6" : "var(--muted)",
                          fontSize: "12px", fontWeight: childActive ? 700 : 500,
                          transition: "all 0.15s", textAlign: "left",
                        }}
                        onMouseEnter={e => { if (!childActive) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                        onMouseLeave={e => { if (!childActive) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={() => { navigate("/"); onNav?.(); }} style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", background: "transparent", border: "1px solid rgba(240,235,227,0.07)", color: "var(--muted)", transition: "all 0.15s", textAlign: "left", width: "100%" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(76,175,130,0.35)"; (e.currentTarget as HTMLElement).style.color = "#4caf82"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
          <Music2 size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12px", fontWeight: 600 }}>Retour à E-BIA</span>
        </button>

        {/* Profil bas */}
        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff" }}>
              {user.displayName?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName}</p>
              <p style={{ fontSize: "10px", color: "#8B5CF6", fontWeight: 600 }}>Administrateur</p>
            </div>
            <button onClick={() => setLogoutOpen(true)} title="Se déconnecter" style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", borderRadius: "6px", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.background = "none"; }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>

      {/* ── SIDEBAR desktop ── */}
      <aside className="sidebar-dashboard" style={{ flexDirection: "column", gap: "8px", padding: "8px", background: "#000", overflow: "hidden" }}>
        {sidebarContent()}
      </aside>

      {/* ── DRAWER mobile ── */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      )}
      <div style={{ position: "fixed", top: 0, left: mobileMenuOpen ? 0 : "-260px", width: "260px", height: "100vh", zIndex: 91, background: "#000", display: "flex", flexDirection: "column", gap: "8px", padding: "8px", transition: "left 0.25s ease", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 4px 0" }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}>
            <XIcon size={20} />
          </button>
        </div>
        {sidebarContent(() => setMobileMenuOpen(false))}
      </div>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
        {/* Barre mobile top avec hamburger */}
        <div className="sidebar-dashboard-mobile-bar" style={{ alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#000", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", padding: "4px", display: "flex" }}>
            <Menu size={22} />
          </button>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <EbiaLogo size={22} />
            <span className="bebas" style={{ fontSize: "14px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <NotificationCenter />
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {user.displayName?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="dashboard-main" style={{ padding: "36px 40px", maxWidth: "1360px", margin: "0 auto" }}>
          <h1 className="bebas" style={{ fontSize: "36px", color: "var(--text)", lineHeight: 1, marginBottom: "28px" }}>
            {currentNavItem?.label}
            {currentChildLabel && <span style={{ color: "var(--muted)" }}> — {currentChildLabel}</span>}
          </h1>

          {/* Stats Section */}
          {section === "stats" && (
            <>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                  <Loader2 size={32} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
                </div>
              ) : !stats ? (
                <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)" }}>
                  <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "14px" }}>
                    Impossible de charger les statistiques.
                  </p>
                  <button
                    onClick={loadStats}
                    style={{ padding: "8px 18px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                  {statCards.map((card) => (
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
              )}
            </>
          )}

          {/* Users Section */}
          {section === "users" && (
            <div>
              {usersLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
                </div>
              ) : usersError ? (
                <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)" }}>
                  <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "14px" }}>
                    Impossible de charger les utilisateurs.
                  </p>
                  <button
                    onClick={loadUsers}
                    style={{ padding: "8px 18px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <div style={{ background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.06)", borderRadius: "16px", overflow: "hidden" }}>
                  {/* Table Header */}
                  <div className="admin-user-row admin-table-header" style={{ padding: "14px 20px", borderBottom: "1px solid rgba(240,235,227,0.06)", fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <span>Nom</span>
                    <span>Email</span>
                    <span>Rôle</span>
                    <span>Statut</span>
                    <span>Abonnement</span>
                    <span style={{ textAlign: "right" }}>Actions</span>
                  </div>

                  {/* Users */}
                  {users.map((u) => (
                    <div key={u.id} className="admin-user-row" style={{ padding: "14px 20px", borderBottom: "1px solid rgba(240,235,227,0.03)", alignItems: "center", fontSize: "14px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{u.displayName || "—"}</span>
                      <span style={{ color: "var(--muted)" }}>{u.email}</span>
                      <span>
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(240,235,227,0.1)", background: "rgba(240,235,227,0.05)", color: "var(--text)", fontSize: "12px", cursor: "pointer" }}
                        >
                          <option value="listener">listener</option>
                          <option value="artist">artist</option>
                          <option value="admin">admin</option>
                        </select>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: ACCOUNT_STATUS_COLORS[u.accountStatus] || "var(--muted)" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ACCOUNT_STATUS_COLORS[u.accountStatus] || "var(--muted)" }} />
                        {ACCOUNT_STATUS_LABELS[u.accountStatus] || u.accountStatus}
                      </span>
                      <span>
                        {u.role === "admin" ? (
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>—</span>
                        ) : (
                          <select
                            value={u.subscription || "free"}
                            onChange={(e) => handleChangeSubscription(u.id, e.target.value as "free" | "pro")}
                            style={{
                              padding: "6px 10px", borderRadius: "8px",
                              border: `1px solid ${u.subscription === "pro" ? "rgba(201,147,10,0.35)" : "rgba(240,235,227,0.1)"}`,
                              background: u.subscription === "pro" ? "rgba(201,147,10,0.1)" : "rgba(240,235,227,0.05)",
                              color: u.subscription === "pro" ? "var(--gold)" : "var(--text)",
                              fontSize: "12px", fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            <option value="free">free</option>
                            <option value="pro">pro</option>
                          </select>
                        )}
                      </span>
                      <div style={{ textAlign: "right" }}>
                        <button
                          onClick={() => setDetailsUserId(u.id)}
                          style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(240,235,227,0.1)", background: "none", color: "var(--amber)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                        >
                          Détails
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
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{ padding: "10px 20px", borderRadius: "99px", border: "1px solid rgba(240,235,227,0.1)", background: "none", color: page === 0 ? "rgba(240,235,227,0.2)" : "var(--muted)", fontSize: "13px", fontWeight: 600, cursor: page === 0 ? "not-allowed" : "pointer" }}
                >
                  Précédent
                </button>
                <span style={{ display: "flex", alignItems: "center", fontSize: "13px", color: "var(--muted)" }}>
                  Page {page + 1}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={users.length < 20}
                  style={{ padding: "10px 20px", borderRadius: "99px", border: "1px solid rgba(240,235,227,0.1)", background: "none", color: users.length < 20 ? "rgba(240,235,227,0.2)" : "var(--muted)", fontSize: "13px", fontWeight: 600, cursor: users.length < 20 ? "not-allowed" : "pointer" }}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Validations Section */}
          {section === "validations" && (
            <div style={{ maxWidth: "900px" }}>
              <ValidationsQueue tab={validationTab} />
            </div>
          )}

          {/* Moderation Section */}
          {section === "moderation" && (
            <div style={{ maxWidth: "800px" }}>
              <ModerationQueue filter={moderationFilter} />
            </div>
          )}
        </div>
      </main>

      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />

      {detailsUserId && (
        <UserDetailsModal
          userId={detailsUserId}
          onClose={() => setDetailsUserId(null)}
          onChanged={loadUsers}
        />
      )}
    </div>
  );
}
