import { useEffect, useState } from "react";
import { X, ShieldAlert, ShieldX, ShieldCheck, Trash2, Loader2, ExternalLink } from "lucide-react";
import {
  getAdminUserDetails, suspendUser, banUser, reactivateUser, deleteUserAccount,
  type AdminUserDetails,
} from "../lib/api";

type Props = { userId: string; onClose: () => void; onChanged: () => void };

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Actif", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  suspended: { label: "Suspendu", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  banned: { label: "Banni", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  deleted: { label: "Supprimé", color: "var(--muted)", bg: "rgba(240,235,227,0.06)" },
};

type PendingAction = "suspend" | "ban" | "delete";

const ACTION_COPY: Record<PendingAction, { title: string; confirmLabel: string; needsReason: boolean; danger: boolean }> = {
  suspend: { title: "Suspendre ce compte", confirmLabel: "Suspendre", needsReason: true, danger: false },
  ban: { title: "Bannir ce compte", confirmLabel: "Bannir définitivement", needsReason: true, danger: true },
  delete: { title: "Supprimer ce compte", confirmLabel: "Supprimer", needsReason: false, danger: true },
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export default function UserDetailsModal({ userId, onClose, onChanged }: Props) {
  const [details, setDetails] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true); setLoadError(false);
    getAdminUserDetails(userId).then(setDetails).catch(() => setLoadError(true)).finally(() => setLoading(false));
  };

  useEffect(load, [userId]);

  const runAction = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      setPendingAction(null);
      setReason("");
      load();
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'action");
    } finally {
      setBusy(false);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction === "suspend") runAction(() => suspendUser(userId, reason || undefined));
    else if (pendingAction === "ban") runAction(() => banUser(userId, reason || undefined));
    else if (pendingAction === "delete") runAction(() => deleteUserAccount(userId));
  };

  const status = details ? (STATUS_STYLE[details.accountStatus] ?? STATUS_STYLE.active) : null;

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto", borderRadius: "18px", background: "var(--bg2)", border: "1px solid var(--border)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <h2 className="bebas" style={{ fontSize: "20px", color: "var(--text)", lineHeight: 1 }}>Détails utilisateur</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "22px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : loadError || !details ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "12px" }}>Impossible de charger les détails.</p>
              <button onClick={load} style={{ padding: "8px 16px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Réessayer</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#fff" }}>
                  {details.artist?.avatarUrl ? <img src={details.artist.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : details.displayName?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{details.displayName || "—"}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>{details.email}</p>
                </div>
                {status && (
                  <span style={{ padding: "5px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, color: status.color, background: status.bg }}>{status.label}</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                <InfoRow label="Rôle" value={details.role} />
                <InfoRow label="Abonnement" value={details.subscription} />
                <InfoRow label="Téléphone" value={details.phone || "—"} />
                <InfoRow label="Inscrit le" value={fmtDate(details.createdAt)} />
                {details.role === "artist" && <InfoRow label="Vérification" value={details.verificationStatus} />}
                {details.pendingProfileChanges > 0 && <InfoRow label="Modifs. en attente" value={String(details.pendingProfileChanges)} />}
              </div>

              {details.statusReason && (
                <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(240,235,227,0.04)", border: "1px solid var(--border)", marginBottom: "18px" }}>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>Motif ({fmtDate(details.statusChangedAt)})</p>
                  <p style={{ fontSize: "12px", color: "var(--text)" }}>{details.statusReason}</p>
                </div>
              )}

              {details.artist && (
                <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)", marginBottom: "18px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{details.artist.stageName}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>{details.artist.genre} · {details.artist.city}</p>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--muted)" }}>
                    <span>{details.artist.tracksCount} titres</span>
                    <span>{details.artist.followersCount} abonnés</span>
                    <span>{details.artist.playsCount} écoutes</span>
                  </div>
                  {details.identityDocument && (
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "10px" }}>
                      Pièce d'identité : {details.identityDocument.status}
                      {details.identityDocument.rejectionReason ? ` (${details.identityDocument.rejectionReason})` : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {!pendingAction ? (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {details.accountStatus === "active" && (
                    <>
                      <ActionButton icon={ShieldAlert} label="Suspendre" color="#F59E0B" onClick={() => setPendingAction("suspend")} />
                      <ActionButton icon={ShieldX} label="Bannir" color="#EF4444" onClick={() => setPendingAction("ban")} />
                    </>
                  )}
                  {(details.accountStatus === "suspended" || details.accountStatus === "banned") && (
                    <ActionButton icon={ShieldCheck} label="Réactiver" color="#10B981" onClick={() => runAction(() => reactivateUser(userId))} disabled={busy} />
                  )}
                  {details.accountStatus !== "deleted" && (
                    <ActionButton icon={Trash2} label="Supprimer" color="#EF4444" onClick={() => setPendingAction("delete")} />
                  )}
                  {details.role === "artist" && (
                    <a href={`/artist/${details.id}`} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>
                      <ExternalLink size={12} /> Voir le profil public
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: "14px", borderRadius: "12px", border: `1px solid ${ACTION_COPY[pendingAction].danger ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`, background: ACTION_COPY[pendingAction].danger ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{ACTION_COPY[pendingAction].title}</p>
                  {ACTION_COPY[pendingAction].needsReason && (
                    <textarea
                      value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="Motif (optionnel, visible par l'utilisateur)"
                      rows={2}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(240,235,227,0.04)", color: "var(--text)", fontSize: "12px", resize: "none", marginBottom: "10px", boxSizing: "border-box" }}
                    />
                  )}
                  {pendingAction === "delete" && (
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "10px" }}>
                      Le compte ne pourra plus se connecter. Son contenu (titres, messages) est conservé.
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={confirmPendingAction} disabled={busy} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: ACTION_COPY[pendingAction].danger ? "#EF4444" : "#F59E0B", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
                      {busy ? "..." : ACTION_COPY[pendingAction].confirmLabel}
                    </button>
                    <button onClick={() => { setPendingAction(null); setReason(""); }} disabled={busy} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>{label}</p>
      <p style={{ fontSize: "13px", color: "var(--text)" }}>{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick, disabled }: { icon: typeof ShieldAlert; label: string; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: `1px solid ${color}55`, background: `${color}15`, color, fontSize: "12px", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
      <Icon size={13} /> {label}
    </button>
  );
}
