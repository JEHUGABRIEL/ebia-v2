import { useState } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard,
  Users,
  Music2,
  Shield,
  LogOut,
  Menu,
  X as XIcon,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
  Crown,
} from "lucide-react";
import LogoutModal from "../components/LogoutModal";
import EbiaLogo from "../components/EbiaLogo";
import NotificationCenter from "../components/NotificationCenter";

type NavChild = { to: string; label: string };
type NavGroup = { key: string; label: string; icon: typeof Users; to?: string; base?: string; children?: NavChild[] };

const NAV_ITEMS: NavGroup[] = [
  { key: "overview", label: "Tableau de bord", icon: LayoutDashboard, to: "/admin" },
  { key: "stats", label: "Statistiques", icon: TrendingUp, to: "/admin/stats" },
  {
    key: "users", label: "Utilisateurs", icon: Users, base: "/admin/users",
    children: [
      { to: "/admin/users/listener", label: "Auditeurs" },
      { to: "/admin/users/artist", label: "Artistes" },
      { to: "/admin/users/admin", label: "Admins" },
    ],
  },
  {
    key: "subscriptions", label: "Abonnement", icon: Crown, base: "/admin/subscriptions",
    children: [
      { to: "/admin/subscriptions/free", label: "Gratuit" },
      { to: "/admin/subscriptions/pro", label: "Pro" },
    ],
  },
  {
    key: "validations", label: "Validations", icon: CheckCircle2, base: "/admin/validations",
    children: [
      { to: "/admin/validations/artists", label: "Comptes artistes" },
      { to: "/admin/validations/profile", label: "Modifications de profil" },
      { to: "/admin/validations/tracks", label: "Titres" },
    ],
  },
  {
    key: "moderation", label: "Modération", icon: Shield, base: "/admin/moderation",
    children: [
      { to: "/admin/moderation/pending", label: "En attente" },
      { to: "/admin/moderation/resolved", label: "Résolus" },
      { to: "/admin/moderation/dismissed", label: "Rejetés" },
    ],
  },
];

export default function AdminLayout() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [manualExpand, setManualExpand] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const isGroupActive = (item: NavGroup) =>
    item.to ? location.pathname === item.to : !!item.base && location.pathname.startsWith(item.base);

  const isExpanded = (item: NavGroup) =>
    item.key in manualExpand ? manualExpand[item.key] : isGroupActive(item);

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
          const active = isGroupActive(item);
          const expanded = isExpanded(item);
          return (
            <div key={item.key}>
              {item.to ? (
                <Link
                  to={item.to}
                  onClick={() => onNav?.()}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                    background: active ? "rgba(139,92,246,0.12)" : "transparent",
                    border: "none", color: active ? "var(--text)" : "var(--muted)",
                    transition: "all 0.15s", textAlign: "left", textDecoration: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <item.icon size={17} style={{ color: active ? "#8B5CF6" : "inherit", flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>{item.label}</span>
                </Link>
              ) : (
                <button
                  onClick={() => setManualExpand(m => ({ ...m, [item.key]: !expanded }))}
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
                  <span style={{ fontWeight: 600, fontSize: "13px", flex: 1 }}>{item.label}</span>
                  <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
              )}

              {item.children && expanded && (
                <div style={{ display: "flex", flexDirection: "column", marginTop: "2px", marginBottom: "4px" }}>
                  {item.children.map(child => {
                    const childActive = location.pathname === child.to;
                    return (
                      <Link
                        key={child.to}
                        to={child.to}
                        onClick={() => onNav?.()}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "7px 12px 7px 38px", borderRadius: "8px", cursor: "pointer",
                          background: childActive ? "rgba(139,92,246,0.08)" : "transparent",
                          border: "none", color: childActive ? "#8B5CF6" : "var(--muted)",
                          fontSize: "12px", fontWeight: childActive ? 700 : 500,
                          transition: "all 0.15s", textAlign: "left", textDecoration: "none",
                        }}
                        onMouseEnter={e => { if (!childActive) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                        onMouseLeave={e => { if (!childActive) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={() => { navigate("/"); }} style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", background: "transparent", border: "1px solid rgba(240,235,227,0.07)", color: "var(--muted)", transition: "all 0.15s", textAlign: "left", width: "100%" }}
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
          <Outlet />
        </div>
      </main>

      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  );
}
