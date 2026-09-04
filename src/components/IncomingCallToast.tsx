import { Phone, PhoneOff, Video } from "lucide-react";
import { useCall } from "../context/CallContext";

/**
 * Bandeau d'appel entrant, monté globalement dans App.tsx — visible sur
 * n'importe quelle page dès qu'un appel arrive (status "ringing"), avant
 * même que l'utilisateur ait ouvert la conversation.
 */
export default function IncomingCallToast() {
  const { status, type, peer, answerCall, rejectCall } = useCall();

  if (status !== "ringing") return null;

  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 250, width: "min(360px, calc(100vw - 32px))",
      background: "var(--bg2)", border: "1px solid rgba(240,235,227,0.12)",
      borderRadius: 16, padding: "14px 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", gap: 12,
      animation: "fadeUp 0.2s ease both",
    }}>
      {peer?.avatar ? (
        <img src={peer.avatar} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 700 }}>
          {peer?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {peer?.name ?? "Artiste"}
        </p>
        <p style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
          {type === "video" ? <Video size={11} /> : <Phone size={11} />}
          Appel {type === "video" ? "vidéo" : "audio"} entrant…
        </p>
      </div>

      <button onClick={rejectCall} title="Refuser" style={{
        width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
        background: "#f43f5e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <PhoneOff size={16} />
      </button>
      <button onClick={() => void answerCall()} title="Répondre" style={{
        width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
        background: "#4caf82", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Phone size={16} />
      </button>
    </div>
  );
}
