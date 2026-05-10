import { X, Music2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, login, register } = useApp();
  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={e => e.target === e.currentTarget && setShowLoginModal(false)}>
      <div className="rounded-3xl p-8 w-full max-w-sm relative"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={() => setShowLoginModal(false)}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-500 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
            <Music2 size={24} className="text-black" />
          </div>
          <h2 className="bebas text-3xl text-white mb-1">Rejoindre E-Bia</h2>
          <p className="text-zinc-500 text-xs">Connectez-vous pour profiter de toutes les fonctionnalités</p>
        </div>

        <div className="space-y-3">
          <button onClick={login}
            className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-black transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
            Se connecter
          </button>
          <button onClick={() => { setShowLoginModal(false); register("listener"); }}
            className="w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            Créer un compte auditeur
          </button>
          <button onClick={() => { setShowLoginModal(false); register("artist"); }}
            className="w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105"
            style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.3)", color: "#FF6B35" }}>
            Je suis un artiste
          </button>
        </div>
      </div>
    </div>
  );
}
