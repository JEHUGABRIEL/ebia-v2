import { useEffect, useState } from "react";
import { X, ShieldAlert, ShieldX, ShieldCheck, Trash2, Loader2, ExternalLink, Phone, Calendar, CreditCard, BadgeCheck, AlertTriangle } from "lucide-react";
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
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: "560px", maxHeight: "88vh", overflowY: "auto", borderRadius: "20px", background: "var(--bg2)", border: "1px solid var(--border)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : loadError || !details ? (
          <div style={{ textAlign: "center", padding: "60px 30px" }}>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "12px" }}>Impossible de charger les détails.</p>
            <button onClick={load} style={{ padding: "8px 16px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Réessayer</button>
          </div>
        ) : (
          <>
            {/* Bannière d'identité */}
            <div style={{
              position: "relative", padding: "24px", borderRadius: "20px 20px 0 0", overflow: "hidden",
              background: details.artist?.coverUrl
                ? `linear-gradient(180deg, rgba(8,8,8,0.35), var(--bg2) 92%), url(${details.artist.coverUrl}) center/cover`
                : "linear-gradient(135deg, rgba(139,92,246,0.16), rgba(232,96,26,0.08))",
            }}>
              <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(0,0,0,0.35)", border: "none", color: "#fff", cursor: "pointer", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <X size={16} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "#fff", border: "2px solid rgba(255,255,255,0.15)" }}>
                  {details.artist?.avatarUrl ? <img src={details.artist.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : details.displayName?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "17px", fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{details.displayName || "—"}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>{details.email}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                {status && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 11px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, color: status.color, background: status.bg }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: status.color }} /> {status.label}
                  </span>
                )}
                <span style={{ padding: "4px 11px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, color: "var(--text)", background: "rgba(240,235,227,0.08)", textTransform: "capitalize" }}>
                  {details.role}
                </span>
                {details.subscription === "pro" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 11px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, color: "var(--gold)", background: "rgba(201,147,10,0.15)" }}>
                    <BadgeCheck size={11} /> Pro
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: "22px" }}>
              {/* Infos clés */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "18px" }}>
                <InfoRow icon={Phone} label="Téléphone" value={details.phone || "—"} />
                <InfoRow icon={Calendar} label="Inscrit le" value={fmtDate(details.createdAt)} />
                <InfoRow icon={CreditCard} label="Abonnement" value={details.subscription === "pro" ? "Pro" : "Gratuit"} />
                {details.role === "artist" && <InfoRow icon={BadgeCheck} label="Vérification" value={details.verificationStatus} />}
              </div>

              {details.pendingProfileChanges > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", background: "rgba(232,96,26,0.08)", border: "1px solid rgba(232,96,26,0.2)", marginBottom: "16px" }}>
                  <AlertTriangle size={14} style={{ color: "var(--amber)", flexShrink: 0 }} />
                  <p style={{ fontSize: "12px", color: "var(--amber)", fontWeight: 600 }}>
                    {details.pendingProfileChanges} modification{details.pendingProfileChanges > 1 ? "s" : ""} de profil en attente de validation
                  </p>
                </div>
              )}

              {details.statusReason && (
                <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(240,235,227,0.04)", border: "1px solid var(--border)", marginBottom: "16px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "4px" }}>Motif ({fmtDate(details.statusChangedAt)})</p>
                  <p style={{ fontSize: "12px", color: "var(--text)" }}>{details.statusReason}</p>
                </div>
              )}

              {details.artist && (
                <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{details.artist.stageName}</p>
                    <a href={`/artist/${details.id}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#8B5CF6", textDecoration: "none", fontWeight: 600 }}>
                      Profil public <ExternalLink size={11} />
                    </a>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>{details.artist.genre} · {details.artist.city}</p>
                  <div style={{ display: "flex", gap: "18px" }}>
                    <StatMini label="Titres" value={details.artist.tracksCount} />
                    <StatMini label="Abonnés" value={details.artist.followersCount} />
                    <StatMini label="Écoutes" value={details.artist.playsCount} />
                  </div>
                  {details.identityDocument && (
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(139,92,246,0.12)" }}>
                      Pièce d'identité : <strong style={{ color: "var(--text)" }}>{details.identityDocument.status}</strong>
                      {details.identityDocument.rejectionReason ? ` — ${details.identityDocument.rejectionReason}` : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {!pendingAction ? (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "10px" }}>Actions</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {(details.accountStatus === "suspended" || details.accountStatus === "banned") && (
                      <ActionButton icon={ShieldCheck} label="Réactiver" color="#10B981" onClick={() => runAction(() => reactivateUser(userId))} disabled={busy} />
                    )}
                    {details.accountStatus === "active" && (
                      <ActionButton icon={ShieldAlert} label="Suspendre" color="#F59E0B" onClick={() => setPendingAction("suspend")} />
                    )}
                    {details.accountStatus === "active" && (
                      <ActionButton icon={ShieldX} label="Bannir" color="#EF4444" onClick={() => setPendingAction("ban")} />
                    )}
                    {details.accountStatus !== "deleted" && (
                      <ActionButton icon={Trash2} label="Supprimer" color="#EF4444" onClick={() => setPendingAction("delete")} />
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "16px", borderRadius: "14px", border: `1px solid ${ACTION_COPY[pendingAction].danger ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`, background: ACTION_COPY[pendingAction].danger ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "10px" }}>{ACTION_COPY[pendingAction].title}</p>
                  {ACTION_COPY[pendingAction].needsReason && (
                    <textarea
                      value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="Motif (optionnel, visible par l'utilisateur)"
                      rows={2}
                      style={{ width: "100%", padding: "9px 11px", borderRadius: "9px", border: "1px solid var(--border)", background: "rgba(240,235,227,0.04)", color: "var(--text)", fontSize: "12px", resize: "none", marginBottom: "12px", boxSizing: "border-box" }}
                    />
                  )}
                  {pendingAction === "delete" && (
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
                      Le compte ne pourra plus se connecter. Son contenu (titres, messages) est conservé.
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={confirmPendingAction} disabled={busy} style={{ padding: "9px 18px", borderRadius: "9px", border: "none", background: ACTION_COPY[pendingAction].danger ? "#EF4444" : "#F59E0B", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
                      {busy ? "..." : ACTION_COPY[pendingAction].confirmLabel}
                    </button>
                    <button onClick={() => { setPendingAction(null); setReason(""); }} disabled={busy} style={{ padding: "9px 18px", borderRadius: "9px", border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
        <Icon size={11} style={{ color: "var(--muted)" }} />
        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</p>
      </div>
      <p style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600, textTransform: "capitalize" }}>{value}</p>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{value.toLocaleString("fr-FR")}</p>
      <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{label}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick, disabled }: { icon: typeof ShieldAlert; label: string; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 15px", borderRadius: "10px", border: `1px solid ${color}45`, background: `${color}15`, color, fontSize: "12px", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
      <Icon size={13} /> {label}
    </button>
  );
}
