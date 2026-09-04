import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open, title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler",
  danger = true, loading = false, onConfirm, onCancel,
}: Props) {
  if (!open) return null;
  const accent = danger ? "#EF4444" : "var(--amber)";

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
      style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div style={{ width: "100%", maxWidth: "400px", borderRadius: "18px", background: "var(--bg2)", border: `1px solid ${accent}33`, boxShadow: "0 32px 80px rgba(0,0,0,0.6)", padding: "28px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <AlertTriangle size={20} style={{ color: accent }} />
        </div>
        <h2 className="bebas" style={{ fontSize: "22px", color: "var(--text)", lineHeight: 1.1, marginBottom: "8px" }}>{title}</h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "24px" }}>{message}</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: accent, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "..." : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
