import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2, Crown, ArrowLeftRight } from "lucide-react";
import {
  getAdminUsers, changeUserSubscription, getSubscriptionSummary,
  type AdminUser, type SubscriptionSummary,
} from "../../lib/api";
import ConfirmModal from "../../components/ConfirmModal";

const PLAN_LABELS: Record<string, string> = { free: "Gratuit", pro: "Pro" };

export default function AdminSubscriptionsPage() {
  const { plan } = useParams<{ plan: string }>();
  const validPlan = plan === "free" || plan === "pro" ? plan : null;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [pendingSwitch, setPendingSwitch] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!validPlan) return;
    setLoading(true);
    setError(false);
    Promise.all([
      getAdminUsers(page, 20, undefined, validPlan),
      getSubscriptionSummary(),
    ]).then(([u, s]) => { setUsers(u); setSummary(s); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(0); }, [validPlan]);
  useEffect(load, [validPlan, page]);

  if (!validPlan) return <Navigate to="/admin/subscriptions/pro" replace />;

  const otherPlan = validPlan === "pro" ? "free" : "pro";

  const runSwitch = async () => {
    if (!pendingSwitch) return;
    setBusy(true);
    try {
      await changeUserSubscription(pendingSwitch.id, otherPlan);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
      setPendingSwitch(null);
    }
  };

  const proPct = summary && summary.total > 0 ? Math.round((summary.pro / summary.total) * 100) : 0;

  return (
    <div>
      {summary && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "24px" }}>
          <div style={{ flex: "1 1 160px", padding: "18px", borderRadius: "14px", background: "rgba(201,147,10,0.08)", border: "1px solid rgba(201,147,10,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Crown size={15} style={{ color: "var(--gold)" }} />
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>Pro</span>
            </div>
            <p className="bebas" style={{ fontSize: "28px", color: "var(--gold)" }}>{summary.pro.toLocaleString("fr-FR")}</p>
          </div>
          <div style={{ flex: "1 1 160px", padding: "18px", borderRadius: "14px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>Gratuit</span>
            <p className="bebas" style={{ fontSize: "28px", color: "var(--text)" }}>{summary.free.toLocaleString("fr-FR")}</p>
          </div>
          <div style={{ flex: "1 1 160px", padding: "18px", borderRadius: "14px", background: "rgba(240,235,227,0.03)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: "8px" }}>Taux de conversion</span>
            <p className="bebas" style={{ fontSize: "28px", color: "var(--text)" }}>{proPct}%</p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Loader2 size={24} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: "16px", background: "rgba(240,235,227,0.03)", border: "1px solid rgba(240,235,227,0.06)" }}>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "14px" }}>Impossible de charger les abonnements.</p>
          <button onClick={load} style={{ padding: "8px 18px", borderRadius: "99px", border: "1px solid rgba(232,96,26,0.3)", background: "none", color: "var(--amber)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            Réessayer
          </button>
        </div>
      ) : (
        <div style={{ background: "rgba(240,235,227,0.02)", border: "1px solid rgba(240,235,227,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div className="admin-user-row admin-table-header" style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr", padding: "14px 20px", borderBottom: "1px solid rgba(240,235,227,0.06)", fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span>Nom</span>
            <span>Email</span>
            <span>Rôle</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {users.map((u) => (
            <div key={u.id} className="admin-user-row" style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr", padding: "14px 20px", borderBottom: "1px solid rgba(240,235,227,0.03)", alignItems: "center", fontSize: "14px" }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{u.displayName || "—"}</span>
              <span style={{ color: "var(--muted)" }}>{u.email}</span>
              <span style={{ color: "var(--muted)", fontSize: "12px" }}>{u.role}</span>
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => setPendingSwitch(u)}
                  disabled={u.role === "admin"}
                  title={u.role === "admin" ? "Non applicable aux admins" : `Passer en ${PLAN_LABELS[otherPlan]}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px",
                    border: "1px solid rgba(240,235,227,0.1)", background: "none",
                    color: u.role === "admin" ? "rgba(240,235,227,0.2)" : "var(--amber)",
                    fontSize: "11px", fontWeight: 600, cursor: u.role === "admin" ? "not-allowed" : "pointer",
                  }}
                >
                  <ArrowLeftRight size={12} /> {PLAN_LABELS[otherPlan]}
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              Aucun utilisateur {PLAN_LABELS[validPlan].toLowerCase()}
            </div>
          )}
        </div>
      )}

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

      <ConfirmModal
        open={pendingSwitch !== null}
        title={`Passer en ${pendingSwitch ? PLAN_LABELS[otherPlan] : ""}`}
        message={pendingSwitch ? `${pendingSwitch.displayName || pendingSwitch.email} passera de ${PLAN_LABELS[validPlan]} à ${PLAN_LABELS[otherPlan]}.` : ""}
        confirmLabel="Confirmer"
        danger={false}
        loading={busy}
        onConfirm={runSwitch}
        onCancel={() => setPendingSwitch(null)}
      />
    </div>
  );
}
