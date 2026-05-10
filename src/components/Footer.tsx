import { Link } from "react-router-dom";
import { Music2 } from "lucide-react";

const links = {
  "Compagnie": [
    { label: "À propos", to: "/about" },
    { label: "Presse", to: "/press" },
    { label: "Investisseurs", to: "/investors" },
  ],
  "Communauté": [
    { label: "Artistes", to: "/explore" },
    { label: "Concerts", to: "/concerts" },
    { label: "Blog", to: "/blog" },
  ],
  "Aide": [
    { label: "Centre d'aide", to: "/help" },
    { label: "Contact", to: "/contact" },
    { label: "Confidentialité", to: "/privacy" },
  ],
  "Légal": [
    { label: "Conditions d'utilisation", to: "/terms" },
    { label: "Politique de confidentialité", to: "/privacy" },
    { label: "Cookies", to: "/cookies" },
  ],
};

const socials = [
  { label: "Instagram", href: "https://instagram.com", icon: "IG" },
  { label: "Twitter", href: "https://twitter.com", icon: "TW" },
  { label: "Facebook", href: "https://facebook.com", icon: "FB" },
  { label: "YouTube", href: "https://youtube.com", icon: "YT" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0D0D0D", borderTop: "1px solid rgba(255,255,255,0.08)" }} className="pb-24">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
                <Music2 size={16} className="text-black" />
              </div>
              <span className="bebas text-lg text-white">E-BIA</span>
            </Link>
            <div className="flex gap-3 mt-4">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="text-zinc-400 text-xs font-bold">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-4">{title}</h3>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-zinc-500 text-sm hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-zinc-600 text-xs">© 2026 E-Bia — République Centrafricaine. Tous droits réservés.</p>
          <div className="flex items-center gap-2">
            <select className="text-xs text-zinc-500 bg-transparent border rounded px-2 py-1 outline-none" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <option>🇫🇷 Français</option>
              <option>🇬🇧 English</option>
              <option>🇸🇦 العربية</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
