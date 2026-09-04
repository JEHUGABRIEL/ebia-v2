import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActivityFeed, type Activity } from "../lib/api";
import {
  Music,
  Mic2,
  Heart,
  Star,
  Radio,
  Plus,
  Loader2,
  Rss,
} from "lucide-react";

/* ── Tiny relative-time helper (no dependency) ── */
function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

const ICON_MAP: Record<string, typeof Music> = {
  new_track: Music,
  new_concert: Mic2,
  liked: Heart,
  new_follower: Star,
  new_radio: Radio,
  new_release: Plus,
};

const COLOR_MAP: Record<string, string> = {
  new_track: "bg-blue-500/20 text-blue-400",
  new_concert: "bg-purple-500/20 text-purple-400",
  liked: "bg-red-500/20 text-red-400",
  new_follower: "bg-amber-500/20 text-amber-400",
  new_radio: "bg-green-500/20 text-green-400",
  new_release: "bg-cyan-500/20 text-cyan-400",
};

function ActivityItem({ activity }: { activity: Activity }) {
  const navigate = useNavigate();
  const Icon = ICON_MAP[activity.type] || Music;
  const colorClass = COLOR_MAP[activity.type] || "bg-gray-500/20 text-gray-400";

  const handleClick = () => {
    if (activity.targetType === "track" && activity.targetSlug) {
      navigate(`/`);
    } else if (activity.targetType === "artist" && activity.targetSlug) {
      navigate(`/artist/${activity.targetSlug}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition text-left"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={activity.userAvatar || "/images/default-avatar.png"}
          alt={activity.userName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}
        >
          <Icon className="w-3 h-3" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 leading-snug">
          <span className="font-semibold">{activity.userName}</span>{" "}
          <span className="text-white/60">{activity.title}</span>
        </p>
        {activity.description && (
          <p className="text-xs text-white/40 mt-0.5 truncate">
            {activity.description}
          </p>
        )}
        <p className="text-[11px] text-white/30 mt-1">
          {timeAgo(activity.createdAt)}
        </p>
      </div>
    </button>
  );
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getActivityFeed(30);
        if (mounted) setActivities(data);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-white/40 text-sm">{error}</div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-white/40">
        <Rss className="w-8 h-8" />
        <p className="text-sm">Aucune activité récente</p>
        <p className="text-xs text-white/30">
          Suivez des artistes pour voir leur actualité ici
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {activities.map((a) => (
        <ActivityItem key={a.id} activity={a} />
      ))}
    </div>
  );
}
