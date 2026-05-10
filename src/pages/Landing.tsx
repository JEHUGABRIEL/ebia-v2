import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ArrowRight, Zap, Globe, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const { user } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Hero */}
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden" style={{ paddingTop: "80px" }}>
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse"
            style={{ background: "radial-gradient(circle, #FF6B35, transparent)", top: "10%", left: "5%" }} />
          <div className="absolute w-80 h-80 rounded-full opacity-15 animate-pulse"
            style={{ background: "radial-gradient(circle, #7B2FBE, transparent)", top: "30%", right: "5%", animationDelay: "1s" }} />
          <div className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse"
            style={{ background: "radial-gradient(circle, #00D46A, transparent)", bottom: "20%", left: "30%", animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 text-xs font-bold uppercase tracking-widest"
            style={{ borderColor: "rgba(255,107,53,0.4)", color: "#FF6B35", background: "rgba(255,107,53,0.1)" }}>
            <Zap size={12} fill="#FF6B35" />
            La Pulsation Musicale de la RCA
          </div>

          <h1 className="bebas text-7xl md:text-[10rem] leading-none mb-6">
            <span className="block text-white">Propulser</span>
            <span className="block gradient-text">la musique</span>
            <span className="block text-white">centrafricaine</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
            Découvrez, écoutez et soutenez les artistes qui définissent le son de la République Centrafricaine.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link to="/explore"
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
              Découvrir les artistes <ArrowRight size={16} />
            </Link>
            {!user && (
              <button onClick={() => navigate("/login")}
                className="px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 border"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff", background: "rgba(255,255,255,0.05)" }}>
                Rejoindre E-Bia
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {[
              { value: "19", label: "Artistes", color: "#FF6B35" },
              { value: "54", label: "Titres", color: "#FFD700" },
              { value: "RCA", label: "Origine", color: "#00D46A" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="bebas text-4xl" style={{ color: s.color }}>{s.value}</div>
                <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-zinc-600 flex items-start justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-zinc-400" />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4" style={{ padding: "80px 16px 120px" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Music, title: "Écoute libre", desc: "Profitez de toute la musique centrafricaine sans restriction. Pas de compte requis.", color: "#FF6B35" },
            { icon: Globe, title: "Artistes locaux", desc: "Soutenez directement les artistes de la RCA en les suivant et en partageant leur musique.", color: "#7B2FBE" },
            { icon: Zap, title: "Qualité audio", desc: "Streaming haute qualité pour une expérience d'écoute optimale.", color: "#00D46A" },
          ].map(f => (
            <div key={f.title} className="rounded-3xl p-8 border card-hover"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}20` }}>
                <f.icon size={24} style={{ color: f.color }} />
              </div>
              <h3 className="bebas text-2xl text-white mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
