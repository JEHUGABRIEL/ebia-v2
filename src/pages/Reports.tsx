import { useState, useEffect } from "react";
import {
  Flag,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  getReports,
  updateReportStatus,
  type Report,
} from "../lib/api";

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadReports();
  }, [page, statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getReports(page, 20, statusFilter || undefined);
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      await updateReportStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Failed to update report status:", err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: Clock, label: "En attente" };
      case "reviewed":
        return { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: AlertTriangle, label: "Examiné" };
      case "resolved":
        return { color: "#10B981", bg: "rgba(16,185,129,0.1)", icon: CheckCircle, label: "Résolu" };
      case "dismissed":
        return { color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: XCircle, label: "Rejeté" };
      default:
        return { color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: Clock, label: status };
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>
      {/* Header */}
      <section
        style={{
          padding: "120px 24px 40px",
          maxWidth: "1360px",
          margin: "0 auto",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px",
              borderRadius: "99px",
              border: "1px solid rgba(239,68,68,0.3)",
              marginBottom: "20px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#EF4444",
            }}
          >
            <Flag size={12} />
            Modération
          </div>

          <h1
            className="bebas"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "var(--text)",
              lineHeight: 0.92,
              marginBottom: "16px",
            }}
          >
            Signalements
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "var(--muted)",
              maxWidth: "500px",
              lineHeight: 1.7,
            }}
          >
            Gérez les signalements de contenu de la plateforme.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px" }}>
        {/* Status Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {["", "pending", "reviewed", "resolved", "dismissed"].map((status) => {
            const config = getStatusConfig(status || "pending");
            return (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(0); }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "99px",
                  border: `1px solid ${statusFilter === status ? config.color : "rgba(240,235,227,0.1)"}`,
                  background: statusFilter === status ? config.bg : "transparent",
                  color: statusFilter === status ? config.color : "var(--muted)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {status ? config.label : "Tous"}
              </button>
            );
          })}
        </div>

        {/* Reports List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2
              size={32}
              style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Flag size={64} style={{ color: "var(--muted)", opacity: 0.3, marginBottom: "16px" }} />
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              Aucun signalement trouvé
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(240,235,227,0.02)",
              border: "1px solid rgba(240,235,227,0.06)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {reports.map((report) => {
              const statusConfig = getStatusConfig(report.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={report.id}
                  style={{
                    padding: "20px",
                    borderBottom: "1px solid rgba(240,235,227,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "16px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "99px",
                            background: statusConfig.bg,
                            color: statusConfig.color,
                            fontSize: "11px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "99px",
                            background: "rgba(240,235,227,0.05)",
                            color: "var(--muted)",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {report.targetType}
                        </span>
                      </div>

                      <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                        {report.reason}
                      </p>

                      {report.description && (
                        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px", lineHeight: 1.5 }}>
                          {report.description}
                        </p>
                      )}

                      <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                        Signalement ID: {report.id.slice(0, 8)}... •{" "}
                        {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      {report.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(report.id, "resolved")}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: "1px solid rgba(16,185,129,0.3)",
                              background: "rgba(16,185,129,0.1)",
                              color: "#10B981",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Résoudre
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(report.id, "dismissed")}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: "1px solid rgba(107,114,128,0.3)",
                              background: "rgba(107,114,128,0.1)",
                              color: "#6B7280",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                      {report.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, "reviewed")}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid rgba(59,130,246,0.3)",
                            background: "rgba(59,130,246,0.1)",
                            color: "#3B82F6",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Examiner
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: "10px 20px",
              borderRadius: "99px",
              border: "1px solid rgba(240,235,227,0.1)",
              background: "none",
              color: page === 0 ? "rgba(240,235,227,0.2)" : "var(--muted)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: page === 0 ? "not-allowed" : "pointer",
            }}
          >
            Précédent
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: "13px", color: "var(--muted)" }}>
            Page {page + 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={reports.length < 20}
            style={{
              padding: "10px 20px",
              borderRadius: "99px",
              border: "1px solid rgba(240,235,227,0.1)",
              background: "none",
              color: reports.length < 20 ? "rgba(240,235,227,0.2)" : "var(--muted)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: reports.length < 20 ? "not-allowed" : "pointer",
            }}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
