import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff, AlertCircle, X } from "lucide-react";
import { useCall } from "../context/CallContext";

/**
 * Écran d'appel plein écran (audio ou vidéo). Monté globalement dans App.tsx
 * — visible dès qu'un appel est en cours ("calling" ou "connected"), quelle
 * que soit la page active. Affiche aussi un toast d'erreur (micro/caméra
 * indisponible) même quand aucun appel n'est en cours, puisque l'échec peut
 * survenir avant que le statut ne redevienne "idle".
 */
export default function CallScreen() {
  const { status, type, peer, localStream, remoteStream, micEnabled, camEnabled, callError, clearCallError, hangUp, toggleMic, toggleCam } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (type === "video" && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (type === "audio" && remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream, type]);

  useEffect(() => {
    if (!callError) return;
    const t = setTimeout(clearCallError, 6000);
    return () => clearTimeout(t);
  }, [callError, clearCallError]);

  if (status !== "calling" && status !== "connected") {
    if (!callError) return null;
    return (
      <div style={{
        position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300,
        display: "flex", alignItems: "center", gap: 10, maxWidth: "90vw",
        padding: "12px 16px", borderRadius: 12, background: "#1a1210",
        border: "1px solid rgba(244,63,94,0.35)", color: "#fff", boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
      }}>
        <AlertCircle size={16} style={{ color: "#f43f5e", flexShrink: 0 }} />
        <span style={{ fontSize: 13 }}>{callError}</span>
        <button onClick={clearCallError} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>
    );
  }

  const isVideo = type === "video";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "#0a0a0a", display: "flex", flexDirection: "column",
    }}>
      {/* Flux distant (vidéo) ou audio caché */}
      {isVideo ? (
        <video ref={remoteVideoRef} autoPlay playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#000" }} />
      ) : (
        <audio ref={remoteAudioRef} autoPlay />
      )}

      {/* En-tête : identité + statut */}
      <div style={{
        position: "relative", zIndex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", padding: "48px 24px 24px", color: "#fff",
        textShadow: isVideo ? "0 2px 12px rgba(0,0,0,0.6)" : "none",
      }}>
        {peer?.avatar ? (
          <img src={peer.avatar} alt="" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", marginBottom: 16, border: "2px solid rgba(255,255,255,0.2)" }} />
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 32, fontWeight: 700 }}>
            {peer?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{peer?.name ?? "Artiste"}</p>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          {status === "calling" ? "Appel en cours…" : isVideo ? "Appel vidéo" : "Appel audio"}
        </p>
      </div>

      {/* Incrustation locale (PiP) — vidéo uniquement */}
      {isVideo && (
        <video ref={localVideoRef} autoPlay playsInline muted
          style={{
            position: "absolute", top: 16, right: 16, width: 110, height: 150,
            borderRadius: 12, objectFit: "cover", background: "#111",
            border: "1px solid rgba(255,255,255,0.2)", zIndex: 2,
            transform: "scaleX(-1)", // effet miroir, plus naturel pour l'utilisateur
          }} />
      )}

      {/* Barre de contrôles */}
      <div style={{
        position: "relative", zIndex: 1, marginTop: "auto",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 20, padding: "32px 24px 48px",
      }}>
        <button onClick={toggleMic} title={micEnabled ? "Couper le micro" : "Réactiver le micro"} style={ctrlBtnStyle(!micEnabled)}>
          {micEnabled ? <Mic size={22} /> : <MicOff size={22} />}
        </button>

        {isVideo && (
          <button onClick={toggleCam} title={camEnabled ? "Couper la caméra" : "Réactiver la caméra"} style={ctrlBtnStyle(!camEnabled)}>
            {camEnabled ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        )}

        <button onClick={hangUp} title="Raccrocher" style={{
          width: 64, height: 64, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "#f43f5e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 28px rgba(244,63,94,0.5)",
        }}>
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
}

const ctrlBtnStyle = (active: boolean): React.CSSProperties => ({
  width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
  background: active ? "#fff" : "rgba(255,255,255,0.12)",
  color: active ? "#0a0a0a" : "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.15s, color 0.15s",
});
