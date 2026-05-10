import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Home, Search, Library, Heart, Users, Settings, Plus, Play, ChevronRight, Music2, LogOut } from "lucide-react";
import LogoutModal from "../components/LogoutModal";

type Section = "accueil" | "recherche" | "bibliotheque" | "favoris" | "suivis" | "parametres";

const MOCK_RECENT = [
  { id: "1", title: "On va se marier", artist: "Idylle Mamba", genre: "Afro-Folk", color: "#FF6B35", avatar: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=80" },
  { id: "2", title: "Bande de Bangui", artist: "Cool Fawa", genre: "Hip-Hop", color: "#7B2FBE", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80" },
  { id: "3", title: "Mawa", artist: "Ley Kartel", genre: "Afro-Pop", color: "#00D46A", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80" },
  { id: "4", title: "Kondogbia", artist: "Mansdou", genre: "Afro-Trap", color: "#FFD700", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80" },
  { id: "5", title: "Calm Down", artist: "Ley Kartel", genre: "Pop", color: "#FF6B35", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80" },
  { id: "6", title: "One Africa", artist: "Cool Fawa", genre: "Afro-Beat", color: "#7B2FBE", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80" },
];

const MOCK_ARTISTS = [
  { id: "1", name: "Idylle Mamba", genre: "Afro-Folk", slug: "idylle-mamba", avatar: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=200" },
  { id: "2", name: "Cool Fawa", genre: "Hip-Hop", slug: "cool-fawa", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" },
  { id: "3", name: "Ley Kartel", genre: "Afro-Pop", slug: "ley-kartel", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200" },
  { id: "4", name: "KT Pop", genre: "Pop", slug: "kt-pop", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200" },
  { id: "5", name: "Mansdou", genre: "Afro-Trap", slug: "mansdou", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
];

const MOCK_FAVORITES = [
  { id: "1", title: "One Africa", artist: "Cool Fawa", duration: "4:20", color: "#7B2FBE" },
  { id: "2", title: "Faro Faro", artist: "Idylle Mamba", duration: "3:55", color: "#FF6B35" },
  { id: "3", title: "Regal", artist: "Mansdou", duration: "3:30", color: "#FFD700" },
  { id: "4", title: "Mawa", artist: "Ley Kartel", duration: "4:10", color: "#00D46A" },
];

export default function ListenerDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("accueil");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (!user) return null;

  const sidebarLinks = [
    { id: "accueil" as Section, icon: Home, label: "Accueil" },
    { id: "recherche" as Section, icon: Search, label: "Rechercher" },
    { id: "bibliotheque" as Section, icon: Library, label: "Bibliothèque" },
  ];

  const playlistLinks = [
    { id: "favoris" as Section, icon: Heart, label: "Titres favoris", color: "#00D46A" },
    { id: "suivis" as Section, icon: Users, label: "Artistes suivis", color: "#7B2FBE" },
    { id: "parametres" as Section, icon: Settings, label: "Paramètres", color: "#9ca3af" },
  ];

  const sidebarStyle = {
    background: "#000",
    width: "240px",
    minWidth: "240px",
  };

return (
    <div className="flex" style={{ height: "calc(100vh - 64px)", marginTop: "64px", background: "#0D0D0D" }}>

      {/* ── SIDEBAR ── */}
      <div className="hidden md:flex flex-col gap-2 p-2 overflow-y-auto" style={sidebarStyle}>
        {/* Nav principale */}
        <div className="rounded-xl p-4" style={{ background: "#121212" }}>
          {sidebarLinks.map(link => (
            <button key={link.id} onClick={() => setSection(link.id)}
              className="w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all text-left"
              style={{ color: section === link.id ? "#fff" : "#9ca3af" }}>
              <link.icon size={22} style={{ color: section === link.id ? "#FF6B35" : "inherit" }} />
              <span className="font-bold text-sm">{link.label}</span>
            </button>
          ))}
        </div>

        {/* Bibliothèque */}
        <div className="rounded-xl p-4 flex-1" style={{ background: "#121212" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-400 font-bold text-sm flex items-center gap-2">
              <Library size={18} /> Ma bibliothèque
            </span>
            <button className="text-zinc-400 hover:text-white transition-colors p-1">
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-1">
            {playlistLinks.map(link => (
              <button key={link.id} onClick={() => setSection(link.id)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all text-left hover:bg-white/5"
                style={{ color: section === link.id ? "#fff" : "#9ca3af" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${link.color}25` }}>
                  <link.icon size={16} style={{ color: link.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{link.label}</p>
                  <p className="text-xs text-zinc-600">Playlist</p>
                </div>
              </button>
            ))}
          </div>

          {/* Profil en bas */}
          <div className="mt-auto pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
                {user.displayName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">{user.displayName}</p>
                <p className="text-zinc-600 text-xs truncate">{user.email}</p>
              </div>
              <button onClick={() => setLogoutOpen(true)} className="text-zinc-600 hover:text-white transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="flex-1 overflow-y-auto" style={{ background: "linear-gradient(180deg, #1a0a00 0%, #0D0D0D 300px)" }}>
        <div className="p-6 max-w-5xl">

          {/* ── ACCUEIL ── */}
          {section === "accueil" && (
            <div className="space-y-8">
              <div>
                <h1 className="bebas text-4xl text-white mb-1">
                  {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"}, {user.displayName?.split(" ")[0]} 👋
                </h1>
                <p className="text-zinc-500 text-sm">Que voulez-vous écouter aujourd'hui ?</p>
              </div>

              {/* Écoutes récentes — grille 3x2 */}
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MOCK_RECENT.map(track => (
                    <button key={track.id}
                      className="flex items-center gap-3 rounded-lg overflow-hidden text-left transition-all group hover:bg-white/10"
                      style={{ background: "rgba(255,255,255,0.08)" }}>
                      <img src={track.avatar} alt={track.title}
                        className="w-14 h-14 object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-white text-sm font-bold truncate">{track.title}</p>
                        <p className="text-zinc-500 text-xs truncate">{track.artist}</p>
                      </div>
                      <div className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: "#FF6B35" }}>
                          <Play size={14} className="text-black ml-0.5" fill="black" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Artistes populaires */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="bebas text-2xl text-white">Artistes populaires</h2>
                  <button onClick={() => navigate("/explore")}
                    className="text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                    Tout afficher
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {MOCK_ARTISTS.map(artist => (
                    <button key={artist.id} onClick={() => navigate(`/artist/${artist.slug}`)}
                      className="p-4 rounded-xl text-left transition-all hover:bg-white/5 group">
                      <div className="relative mb-4">
                        <img src={artist.avatar} alt={artist.name}
                          className="w-full aspect-square rounded-full object-cover" />
                        <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                          style={{ background: "#FF6B35" }}>
                          <Play size={16} className="text-black ml-0.5" fill="black" />
                        </div>
                      </div>
                      <p className="text-white font-bold text-sm truncate">{artist.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{artist.genre}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nouveautés E-Bia */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="bebas text-2xl text-white">Nouveautés E-Bia</h2>
                  <button className="text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                    Tout afficher
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {MOCK_RECENT.slice(0, 4).map(track => (
                    <button key={track.id}
                      className="p-4 rounded-xl text-left transition-all hover:bg-white/5 group"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="relative mb-3">
                        <img src={track.avatar} alt={track.title}
                          className="w-full aspect-square rounded-lg object-cover" />
                        <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                          style={{ background: "#FF6B35" }}>
                          <Play size={16} className="text-black ml-0.5" fill="black" />
                        </div>
                      </div>
                      <p className="text-white font-bold text-sm truncate">{track.title}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{track.artist}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── RECHERCHE ── */}
          {section === "recherche" && (
            <div>
              <h1 className="bebas text-3xl text-white mb-6">Rechercher</h1>
              <div className="relative mb-8">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Artistes, titres, genres..."
                  className="w-full py-4 pl-12 pr-4 rounded-full text-white text-sm outline-none"
                  style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <h2 className="bebas text-2xl text-white mb-4">Parcourir les genres</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Afro-Pop", "Hip-Hop", "Afro-Trap", "Folk", "Jazz", "Urbain", "Gospel", "Traditionnel"].map((genre, i) => (
                    <button key={genre} onClick={() => navigate("/explore")}
                      className="p-6 rounded-xl text-left font-bold text-white text-lg overflow-hidden relative"
                      style={{ background: ["#E61E32","#7B2FBE","#FF6B35","#00D46A","#FFD700","#1DB954","#E91429","#148A08"][i] }}>
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BIBLIOTHÈQUE ── */}
          {section === "bibliotheque" && (
            <div>
              <h1 className="bebas text-3xl text-white mb-6">Ma bibliothèque</h1>
              <div className="space-y-2">
                {[
                  { label: "Titres favoris", count: MOCK_FAVORITES.length, icon: Heart, color: "#00D46A", id: "favoris" as Section },
                  { label: "Artistes suivis", count: MOCK_ARTISTS.length, icon: Users, color: "#7B2FBE", id: "suivis" as Section },
                ].map(item => (
                  <button key={item.label} onClick={() => setSection(item.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5 text-left"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}20` }}>
                      <item.icon size={24} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold">{item.label}</p>
                      <p className="text-zinc-500 text-sm">{item.count} éléments</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── FAVORIS ── */}
          {section === "favoris" && (
            <div>
              <div className="flex items-end gap-6 mb-8 p-8 rounded-2xl"
                style={{ background: "linear-gradient(135deg, #00D46A30, transparent)" }}>
                <div className="w-40 h-40 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #00D46A, #00D46A50)" }}>
                  <Heart size={60} className="text-white" fill="white" />
                </div>
                <div>
                  <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Playlist</p>
                  <h1 className="bebas text-5xl text-white mb-2">Titres favoris</h1>
                  <p className="text-zinc-500 text-sm">{user.displayName} · {MOCK_FAVORITES.length} titres</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-4 px-4 pb-3 text-zinc-600 text-xs uppercase tracking-widest border-b"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="w-8 text-center">#</span>
                  <span className="flex-1">Titre</span>
                  <span>Durée</span>
                </div>
                {MOCK_FAVORITES.map((track, i) => (
                  <div key={track.id} className="flex items-center gap-4 px-4 py-3 rounded-lg transition-all group hover:bg-white/5">
                    <span className="w-8 text-center text-zinc-600 group-hover:hidden text-sm">{i + 1}</span>
                    <Play size={14} className="w-8 hidden group-hover:block text-white" fill="white" />
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${track.color}25` }}>
                      <Music2 size={14} style={{ color: track.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{track.title}</p>
                      <p className="text-zinc-500 text-xs">{track.artist}</p>
                    </div>
                    <span className="text-zinc-600 text-sm">{track.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUIVIS ── */}
          {section === "suivis" && (
            <div>
              <h1 className="bebas text-3xl text-white mb-6">Artistes suivis</h1>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {MOCK_ARTISTS.map(artist => (
                  <button key={artist.id} onClick={() => navigate(`/artist/${artist.slug}`)}
                    className="p-4 rounded-xl text-center transition-all hover:bg-white/5 group"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="relative mx-auto mb-3 w-24 h-24">
                      <img src={artist.avatar} alt={artist.name}
                        className="w-full h-full rounded-full object-cover" />
                      <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <Play size={24} className="text-white" fill="white" />
                      </div>
                    </div>
                    <p className="text-white font-bold text-sm">{artist.name}</p>
                    <p className="text-zinc-500 text-xs mt-1">Artiste</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PARAMÈTRES ── */}
          {section === "parametres" && (
            <div className="max-w-lg">
              <h1 className="bebas text-3xl text-white mb-6">Paramètres</h1>
              <div className="space-y-4">
                <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <h2 className="bebas text-xl text-white mb-4">Compte</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-1">Nom</label>
                      <input defaultValue={user.displayName}
                        className="w-full py-3 px-4 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-1">Email</label>
                      <input value={user.email} disabled
                        className="w-full py-3 px-4 rounded-xl text-zinc-500 text-sm"
                        style={{ background: "rgba(255,255,255,0.03)" }} />
                    </div>
                    <button className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-black"
                      style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)" }}>
                      Sauvegarder
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl space-y-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <h2 className="bebas text-xl text-white">Préférences</h2>
                  {[
                    { label: "Notifications", desc: "Nouvelles sorties des artistes suivis" },
                    { label: "Qualité audio haute", desc: "Utilise plus de données mobiles" },
                    { label: "Lecture automatique", desc: "Continuer avec des titres similaires" },
                  ].map((s, i) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-bold">{s.label}</p>
                        <p className="text-zinc-600 text-xs">{s.desc}</p>
                      </div>
                      <div className="w-10 h-6 rounded-full flex items-center cursor-pointer px-1"
                        style={{ background: i === 0 ? "#FF6B35" : "rgba(255,255,255,0.2)", justifyContent: i === 0 ? "flex-end" : "flex-start" }}>
                        <div className="w-4 h-4 rounded-full bg-white" />
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setLogoutOpen(true)}
                  className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all hover:scale-105"
                  style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", color: "#FF3B30" }}>
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  );
}
