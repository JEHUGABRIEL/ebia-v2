import { Link } from "react-router-dom";
import EbiaLogo from "./EbiaLogo";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

function useFooterLinks() {
  const { t } = useTranslation();
  return {
    [t("footer.company")]: [{ label: t("footer.about"), to: "/about" }, { label: t("footer.press"), to: "/press" }, { label: t("footer.investors"), to: "/investors" }],
    [t("footer.community")]: [{ label: t("nav.artists"), to: "/explore" }, { label: t("nav.concerts"), to: "/concerts" }, { label: t("footer.blog"), to: "/blog" }],
    [t("footer.help")]: [{ label: t("footer.helpCenter"), to: "/help" }, { label: t("footer.contact"), to: "/contact" }, { label: t("footer.privacy"), to: "/privacy" }],
    [t("footer.legal")]: [{ label: t("footer.terms"), to: "/terms" }, { label: t("footer.privateLife"), to: "/privacy" }, { label: t("footer.cookies"), to: "/cookies" }],
  };
}

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg> },
  { label: "X / Twitter", href: "https://x.com",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25z"/></svg> },
  { label: "Facebook", href: "https://www.fb.com/l/6lp1kJRRR",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}><path d="M9.6 21.6V13.2H7.2V9.6h2.4V7.2C9.6 4.56 11.184 3 13.584 3c1.056 0 2.16.084 3.216.252v2.88h-1.8c-1.152 0-1.44.552-1.44 1.368V9.6H16.8l-.48 3.6H13.56V21.6H9.6Z"/></svg> },
  { label: "YouTube", href: "https://youtube.com",
    svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.5 20.45 12 20.45 12 20.45s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg> },
];

export default function Footer() {
  const { t } = useTranslation();
  const LINKS = useFooterLinks();
  return (
    <footer style={{ background: "var(--bg)", borderTop: "1px solid rgba(240,235,227,0.07)" }} className="pb-24">
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "64px 48px 0" }}>

        {/* Main grid */}
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: "48px", marginBottom: "64px", alignItems: "start" }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "16px" }}>
              <EbiaLogo size={36} />
              <span className="bebas" style={{ fontSize: "20px", color: "var(--text)", letterSpacing: "0.1em" }}>E-BIA</span>
            </Link>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7, maxWidth: "240px", marginBottom: "24px" }}>
              {t("footer.description")}
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  style={{
                    width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(240,235,227,0.05)", border: "1px solid rgba(240,235,227,0.1)",
                    color: "var(--muted)", textDecoration: "none", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(232,96,26,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,96,26,0.3)"; (e.currentTarget as HTMLElement).style.color = "var(--amber)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(240,235,227,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,235,227,0.1)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                >{s.svg}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h3 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text)", marginBottom: "18px" }}>{title}</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                {items.map(item => (
                  <li key={item.label}>
                    <Link to={item.to} style={{ fontSize: "13px", color: "var(--muted)", textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}
                    >{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(240,235,227,0.07)", padding: "24px 0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontSize: "12px", color: "var(--muted)" }}>
            © 2026 <span style={{ color: "var(--amber)", fontWeight: 600 }}>E-Bia</span> — {t("footer.copyright")}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
