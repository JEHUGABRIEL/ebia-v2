import { useApp } from "../context/AppContext";
import { Music2, BarChart2, Upload, LogOut } from "lucide-react";

export default function ArtistDashboard() {
  const { user, logout } = useApp();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#C49A2C] mb-1 block">Espace Artiste</span>
              <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
              <p className="text-zinc-500 text-sm">{user.email}</p>
            </div>
            <button onClick={logout} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <Music2 size={24} className="mx-auto mb-2 text-[#C49A2C]" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-zinc-500 text-xs uppercase tracking-widest">Titres</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <BarChart2 size={24} className="mx-auto mb-2 text-[#C49A2C]" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-zinc-500 text-xs uppercase tracking-widest">Écoutes</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <Upload size={24} className="mx-auto mb-2 text-[#C49A2C]" />
            <div className="text-2xl font-bold text-white cursor-pointer hover:text-[#C49A2C] transition-colors">Uploader</div>
            <div className="text-zinc-500 text-xs uppercase tracking-widest">Un titre</div>
          </div>
        </div>
      </div>
    </div>
  );
}
