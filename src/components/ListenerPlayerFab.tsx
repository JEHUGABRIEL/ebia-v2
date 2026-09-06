import { Play, Music2 } from "lucide-react";
import { useApp } from "../context/AppContext";

/**
 * Sur le profil auditeur, remplace la bande de lecture du bas (cf. Player.tsx,
 * masquée pour ce rôle) par un bouton flottant unique : play/pause à l'arrêt,
 * disque qui tourne sur lui-même pendant la lecture. Bascule automatiquement
 * avec le rôle de l'utilisateur (ne s'affiche que pour un auditeur).
 */
export default function ListenerPlayerFab() {
  const { user, currentTrack, isPlaying, togglePlay } = useApp();

  if (user?.role !== "listener" || !currentTrack) return null;

  return (
    <>
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Mettre en pause" : "Lecture"}
        title={currentTrack.title}
        style={{
          position: "fixed",
          right: "16px",
          bottom: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "var(--amber)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: "0 8px 28px rgba(232,96,26,0.45)",
          zIndex: 60,
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 10px 32px rgba(232,96,26,0.6)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(232,96,26,0.45)";
        }}
      >
        {isPlaying ? (
          <div style={{
            width: "100%", height: "100%", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: currentTrack.coverUrl ? undefined : "rgba(0,0,0,0.15)",
            animation: "listenerFabSpin 3s linear infinite",
          }}>
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Music2 size={22} />
            )}
          </div>
        ) : (
          <Play size={22} fill="#fff" style={{ marginLeft: "2px" }} />
        )}
      </button>
      <style>{`@keyframes listenerFabSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
