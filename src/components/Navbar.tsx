import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, Radio, Mic } from "lucide-react";
import EbiaLogo from "./EbiaLogo";
import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import LogoutModal from "./LogoutModal";

export default function Navbar() {
  const { user } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fermer le menu mobile au changement de route
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: "/explore", label: "Artistes" },
    { to: "/concerts", label: "Concerts" },
    { to: "/radio", label: "Radios", icon: Radio },
    { to: "/recognize", label: "Identifier", icon: Mic },
  ];

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "rgba(8,8,8,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(240,235,227,0.07)" : "1px solid transparent",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
            <EbiaLogo size={30} />
            <span className="bebas" style={{ fontSize: "17px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
          </Link>

          {/* Nav links — desktop uniquement */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="nav-desktop">
            {navLinks.map(link => {
              const active = isActive(link.to);
              const Icon = link.icon;
              return (
                <Link key={link.to} to={link.to} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 600,
                  textDecoration: "none",
                  color: active ? "var(--amber)" : "var(--muted)",
                  background: active ? "rgba(232,96,26,0.08)" : "transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"; }}}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}}
                >
                  {Icon && <Icon size={14} />}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {user ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(d => !d)} style={{
                  display: "flex", alignItems: "center", gap: "7px", padding: "6px 10px",
                  borderRadius: "99px", cursor: "pointer",
                  background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.1)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"}
                >
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff" }}>
                    {user.displayName?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: "var(--text)", fontSize: "13px", fontWeight: 500 }} className="hidden sm:block">
                    {user.displayName?.split(" ")[0]}
                  </span>
                  <ChevronDown size={12} style={{ color: "var(--muted)" }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)", width: "190px",
                    borderRadius: "12px", overflow: "hidden",
                    background: "var(--bg3)", border: "1px solid var(--border)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                  }}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>{user.displayName}</p>
                      <p style={{ fontSize: "10px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                    </div>
                    <button onClick={() => { navigate(user.role === "artist" || user.role === "admin" ? "/artist-dashboard" : "/me"); setDropdownOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", fontSize: "12px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "all 0.1s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                    ><LayoutDashboard size={13} /> Mon espace</button>
                    <button onClick={() => { setDropdownOpen(false); setLogoutOpen(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", fontSize: "12px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "all 0.1s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                    ><LogOut size={13} /> Déconnexion</button>
                  </div>
                )}
              </div>
            ) : (
              /* Boutons desktop uniquement */
              <div style={{ display: "flex", gap: "4px" }} className="nav-desktop">
                <Link to="/login" style={{ padding: "7px 14px", fontSize: "13px", fontWeight: 600, color: "var(--muted)", textDecoration: "none", borderRadius: "99px", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}
                >Connexion</Link>
                <Link to="/login" state={{ tab: "register" }} style={{ padding: "7px 18px", borderRadius: "99px", background: "var(--amber)", color: "#fff", fontSize: "12px", fontWeight: 700, textDecoration: "none", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(232,96,26,0.4)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
                >S'inscrire</Link>
              </div>
            )}

            {/* Burger mobile uniquement */}
            <button
  className="nav-mobile-btn"
              style={{ padding: "6px", color: "var(--muted)", background: "rgba(240,235,227,0.06)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer" }}
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu — remplace tout le nav sur mobile */}
        {mobileOpen && (
          <div className="nav-mobile-menu" style={{ borderTop: "1px solid var(--border)", background: "rgba(8,8,8,0.98)" }}>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {navLinks.map(link => {
                const active = isActive(link.to);
                const Icon = link.icon;
                return (
                  <Link key={link.to} to={link.to} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "11px 14px", borderRadius: "10px",
                    color: active ? "var(--amber)" : "var(--muted)",
                    background: active ? "rgba(232,96,26,0.08)" : "transparent",
                    fontWeight: 600, fontSize: "14px", textDecoration: "none",
                  }}>
                    {Icon ? <Icon size={16} /> : null}
                    {link.label}
                  </Link>
                );
              })}

              <div style={{ borderTop: "1px solid var(--border)", marginTop: "8px", paddingTop: "8px" }}>
                {user ? (
                  <>
                    <button onClick={() => navigate(user.role === "artist" || user.role === "admin" ? "/artist-dashboard" : "/me")}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontWeight: 600, fontSize: "14px", textAlign: "left" }}>
                      <LayoutDashboard size={16} /> Mon espace
                    </button>
                    <button onClick={() => setLogoutOpen(true)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "#f08080", fontWeight: 600, fontSize: "14px", textAlign: "left" }}>
                      <LogOut size={16} /> Déconnexion
                    </button>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link to="/login" style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(240,235,227,0.05)", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 600, fontSize: "14px", textDecoration: "none", textAlign: "center" }}>
                      Connexion
                    </Link>
                    <Link to="/login" state={{ tab: "register" }} style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--amber)", color: "#fff", fontWeight: 700, fontSize: "14px", textDecoration: "none", textAlign: "center" }}>
                      S'inscrire
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
