import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArtists, type Artist } from "../lib/api";
import { MapPin, Search, CheckCircle } from "lucide-react";

export default function Explore() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getArtists().then(r => setArtists(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.genre || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-32 px-4" style={{ background: "#0D0D0D", paddingTop: "88px" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="bebas text-6xl md:text-8xl gradient-text mb-2">Artistes</h1>
          <p className="text-zinc-500">Les talents qui font vibrer la République Centrafricaine</p>
        </div>

        {/* Search */}
        <div className="relative mb-10">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un artiste ou un genre..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm font-medium text-white placeholder-zinc-600 outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onFocus={e => (e.target.style.borderColor = "#FF6B35")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="aspect-square" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="h-3 w-2/3 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-zinc-600 py-20 bebas text-3xl">Aucun artiste trouvé</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((artist, i) => (
              <Link key={artist.id} to={`/artist/${artist.slug}`}
                className="rounded-3xl overflow-hidden card-hover group"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="aspect-square overflow-hidden relative">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bebas text-6xl"
                      style={{ background: `linear-gradient(135deg, ${["#FF6B35","#7B2FBE","#00D46A","#FFD700"][i%4]}40, transparent)`, color: ["#FF6B35","#7B2FBE","#00D46A","#FFD700"][i%4] }}>
                      {artist.name[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }} />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <h3 className="font-bold text-white truncate">{artist.name}</h3>
                    {artist.verified && <CheckCircle size={14} style={{ color: "#FF6B35", flexShrink: 0 }} />}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest truncate mb-2"
                    style={{ color: ["#FF6B35","#7B2FBE","#00D46A","#FFD700"][i%4] }}>
                    {artist.genre}
                  </p>
                  <div className="flex items-center gap-1 text-zinc-600 text-xs">
                    <MapPin size={10} /><span>{artist.city}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
