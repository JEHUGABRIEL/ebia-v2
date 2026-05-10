import { useApp } from "../context/AppContext";
import { LogOut, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LogoutModal({ open, onClose }: Props) {
  const { logout } = useApp();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.15)" }}>
              <LogOut size={18} style={{ color: "#FF6B35" }} />
            </div>
            <h2 className="bebas text-2xl text-white tracking-wider">Déconnexion</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: "#9ca3af" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Vous êtes sur le point de vous déconnecter de votre compte E-Bia. 
            Vous devrez vous reconnecter pour accéder à votre espace.
          </p>

          <div className="flex flex-col gap-3">
            <button onClick={() => { logout(); onClose(); }}
              className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-black transition-all hover:scale-[1.02] hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
              Oui, me déconnecter
            </button>
            <button onClick={onClose}
              className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
