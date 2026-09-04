import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2, Eye, ShieldAlert, ShieldX, ShieldCheck, Trash2 } from "lucide-react";
import {
  getAdminUsers, changeUserRole, changeUserSubscription,
  suspendUser, banUser, reactivateUser, deleteUserAccount,
  type AdminUser,
} from "../../lib/api";
import UserDetailsModal from "../../components/UserDetailsModal";
import ConfirmModal from "../../components/ConfirmModal";

const ROLE_LABELS: Record<string, string> = { listener: "Auditeurs", artist: "Artistes", admin: "Admins" };

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Actif", suspended: "Suspendu", banned: "Banni", deleted: "Supprimé",
};
const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "#10B981", suspended: "#F59E0B", banned: "#EF4444", deleted: "var(--muted)",
};

type QuickAction = "suspend" | "ban" | "reactivate" | "delete";

const QUICK_ACTION_COPY: Record<QuickAction, { title: string; message: (name: string) => string; confirmLabel: string; danger: boolean }> = {
  suspend: { title: "Suspendre ce compte", message: (n) => `${n} ne pourra plus se connecter tant que le compte n'est pas réactivé.`, confirmLabel: "Suspendre", danger: false },
  ban: { title: "Bannir ce compte", message: (n) => `${n} sera banni définitivement.`, confirmLabel: "Bannir", danger: true },
  reactivate: { title: "Réactiver ce compte", message: (n) => `${n} pourra de nouveau se connecter.`, confirmLabel: "Réactiver", danger: false },
  delete: { title: "Supprimer ce compte", message: (n) => `${n} ne pourra plus se connecter. Son contenu (titres, messages) est conservé.`, confirmLabel: "Supprimer", danger: true },
};

export default function AdminUsersPage() {
  const { role } = useParams<{ role: string }>();
  const validRole = role && ROLE_LABELS[role] ? role : null;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: QuickAction; user: AdminUser } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!validRole) return;
    setLoading(true);
    setError(false);
    getAdminUsers(page, 20, validRole).then(setUsers).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => { setPage(0); }, [validRole]);
  useEffect(load, [validRole, page]);

  if (!validRole) return <Navigate to="/admin/users/listener" replace />;

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await changeUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error("Failed to change user role:", err);
    }
  };

  const handleChangeSubscription = async (userId: string, plan: "free" | "pro") => {
    try {
      await changeUserSubscription(userId, plan);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, subscription: plan } : u)));
    } catch (err) {
      console.error("Failed to change user subscription:", err);
    }
  };

  const runQuickAction = async () => {
    if (!pendingAction) return;
    setBusy(true);
    try {
      const { type, user } = pendingAction;
      if (type === "suspend") await suspendUser(user.id);
      else if (type === "ban") await banUser(user.id);
      else if (type === "reactivate") await reactivateUser(user.id);
      else await deleteUserAccount(user.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'action");
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  };

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)" }}>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "14px" }}>Impossible de charger les utilisateurs.</p>
          <button onClick={load} style={{ padding: "8px 18px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            Réessayer
          </button>
        </div>
      ) : (
        <div style={{ background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div className="admin-user-row admin-table-header" style={{ padding: "14px 20px", borderBottom: "1px solid rgba(240,235,227,0.06)", fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span>Nom</span>
            <span>Email</span>
            <span>Rôle</span>
            <span>Statut</span>
            <span>Abonnement</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

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
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
                <IconButton title="Détails" color="var(--amber)" onClick={() => setDetailsUserId(u.id)}>
                  <Eye size={14} />
                </IconButton>
                {u.accountStatus === "active" && (
                  <>
                    <IconButton title="Suspendre" color="#F59E0B" onClick={() => setPendingAction({ type: "suspend", user: u })}>
                      <ShieldAlert size={14} />
                    </IconButton>
                    <IconButton title="Bannir" color="#EF4444" onClick={() => setPendingAction({ type: "ban", user: u })}>
                      <ShieldX size={14} />
                    </IconButton>
                  </>
                )}
                {(u.accountStatus === "suspended" || u.accountStatus === "banned") && (
                  <IconButton title="Réactiver" color="#10B981" onClick={() => setPendingAction({ type: "reactivate", user: u })}>
                    <ShieldCheck size={14} />
                  </IconButton>
                )}
                {u.accountStatus !== "deleted" && (
                  <IconButton title="Supprimer" color="#EF4444" onClick={() => setPendingAction({ type: "delete", user: u })}>
                    <Trash2 size={14} />
                  </IconButton>
                )}
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

      {detailsUserId && (
        <UserDetailsModal
          userId={detailsUserId}
          onClose={() => setDetailsUserId(null)}
          onChanged={load}
        />
      )}

      <ConfirmModal
        open={pendingAction !== null}
        title={pendingAction ? QUICK_ACTION_COPY[pendingAction.type].title : ""}
        message={pendingAction ? QUICK_ACTION_COPY[pendingAction.type].message(pendingAction.user.displayName || pendingAction.user.email) : ""}
        confirmLabel={pendingAction ? QUICK_ACTION_COPY[pendingAction.type].confirmLabel : "Confirmer"}
        danger={pendingAction ? QUICK_ACTION_COPY[pendingAction.type].danger : true}
        loading={busy}
        onConfirm={runQuickAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

function IconButton({ title, color, onClick, children }: { title: string; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{ width: "28px", height: "28px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, border: "none", color, cursor: "pointer", transition: "opacity 0.15s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
    >
      {children}
    </button>
  );
}
