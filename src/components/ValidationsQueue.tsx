import { useEffect, useState } from "react";
import { UserCheck, FileEdit, Music2, Loader2, Check, X, ExternalLink } from "lucide-react";
import {
  getArtistValidations, approveArtist, rejectArtist,
  getProfileChangeValidations, approveProfileChange, rejectProfileChange,
  getTrackValidations, approveTrack, rejectTrack,
  type ArtistValidation, type ProfileChangeValidation, type TrackValidation,
} from "../lib/api";

type Tab = "artists" | "profile" | "tracks";

const TABS: { key: Tab; label: string; icon: typeof UserCheck }[] = [
  { key: "artists", label: "Comptes artistes", icon: UserCheck },
  { key: "profile", label: "Modifications de profil", icon: FileEdit },
  { key: "tracks", label: "Titres", icon: Music2 },
];

const CHANGE_TYPE_LABELS: Record<string, string> = {
  PASSWORD: "Changement de mot de passe",
  AVATAR: "Nouvelle photo de profil",
  COVER: "Nouvelle bannière",
  ARTIST_PROFILE: "Modification de profil public",
};

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export default function ValidationsQueue() {
  const [tab, setTab] = useState<Tab>("artists");
  const [artists, setArtists] = useState<ArtistValidation[]>([]);
  const [profileChanges, setProfileChanges] = useState<ProfileChangeValidation[]>([]);
  const [tracks, setTracks] = useState<TrackValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true); setLoadError(false);
    try {
      if (tab === "artists") setArtists(await getArtistValidations());
      else if (tab === "profile") setProfileChanges(await getProfileChangeValidations());
      else setTracks(await getTrackValidations());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      if (tab === "artists") await approveArtist(id);
      else if (tab === "profile") await approveProfileChange(id);
      else await approveTrack(id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la validation");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = reasonDrafts[id]?.trim() || undefined;
    setBusyId(id);
    try {
      if (tab === "artists") await rejectArtist(id, reason);
      else if (tab === "profile") await rejectProfileChange(id, reason);
      else await rejectTrack(id, reason);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors du rejet");
    } finally {
      setBusyId(null);
    }
  };

  const currentCount = tab === "artists" ? artists.length : tab === "profile" ? profileChanges.length : tracks.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
        Rien de ce qu'un artiste soumet n'est visible du public tant que ce n'est pas validé ici.
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "9px 16px", borderRadius: "99px", cursor: "pointer",
                border: `1px solid ${active ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
                background: active ? "rgba(139,92,246,0.12)" : "rgba(240,235,227,0.03)",
                color: active ? "#8B5CF6" : "var(--muted)", fontSize: "12px", fontWeight: 700, transition: "all 0.15s",
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ borderRadius: "16px", background: "rgba(240,235,227,0.02)", border: "1px solid var(--border)", minHeight: "160px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "14px" }}>Impossible de charger les demandes en attente.</p>
            <button onClick={load} style={{ padding: "8px 18px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Réessayer
            </button>
          </div>
        ) : currentCount === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <Check size={32} style={{ color: "var(--muted)", opacity: 0.4, marginBottom: "12px" }} />
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>Aucune demande en attente</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tab === "artists" && artists.map((a, idx) => (
              <div key={a.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "18px", borderBottom: idx < artists.length - 1 ? "1px solid rgba(240,235,227,0.04)" : "none", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>{a.stageName || "—"}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>{a.email}</p>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>{a.genre} · {a.city} · inscrit le {fmtDate(a.submittedAt)}</p>
                  {a.documentUrl && (
                    <a href={a.documentUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "8px", fontSize: "12px", color: "var(--amber)", fontWeight: 600, textDecoration: "none" }}>
                      <ExternalLink size={12} /> Voir la pièce d'identité
                    </a>
                  )}
                  <input
                    value={reasonDrafts[a.id] || ""} onChange={e => setReasonDrafts(d => ({ ...d, [a.id]: e.target.value }))}
                    placeholder="Motif de rejet (optionnel)"
                    style={{ marginTop: "10px", width: "100%", maxWidth: "320px", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(240,235,227,0.04)", color: "var(--text)", fontSize: "12px" }}
                  />
                </div>
                <ApproveRejectButtons busy={busyId === a.id} onApprove={() => handleApprove(a.id)} onReject={() => handleReject(a.id)} />
              </div>
            ))}

            {tab === "profile" && profileChanges.map((p, idx) => (
              <div key={p.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "18px", borderBottom: idx < profileChanges.length - 1 ? "1px solid rgba(240,235,227,0.04)" : "none", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>{CHANGE_TYPE_LABELS[p.changeType] || p.changeType}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>{p.displayName || "—"} · {p.email}</p>
                  {p.changeType === "ARTIST_PROFILE" && (
                    <p style={{ fontSize: "12px", color: "var(--text)", marginTop: "6px" }}>
                      {Object.entries(p.payload).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
                    </p>
                  )}
                  {(p.changeType === "AVATAR" || p.changeType === "COVER") && typeof p.payload.url === "string" && (
                    <img src={p.payload.url} alt="" style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover", marginTop: "8px" }} />
                  )}
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>Soumis le {fmtDate(p.createdAt)}</p>
                  <input
                    value={reasonDrafts[p.id] || ""} onChange={e => setReasonDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                    placeholder="Motif de rejet (optionnel)"
                    style={{ marginTop: "10px", width: "100%", maxWidth: "320px", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(240,235,227,0.04)", color: "var(--text)", fontSize: "12px" }}
                  />
                </div>
                <ApproveRejectButtons busy={busyId === p.id} onApprove={() => handleApprove(p.id)} onReject={() => handleReject(p.id)} />
              </div>
            ))}

            {tab === "tracks" && tracks.map((t, idx) => (
              <div key={t.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "18px", borderBottom: idx < tracks.length - 1 ? "1px solid rgba(240,235,227,0.04)" : "none", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>{t.title}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>{t.artistName || "—"} · {t.genre}{t.albumName ? ` · ${t.albumName}` : ""}</p>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Uploadé le {fmtDate(t.createdAt)}</p>
                  {t.streamUrl && (
                    <audio controls src={t.streamUrl} style={{ marginTop: "10px", height: "32px", maxWidth: "320px", width: "100%" }} />
                  )}
                  <input
                    value={reasonDrafts[t.id] || ""} onChange={e => setReasonDrafts(d => ({ ...d, [t.id]: e.target.value }))}
                    placeholder="Motif de rejet (optionnel)"
                    style={{ marginTop: "10px", width: "100%", maxWidth: "320px", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(240,235,227,0.04)", color: "var(--text)", fontSize: "12px" }}
                  />
                </div>
                <ApproveRejectButtons busy={busyId === t.id} onApprove={() => handleApprove(t.id)} onReject={() => handleReject(t.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApproveRejectButtons({ busy, onApprove, onReject }: { busy: boolean; onApprove: () => void; onReject: () => void }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
      <button onClick={onApprove} disabled={busy} title="Valider"
        style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(76,175,130,0.1)", border: "none", color: "#4caf82", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}>
        <Check size={15} />
      </button>
      <button onClick={onReject} disabled={busy} title="Rejeter"
        style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(220,50,50,0.08)", border: "none", color: "#f08080", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}>
        <X size={15} />
      </button>
    </div>
  );
}
