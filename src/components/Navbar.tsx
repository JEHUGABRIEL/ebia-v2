import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, Music2 } from "lucide-react";
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

  const navLinks = [{ to: "/explore", label: "Artistes" }, { to: "/concerts", label: "Concerts" }];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "rgba(8,8,8,0.93)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(240,235,227,0.07)" : "1px solid transparent",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Music2 size={15} color="#fff" />
            </div>
            <span className="bebas" style={{ fontSize: "18px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
          </Link>

          {/* Nav links — desktop */}
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }} className="hidden md:flex">
            {navLinks.map(link => {
              const active = location.pathname.startsWith(link.to);
              return (
                <Link key={link.to} to={link.to} style={{
                  fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
                  textDecoration: "none", color: active ? "var(--amber)" : "var(--muted)", transition: "color 0.15s",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                >{link.label}</Link>
              );
            })}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {user ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(d => !d)} style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "7px 12px",
                  borderRadius: "99px", cursor: "pointer",
                  background: "rgba(240,235,227,0.06)", border: "1px solid rgba(240,235,227,0.1)", transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.06)"}
                >
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff" }}>
                    {user.displayName?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: "var(--text)", fontSize: "13px", fontWeight: 500 }} className="hidden sm:block">{user.displayName?.split(" ")[0]}</span>
                  <ChevronDown size={12} style={{ color: "var(--muted)" }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)", width: "200px",
                    borderRadius: "14px", overflow: "hidden",
                    background: "var(--bg3)", border: "1px solid var(--border)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                  }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{user.displayName}</p>
                      <p style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                    </div>
                    {[
                      { icon: <LayoutDashboard size={14} />, label: "Mon espace", action: () => { navigate(user.role === "artist" || user.role === "admin" ? "/artist-dashboard" : "/me"); setDropdownOpen(false); } },
                      { icon: <LogOut size={14} />, label: "Déconnexion", action: () => { setDropdownOpen(false); setLogoutOpen(true); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "10px",
                        padding: "11px 16px", fontSize: "13px", color: "var(--muted)",
                        background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "all 0.1s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.04)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                      >{item.icon}{item.label}</button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="hidden md:flex">
                <Link to="/login" style={{
                  padding: "8px 16px", fontSize: "13px", fontWeight: 600,
                  color: "var(--muted)", textDecoration: "none", borderRadius: "99px", transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}
                >Connexion</Link>
                <Link to="/login" style={{
                  padding: "9px 20px", borderRadius: "99px", background: "var(--amber)", color: "#fff",
                  fontSize: "12px", fontWeight: 700, textDecoration: "none", letterSpacing: "0.04em",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,96,26,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >S'inscrire</Link>
              </div>
            )}

            <button style={{ padding: "8px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }} className="md:hidden" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ padding: "16px 24px 20px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border)", background: "rgba(8,8,8,0.98)" }} className="md:hidden">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} style={{ color: "var(--muted)", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", padding: "10px 0" }}>{link.label}</Link>
            ))}
            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)} style={{ marginTop: "8px", padding: "14px", borderRadius: "12px", background: "var(--amber)", color: "#fff", fontWeight: 700, fontSize: "13px", textAlign: "center", textDecoration: "none" }}>
                Connexion / S'inscrire
              </Link>
            )}
          </div>
        )}
      </nav>
      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
