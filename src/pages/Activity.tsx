import ActivityFeed from "../components/ActivityFeed";

export default function Activity() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Actualités</h1>
          <p className="text-xs text-white/40">Activité récente de vos artistes suivis</p>
        </div>
      </div>

      <ActivityFeed />
    </div>
  );
}
