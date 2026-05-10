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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navLinks = [
    { to: "/explore", label: "Artistes" },
    { to: "/concerts", label: "Concerts" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(13,13,13,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none"
        }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
              <Music2 size={15} className="text-black" />
            </div>
            <span className="bebas text-lg text-white tracking-wider">E-BIA</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="text-sm font-bold uppercase tracking-widest transition-colors"
                style={{ color: location.pathname.startsWith(link.to) ? "#FF6B35" : "#9ca3af" }}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(d => !d)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                    style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
                    {user.displayName?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium hidden sm:block">{user.displayName?.split(" ")[0]}</span>
                  <ChevronDown size={14} className="text-zinc-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden shadow-2xl"
                    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <p className="text-white text-sm font-bold">{user.displayName}</p>
                      <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { navigate(user.role === "artist" || user.role === "admin" ? "/artist-dashboard" : "/me"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-left">
                      <LayoutDashboard size={16} />
                      Mon espace
                    </button>
                    <button onClick={() => { setDropdownOpen(false); setLogoutOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-left">
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors">
                  Connexion
                </Link>
                <Link to="/login"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-black transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
                  S'inscrire
                </Link>
              </div>
            )}
            <button className="md:hidden p-2 text-zinc-400" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden px-4 py-4 flex flex-col gap-3 border-t"
            style={{ background: "rgba(13,13,13,0.98)", borderColor: "rgba(255,255,255,0.08)" }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className="text-zinc-400 font-bold text-sm uppercase tracking-widest py-2">
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-center text-black"
                style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
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
